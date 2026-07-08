from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import get_settings

settings = get_settings()

# Motor async client — single instance reused across the app
client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None


async def connect_to_database():
    """Initialize the Motor client and database reference."""
    global client, database
    client = AsyncIOMotorClient(settings.MONGO_URI)
    database = client[settings.DB_NAME]
    # Verify connection
    await client.admin.command("ping")
    print(f"✅ Connected to MongoDB: {settings.DB_NAME}")
    
    # Auto-seed the requested demo accounts
    try:
        await seed_demo_users(database)
    except Exception as e:
        print(f"⚠️ Error seeding demo accounts: {e}")


async def seed_demo_users(db):
    """Seed requested demo accounts: Student, Vendor, Admin."""
    from app.core.security import hash_password
    from app.models.user import user_document
    from app.models.vendor import COLLECTION_NAME as VENDOR_COLLECTION, vendor_document

    # 1. Student
    student_email = "student@kiit.ac.in"
    student = await db.users.find_one({"email": student_email})
    if not student:
        doc = user_document(name="Demo Student", email=student_email, password_hash=hash_password("pass123"), role="student")
        await db.users.insert_one(doc)
        print(f"🌱 Auto-seeded student: {student_email}")

    # 2. Vendor
    vendor_email = "vendor@kiitvendor.ac.in"
    vendor_user = await db.users.find_one({"email": vendor_email})
    if not vendor_user:
        doc = user_document(name="Demo Vendor", email=vendor_email, password_hash=hash_password("pass123"), role="vendor")
        res = await db.users.insert_one(doc)
        vendor_user_id = str(res.inserted_id)
        print(f"🌱 Auto-seeded vendor user: {vendor_email}")
    else:
        vendor_user_id = str(vendor_user["_id"])

    # Ensure vendor profile exists
    vendor_profile = await db[VENDOR_COLLECTION].find_one({"owner_user_id": vendor_user_id})
    if not vendor_profile:
        v_doc = vendor_document(
            name="KIIT Express Cafe",
            location="Campus 6 area",
            description="Fast food, beverages, and desserts",
            owner_user_id=vendor_user_id,
            images=["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"],
            upi_id="kiitexpress@okaxis",
            email=vendor_email,
            lat=20.3532,
            lng=85.8205
        )
        await db[VENDOR_COLLECTION].insert_one(v_doc)
        print(f"🌱 Auto-seeded vendor profile for: {vendor_email}")

    # 3. Admin
    admin_email = "admin@kiitadmin.ac.in"
    admin = await db.users.find_one({"email": admin_email})
    if not admin:
        doc = user_document(name="Demo Admin", email=admin_email, password_hash=hash_password("pass123"), role="admin")
        await db.users.insert_one(doc)
        print(f"🌱 Auto-seeded admin: {admin_email}")


async def close_database_connection():
    """Gracefully close the Motor client."""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Return the database instance for dependency injection."""
    return database

