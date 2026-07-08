from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from bson import ObjectId
import re

from app.core.database import get_database
from app.core.security import get_current_user
from app.schemas.user_schema import UserSignup, UserLogin, UserResponse, TokenResponse, UpiUpdate
from app.services.auth_service import create_user, authenticate_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: UserSignup, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Register a new user (student, vendor, or admin).

    Example request:
    ```json
    {
        "name": "Swagat Patel",
        "email": "swagat@kiit.ac.in",
        "password": "securepass123",
        "role": "student"
    }
    ```
    """
    user = await create_user(
        db=db,
        name=data.name,
        email=data.email,
        password=data.password,
        role=data.role,
    )
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Authenticate a user and return a JWT access token.

    Example request:
    ```json
    {
        "email": "swagat@kiit.ac.in",
        "password": "securepass123"
    }
    ```
    """
    result = await authenticate_user(db=db, email=data.email, password=data.password)
    return result


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get the currently authenticated user's profile.
    Requires a valid JWT token in the Authorization header.
    """
    return current_user


@router.patch("/me/upi", response_model=UserResponse)
async def update_upi(
    data: UpiUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Save or update the current user's UPI ID."""
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"upi_id": data.upi_id}},
    )
    updated = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    updated["_id"] = str(updated["_id"])
    return updated


@router.get("/search", response_model=List[UserResponse])
async def search_users(
    q: str = Query(..., min_length=1, max_length=100, description="Search query (name or email)"),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """
    Search registered **students** by name or email.
    Returns up to 10 matching users. Excludes vendors, admins, and the current user.
    """
    safe_q = re.escape(q)
    query_filter = {
        "_id": {"$ne": ObjectId(current_user["_id"])},
        "role": "student",
        "$or": [
            {"name": {"$regex": safe_q, "$options": "i"}},
            {"email": {"$regex": safe_q, "$options": "i"}},
        ],
    }
    users = await db.users.find(
        query_filter, {"password_hash": 0}
    ).to_list(10)

    for u in users:
        u["_id"] = str(u["_id"])

    return users
