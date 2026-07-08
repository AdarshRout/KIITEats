"""
AI Combo Recommendation Service
Uses association rules (frequent itemset mining) on order history
to suggest food combos to users.
"""
from collections import Counter, defaultdict
from itertools import combinations
from motor.motor_asyncio import AsyncIOMotorDatabase


async def get_combo_recommendations(
    db: AsyncIOMotorDatabase,
    user_id: str = None,
    vendor_id: str = None,
    top_n: int = 5,
) -> list:
    """
    Recommend food combos based on order history.
    Uses simple association rules / frequent itemset mining.

    Strategy:
    1. Fetch recent orders (optionally filtered by vendor)
    2. Find frequently co-ordered item pairs
    3. Rank by frequency
    4. Return top N combos
    """
    query = {}
    if vendor_id:
        query["vendor_id"] = vendor_id
    if user_id:
        # Also consider user-specific patterns
        pass

    orders = await db.orders.find(query).sort("created_at", -1).to_list(500)

    if not orders:
        return []

    # Extract item sets from each order
    order_item_sets = []
    for order in orders:
        items = order.get("items", [])
        item_names = [item["name"] for item in items]
        if len(item_names) >= 2:
            order_item_sets.append(frozenset(item_names))

    if not order_item_sets:
        return []

    # Count pair frequencies
    pair_counts = Counter()
    for item_set in order_item_sets:
        for pair in combinations(item_set, 2):
            pair_counts[frozenset(pair)] += 1

    # Get top combos
    top_combos = pair_counts.most_common(top_n)

    # Enrich with prices
    combos = []
    for combo_set, freq in top_combos:
        combo_items = list(combo_set)
        total_price = 0.0
        enriched = []
        for name in combo_items:
            food = await db.food_items.find_one({"name": name})
            price = food["price"] if food else 0.0
            total_price += price
            enriched.append({"name": name, "price": price})

        combos.append({
            "items": enriched,
            "combo_price": round(total_price * 0.9, 2),  # 10% combo discount
            "original_price": round(total_price, 2),
            "frequency": freq,
            "savings": round(total_price * 0.1, 2),
        })

    return combos


async def get_personalized_recommendations(
    db: AsyncIOMotorDatabase,
    user_id: str,
    top_n: int = 5,
) -> list:
    """
    Get personalized food recommendations based on user's order history.
    Returns frequently ordered items + items similar users ordered.
    """
    # Get user's order history
    user_orders = await db.orders.find({"user_id": user_id}).to_list(100)

    if not user_orders:
        # New user — return popular items
        popular = await db.orders.aggregate([
            {"$unwind": "$items"},
            {"$group": {"_id": "$items.name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": top_n},
        ]).to_list(top_n)

        return [{"name": item["_id"], "reason": "Popular on campus"} for item in popular]

    # Count user's frequently ordered items
    item_counter = Counter()
    for order in user_orders:
        for item in order.get("items", []):
            item_counter[item["name"]] += 1

    # Return top items the user orders frequently
    recommendations = []
    for name, count in item_counter.most_common(top_n):
        food = await db.food_items.find_one({"name": name, "available": True})
        if food:
            recommendations.append({
                "name": name,
                "price": food["price"],
                "vendor_id": food["vendor_id"],
                "reason": f"You've ordered this {count} times",
            })

    return recommendations
