from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])


# ── Schemas (inline for simplicity) ──────────────────────────────────────

class CartItemAdd(BaseModel):
    food_id: str = Field(..., examples=["64abc..."])
    quantity: int = Field(default=1, ge=1, le=50)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, le=50)


class CartItemResponse(BaseModel):
    food_id: str
    name: str
    price: float
    quantity: int
    subtotal: float
    image_url: Optional[str] = None


class CartResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    vendor_id: Optional[str] = None
    vendor_name: Optional[str] = None
    items: List[CartItemResponse] = []
    total: float = 0.0

    class Config:
        populate_by_name = True


# ── Routes ───────────────────────────────────────────────────────────────

@router.get("/", response_model=CartResponse)
async def get_cart(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Get the current user's cart."""
    cart = await db.cart.find_one({"user_id": current_user["_id"]})
    if not cart:
        return CartResponse(user_id=current_user["_id"], items=[], total=0.0)

    # Enrich items with food details
    enriched_items = []
    total = 0.0
    for item in cart.get("items", []):
        food = await db.food_items.find_one({"_id": ObjectId(item["food_id"])})
        if food:
            subtotal = food["price"] * item["quantity"]
            total += subtotal
            enriched_items.append(CartItemResponse(
                food_id=item["food_id"],
                name=food["name"],
                price=food["price"],
                quantity=item["quantity"],
                subtotal=subtotal,
                image_url=food.get("image_url")
            ))

    # Get vendor name
    vendor_name = None
    if cart.get("vendor_id"):
        vendor = await db.vendors.find_one({"_id": ObjectId(cart["vendor_id"])})
        vendor_name = vendor["name"] if vendor else None

    cart["_id"] = str(cart["_id"])
    return CartResponse(
        _id=cart["_id"],
        user_id=current_user["_id"],
        vendor_id=cart.get("vendor_id"),
        vendor_name=vendor_name,
        items=enriched_items,
        total=round(total, 2),
    )


@router.post("/add", response_model=dict)
async def add_to_cart(
    data: CartItemAdd,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Add a food item to the cart.
    Cart is tied to one vendor — adding an item from a different vendor
    will clear the existing cart and start fresh.

    Example:
    ```json
    {"food_id": "64abc123...", "quantity": 2}
    ```
    """
    # Validate food item
    if not ObjectId.is_valid(data.food_id):
        raise HTTPException(status_code=400, detail="Invalid food ID")

    food = await db.food_items.find_one({"_id": ObjectId(data.food_id)})
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    if not food.get("available", True):
        raise HTTPException(status_code=400, detail="Food item is not available")
    if food.get("stock", 0) < data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    food_vendor_id = food["vendor_id"]

    # Get or create cart
    cart = await db.cart.find_one({"user_id": current_user["_id"]})

    if cart and cart.get("vendor_id") and cart["vendor_id"] != food_vendor_id:
        # Different vendor — clear cart
        await db.cart.delete_one({"_id": cart["_id"]})
        cart = None

    if not cart:
        # Create new cart
        cart = {
            "user_id": current_user["_id"],
            "vendor_id": food_vendor_id,
            "items": [],
        }
        result = await db.cart.insert_one(cart)
        cart["_id"] = result.inserted_id

    # Check if item already in cart
    items = cart.get("items", [])
    found = False
    for item in items:
        if item["food_id"] == data.food_id:
            item["quantity"] += data.quantity
            found = True
            break

    if not found:
        items.append({"food_id": data.food_id, "quantity": data.quantity})

    await db.cart.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": items}},
    )

    return {"message": "Item added to cart", "item_count": len(items)}


@router.put("/item/{food_id}", response_model=dict)
async def update_cart_item(
    food_id: str,
    data: CartItemUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Update quantity of an item in the cart. Set quantity to 0 to remove."""
    cart = await db.cart.find_one({"user_id": current_user["_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart is empty")

    items = cart.get("items", [])
    if data.quantity == 0:
        # Remove item
        items = [i for i in items if i["food_id"] != food_id]
    else:
        found = False
        for item in items:
            if item["food_id"] == food_id:
                item["quantity"] = data.quantity
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Item not in cart")

    if not items:
        # Cart is empty, delete it
        await db.cart.delete_one({"_id": cart["_id"]})
        return {"message": "Cart is now empty"}

    await db.cart.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": items}},
    )
    return {"message": "Cart updated", "item_count": len(items)}


@router.delete("/", status_code=status.HTTP_200_OK)
async def clear_cart(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Clear the entire cart."""
    await db.cart.delete_one({"user_id": current_user["_id"]})
    return {"message": "Cart cleared"}
