from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List

from app.core.database import get_database
from app.core.security import get_current_user, require_roles
from app.schemas.food_schema import VendorCreate, VendorResponse
from app.models.vendor import vendor_document, COLLECTION_NAME

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.get("/me", response_model=VendorResponse)
async def get_my_vendor(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("vendor", "admin")),
):
    """Get the current vendor's profile. Returns 404 if not set up yet."""
    vendor = await db[COLLECTION_NAME].find_one({"owner_user_id": current_user["_id"]})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not set up yet")
    vendor["_id"] = str(vendor["_id"])
    return vendor


@router.get("/", response_model=List[VendorResponse])
async def list_vendors(db: AsyncIOMotorDatabase = Depends(get_database)):
    """List all active vendors on campus."""
    vendors = await db[COLLECTION_NAME].find({"is_active": True}).to_list(100)
    for v in vendors:
        v["_id"] = str(v["_id"])
    return vendors


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(vendor_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get a single vendor by ID."""
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid vendor ID")
    vendor = await db[COLLECTION_NAME].find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor["_id"] = str(vendor["_id"])
    return vendor


@router.post("/", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    data: VendorCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("admin", "vendor")),
):
    """Create a new vendor. Only admin or vendor users can do this."""
    # Check if vendor already exists for this user
    existing = await db[COLLECTION_NAME].find_one({"owner_user_id": current_user["_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Vendor profile already exists. Use PUT to update.")

    doc = vendor_document(
        name=data.name,
        location=data.location,
        description=data.description,
        owner_user_id=current_user["_id"],
        images=data.images,
        qr_image_url=data.qr_image_url,
        upi_id=data.upi_id,
        email=data.email,
        lat=data.lat or 0.0,
        lng=data.lng or 0.0,
    )
    result = await db[COLLECTION_NAME].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: str,
    data: VendorCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("admin", "vendor")),
):
    """Update a vendor's details. Only the owner or admin can update."""
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid vendor ID")

    vendor = await db[COLLECTION_NAME].find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Only owner or admin can update
    if current_user["role"] != "admin" and vendor["owner_user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this vendor")

    update_data = {
        "name": data.name,
        "location": data.location,
        "description": data.description,
        "images": data.images,
        "qr_image_url": data.qr_image_url,
        "upi_id": data.upi_id,
        "email": data.email,
        "lat": data.lat,
        "lng": data.lng,
    }
    print(f"DEBUG PUT payload received for {vendor_id}: {update_data}")
    await db[COLLECTION_NAME].update_one(
        {"_id": ObjectId(vendor_id)},
        {"$set": update_data},
    )

    updated = await db[COLLECTION_NAME].find_one({"_id": ObjectId(vendor_id)})
    updated["_id"] = str(updated["_id"])
    return updated


@router.patch("/{vendor_id}/toggle", response_model=VendorResponse)
async def toggle_vendor_status(
    vendor_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("admin", "vendor")),
):
    """Toggle a vendor's active status."""
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid vendor ID")

    vendor = await db[COLLECTION_NAME].find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if current_user["role"] != "admin" and vendor["owner_user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_status = not vendor.get("is_active", True)
    await db[COLLECTION_NAME].update_one(
        {"_id": ObjectId(vendor_id)},
        {"$set": {"is_active": new_status}},
    )

    updated = await db[COLLECTION_NAME].find_one({"_id": ObjectId(vendor_id)})
    updated["_id"] = str(updated["_id"])
    return updated


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(
    vendor_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_roles("admin")),
):
    """Delete a vendor. Admin only."""
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid vendor ID")
    result = await db[COLLECTION_NAME].delete_one({"_id": ObjectId(vendor_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")



