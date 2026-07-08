import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
db_name = os.getenv("DB_NAME", "kiiteats")

client = AsyncIOMotorClient(MONGO_URI)
db = client[db_name]

async def seed():
    print("Seeding database with Campus Vendors...")
    
    owner = await db.users.find_one({"role": "vendor"})
    if not owner:
        print("Creating generic vendor owner...")
        res = await db.users.insert_one({
            "email": "vendor_seed@kiit.ac.in",
            "name": "Seed Vendor",
            "role": "vendor",
            "password_hash": "placeholder",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        })
        owner_id = str(res.inserted_id)
    else:
        owner_id = str(owner["_id"])

    campuses = [
        {"name": "Campus 6 Food Court", "location": "Campus 6, KIIT", "desc": "Famous for biryani and fast food"},
        {"name": "Campus 8 Cafeteria", "location": "Campus 8, KIIT", "desc": "Best coffee and snacks"},
        {"name": "Campus 10 Mess", "location": "Campus 10, KIIT", "desc": "Authentic meals and South Indian"},
        {"name": "Campus 25 Bites", "location": "Campus 25, KIIT", "desc": "Pizzas, burgers, and beverages"},
        {"name": "Campus 15 Express", "location": "Campus 15, KIIT", "desc": "Quick bites and Chinese food"},
    ]

    menu_templates = [
        {"name": "Chicken Biryani", "price": 150, "category": "Main Course", "desc": "Aromatic basmati rice with tender chicken cooked in authentic spices", "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80"},
        {"name": "Margherita Pizza", "price": 120, "category": "Fast Food", "desc": "Classic delight with 100% real mozzarella cheese", "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80"},
        {"name": "Veg Burger", "price": 60, "category": "Fast Food", "desc": "Crispy potato patty with fresh veggies and creamy mayo", "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80"},
        {"name": "Masala Dosa", "price": 50, "category": "South Indian", "desc": "Crispy crepe served with spicy potato filling, sambar and chutney", "image": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&q=80"},
        {"name": "Hakka Noodles", "price": 90, "category": "Chinese", "desc": "Wok tossed noodles with crunchy vegetables", "image": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&q=80"},
        {"name": "Cold Coffee", "price": 40, "category": "Beverages", "desc": "Thick and creamy cold coffee blended with ice cream", "image": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80"},
        {"name": "Paneer Butter Masala", "price": 140, "category": "Main Course", "desc": "Rich and creamy curry made with paneer, spices, onions and tomatoes", "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=500&q=80"},
        {"name": "Momos (Veg)", "price": 60, "category": "Snacks", "desc": "Steamed dumplings filled with finely chopped fresh vegetables", "image": "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=500&q=80"},
    ]

    for c in campuses:
        existing = await db.vendors.find_one({"name": c["name"]})
        if not existing:
            print(f"Adding vendor: {c['name']}")
            res = await db.vendors.insert_one({
                "name": c["name"],
                "location": c["location"],
                "description": c["desc"],
                "owner_user_id": owner_id,
                "images": ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc)
            })
            vid = str(res.inserted_id)

            print(f" -> Adding menu items for {c['name']}")
            items = []
            for t in menu_templates:
                items.append({
                    "vendor_id": vid,
                    "name": t["name"],
                    "price": t["price"],
                    "category": t["category"],
                    "description": t["desc"],
                    "image_url": t["image"],
                    "available": True,
                    "stock": 50,
                    "created_at": datetime.now(timezone.utc)
                })
            await db.food_items.insert_many(items)
        else:
            print(f"Vendor {c['name']} already exists.")
            
    print("Seed complete!")

if __name__ == "__main__":
    asyncio.run(seed())
