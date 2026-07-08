import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import re

async def update_paneer():
    uri = 'mongodb+srv://swagatpatel03_db_user:X45ONtgXEJQAx2w0@kiiteats.q3glutb.mongodb.net/?retryWrites=true&w=majority'
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
