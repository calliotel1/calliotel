"""
Database Migration: Add SMS Fields to User Collection
Adds phone_number, sms_preferences, and sms_quota fields
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def migrate_users_add_sms_fields():
    """Add SMS-related fields to all users"""
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔄 Starting SMS fields migration...")
    
    # Default SMS preferences based on tier
    default_sms_preferences = {
        "duel_challenges": True,
        "duel_results": True,
        "achievements": True,
        "tier_upgrades": True,
        "global_square_mentions": False,
        "direct_messages": False,
        "admin_broadcasts": True
    }
    
    # Update all users to add SMS fields if they don't exist
    result = await db.users.update_many(
        {
            "$or": [
                {"phone_number": {"$exists": False}},
                {"sms_preferences": {"$exists": False}},
                {"sms_quota": {"$exists": False}}
            ]
        },
        {
            "$set": {
                "phone_number": None,  # Will be set by user
                "phone_verified": False,
                "sms_preferences": default_sms_preferences,
                "sms_quota": {
                    "monthly_limit": 0,  # Will be set based on tier
                    "used_this_month": 0,
                    "reset_date": datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0).isoformat()
                },
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    print(f"✅ Updated {result.modified_count} users with SMS fields")
    
    # Set SMS quotas based on tier
    tier_quotas = {
        "Bronze": 0,      # No SMS
        "Silver": 0,      # No SMS
        "Gold": 20,       # 20 SMS per month
        "Platinum": -1,   # Unlimited (-1 means no limit)
        "Diamond": -1,    # Unlimited
        "Architect": -1   # Unlimited
    }
    
    for tier, quota in tier_quotas.items():
        result = await db.users.update_many(
            {"tier": tier},
            {
                "$set": {
                    "sms_quota.monthly_limit": quota
                }
            }
        )
        print(f"✅ Set {tier} tier quota to {quota if quota != -1 else 'unlimited'} ({result.modified_count} users)")
    
    # Get statistics
    total_users = await db.users.count_documents({})
    users_with_phone = await db.users.count_documents({"phone_number": {"$ne": None}})
    
    print(f"\n📊 Migration Statistics:")
    print(f"   Total users: {total_users}")
    print(f"   Users with phone number: {users_with_phone}")
    print(f"   Users without phone: {total_users - users_with_phone}")
    
    print("\n🎯 SMS Quota Distribution:")
    for tier, quota in tier_quotas.items():
        count = await db.users.count_documents({"tier": tier})
        quota_display = "unlimited" if quota == -1 else f"{quota} SMS/month"
        print(f"   {tier}: {count} users ({quota_display})")
    
    print("\n✅ Migration complete!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_users_add_sms_fields())
