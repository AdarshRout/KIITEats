import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def rename_fc():
    uri = 'mongodb+srv://swagatpatel03_db_user:X45ONtgXEJQAx2w0@kiiteats.q3glutb.mongodb.net/?retryWrites=true&w=majority'
    client = AsyncIOMotorClient(uri)
    db = client['kiiteats']
    
    # Using regex to catch any variation of Food Court 10 or KIMS
    res = await db['vendors'].update_one(
        {'name': {'$regex': 'Food Court 10|KIMS', '$options': 'i'}},
        {'$set': {'name': 'KIIT Food Court 8', 'description': 'Bustling food court known for quick meals and Indian fast food.'}}
    )
    print(f"Renamed {res.modified_count} vendor(s) to Food Court 8")
    client.close()

if __name__ == '__main__':
    asyncio.run(rename_fc())
