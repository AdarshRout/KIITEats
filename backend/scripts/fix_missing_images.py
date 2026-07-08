import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import re

async def fix_missing_images():
    uri = os.getenv("MONGO_URI")
    client = AsyncIOMotorClient(uri)
    db = client['kiiteats']
    collection = db['food_items']

    mapping = [
        (re.compile(r'biryani', re.I), '/food/biryani.png'),
        (re.compile(r'fruit salad', re.I), '/food/fruit_salad.png'),
        (re.compile(r'roll', re.I), '/food/rolls.png'),
        (re.compile(r'caesar salad', re.I), '/food/caesar_salad.png'),
        (re.compile(r'greek salad', re.I), '/food/greek_salad.png'),
        (re.compile(r'quinoa power', re.I), '/food/quinoa_power_bowl.png'),
        (re.compile(r'paneer butter masala', re.I), '/food/paneer_butter_masala.jpg'),
        (re.compile(r'pizza', re.I), 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80'),
        (re.compile(r'burger', re.I), 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'),
        (re.compile(r'pasta|penne|alfredo|mac|aglio', re.I), 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80'),
        (re.compile(r'noodles|mein|chow|hakka', re.I), 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80'),
        (re.compile(r'thali|combo|bhature|dosa', re.I), 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80'),
        (re.compile(r'jamun|rasgulla|kulfi|sweet|dessert', re.I), 'https://images.unsplash.com/photo-1589113182023-704e60128bca?w=800&q=80'),
        (re.compile(r'brownie|cake|pastry|slice|cheesecake|cupcake', re.I), 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80'),
        (re.compile(r'sandwich', re.I), 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80'),
        (re.compile(r'coffee|beverage|drink|tea', re.I), 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80'),
        (re.compile(r'.*', re.I), 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'), # Global Ultimate Fallback (Food Platter)
    ]

    # Find items where image_url is strictly empty or doesn't exist
    items = await collection.find({'$or': [{'image_url': ''}, {'image_url': None}, {'image_url': {'$exists': False}}]}).to_list(1000)
    print(f"Auditing missing images... Found {len(items)} items strictly missing images.")

    count = 0
    for item in items:
        name = item.get("name", "")
        # Find first matching pattern
        for pattern, url in mapping:
            if pattern.search(name):
                res = await collection.update_one({'_id': item['_id']}, {'$set': {'image_url': url}})
                if res.modified_count > 0:
                    count += 1
                    print(f"✅ Fixed missing '{name}' -> {url}")
                break
    
    print(f"Total missing images fixed: {count}")
    client.close()

if __name__ == '__main__':
    asyncio.run(fix_missing_images())
