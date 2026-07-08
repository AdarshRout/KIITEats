"""
User model helpers — defines the collection name and index setup.
Motor doesn't use ORM-style models; we work directly with dicts.
This module provides constants and helper functions for the users collection.
"""

COLLECTION_NAME = "users"


async def create_indexes(db):
    """Create MongoDB indexes for the users collection."""
    await db[COLLECTION_NAME].create_index("email", unique=True)


def user_document(
    name: str,
    email: str,
    password_hash: str,
    role: str = "student",
) -> dict:
    """Build a user document ready for insertion."""
    from datetime import datetime, timezone

    return {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": role,
        "upi_id": "",
        "wallet_balance": 0.0,
        "coins": 0,
        "streak_count": 0,
        "last_order_date": None,
        "created_at": datetime.now(timezone.utc),
    }
