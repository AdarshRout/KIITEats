"""
Split-group routes: lightweight bill-splitting sessions between students.
Flow: organizer creates → invites members → members accept → organizer shares UPI → members pay.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import List, Optional

from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter(prefix="/splits", tags=["Bill Splitting"])

COLLECTION = "split_groups"


# ── Schemas ──────────────────────────────────────────────────────────────

class SplitCreate(BaseModel):
    total_amount: float = Field(..., ge=0, examples=[200.0])
    upi_id: str = Field(default="", examples=["organizer@paytm"])


class InviteMembers(BaseModel):
    user_ids: List[str] = Field(..., min_length=1)


class AcceptDecline(BaseModel):
    action: str = Field(..., pattern="^(accept|decline)$")


# ── Helpers ──────────────────────────────────────────────────────────────

async def _get_user_name(db, user_id: str) -> str:
    """Resolve user_id to user name."""
    if ObjectId.is_valid(user_id):
        u = await db.users.find_one({"_id": ObjectId(user_id)}, {"name": 1})
        if u:
            return u.get("name", "Unknown")
    return "Unknown"


async def _enrich(db, doc: dict) -> dict:
    """Add host_name and member names to a split document for frontend display."""
    doc["_id"] = str(doc["_id"])
    doc["host_name"] = await _get_user_name(db, doc["host_id"])
    for m in doc.get("members", []):
        m["name"] = await _get_user_name(db, m["user_id"])
    return doc


# ── Routes ───────────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_split(
    data: SplitCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Create a new split group. Current user becomes the organizer/host."""
    doc = {
        "host_id": current_user["_id"],
        "total_amount": data.total_amount,
        "upi_id": data.upi_id,
        "qr_image": "",  # base64 or URL, set via update
        "members": [],   # [{user_id, status: pending|accepted|declined|paid, name}]
        "status": "open",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["host_name"] = current_user.get("name", "")
    return doc


@router.post("/{split_id}/invite")
async def invite_members(
    split_id: str,
    data: InviteMembers,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Invite students to a split group (host only)."""
    if not ObjectId.is_valid(split_id):
        raise HTTPException(status_code=400, detail="Invalid split ID")

    doc = await db[COLLECTION].find_one({"_id": ObjectId(split_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Split group not found")
    if doc["host_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the organizer can invite members")

    existing_ids = {m["user_id"] for m in doc.get("members", [])}
    new_members = []
    for uid in data.user_ids:
        if uid == current_user["_id"]:
            continue  # Can't invite yourself
        if uid in existing_ids:
            continue  # Already invited
        new_members.append({"user_id": uid, "status": "pending"})

    if new_members:
        await db[COLLECTION].update_one(
            {"_id": ObjectId(split_id)},
            {"$push": {"members": {"$each": new_members}}},
        )

    return {"message": f"Invited {len(new_members)} member(s)"}


@router.post("/{split_id}/respond")
async def respond_to_invite(
    split_id: str,
    data: AcceptDecline,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Accept or decline a split invitation."""
    if not ObjectId.is_valid(split_id):
        raise HTTPException(status_code=400, detail="Invalid split ID")

    doc = await db[COLLECTION].find_one({"_id": ObjectId(split_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Split group not found")

    found = False
    for m in doc.get("members", []):
        if m["user_id"] == current_user["_id"]:
            if m["status"] != "pending":
                raise HTTPException(status_code=400, detail=f"Already {m['status']}")
            m["status"] = "accepted" if data.action == "accept" else "declined"
            found = True
            break

    if not found:
        raise HTTPException(status_code=403, detail="You are not invited to this split")

    await db[COLLECTION].update_one(
        {"_id": ObjectId(split_id)},
        {"$set": {"members": doc["members"]}},
    )

    return {"message": f"Invitation {data.action}ed"}


@router.post("/{split_id}/mark-paid/{user_id}")
async def mark_member_paid(
    split_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Mark a member as paid (host only)."""
    if not ObjectId.is_valid(split_id):
        raise HTTPException(status_code=400, detail="Invalid split ID")

    doc = await db[COLLECTION].find_one({"_id": ObjectId(split_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Split group not found")
    if doc["host_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the organizer can mark payments")

    for m in doc.get("members", []):
        if m["user_id"] == user_id:
            m["status"] = "paid"
            break

    await db[COLLECTION].update_one(
        {"_id": ObjectId(split_id)},
        {"$set": {"members": doc["members"]}},
    )

    return {"message": "Marked as paid"}


@router.patch("/{split_id}")
async def update_split(
    split_id: str,
    data: SplitCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Update split total/UPI (host only)."""
    if not ObjectId.is_valid(split_id):
        raise HTTPException(status_code=400, detail="Invalid split ID")

    doc = await db[COLLECTION].find_one({"_id": ObjectId(split_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Split group not found")
    if doc["host_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the organizer can update")

    updates = {"total_amount": data.total_amount}
    if data.upi_id:
        updates["upi_id"] = data.upi_id

    await db[COLLECTION].update_one(
        {"_id": ObjectId(split_id)},
        {"$set": updates},
    )

    return {"message": "Updated"}


@router.post("/{split_id}/cancel")
async def cancel_split(
    split_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Cancel an active split group (host only)."""
    if not ObjectId.is_valid(split_id):
        raise HTTPException(status_code=400, detail="Invalid split ID")

    doc = await db[COLLECTION].find_one({"_id": ObjectId(split_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Split group not found")
    if doc["host_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the organizer can cancel this split")

    await db[COLLECTION].update_one(
        {"_id": ObjectId(split_id)},
        {"$set": {"status": "cancelled"}},
    )

    return {"message": "Split cancelled"}


@router.get("/my")
async def get_my_splits(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Get all splits where current user is host or member."""
    query = {
        "$or": [
            {"host_id": current_user["_id"]},
            {"members.user_id": current_user["_id"]},
        ]
    }
    docs = await db[COLLECTION].find(query).sort("created_at", -1).to_list(50)
    enriched = []
    for d in docs:
        enriched.append(await _enrich(db, d))
    return enriched


@router.get("/{split_id}")
async def get_split(
    split_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    """Get a single split group."""
    if not ObjectId.is_valid(split_id):
        raise HTTPException(status_code=400, detail="Invalid split ID")

    doc = await db[COLLECTION].find_one({"_id": ObjectId(split_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Split group not found")

    return await _enrich(db, doc)
