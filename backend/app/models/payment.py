"""
Payment transaction model helpers for the payment_transactions collection.
"""

COLLECTION_NAME = "payment_transactions"


async def create_indexes(db):
    """Create MongoDB indexes for the payment_transactions collection."""
    await db[COLLECTION_NAME].create_index("vendor_id")
    await db[COLLECTION_NAME].create_index("user_id")
    await db[COLLECTION_NAME].create_index("created_at")


def transaction_document(
    order_id: str,
    vendor_id: str,
    user_id: str,
    amount: float,
    transaction_id: str,
    status: str = "success",
    items: list = None,
    token_number: int = None,
    utr_number: str = None,
    verification_method: str = "webhook",
) -> dict:
    """Build a payment transaction document ready for insertion."""
    from datetime import datetime, timezone

    return {
        "order_id": order_id,
        "vendor_id": vendor_id,
        "user_id": user_id,
        "amount": amount,
        "transaction_id": transaction_id,
        "status": status,
        "items": items or [],
        "token_number": token_number,
        "utr_number": utr_number,
        "verification_method": verification_method,  # webhook | utr_submit | manual | auto_gmail
        "created_at": datetime.now(timezone.utc),
    }
