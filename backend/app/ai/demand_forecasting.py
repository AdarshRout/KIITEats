"""
AI Demand Forecasting Module
Predicts food item demand using order history patterns.
Since initial data is sparse, the system learns progressively from order history.
"""
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase


async def forecast_demand(
    db: AsyncIOMotorDatabase,
    vendor_id: str,
    days_ahead: int = 1,
) -> list:
    """
    Predict demand for a vendor's items based on historical order patterns.

    Strategy:
    1. Analyze order history by day-of-week and item
    2. Calculate average daily demand per item
    3. Return predictions with confidence levels

    Returns:
    [
        {
            "item_name": "Momos",
            "predicted_quantity": 25,
            "confidence": "high",
            "day": "Friday",
            "alert": "High demand predicted for Momos on Friday"
        }
    ]
    """
    # Get the target day
    target_date = datetime.now(timezone.utc) + timedelta(days=days_ahead)
    target_day_name = target_date.strftime("%A")
    target_day_num = target_date.weekday()

    # Fetch historical orders for this vendor
    orders = await db.orders.find({
        "vendor_id": vendor_id,
        "status": {"$ne": "cancelled"},
    }).to_list(1000)

    if not orders:
        return [{
            "message": "Not enough order history for predictions yet.",
            "day": target_day_name,
        }]

    # Group demand by day-of-week and item
    daily_demand = defaultdict(lambda: defaultdict(list))

    for order in orders:
        if not order.get("created_at"):
            continue
        order_day = order["created_at"].weekday()
        for item in order.get("items", []):
            daily_demand[order_day][item["name"]].append(item["quantity"])

    # Calculate predictions for target day
    predictions = []
    day_data = daily_demand.get(target_day_num, {})

    for item_name, quantities in day_data.items():
        avg_qty = sum(quantities) / len(quantities)
        total_orders = len(quantities)

        # Determine confidence
        if total_orders >= 10:
            confidence = "high"
        elif total_orders >= 3:
            confidence = "medium"
        else:
            confidence = "low"

        predicted_qty = round(avg_qty * 1.1)  # Add 10% buffer

        alert = None
        if predicted_qty > 20:
            alert = f"⚠️ High demand predicted for {item_name} on {target_day_name}"

        predictions.append({
            "item_name": item_name,
            "predicted_quantity": predicted_qty,
            "average_daily": round(avg_qty, 1),
            "confidence": confidence,
            "data_points": total_orders,
            "day": target_day_name,
            "alert": alert,
        })

    # Sort by predicted quantity (highest first)
    predictions.sort(key=lambda x: x["predicted_quantity"], reverse=True)

    return predictions


async def get_demand_alerts(
    db: AsyncIOMotorDatabase,
    vendor_id: str,
) -> list:
    """
    Get demand alerts for the next 3 days.
    Useful for vendor dashboard.
    """
    alerts = []
    for days in range(1, 4):
        preds = await forecast_demand(db, vendor_id, days_ahead=days)
        for pred in preds:
            if pred.get("alert"):
                alerts.append(pred)
    return alerts
