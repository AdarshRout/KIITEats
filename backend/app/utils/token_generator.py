"""
Token Generator — Daily-resetting serial tokens and unique verification IDs.
"""
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase


async def generate_token_number(db: AsyncIOMotorDatabase, vendor_id: str) -> int:
    """
    Generate a daily-resetting serial token number for a vendor.
    Token numbers start at 1 each day and increment per order.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Use a counter collection to track daily token numbers per vendor
    counter = await db.token_counters.find_one_and_update(
        {"vendor_id": vendor_id, "date": today},
        {"$inc": {"counter": 1}},
        upsert=True,
        return_document=True,  # return the updated document
    )

    return counter["counter"]


def generate_verification_id() -> str:
    """Generate a unique 4-character uppercase alphanumeric verification ID for order delivery."""
    import string
    import random
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(4))
