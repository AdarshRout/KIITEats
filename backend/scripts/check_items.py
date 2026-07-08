import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    uri = 'mongodb+srv://swagatpatel03_db_user:X45ONtgXEJQAx2w0@kiiteats.q3glutb.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['kiiteats']
    items = await db['food_items'].find({'name': {'$regex': 'Rasgulla|Mango Kulfi|Gulab'}}).to_list(10)
    for i in items:
        print(f"{i.get('name')}: {i.get('image_url')}")
        print(f"Category: {i.get('category')}")
    client.close()

if __name__ == '__main__':
    asyncio.run(check())
