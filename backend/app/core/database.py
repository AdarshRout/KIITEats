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


async def close_database_connection():
    """Gracefully close the Motor client."""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Return the database instance for dependency injection."""
    return database
