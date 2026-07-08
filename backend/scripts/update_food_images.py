import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def update_food_images():
    uri = os.getenv("MONGO_URI")
    client = AsyncIOMotorClient(uri)
    db = client['kiiteats']
    collection = db['food_items']

    mapping = {
        'Caesar Salad Bowl': '/food/caesar_salad.png',
        'Greek Salad': '/food/greek_salad.png',
        'Quinoa Power Bowl': '/food/quinoa_power_bowl.png'
    }

    print(f"Connecting to MongoDB Atlas...")
    
    for name, img_url in mapping.items():
        try:
            # Find the item first to confirm existence
            item = await collection.find_one({'name': name})
            if item:
                # Perform the update
                result = await collection.update_one(
                    {'_id': item['_id']},
                    {'$set': {'image_url': img_url}}
                )
                if result.modified_count > 0:
                    print(f"✅ Updated {name} -> {img_url}")
                else:
                    print(f"ℹ️ {name} already has the correct image URL.")
            else:
                print(f"⚠️ Item '{name}' not found in database.")
        except Exception as e:
            print(f"❌ Error updating {name}: {str(e)}")

    client.close()

if __name__ == '__main__':
    asyncio.run(update_food_images())
