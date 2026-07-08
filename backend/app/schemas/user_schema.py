from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ── Request Schemas ──────────────────────────────────────────────────────

class UserSignup(BaseModel):
    """Schema for user registration."""
    name: str = Field(..., min_length=2, max_length=100, examples=["Swagat Patel"])
    email: EmailStr = Field(..., examples=["swagat@kiit.ac.in"])
    password: str = Field(..., min_length=6, max_length=128, examples=["securepass123"])
    role: str = Field(
        default="student",
        pattern="^(student|vendor|admin)$",
        examples=["student"],
    )


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., examples=["swagat@kiit.ac.in"])
    password: str = Field(..., examples=["securepass123"])


# ── Response Schemas ─────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """Schema for user data returned in API responses."""
    id: str = Field(..., alias="_id")
    name: str
    email: str
    role: str
    upi_id: str = ""
    wallet_balance: float = 0.0
    coins: int = 0
    streak_count: int = 0
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class UpiUpdate(BaseModel):
    """Schema for updating user's UPI ID."""
    upi_id: str = Field(..., max_length=100, examples=["yourname@paytm"])


class TokenResponse(BaseModel):
    """Schema for JWT token response after login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
