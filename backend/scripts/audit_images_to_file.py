import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_items_to_file():
    uri = 'mongodb+srv://swagatpatel03_db_user:X45ONtgXEJQAx2w0@kiiteats.q3glutb.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['kiiteats']
    collection = db['food_items']
    
    items = await collection.find().to_list(1000)
    with open("audit_results.txt", "w", encoding="utf-8") as f:
        f.write("--- START ---\n")
        for i in items:
            name = i.get("name", "Unknown")
            img = i.get("image_url", "EMPTY")
            f.write(f"NAME: {name} | IMG: {img}\n")
        f.write("--- END ---\n")
    client.close()

if __name__ == '__main__':
    asyncio.run(list_items_to_file())
