import os

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "grit_hackathon")

_client: AsyncIOMotorClient | None = None


def get_database() -> AsyncIOMotorDatabase:
    global _client

    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URL)

    return _client[MONGODB_DB_NAME]


db = get_database()