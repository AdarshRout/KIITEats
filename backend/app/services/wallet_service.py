from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from fastapi import HTTPException


async def get_wallet(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Get user's wallet balance and coins."""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "wallet_balance": user.get("wallet_balance", 0.0),
        "coins": user.get("coins", 0),
        "streak_count": user.get("streak_count", 0),
    }


async def add_coins(db: AsyncIOMotorDatabase, user_id: str, coins: int, reason: str = ""):
    """Add coins to a user's wallet (reward/cashback)."""
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"coins": coins}},
    )
    # Log the transaction
    from datetime import datetime, timezone
    await db.wallet_transactions.insert_one({
        "user_id": user_id,
        "type": "credit",
        "coins": coins,
        "reason": reason,
        "created_at": datetime.now(timezone.utc),
    })


async def redeem_coins(
    db: AsyncIOMotorDatabase,
    user_id: str,
    coins_to_redeem: int,
) -> float:
    """
    Redeem coins for a discount. 10 coins = ₹1 discount.
    Returns the discount amount.
    """
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    available_coins = user.get("coins", 0)
    if coins_to_redeem > available_coins:
        raise HTTPException(status_code=400, detail="Insufficient coins")

    discount = coins_to_redeem / 10.0  # ₹1 per 10 coins

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"coins": -coins_to_redeem}},
    )

    from datetime import datetime, timezone
    await db.wallet_transactions.insert_one({
        "user_id": user_id,
        "type": "debit",
        "coins": coins_to_redeem,
        "reason": f"Redeemed for ₹{discount:.2f} discount",
        "created_at": datetime.now(timezone.utc),
    })

    return discount
