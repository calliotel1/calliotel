"""
BulkSMS Integration Routes for Digital Colosseum
Handles SMS notifications for duels, achievements, and system alerts
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from services.bulksms_client import bulksms_client
import os

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class SendTestSMSRequest(BaseModel):
    phone_number: str
    message: Optional[str] = "🏛️ Welcome to the Digital Colosseum! This is a test message from Calliotel."

class SendDuelNotificationRequest(BaseModel):
    opponent_id: str
    duel_type: str

class SendBulkSMSRequest(BaseModel):
    recipient_ids: List[str]
    message: str

@router.post("/test")
async def send_test_sms(
    request: SendTestSMSRequest,
    current_user = Depends(get_current_user)
):
    """
    Send a test SMS to verify BulkSMS integration works
    """
    try:
        # Validate phone number format
        if not bulksms_client.validate_phone_number(request.phone_number):
            raise HTTPException(
                status_code=400,
                detail="Invalid phone number format. Use E.164 format (e.g., +27123456789)"
            )
        
        # Send SMS
        result = bulksms_client.send_sms(
            to=request.phone_number,
            message=request.message,
            from_name="Calliotel"
        )
        
        # Log in database
        sms_log = {
            "user_id": current_user["id"],
            "type": "test",
            "to": request.phone_number,
            "message": request.message,
            "status": "sent",
            "message_id": result.get('message_id'),
            "cost": result.get('cost', 0.01),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.bulksms_logs.insert_one(sms_log)
        
        logger.info(f"Test SMS sent to {request.phone_number} for user {current_user['id']}")
        
        return {
            "success": True,
            "message": "SMS sent successfully!",
            "message_id": result.get('message_id'),
            "cost": result.get('cost')
        }
        
    except Exception as e:
        logger.error(f"Error sending test SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notify/duel-challenge")
async def send_duel_challenge_notification(
    request: SendDuelNotificationRequest,
    current_user = Depends(get_current_user)
):
    """
    Send SMS notification when a user is challenged to a duel
    """
    try:
        # Get opponent details
        opponent = await db.users.find_one({"id": request.opponent_id}, {"_id": 0})
        if not opponent:
            raise HTTPException(status_code=404, detail="Opponent not found")
        
        # Check if opponent has SMS notifications enabled and phone number set
        phone_number = opponent.get('phone_number')
        sms_enabled = opponent.get('settings', {}).get('sms_notifications', {}).get('duel_challenges', False)
        
        if not phone_number:
            return {
                "success": False,
                "message": "Opponent has no phone number configured"
            }
        
        if not sms_enabled:
            return {
                "success": False,
                "message": "Opponent has SMS notifications disabled"
            }
        
        # Craft message
        challenger_name = current_user.get('username', 'A warrior')
        message = f"⚔️ {challenger_name} has challenged you to a {request.duel_type} duel! Open Calliotel to accept the challenge. 🏛️"
        
        # Send SMS
        result = bulksms_client.send_sms(
            to=phone_number,
            message=message,
            from_name="Calliotel"
        )
        
        # Log notification
        notification_log = {
            "user_id": request.opponent_id,
            "challenger_id": current_user["id"],
            "type": "duel_challenge",
            "duel_type": request.duel_type,
            "to": phone_number,
            "message": message,
            "status": "sent",
            "message_id": result.get('message_id'),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.bulksms_logs.insert_one(notification_log)
        
        logger.info(f"Duel challenge SMS sent to {request.opponent_id}")
        
        return {
            "success": True,
            "message": "Duel challenge notification sent!",
            "message_id": result.get('message_id')
        }
        
    except Exception as e:
        logger.error(f"Error sending duel notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notify/achievement")
async def send_achievement_notification(
    achievement_name: str,
    current_user = Depends(get_current_user)
):
    """
    Send SMS notification when a user unlocks an achievement
    """
    try:
        # Check if user has SMS notifications enabled
        phone_number = current_user.get('phone_number')
        sms_enabled = current_user.get('settings', {}).get('sms_notifications', {}).get('achievements', False)
        
        if not phone_number or not sms_enabled:
            return {
                "success": False,
                "message": "SMS notifications not configured"
            }
        
        # Craft message
        message = f"🏆 Achievement Unlocked: {achievement_name}! You're climbing the ranks in the Digital Colosseum! 👑"
        
        # Send SMS
        result = bulksms_client.send_sms(
            to=phone_number,
            message=message,
            from_name="Calliotel"
        )
        
        # Log notification
        notification_log = {
            "user_id": current_user["id"],
            "type": "achievement",
            "achievement": achievement_name,
            "to": phone_number,
            "message": message,
            "status": "sent",
            "message_id": result.get('message_id'),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.bulksms_logs.insert_one(notification_log)
        
        return {
            "success": True,
            "message": "Achievement notification sent!",
            "message_id": result.get('message_id')
        }
        
    except Exception as e:
        logger.error(f"Error sending achievement notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notify/tier-upgrade")
async def send_tier_upgrade_notification(
    new_tier: str,
    current_user = Depends(get_current_user)
):
    """
    Send SMS notification when a user upgrades to a new tier
    """
    try:
        # Check if user has SMS notifications enabled
        phone_number = current_user.get('phone_number')
        sms_enabled = current_user.get('settings', {}).get('sms_notifications', {}).get('tier_upgrades', False)
        
        if not phone_number or not sms_enabled:
            return {
                "success": False,
                "message": "SMS notifications not configured"
            }
        
        # Tier emojis
        tier_emojis = {
            "Bronze": "🥉",
            "Silver": "🥈",
            "Gold": "🥇",
            "Platinum": "💎",
            "Diamond": "💠",
            "Architect": "👑"
        }
        
        emoji = tier_emojis.get(new_tier, "⭐")
        message = f"{emoji} TIER UPGRADE! You've reached {new_tier} tier in the Digital Colosseum! Your legend grows! 🏛️"
        
        # Send SMS
        result = bulksms_client.send_sms(
            to=phone_number,
            message=message,
            from_name="Calliotel"
        )
        
        # Log notification
        notification_log = {
            "user_id": current_user["id"],
            "type": "tier_upgrade",
            "new_tier": new_tier,
            "to": phone_number,
            "message": message,
            "status": "sent",
            "message_id": result.get('message_id'),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.bulksms_logs.insert_one(notification_log)
        
        return {
            "success": True,
            "message": "Tier upgrade notification sent!",
            "message_id": result.get('message_id')
        }
        
    except Exception as e:
        logger.error(f"Error sending tier upgrade notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/broadcast")
async def send_admin_broadcast(
    request: SendBulkSMSRequest,
    current_user = Depends(get_current_user)
):
    """
    Send bulk SMS to multiple users (admin only)
    """
    try:
        # Check if user is admin
        if not current_user.get('is_admin'):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get recipients' phone numbers
        recipients = []
        for user_id in request.recipient_ids:
            user = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user and user.get('phone_number'):
                # Check if user has SMS enabled for broadcasts
                if user.get('settings', {}).get('sms_notifications', {}).get('broadcasts', True):
                    recipients.append(user['phone_number'])
        
        if not recipients:
            raise HTTPException(status_code=400, detail="No valid recipients with SMS enabled")
        
        # Send bulk SMS
        result = bulksms_client.send_bulk_sms(
            recipients=recipients,
            message=request.message,
            from_name="Calliotel"
        )
        
        # Log broadcast
        broadcast_log = {
            "admin_id": current_user["id"],
            "type": "admin_broadcast",
            "recipient_count": len(recipients),
            "message": request.message,
            "successful": result.get('successful', 0),
            "failed": result.get('failed', 0),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.bulksms_logs.insert_one(broadcast_log)
        
        logger.info(f"Admin broadcast sent to {result.get('successful')} users")
        
        return {
            "success": True,
            "message": f"Broadcast sent to {result.get('successful')} recipients",
            "total": result.get('total'),
            "successful": result.get('successful'),
            "failed": result.get('failed')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending admin broadcast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/balance")
async def get_sms_balance(current_user = Depends(get_current_user)):
    """
    Get BulkSMS account balance (admin only)
    """
    try:
        # Check if user is admin
        if not current_user.get('is_admin'):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        balance = bulksms_client.get_balance()
        
        return {
            "success": True,
            "credits": balance.get('credits'),
            "username": balance.get('username'),
            "company": balance.get('company')
        }
        
    except Exception as e:
        logger.error(f"Error getting balance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs")
async def get_sms_logs(
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """
    Get SMS notification logs for current user
    """
    try:
        # Get logs
        cursor = db.bulksms_logs.find({"user_id": current_user["id"]})
        logs = await cursor.sort("created_at", -1).limit(limit).to_list(length=limit)
        
        return {
            "success": True,
            "logs": logs,
            "total": len(logs)
        }
        
    except Exception as e:
        logger.error(f"Error fetching SMS logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/logs")
async def get_admin_sms_logs(
    limit: int = 100,
    current_user = Depends(get_current_user)
):
    """
    Get all SMS logs (admin only)
    """
    try:
        # Check if user is admin
        if not current_user.get('is_admin'):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get logs
        cursor = db.bulksms_logs.find({})
        logs = await cursor.sort("created_at", -1).limit(limit).to_list(length=limit)
        
        # Get statistics
        total_sent = await db.bulksms_logs.count_documents({"status": "sent"})
        total_failed = await db.bulksms_logs.count_documents({"status": "failed"})
        
        return {
            "success": True,
            "logs": logs,
            "statistics": {
                "total_sent": total_sent,
                "total_failed": total_failed,
                "recent_count": len(logs)
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching admin SMS logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
