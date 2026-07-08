import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def remove_unsplash():
    uri = 'mongodb+srv://swagatpatel03_db_user:X45ONtgXEJQAx2w0@kiiteats.q3glutb.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['kiiteats']
    collection = db['food_items']

    res = await collection.update_many(
        {'image_url': {'$regex': 'unsplash', '$options': 'i'}},
        {'$set': {'image_url': ''}}
    )
    print(f"Removed fake Unsplash URLs from {res.modified_count} items")
    client.close()

if __name__ == '__main__':
    asyncio.run(remove_unsplash())
