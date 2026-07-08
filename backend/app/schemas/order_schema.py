from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ── Order Item Schema ────────────────────────────────────────────────────

class OrderItemSchema(BaseModel):
    food_id: str
    name: str
    price: float
    quantity: int
    subtotal: float


# ── Request Schemas ──────────────────────────────────────────────────────

class OrderItemInput(BaseModel):
    food_id: str
    quantity: int = Field(..., ge=1)

class OrderCreate(BaseModel):
    """Place an order. Either from the server-side cart, or by passing items directly."""
    scheduled_time: Optional[datetime] = Field(
        None,
        description="ISO datetime for scheduled pickup. None = immediate order.",
        examples=["2026-03-12T12:30:00"],
    )
    vendor_id: Optional[str] = Field(None, description="Required when sending items directly")
    items: Optional[List[OrderItemInput]] = Field(None, description="Items to order (bypass server cart)")
    promo_code: Optional[str] = Field(None, description="Optional discount coupon code")


class OrderStatusUpdate(BaseModel):
    """Update order status (vendor/admin only)."""
    status: str = Field(
        ...,
        pattern="^(preparing|ready|delivered|cancelled)$",
        examples=["preparing"],
    )


# ── Response Schemas ─────────────────────────────────────────────────────

class OrderResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    vendor_id: str
    items: List[OrderItemSchema]
    total_amount: float
    status: str
    token_number: Optional[int] = None
    verification_id: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    payment_status: str = "unpaid"
    payment_method: Optional[str] = "upi"
    utr_number: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ── Group Order Schemas ──────────────────────────────────────────────────

class GroupOrderCreate(BaseModel):
    vendor_id: str = Field(..., examples=["64abc..."])


class GroupOrderAddItem(BaseModel):
    food_id: str
    quantity: int = Field(default=1, ge=1)


class GroupOrderMemberPayment(BaseModel):
    upi_id: str = Field(..., examples=["user@upi"])


class GroupOrderMember(BaseModel):
    user_id: str
    items: List[dict] = []
    amount: float = 0.0


class GroupOrderPayment(BaseModel):
    user_id: str
    amount: float
    status: str = "pending"
    upi_id: Optional[str] = None


class GroupOrderResponse(BaseModel):
    id: str = Field(..., alias="_id")
    host_user_id: str
    vendor_id: str
    members: List[GroupOrderMember]
    total_amount: float = 0.0
    payments: List[GroupOrderPayment] = []
    status: str
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
