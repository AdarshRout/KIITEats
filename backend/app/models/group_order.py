"""
Group order model helpers for the group_orders collection.
"""

COLLECTION_NAME = "group_orders"


async def create_indexes(db):
    """Create MongoDB indexes for the group_orders collection."""
    await db[COLLECTION_NAME].create_index("host_user_id")
    await db[COLLECTION_NAME].create_index("status")


def group_order_document(
    host_user_id: str,
    vendor_id: str,
) -> dict:
    """Build a group order document ready for insertion."""
    from datetime import datetime, timezone

    return {
        "host_user_id": host_user_id,
        "vendor_id": vendor_id,
        "members": [{"user_id": host_user_id, "items": [], "amount": 0.0}],
        "items": [],
        "total_amount": 0.0,
        "payments": [],  # [{user_id, amount, status: "pending"|"paid", upi_id}]
        "status": "open",  # open → locked → paid → fulfilled
        "created_at": datetime.now(timezone.utc),
    }
