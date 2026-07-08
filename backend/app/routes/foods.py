from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List

from app.core.database import get_database
from app.core.security import get_current_user, require_roles
from app.schemas.food_schema import FoodItemCreate, FoodItemUpdate, FoodItemResponse
from app.models.food import food_document, COLLECTION_NAME

router = APIRouter(prefix="/foods", tags=["Food Items"])

@router.get("/", response_model=List[FoodItemResponse])
async def list_all_foods(db: AsyncIOMotorDatabase = Depends(get_database)):
    """List all available food items globally."""
    foods = await db[COLLECTION_NAME].find({"available": True}).to_list(1000)
    for f in foods:
        f["_id"] = str(f["_id"])
    return foods


@router.get("/vendor/{vendor_id}", response_model=List[FoodItemResponse])
async def list_foods_by_vendor(
    vendor_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """List all food items for a specific vendor."""
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid vendor ID")
    foods = await db[COLLECTION_NAME].find({"vendor_id": vendor_id}).to_list(200)
    for f in foods:
        f["_id"] = str(f["_id"])
    return foods


@router.get("/{food_id}", response_model=FoodItemResponse)
async def get_food(food_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get a single food item by ID."""
    if not ObjectId.is_valid(food_id):
        raise HTTPException(status_code=400, detail="Invalid food ID")
    food = await db[COLLECTION_NAME].find_one({"_id": ObjectId(food_id)})
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    food["_id"] = str(food["_id"])
    return food


@router.post("/", response_model=FoodItemResponse, status_code=status.HTTP_201_CREATED)
async def create_food(
    data: FoodItemCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("vendor", "admin")),
):
    """
    Add a food item to the vendor's menu. Only vendor or admin users.
    The vendor_id is auto-resolved from the current user's vendor.

    Example request:
    ```json
    {
        "name": "Chicken Biryani",
        "price": 120.0,
        "category": "Main Course",
        "description": "Aromatic basmati rice with tender chicken",
        "available": true,
        "stock": 50
    }
    ```
    """
    # Find the vendor owned by this user
    vendor = await db["vendors"].find_one({"owner_user_id": current_user["_id"]})
    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="No vendor found for this user. Create a vendor first.",
        )
    vendor_id = str(vendor["_id"])

    doc = food_document(
        vendor_id=vendor_id,
        name=data.name,
        price=data.price,
        category=data.category,
        description=data.description,
        image_url=data.image_url,
        available=data.available,
        stock=data.stock,
    )
    result = await db[COLLECTION_NAME].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/{food_id}", response_model=FoodItemResponse)
async def update_food(
    food_id: str,
    data: FoodItemUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("vendor", "admin")),
):
    """Update a food item. Only the owning vendor or admin."""
    if not ObjectId.is_valid(food_id):
        raise HTTPException(status_code=400, detail="Invalid food ID")

    food = await db[COLLECTION_NAME].find_one({"_id": ObjectId(food_id)})
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    # Verify ownership
    if current_user["role"] != "admin":
        vendor = await db["vendors"].find_one({"owner_user_id": current_user["_id"]})
        if not vendor or str(vendor["_id"]) != food["vendor_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to update this item")

    # Only update provided fields
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db[COLLECTION_NAME].update_one(
        {"_id": ObjectId(food_id)},
        {"$set": update_data},
    )
    updated = await db[COLLECTION_NAME].find_one({"_id": ObjectId(food_id)})
    updated["_id"] = str(updated["_id"])
    return updated


@router.patch("/{food_id}/toggle", response_model=FoodItemResponse)
async def toggle_availability(
    food_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("vendor", "admin")),
):
    """Toggle the availability of a food item."""
    if not ObjectId.is_valid(food_id):
        raise HTTPException(status_code=400, detail="Invalid food ID")

    food = await db[COLLECTION_NAME].find_one({"_id": ObjectId(food_id)})
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    new_availability = not food.get("available", True)
    await db[COLLECTION_NAME].update_one(
        {"_id": ObjectId(food_id)},
        {"$set": {"available": new_availability}},
    )
    food["available"] = new_availability
    food["_id"] = str(food["_id"])
    return food


@router.delete("/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_food(
    food_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("vendor", "admin")),
):
    """Delete a food item from the menu."""
    if not ObjectId.is_valid(food_id):
        raise HTTPException(status_code=400, detail="Invalid food ID")
    result = await db[COLLECTION_NAME].delete_one({"_id": ObjectId(food_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Food item not found")
