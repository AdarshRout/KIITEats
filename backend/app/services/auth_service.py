from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import user_document, COLLECTION_NAME


async def create_user(db: AsyncIOMotorDatabase, name: str, email: str, password: str, role: str = "student") -> dict:
    """
    Register a new user. Raises 409 if email already exists.
    Enforces email domain rules: vendor → @kiitvendor.ac.in, admin → @kiitadmin.ac.in.
    Returns the created user document with string _id.
    """
    # Enforce email domain by role
    domain = email.split("@")[-1].lower() if "@" in email else ""
    if role == "vendor" and domain not in ("kiitvendor.ac.in", "kiit.ac.in"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vendor accounts require an @kiit.ac.in or @kiitvendor.ac.in email address",
        )
    if role == "admin" and domain != "kiitadmin.ac.in":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin accounts require an @kiitadmin.ac.in email address",
        )

    # Check for existing user
    existing = await db[COLLECTION_NAME].find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    # Build and insert document
    doc = user_document(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role=role,
    )
    result = await db[COLLECTION_NAME].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def authenticate_user(db: AsyncIOMotorDatabase, email: str, password: str) -> dict:
    """
    Authenticate a user by email and password.
    Returns a dict with access_token and user data.
    Raises 401 on invalid credentials.
    """
    user = await db[COLLECTION_NAME].find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create JWT with user ID as subject
    token = create_access_token(data={"sub": str(user["_id"]), "role": user["role"]})

    user["_id"] = str(user["_id"])
    return {"access_token": token, "user": user}


async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Fetch a user by their ObjectId string. Raises 404 if not found."""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )

    user = await db[COLLECTION_NAME].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user["_id"] = str(user["_id"])
    return user
