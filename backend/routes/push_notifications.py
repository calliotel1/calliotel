"""
Push Notifications Router
Web Push notifications for real-time alerts
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import Optional
import logging
import os
import json
from pywebpush import webpush, WebPushException
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# VAPID Configuration
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_CLAIM_EMAIL = os.environ.get('VAPID_CLAIM_EMAIL', 'mailto:admin@calliotel.com')

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict  # Contains p256dh and auth

class NotificationPayload(BaseModel):
    title: str
    body: str
    icon: Optional[str] = None
    badge: Optional[str] = None
    data: Optional[dict] = None

@router.post("/subscribe")
async def subscribe_push(
    subscription: PushSubscription,
    current_user = Depends(get_current_user)
):
    """
    Subscribe user to push notifications
    """
    try:
        subscription_doc = {
            "user_id": current_user["_id"],
            "endpoint": subscription.endpoint,
            "p256dh": subscription.keys.get("p256dh"),
            "auth": subscription.keys.get("auth"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "active": True
        }
        
        # Check if subscription already exists
        existing = await db.push_subscriptions.find_one({
            "user_id": current_user["_id"],
            "endpoint": subscription.endpoint
        })
        
        if existing:
            # Update existing subscription
            await db.push_subscriptions.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "p256dh": subscription_doc["p256dh"],
                    "auth": subscription_doc["auth"],
                    "active": True,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Insert new subscription
            await db.push_subscriptions.insert_one(subscription_doc)
        
        logger.info(f"Push subscription registered for user {current_user['_id']}")
        
        return {
            "success": True,
            "message": "Subscribed to push notifications"
        }
        
    except Exception as e:
        logger.error(f"Error subscribing to push: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to subscribe")

@router.post("/unsubscribe")
async def unsubscribe_push(
    subscription: PushSubscription,
    current_user = Depends(get_current_user)
):
    """
    Unsubscribe from push notifications
    """
    try:
        result = await db.push_subscriptions.update_one(
            {
                "user_id": current_user["_id"],
                "endpoint": subscription.endpoint
            },
            {"$set": {"active": False}}
        )
        
        if result.modified_count > 0:
            logger.info(f"Push subscription deactivated for user {current_user['_id']}")
            return {
                "success": True,
                "message": "Unsubscribed from push notifications"
            }
        else:
            return {
                "success": False,
                "message": "Subscription not found"
            }
        
    except Exception as e:
        logger.error(f"Error unsubscribing from push: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to unsubscribe")

@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """
    Get VAPID public key for frontend subscription
    """
    return {
        "public_key": VAPID_PUBLIC_KEY
    }

@router.post("/test")
async def test_push_notification(current_user = Depends(get_current_user)):
    """
    Send a test push notification to user
    """
    try:
        # Get user's subscriptions
        subscriptions = await db.push_subscriptions.find({
            "user_id": current_user["_id"],
            "active": True
        }).to_list(100)
        
        if not subscriptions:
            raise HTTPException(status_code=404, detail="No active push subscriptions found")
        
        # Prepare notification payload
        payload = {
            "title": "Test Notification",
            "body": "Push notifications are working! 🎉",
            "icon": "/logo192.png",
            "badge": "/logo192.png"
        }
        
        sent_count = 0
        for sub in subscriptions:
            try:
                subscription_info = {
                    "endpoint": sub["endpoint"],
                    "keys": {
                        "p256dh": sub["p256dh"],
                        "auth": sub["auth"]
                    }
                }
                
                webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(payload),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_CLAIM_EMAIL}
                )
                sent_count += 1
                
            except WebPushException as e:
                logger.error(f"Error sending test push to {sub['endpoint']}: {str(e)}")
                # Mark subscription as inactive if it failed
                if e.response and e.response.status_code in [404, 410]:
                    await db.push_subscriptions.update_one(
                        {"_id": sub["_id"]},
                        {"$set": {"active": False}}
                    )
        
        return {
            "success": True,
            "message": f"Test notification sent to {sent_count} device(s)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test push: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send test notification")

async def send_push_notification(user_id: str, payload: NotificationPayload):
    """
    Send push notification to a specific user
    Internal helper function used by other routers
    """
    try:
        # Get user's active subscriptions
        subscriptions = await db.push_subscriptions.find({
            "user_id": user_id,
            "active": True
        }).to_list(100)
        
        if not subscriptions:
            logger.info(f"No active push subscriptions for user {user_id}")
            return False
        
        # Prepare payload
        notification_data = {
            "title": payload.title,
            "body": payload.body,
            "icon": payload.icon or "/logo192.png",
            "badge": payload.badge or "/logo192.png",
            "data": payload.data or {}
        }
        
        sent_count = 0
        for sub in subscriptions:
            try:
                subscription_info = {
                    "endpoint": sub["endpoint"],
                    "keys": {
                        "p256dh": sub["p256dh"],
                        "auth": sub["auth"]
                    }
                }
                
                webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(notification_data),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_CLAIM_EMAIL}
                )
                sent_count += 1
                
            except WebPushException as e:
                logger.error(f"Error sending push: {str(e)}")
                # Deactivate subscription if device is unreachable
                if e.response and e.response.status_code in [404, 410]:
                    await db.push_subscriptions.update_one(
                        {"_id": sub["_id"]},
                        {"$set": {"active": False}}
                    )
        
        logger.info(f"Push notification sent to {sent_count} device(s) for user {user_id}")
        return sent_count > 0
        
    except Exception as e:
        logger.error(f"Error in send_push_notification: {str(e)}")
        return False

# Export for use in other routers
__all__ = ['send_push_notification', 'NotificationPayload']
