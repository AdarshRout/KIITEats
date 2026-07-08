from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from fastapi import HTTPException

from app.services.payment_service import process_payment


async def process_order_payment(
    db: AsyncIOMotorDatabase,
    order_id: str,
    payment_method: str = "upi",
    transaction_id: str = "",
) -> dict:
    """
    Process payment for an order.
    For now supports UPI webhook-based confirmation.
    """
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["payment_status"] == "paid":
        return {"message": "Already paid", "order_id": order_id}

    # Process via payment service
    result = await process_payment(
        db=db,
        order_id=order_id,
        amount=order["total_amount"],
        method=payment_method,
        transaction_id=transaction_id,
    )

    return result


async def process_payment(
    db: AsyncIOMotorDatabase,
    order_id: str,
    amount: float,
    method: str = "upi",
    transaction_id: str = "",
) -> dict:
    """
    Process payment — for UPI, this is handled via webhook.
    This function simulates the payment confirmation.
    """
    from app.utils.token_generator import generate_token_number, generate_verification_id

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Generate token and verification ID
    token_num = await generate_token_number(db, order["vendor_id"])
    ver_id = generate_verification_id()

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "payment_status": "paid",
                "token_number": token_num,
                "verification_id": ver_id,
                "payment_method": method,
                "transaction_id": transaction_id,
            }
        },
    )

    return {
        "message": "Payment processed",
        "token_number": token_num,
        "verification_id": ver_id,
    }
