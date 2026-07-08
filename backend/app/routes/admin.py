from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database

router = APIRouter(prefix="/api/admin/analytics", tags=["Admin Analytics"])

@router.get("/inventory")
async def get_inventory_stock(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get total stock for each vendor."""
    pipeline = [
        {"$group": {"_id": "$vendor_id", "total_stock": {"$sum": "$stock"}}},
        {
            "$lookup": {
                "from": "vendors",
                "let": {"vendor_id_obj": {"$toObjectId": "$_id"}},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$_id", "$$vendor_id_obj"]}}}
                ],
                "as": "vendor_info"
            }
        },
        {"$unwind": {"path": "$vendor_info", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "vendor_id": "$_id",
                "vendor_name": {"$ifNull": ["$vendor_info.name", "$_id"]},
                "total_stock": 1,
                "_id": 0
            }
        },
        {"$sort": {"total_stock": -1}}
    ]
    cursor = db.food_items.aggregate(pipeline)
    return await cursor.to_list(length=None)

@router.get("/vendor-performance")
async def get_vendor_performance(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get top and poor performing vendors based on total completed orders/revenue."""
    pipeline = [
        {"$match": {"status": "delivered"}},
        {
            "$group": {
                "_id": "$vendor_id",
                "total_orders": {"$sum": 1},
                "total_revenue": {"$sum": "$total_amount"}
            }
        },
        {
            "$lookup": {
                "from": "vendors",
                "let": {"vendor_id_obj": {"$toObjectId": "$_id"}},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$_id", "$$vendor_id_obj"]}}}
                ],
                "as": "vendor_info"
            }
        },
        {"$unwind": {"path": "$vendor_info", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "vendor_id": "$_id",
                "vendor_name": {"$ifNull": ["$vendor_info.name", "$_id"]},
                "total_orders": 1,
                "total_revenue": 1,
                "_id": 0
            }
        },
        {"$sort": {"total_revenue": -1}}
    ]
    cursor = db.orders.aggregate(pipeline)
    results = await cursor.to_list(length=None)
    
    return {
        "top_performers": results[:5],
        "poor_performers": results[-5:] if len(results) > 5 else []
    }

@router.get("/peak-hours")
async def get_peak_hours(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get order count grouped by hour of the day."""
    pipeline = [
        {
            "$project": {
                "hour": {"$hour": "$created_at"}
            }
        },
        {
            "$group": {
                "_id": "$hour",
                "order_count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    cursor = db.orders.aggregate(pipeline)
    results = await cursor.to_list(length=None)
    
    # Format for chart (e.g., 0-23 hours)
    hours_data = [{"hour": f"{h}:00", "orders": 0} for h in range(24)]
    for r in results:
        if r["_id"] is not None:
            hours_data[r["_id"]]["orders"] = r["order_count"]
            
    return hours_data

@router.get("/overview")
async def get_analytics_overview(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get a high-level overview of platform metrics."""
    total_users = await db.users.count_documents({})
    total_vendors = await db.vendors.count_documents({})
    total_orders = await db.orders.count_documents({})
    
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    cursor = db.orders.aggregate(pipeline)
    statuses = await cursor.to_list(length=None)
    
    status_breakdown = {s["_id"]: s["count"] for s in statuses if s["_id"]}
    
    return {
        "total_users": total_users,
        "total_vendors": total_vendors,
        "total_orders": total_orders,
        "status_breakdown": status_breakdown
    }
