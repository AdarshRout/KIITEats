from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List

from app.core.database import get_database
from app.core.security import get_current_user
from app.schemas.order_schema import (
    GroupOrderCreate,
    GroupOrderAddItem,
    GroupOrderMemberPayment,
    GroupOrderResponse,
)
from app.models.group_order import group_order_document, COLLECTION_NAME

router = APIRouter(prefix="/group-orders", tags=["Group Orders"])


@router.post("/", response_model=GroupOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_group_order(
    data: GroupOrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new group order. The creator becomes the host.

    Example:
    ```json
    {"vendor_id": "64abc123..."}
    ```
    """
    if not ObjectId.is_valid(data.vendor_id):
        raise HTTPException(status_code=400, detail="Invalid vendor ID")

    vendor = await db.vendors.find_one({"_id": ObjectId(data.vendor_id)})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    doc = group_order_document(
        host_user_id=current_user["_id"],
        vendor_id=data.vendor_id,
    )
    result = await db[COLLECTION_NAME].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.post("/{group_id}/join")
async def join_group_order(
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Join an existing group order."""
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group order ID")

    group = await db[COLLECTION_NAME].find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group order not found")
    if group["status"] != "open":
        raise HTTPException(status_code=400, detail="Group order is not open for joining")

    # Check if already a member
    member_ids = [m["user_id"] for m in group.get("members", [])]
    if current_user["_id"] in member_ids:
        return {"message": "Already a member of this group order"}

    new_member = {"user_id": current_user["_id"], "items": [], "amount": 0.0}
    await db[COLLECTION_NAME].update_one(
        {"_id": ObjectId(group_id)},
        {"$push": {"members": new_member}},
    )
    return {"message": "Joined group order successfully"}


@router.post("/{group_id}/add-item")
async def add_item_to_group_order(
    group_id: str,
    data: GroupOrderAddItem,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Add an item to the group order for the current user."""
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group order ID")

    group = await db[COLLECTION_NAME].find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group order not found")
    if group["status"] != "open":
        raise HTTPException(status_code=400, detail="Group order is locked")

    # Validate food item
    food = await db.food_items.find_one({"_id": ObjectId(data.food_id)})
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    subtotal = food["price"] * data.quantity

    # Update member's items
    members = group.get("members", [])
    found = False
    for member in members:
        if member["user_id"] == current_user["_id"]:
            member["items"].append({
                "food_id": data.food_id,
                "name": food["name"],
                "price": food["price"],
                "quantity": data.quantity,
                "subtotal": subtotal,
            })
            member["amount"] = sum(i["subtotal"] for i in member["items"])
            found = True
            break

    if not found:
        raise HTTPException(status_code=400, detail="Not a member of this group order")

    total = sum(m["amount"] for m in members)
    await db[COLLECTION_NAME].update_one(
        {"_id": ObjectId(group_id)},
        {"$set": {"members": members, "total_amount": round(total, 2)}},
    )

    return {"message": "Item added", "your_amount": member["amount"], "total": total}


@router.post("/{group_id}/lock")
async def lock_group_order(
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Lock the group order (host only). No more items can be added."""
    group = await db[COLLECTION_NAME].find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group order not found")
    if group["host_user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the host can lock the order")

    # Generate per-member payment records
    payments = []
    for member in group.get("members", []):
        payments.append({
            "user_id": member["user_id"],
            "amount": member["amount"],
            "status": "pending",
            "upi_id": None,
        })

    await db[COLLECTION_NAME].update_one(
        {"_id": ObjectId(group_id)},
        {"$set": {"status": "locked", "payments": payments}},
    )

    return {"message": "Group order locked. Members can now submit payments."}


@router.post("/{group_id}/pay")
async def submit_payment(
    group_id: str,
    data: GroupOrderMemberPayment,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Submit UPI payment info for the group order."""
    group = await db[COLLECTION_NAME].find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group order not found")
    if group["status"] not in ("locked", "paid"):
        raise HTTPException(status_code=400, detail="Group order must be locked first")

    payments = group.get("payments", [])
    for payment in payments:
        if payment["user_id"] == current_user["_id"]:
            payment["status"] = "paid"
            payment["upi_id"] = data.upi_id
            break

    # Check if all paid
    all_paid = all(p["status"] == "paid" for p in payments)
    new_status = "paid" if all_paid else group["status"]

    await db[COLLECTION_NAME].update_one(
        {"_id": ObjectId(group_id)},
        {"$set": {"payments": payments, "status": new_status}},
    )

    return {
        "message": "Payment submitted",
        "all_paid": all_paid,
        "group_status": new_status,
    }


@router.get("/{group_id}", response_model=GroupOrderResponse)
async def get_group_order(
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Get details of a group order."""
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group order ID")
    group = await db[COLLECTION_NAME].find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group order not found")
    group["_id"] = str(group["_id"])
    return group
