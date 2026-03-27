"""
SMS Notification Helper - Auto-Trigger Functions
Handles automatic SMS notifications for game events
"""
import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from services.bulksms_client import bulksms_client
from datetime import datetime, timezone
import os

logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def check_sms_quota(user_id: str) -> tuple[bool, str]:
    """
    Check if user has SMS quota available
    Returns: (has_quota, message)
    """
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return False, "User not found"
    
    sms_quota = user.get('sms_quota', {})
    monthly_limit = sms_quota.get('monthly_limit', 0)
    used_this_month = sms_quota.get('used_this_month', 0)
    
    # -1 means unlimited (Platinum+)
    if monthly_limit == -1:
        return True, "Unlimited quota"
    
    # Check if quota available
    if monthly_limit == 0:
        return False, "No SMS quota (upgrade to Gold+ for SMS notifications)"
    
    if used_this_month >= monthly_limit:
        return False, f"Monthly quota exceeded ({used_this_month}/{monthly_limit})"
    
    return True, f"Quota available ({used_this_month}/{monthly_limit})"

async def increment_sms_usage(user_id: str):
    """Increment user's SMS usage counter"""
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"sms_quota.used_this_month": 1}}
    )

async def send_duel_challenge_sms(
    challenger_id: str,
    opponent_id: str,
    duel_type: str
) -> dict:
    """
    Send SMS notification when user is challenged to a duel
    """
    try:
        # Get opponent details
        opponent = await db.users.find_one({"id": opponent_id}, {"_id": 0})
        challenger = await db.users.find_one({"id": challenger_id}, {"_id": 0})
        
        if not opponent or not challenger:
            return {"success": False, "message": "User not found"}
        
        # Check if opponent has SMS enabled for duel challenges
        phone_number = opponent.get('phone_number')
        sms_prefs = opponent.get('sms_preferences', {})
        
        if not phone_number:
            return {"success": False, "message": "No phone number"}
        
        if not sms_prefs.get('duel_challenges', False):
            return {"success": False, "message": "SMS notifications disabled"}
        
        # Check quota
        has_quota, quota_msg = await check_sms_quota(opponent_id)
        if not has_quota:
            return {"success": False, "message": quota_msg}
        
        # Craft message (text-only, no emojis for better compatibility)
        challenger_name = challenger.get('username', 'A warrior')
        message = f"Calliotel: {challenger_name} challenged you to a {duel_type} duel! Open the app to accept."
        
        # Send SMS
        result = bulksms_client.send_sms(
            to=phone_number,
            message=message,
            from_name="Calliotel"
        )
        
        # Increment usage
        await increment_sms_usage(opponent_id)
        
        # Log notification
        await db.bulksms_logs.insert_one({
            "user_id": opponent_id,
            "challenger_id": challenger_id,
            "type": "duel_challenge",
            "duel_type": duel_type,
            "to": phone_number,
            "message": message,
            "status": "sent",
            "message_id": result.get('message_id'),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Duel challenge SMS sent to {opponent_id} from {challenger_id}")
        
        return {
            "success": True,
            "message_id": result.get('message_id'),
            "message": "SMS sent successfully"
        }
        
    except Exception as e:
        logger.error(f"Error sending duel challenge SMS: {str(e)}")
        return {"success": False, "message": str(e)}

async def send_achievement_unlock_sms(user_id: str, achievement_name: str) -> dict:
    """Send SMS when user unlocks an achievement"""
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        if not user:
            return {"success": False, "message": "User not found"}
        
        phone_number = user.get('phone_number')
        sms_prefs = user.get('sms_preferences', {})
        
        if not phone_number or not sms_prefs.get('achievements', False):
            return {"success": False, "message": "SMS not configured or disabled"}
        
        # Check quota
        has_quota, quota_msg = await check_sms_quota(user_id)
        if not has_quota:
            return {"success": False, "message": quota_msg}
        
        # Send SMS
        message = f"Calliotel: Achievement Unlocked - {achievement_name}! Keep climbing the ranks!"
        
        result = bulksms_client.send_sms(
            to=phone_number,
            message=message,
            from_name="Calliotel"
        )
        
        await increment_sms_usage(user_id)
        
        # Log notification
        await db.bulksms_logs.insert_one({
            "user_id": user_id,
            "type": "achievement",
            "achievement": achievement_name,
            "to": phone_number,
            "message": message,
            "status": "sent",
            "message_id": result.get('message_id'),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Achievement SMS sent to {user_id}: {achievement_name}")
        
        return {"success": True, "message_id": result.get('message_id')}
        
    except Exception as e:
        logger.error(f"Error sending achievement SMS: {str(e)}")
        return {"success": False, "message": str(e)}

async def send_tier_upgrade_sms(user_id: str, new_tier: str, old_tier: str) -> dict:
    """Send SMS when user upgrades to new tier"""
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        if not user:
            return {"success": False, "message": "User not found"}
        
        phone_number = user.get('phone_number')
        sms_prefs = user.get('sms_preferences', {})
        
        if not phone_number or not sms_prefs.get('tier_upgrades', False):
            return {"success": False, "message": "SMS not configured or disabled"}
        
        # Check quota (use old tier quota before upgrade)
        has_quota, quota_msg = await check_sms_quota(user_id)
        if not has_quota:
            return {"success": False, "message": quota_msg}
        
        # Send SMS
        message = f"Calliotel: TIER UPGRADE! You've reached {new_tier} tier! Your legend grows in the Digital Colosseum!"
        
        result = bulksms_client.send_sms(
            to=phone_number,
            message=message,
            from_name="Calliotel"
        )
        
        await increment_sms_usage(user_id)
        
        # Log notification
        await db.bulksms_logs.insert_one({
            "user_id": user_id,
            "type": "tier_upgrade",
            "old_tier": old_tier,
            "new_tier": new_tier,
            "to": phone_number,
            "message": message,
            "status": "sent",
            "message_id": result.get('message_id'),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Tier upgrade SMS sent to {user_id}: {old_tier} -> {new_tier}")
        
        return {"success": True, "message_id": result.get('message_id')}
        
    except Exception as e:
        logger.error(f"Error sending tier upgrade SMS: {str(e)}")
        return {"success": False, "message": str(e)}

async def send_duel_result_sms(user_id: str, result: str, opponent_name: str) -> dict:
    """Send SMS with duel result (victory/defeat)"""
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        
        if not user:
            return {"success": False, "message": "User not found"}
        
        phone_number = user.get('phone_number')
        sms_prefs = user.get('sms_preferences', {})
        
        if not phone_number or not sms_prefs.get('duel_results', False):
            return {"success": False, "message": "SMS not configured or disabled"}
        
        # Check quota
        has_quota, quota_msg = await check_sms_quota(user_id)
        if not has_quota:
            return {"success": False, "message": quota_msg}
        
        # Craft message based on result
        if result == "victory":
            message = f"Calliotel: VICTORY! You defeated {opponent_name} in the duel! XP gained!"
        else:
            message = f"Calliotel: Duel completed. {opponent_name} emerged victorious. Train harder!"
        
        result_obj = bulksms_client.send_sms(
            to=phone_number,
            message=message,
            from_name="Calliotel"
        )
        
        await increment_sms_usage(user_id)
        
        # Log notification
        await db.bulksms_logs.insert_one({
            "user_id": user_id,
            "type": "duel_result",
            "result": result,
            "opponent": opponent_name,
            "to": phone_number,
            "message": message,
            "status": "sent",
            "message_id": result_obj.get('message_id'),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Duel result SMS sent to {user_id}: {result}")
        
        return {"success": True, "message_id": result_obj.get('message_id')}
        
    except Exception as e:
        logger.error(f"Error sending duel result SMS: {str(e)}")
        return {"success": False, "message": str(e)}
