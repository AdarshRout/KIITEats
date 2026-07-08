"""
Vendor model helpers for the vendors collection.
"""

COLLECTION_NAME = "vendors"


async def create_indexes(db):
    """Create MongoDB indexes for the vendors collection."""
    await db[COLLECTION_NAME].create_index("owner_user_id")


def vendor_document(
    name: str,
    location: str,
    description: str,
    owner_user_id: str,
    images: list = None,
    qr_image_url: str = "",
    upi_id: str = "",
    email: str = "",
    lat: float = 0.0,
    lng: float = 0.0,
) -> dict:
    """Build a vendor document ready for insertion."""
    from datetime import datetime, timezone

    return {
        "name": name,
        "location": location,
        "description": description,
        "owner_user_id": owner_user_id,
        "images": images or [],
        "qr_image_url": qr_image_url,
        "upi_id": upi_id,
        "email": email,
        "lat": lat,
        "lng": lng,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
