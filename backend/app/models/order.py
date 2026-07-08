"""
Order model helpers for the orders collection.
"""

COLLECTION_NAME = "orders"


async def create_indexes(db):
    """Create MongoDB indexes for the orders collection."""
    await db[COLLECTION_NAME].create_index("user_id")
    await db[COLLECTION_NAME].create_index("vendor_id")
    await db[COLLECTION_NAME].create_index("status")
    await db[COLLECTION_NAME].create_index("created_at")


def order_document(
    user_id: str,
    vendor_id: str,
    items: list,
    total_amount: float,
    scheduled_time=None,
) -> dict:
    """Build an order document ready for insertion."""
    from datetime import datetime, timezone

    return {
        "user_id": user_id,
        "vendor_id": vendor_id,
        "items": items,  # [{food_id, name, price, quantity, subtotal}]
        "total_amount": total_amount,
        "status": "pending",  # pending → preparing → ready → delivered | cancelled
        "token_number": None,
        "verification_id": None,
        "scheduled_time": scheduled_time,
        "payment_status": "unpaid",  # unpaid → verification_pending → paid → refunded
        "payment_method": "upi",
        "utr_number": None,
        "created_at": datetime.now(timezone.utc),
    }
