import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

async def main():
    MONGO_URI = os.getenv("MONGO_URI")
    DB_NAME = os.getenv("DB_NAME", "kiiteats")
    
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # 1. Find Food Court 1
    fc1 = await db.vendors.find_one({"name": {"$regex": "Court 1", "$options": "i"}})
    if not fc1:
        print("Vendor 'Food Court 1' not found. Trying another vendor.")
        # fallback to the first vendor
        fc1 = await db.vendors.find_one({})
        if not fc1:
            print("No vendors found!")
            return
            
    fc1_id = str(fc1["_id"])
    print(f"Template Vendor: {fc1['name']} ({fc1_id})")
    
    # 2. Extract its food items
    template_foods = await db.food_items.find({"vendor_id": fc1_id}).to_list(1000)
    print(f"Found {len(template_foods)} food items for template vendor.")
    
    if not template_foods:
        print("Template vendor has NO food items. Nothing to duplicate.")
        return
        
    # 3. Get all other vendors
    other_vendors = await db.vendors.find({"_id": {"$ne": fc1["_id"]}}).to_list(1000)
    print(f"Found {len(other_vendors)} other vendors.")
    
    for vendor in other_vendors:
        vendor_id = str(vendor["_id"])
        
        # 4. Optional: Delete existing foods to make them identical, uncomment if needed
        # await db.food_items.delete_many({"vendor_id": vendor_id})
        
        # Check if they already have these foods to avoid duplicates
        existing_foods = await db.food_items.find({"vendor_id": vendor_id}).to_list(1000)
        existing_names = set([f['name'] for f in existing_foods])
        
        # 5. Insert new foods
        new_docs = []
        for f in template_foods:
            if f['name'] not in existing_names:
                new_doc = f.copy()
                new_doc.pop("_id", None)  # remove original ObjectId
                new_doc["vendor_id"] = vendor_id
                new_docs.append(new_doc)
                
        if new_docs:
            await db.food_items.insert_many(new_docs)
            print(f"Added {len(new_docs)} items to {vendor['name']}")
        else:
            print(f"No new items to add for {vendor['name']} (already has them)")

    print("Success: All food courts populated with the template menu!")
    
if __name__ == "__main__":
    asyncio.run(main())
