from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Vendor Schemas ───────────────────────────────────────────────────────

class VendorCreate(BaseModel):
    """Schema for creating a vendor."""
    name: str = Field(..., min_length=2, max_length=200, examples=["Campus Canteen"])
    location: str = Field(..., min_length=2, max_length=300, examples=["Food Court, Block A"])
    description: str = Field(default="", max_length=1000, examples=["Best biryani on campus"])
    images: List[str] = Field(default=[], examples=[["https://example.com/cafe.jpg"]])
    qr_image_url: str = Field(default="", examples=["https://example.com/qr.png"])
    upi_id: str = Field(default="", examples=["vendor@upi"])
    email: str = Field(default="", examples=["fc1@kiit.ac.in"])
    lat: Optional[float] = Field(default=0.0, examples=[20.35])
    lng: Optional[float] = Field(default=0.0, examples=[85.82])


class VendorResponse(BaseModel):
    """Schema for vendor data in API responses."""
    id: str = Field(..., alias="_id")
    name: str
    location: str
    description: str
    owner_user_id: str
    images: List[str] = []
    qr_image_url: str = ""
    upi_id: str = ""
    email: str = ""
    lat: float = 0.0
    lng: float = 0.0
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ── Food Item Schemas ────────────────────────────────────────────────────

class FoodItemCreate(BaseModel):
    """Schema for creating a food item."""
    name: str = Field(..., min_length=2, max_length=200, examples=["Chicken Biryani"])
    price: float = Field(..., gt=0, examples=[120.0])
    category: str = Field(..., min_length=2, max_length=100, examples=["Main Course"])
    description: str = Field(default="", max_length=500, examples=["Aromatic basmati rice with tender chicken"])
    image_url: str = Field(default="", examples=["https://example.com/biryani.jpg"])
    available: bool = Field(default=True)
    stock: int = Field(default=100, ge=0)


class FoodItemUpdate(BaseModel):
    """Schema for updating a food item (all fields optional)."""
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    price: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    available: Optional[bool] = None
    stock: Optional[int] = Field(None, ge=0)


class FoodItemResponse(BaseModel):
    """Schema for food item data in API responses."""
    id: str = Field(..., alias="_id")
    vendor_id: str
    name: str
    price: float
    category: str
    description: str = ""
    image_url: str = ""
    available: bool = True
    stock: int = 100
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ── Payment Transaction Schemas ──────────────────────────────────────────

class TransactionResponse(BaseModel):
    """Schema for payment transaction data in API responses."""
    id: str = Field(..., alias="_id")
    order_id: str
    vendor_id: str
    user_id: str
    amount: float
    transaction_id: str
    status: str
    items: List[dict] = []
    token_number: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
