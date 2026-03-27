"""
Shared MongoDB Database Connection
Breaks circular dependency between server.py and route modules
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables BEFORE accessing them
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# MongoDB connection with Atlas-ready configuration
mongo_url = os.environ['MONGO_URL']

# Detect if using Atlas (mongodb+srv://) and configure accordingly
is_atlas = "mongodb+srv" in mongo_url or "mongodb.net" in mongo_url

# Build client options dynamically
client_options = {
    "serverSelectionTimeoutMS": 5000,  # 5 second timeout for quick failure
    "connectTimeoutMS": 10000,  # 10 second connection timeout
    "socketTimeoutMS": 10000,  # 10 second socket timeout
    "retryWrites": True,  # Enable retry writes for Atlas
    "retryReads": True,  # Enable retry reads for Atlas
}

# Only add TLS options if using Atlas
if is_atlas:
    client_options["tls"] = True

# Create shared MongoDB client
client = AsyncIOMotorClient(mongo_url, **client_options)

# Get database from connection string or use DB_NAME env var
db = client[os.environ.get('DB_NAME', 'test_database')]

logger.info(f"📊 Shared MongoDB client initialized for database: {os.environ.get('DB_NAME', 'test_database')}")
