import asyncio
import random
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load env from regular location
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MONGODB_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "kiiteats")

async def randomize_stock():
    if not MONGODB_URI:
        print("Error: MONGO_URI not found in .env")
        return

    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    foods = await db.food_items.find().to_list(1000)
    print(f"Randomizing stock for {len(foods)} items...")

    for food in foods:
        chance = random.random()
        if chance < 0.15:
            new_stock = 0
        elif chance < 0.4:
            new_stock = random.randint(1, 10)
        else:
            new_stock = random.randint(11, 100)
            
        await db.food_items.update_one(
            {"_id": food["_id"]},
            {"$set": {"stock": new_stock}}
        )

    print("Stock randomization complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(randomize_stock())
