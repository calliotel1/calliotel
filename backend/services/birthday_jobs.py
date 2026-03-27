"""
Birthday background jobs
Runs daily to check for birthdays and send notifications
"""

import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def check_birthdays_async():
    """
    Check for today's birthdays and send notifications
    """
    try:
        from routes.birthdays import check_todays_birthdays
        # Call the birthday checking endpoint
        result = await check_todays_birthdays()
        logger.info(f"Birthday check completed: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in birthday check job: {str(e)}")
        return None


def run_birthday_checks():
    """
    Synchronous wrapper for birthday checking (called by scheduler)
    """
    logger.info("🎂 Starting birthday checks...")
    try:
        # Create new event loop for this job
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(check_birthdays_async())
        loop.close()
        logger.info(f"✅ Birthday checks completed: {result}")
        return True
    except Exception as e:
        logger.error(f"❌ Birthday check job failed: {str(e)}")
        return False
