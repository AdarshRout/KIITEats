"""
Food item model helpers for the food_items collection.
"""

COLLECTION_NAME = "food_items"


async def create_indexes(db):
    """Create MongoDB indexes for the food_items collection."""
    await db[COLLECTION_NAME].create_index("vendor_id")
    await db[COLLECTION_NAME].create_index("category")


def food_document(
    vendor_id: str,
    name: str,
    price: float,
    category: str,
    description: str = "",
    image_url: str = "",
    available: bool = True,
    stock: int = 100,
) -> dict:
    """Build a food item document ready for insertion."""
    from datetime import datetime, timezone

    return {
        "vendor_id": vendor_id,
        "name": name,
        "price": price,
        "category": category,
        "description": description,
        "image_url": image_url,
        "available": available,
        "stock": stock,
        "created_at": datetime.now(timezone.utc),
    }
