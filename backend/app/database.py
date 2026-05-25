import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("❌ MONGO_URI not found in .env file. Please check your .env setup.")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Verify connection is alive
    client.admin.command("ping")
    print("✅ MongoDB connected successfully!")
except ConnectionFailure as e:
    raise RuntimeError(f"❌ Could not connect to MongoDB: {e}")

db = client["memory_assistant_db"]

# Collections
items_collection = db["logged_items"]
users_collection = db["users"]

# Index: ensure email is unique for users
users_collection.create_index("email", unique=True)
