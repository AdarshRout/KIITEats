from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List

from app.core.database import get_database
from app.core.security import get_current_user, require_roles
from app.schemas.order_schema import OrderCreate, OrderStatusUpdate, OrderResponse
from app.services.order_service import place_order, update_order_status

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Place an order from the current cart.
    Returns order details with a UPI QR code for payment.

    Example request:
    ```json
    {"scheduled_time": null}
    ```
    Or for scheduled orders:
    ```json
    {"scheduled_time": "2026-03-12T12:30:00"}
    ```
    """
    result = await place_order(
        db=db,
        user_id=current_user["_id"],
        scheduled_time=data.scheduled_time,
        direct_items=data.items,
        direct_vendor_id=data.vendor_id,
        promo_code=data.promo_code,
    )
    return result


@router.get("/", response_model=List[OrderResponse])
async def list_my_orders(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """List all orders for the current user, newest first."""
    orders = await db.orders.find(
        {"user_id": current_user["_id"]}
    ).sort("created_at", -1).to_list(100)
    for o in orders:
        o["_id"] = str(o["_id"])
    return orders


@router.get("/vendor", response_model=List[OrderResponse])
async def list_vendor_orders(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("vendor", "admin")),
):
    """List all orders for the vendor's restaurant. Vendor/admin only."""
    vendor = await db.vendors.find_one({"owner_user_id": current_user["_id"]})
    if not vendor:
        raise HTTPException(status_code=404, detail="No vendor found for this user")

    orders = await db.orders.find(
        {"vendor_id": str(vendor["_id"])}
    ).sort("created_at", -1).to_list(200)
    for o in orders:
        o["_id"] = str(o["_id"])
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Get details of a specific order."""
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order["_id"] = str(order["_id"])
    return order


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def change_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Update order status. Valid transitions:
    - pending → preparing | cancelled
    - preparing → ready | cancelled
    - ready → delivered

    Students can only cancel their own pending orders.
    Vendors/admins can transition order statuses.
    """
    result = await update_order_status(
        db=db,
        order_id=order_id,
        new_status=data.status,
        user_id=current_user["_id"],
        user_role=current_user["role"],
    )
    return result


@router.delete("/{order_id}", status_code=status.HTTP_200_OK)
async def cancel_order(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Cancel a pending order. Only the ordering user can cancel."""
    result = await update_order_status(
        db=db,
        order_id=order_id,
        new_status="cancelled",
        user_id=current_user["_id"],
        user_role=current_user["role"],
    )
    return {"message": "Order cancelled", "order_id": order_id}
