from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from fastapi import HTTPException, status
from datetime import datetime, timezone

from app.models.order import order_document, COLLECTION_NAME
from app.utils.token_generator import generate_token_number, generate_verification_id
from app.utils.qr_generator import generate_upi_qr
from app.core.ws_manager import manager as ws_manager


async def place_order(
    db: AsyncIOMotorDatabase,
    user_id: str,
    scheduled_time=None,
    direct_items=None,
    direct_vendor_id=None,
    promo_code=None,
) -> dict:
    """
    Place an order from the user's current cart, or from directly provided items.
    Returns order document with QR code for payment.
    """

    if direct_items and direct_vendor_id:
        # ── Direct items path (frontend sends items) ──────────────────
        vendor_id = direct_vendor_id
        order_items = []
        total = 0.0
        for entry in direct_items:
            food = await db.food_items.find_one({"_id": ObjectId(entry.food_id)})
            if not food:
                raise HTTPException(
                    status_code=400,
                    detail=f"Food item {entry.food_id} no longer exists",
                )
            if not food.get("available", True):
                raise HTTPException(
                    status_code=400,
                    detail=f"{food['name']} is no longer available",
                )
            if food.get("stock", 0) < entry.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {food['name']}",
                )
            subtotal = food["price"] * entry.quantity
            total += subtotal
            order_items.append({
                "food_id": entry.food_id,
                "name": food["name"],
                "price": food["price"],
                "quantity": entry.quantity,
                "subtotal": subtotal,
            })
            # Decrement stock
            await db.food_items.update_one(
                {"_id": ObjectId(entry.food_id)},
                {"$inc": {"stock": -entry.quantity}},
            )
        # Clear server cart after direct-items order
        await db.cart.delete_one({"user_id": user_id})
    else:
        # ── Server-side cart path ─────────────────────────────────────
        cart = await db.cart.find_one({"user_id": user_id})
        if not cart or not cart.get("items"):
            raise HTTPException(status_code=400, detail="Cart is empty")

        vendor_id = cart["vendor_id"]
        order_items = []
        total = 0.0
        for item in cart["items"]:
            food = await db.food_items.find_one({"_id": ObjectId(item["food_id"])})
            if not food:
                raise HTTPException(
                    status_code=400,
                    detail=f"Food item {item['food_id']} no longer exists",
                )
            if not food.get("available", True):
                raise HTTPException(
                    status_code=400,
                    detail=f"{food['name']} is no longer available",
                )
            if food.get("stock", 0) < item["quantity"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {food['name']}",
                )
            subtotal = food["price"] * item["quantity"]
            total += subtotal
            order_items.append({
                "food_id": item["food_id"],
                "name": food["name"],
                "price": food["price"],
                "quantity": item["quantity"],
                "subtotal": subtotal,
            })
            # Decrement stock
            await db.food_items.update_one(
                {"_id": ObjectId(item["food_id"])},
                {"$inc": {"stock": -item["quantity"]}},
            )
        # Clear server cart
        await db.cart.delete_one({"user_id": user_id})

    # Apply promo discount
    if promo_code:
        code = promo_code.strip().upper()
        if code == "KIITGREEN":
            total = max(0, total - 10)
        elif code == "WELCOME50":
            total = max(0, total - 50)

    # Create order document
    doc = order_document(
        user_id=user_id,
        vendor_id=vendor_id,
        items=order_items,
        total_amount=round(total, 2),
        scheduled_time=scheduled_time,
    )
    result = await db[COLLECTION_NAME].insert_one(doc)
    order_id = str(result.inserted_id)
    doc["_id"] = order_id

    # Generate UPI QR code
    qr_code = generate_upi_qr(amount=doc["total_amount"], order_id=order_id)

    # Update loyalty streak
    await _update_streak(db, user_id)

    return {**doc, "qr_code": qr_code}


async def update_order_status(
    db: AsyncIOMotorDatabase,
    order_id: str,
    new_status: str,
    user_id: str = None,
    user_role: str = None,
) -> dict:
    """Update order status with role-based validation."""
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = await db[COLLECTION_NAME].find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    current_status = order["status"]

    # Validate status transitions
    valid_transitions = {
        "pending": ["preparing", "cancelled"],
        "preparing": ["ready", "cancelled"],
        "ready": ["delivered"],
    }

    allowed = valid_transitions.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{current_status}' to '{new_status}'",
        )

    # Only the user can cancel their own pending order
    if new_status == "cancelled" and user_role not in ("admin", "vendor"):
        if order["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if current_status != "pending":
            raise HTTPException(status_code=400, detail="Can only cancel pending orders")

    await db[COLLECTION_NAME].update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": new_status}},
    )

    order["status"] = new_status
    order["_id"] = str(order["_id"])

    # Broadcast real-time update to all connected WebSocket clients
    await ws_manager.broadcast_order_update(order_id, {
        "type": "order_update",
        "order_id": order_id,
        "status": new_status,
        "payment_status": order.get("payment_status"),
        "token_number": order.get("token_number"),
        "verification_id": order.get("verification_id"),
    })

    return order


async def _update_streak(db: AsyncIOMotorDatabase, user_id: str):
    """Update the user's loyalty ordering streak."""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return

    today = datetime.now(timezone.utc).date()
    last_order = user.get("last_order_date")

    if last_order:
        last_date = last_order.date() if isinstance(last_order, datetime) else last_order
        diff = (today - last_date).days
        if diff == 1:
            # Consecutive day — increment streak
            new_streak = user.get("streak_count", 0) + 1
        elif diff == 0:
            # Already ordered today — keep streak
            new_streak = user.get("streak_count", 0)
        else:
            # Streak broken
            new_streak = 1
    else:
        new_streak = 1

    # Award coins every 5-day streak
    coins_bonus = 10 if new_streak % 5 == 0 else 0

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "streak_count": new_streak,
                "last_order_date": datetime.now(timezone.utc),
            },
            "$inc": {"coins": coins_bonus},
        },
    )
