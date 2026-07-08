import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

async def main():
    # 1. Database Connection
    MONGO_URI = os.getenv("MONGO_URI")
    DB_NAME = os.getenv("DB_NAME", "kiiteats")
    
    if not MONGO_URI:
        print("Error: MONGO_URI not found in .env")
        return
        
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # 2. Find template vendor: Food Court 1
    # Using regex to find the vendor with "Court 1" in its name
    fc1 = await db.vendors.find_one({"name": {"$regex": "Court 1", "$options": "i"}})
    
    if not fc1:
        print("Vendor 'Food Court 1' not found. Fetching the first available vendor as template.")
        fc1 = await db.vendors.find_one({})
        if not fc1:
            print("No vendors found in the database!")
            return
            
    # Extract payment details from template vendor
    qr_url = fc1.get("qr_image_url")
    upi_id = fc1.get("upi_id")
    
    if not qr_url:
        print(f"Warning: Template vendor '{fc1['name']}' has no qr_image_url set.")
    if not upi_id:
        print(f"Warning: Template vendor '{fc1['name']}' has no upi_id set.")

    print(f"Template Vendor: {fc1['name']}")
    print(f"QR URL: {qr_url}")
    print(f"UPI ID: {upi_id}")
    print("-" * 30)

    # 3. Update all other vendors
    # We update all vendors excluding the template one.
    update_result = await db.vendors.update_many(
        {"_id": {"$ne": fc1["_id"]}},
        {"$set": {
            "qr_image_url": qr_url,
            "upi_id": upi_id
        }}
    )

    print(f"Success! Updated {update_result.modified_count} vendors with the payment credentials of {fc1['name']}.")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
