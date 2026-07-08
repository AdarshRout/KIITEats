import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def list_items():
    uri = os.getenv("MONGO_URI")
    client = AsyncIOMotorClient(uri)
    db = client['kiiteats']
    collection = db['food_items']
    
    items = await collection.find().to_list(1000)
    print("--- START ---")
    for i in items:
        name = i.get("name", "Unknown")
        img = i.get("image_url", "EMPTY")
        print(f"NAME: {name} | IMG: {img}")
    print("--- END ---")
    client.close()

if __name__ == '__main__':
    asyncio.run(list_items())
