import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import re

async def update_paneer():
    uri = os.getenv("MONGO_URI")
    client = AsyncIOMotorClient(uri)
    db = client['kiiteats']
    collection = db['food_items']

    res = await collection.update_many(
        {'name': re.compile(r'paneer butter masala', re.I)},
        {'$set': {'image_url': '/food/paneer_butter_masala.jpg'}}
    )
    print(f"Updated {res.modified_count} Paneer Butter Masala items to the custom image.")
    client.close()

if __name__ == '__main__':
    asyncio.run(update_paneer())
