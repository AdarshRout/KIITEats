import asyncio
import os
import random
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from bson import ObjectId

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MONGODB_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "kiiteats")

async def force_variety():
    if not MONGODB_URI:
        print("Error: MONGO_URI not found in .env")
        return

    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    # 1. Get all vendors
    vendors = await db.vendors.find().to_list(100)
    print(f"Ensuring variety for {len(vendors)} vendors...")

    for v in vendors:
        v_id = str(v["_id"])
        # Get items for this vendor
        items = await db.food_items.find({"vendor_id": v_id}).to_list(1000)
        
        if not items:
            continue
            
        print(f"Updating {len(items)} items for vendor {v['name']} ({v_id})")
        
        # Shuffle to pick random ones for sold out / low stock
        random.shuffle(items)
        
        # Set at least 2 to sold out
        for i in range(min(len(items), 2)):
            await db.food_items.update_one(
                {"_id": items[i]["_id"]},
                {"$set": {"stock": 0}}
            )
            
        # Set at least 3 to low stock (1-10)
        for i in range(2, min(len(items), 5)):
            await db.food_items.update_one(
                {"_id": items[i]["_id"]},
                {"$set": {"stock": random.randint(1, 10)}}
            )

        # Set the rest to healthy (20-80)
        for i in range(5, len(items)):
            await db.food_items.update_one(
                {"_id": items[i]["_id"]},
                {"$set": {"stock": random.randint(20, 80)}}
            )

    print("Stock variety forced successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(force_variety())
