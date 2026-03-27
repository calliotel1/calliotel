from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone, timedelta
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Scheduler for scheduled messages
scheduler = BackgroundScheduler()
scheduler.start()

# Models
class ScheduledSMSCreate(BaseModel):
    from_number: str
    to_number: str
    message: str
    scheduled_time: str  # ISO format
    recurring: Optional[str] = None  # daily, weekly, monthly

class AutoReplyRule(BaseModel):
    name: str
    from_number: str
    keyword: str
    reply_message: str
    enabled: bool = True
    case_sensitive: bool = False

class SMSTemplate(BaseModel):
    name: str
    content: str
    category: Optional[str] = "general"

# Scheduled SMS Endpoints
@router.post("/schedule")
async def schedule_sms(sms: ScheduledSMSCreate, current_user = Depends(get_current_user)):
    """
    Schedule an SMS to be sent at a specific time.
    """
    try:
        user_id = current_user["_id"]
        
        # Verify user owns the from_number
        number = await db.purchased_numbers.find_one({
            "user_id": user_id,
            "phone_number": sms.from_number
        })
        
        if not number:
            raise HTTPException(status_code=403, detail="You don't own this phone number")
        
        # Parse scheduled time
        try:
            scheduled_dt = datetime.fromisoformat(sms.scheduled_time.replace('Z', '+00:00'))
        except:
            raise HTTPException(status_code=400, detail="Invalid datetime format")
        
        if scheduled_dt <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Scheduled time must be in the future")
        
        # Create scheduled message
        scheduled_msg = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "from_number": sms.from_number,
            "to_number": sms.to_number,
            "message": sms.message,
            "scheduled_time": scheduled_dt.isoformat(),
            "recurring": sms.recurring,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.scheduled_sms.insert_one(scheduled_msg)
        
        logger.info(f"SMS scheduled: {scheduled_msg['id']} for {scheduled_dt}")
        
        return {
            "success": True,
            "scheduled_id": scheduled_msg["id"],
            "scheduled_time": scheduled_dt.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scheduling SMS: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to schedule SMS")

@router.get("/scheduled")
async def get_scheduled_sms(current_user = Depends(get_current_user)):
    """
    Get all scheduled SMS for current user.
    """
    try:
        user_id = current_user["_id"]
        
        scheduled = await db.scheduled_sms.find(
            {"user_id": user_id, "status": {"$in": ["pending", "recurring"]}},
            {"_id": 0}
        ).sort("scheduled_time", 1).to_list(100)
        
        return {"scheduled_messages": scheduled, "total": len(scheduled)}
    except Exception as e:
        logger.error(f"Error getting scheduled SMS: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get scheduled messages")

@router.delete("/scheduled/{message_id}")
async def cancel_scheduled_sms(message_id: str, current_user = Depends(get_current_user)):
    """
    Cancel a scheduled SMS.
    """
    try:
        user_id = current_user["_id"]
        
        result = await db.scheduled_sms.update_one(
            {"id": message_id, "user_id": user_id},
            {"$set": {"status": "cancelled"}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Scheduled message not found")
        
        return {"success": True, "message": "Scheduled SMS cancelled"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling scheduled SMS: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel scheduled SMS")

# Auto-Reply Rules
@router.post("/auto-reply")
async def create_auto_reply(rule: AutoReplyRule, current_user = Depends(get_current_user)):
    """
    Create an auto-reply rule.
    """
    try:
        user_id = current_user["_id"]
        
        # Verify user owns the number
        number = await db.purchased_numbers.find_one({
            "user_id": user_id,
            "phone_number": rule.from_number
        })
        
        if not number:
            raise HTTPException(status_code=403, detail="You don't own this phone number")
        
        # Create rule
        rule_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": rule.name,
            "from_number": rule.from_number,
            "keyword": rule.keyword.lower() if not rule.case_sensitive else rule.keyword,
            "reply_message": rule.reply_message,
            "enabled": rule.enabled,
            "case_sensitive": rule.case_sensitive,
            "trigger_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.auto_reply_rules.insert_one(rule_doc)
        
        return {
            "success": True,
            "rule_id": rule_doc["id"],
            "message": "Auto-reply rule created"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating auto-reply rule: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create auto-reply rule")

@router.get("/auto-reply")
async def get_auto_reply_rules(current_user = Depends(get_current_user)):
    """
    Get all auto-reply rules for current user.
    """
    try:
        user_id = current_user["_id"]
        
        rules = await db.auto_reply_rules.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        return {"rules": rules, "total": len(rules)}
    except Exception as e:
        logger.error(f"Error getting auto-reply rules: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get auto-reply rules")

@router.put("/auto-reply/{rule_id}")
async def toggle_auto_reply(rule_id: str, enabled: bool, current_user = Depends(get_current_user)):
    """
    Enable/disable an auto-reply rule.
    """
    try:
        user_id = current_user["_id"]
        
        result = await db.auto_reply_rules.update_one(
            {"id": rule_id, "user_id": user_id},
            {"$set": {"enabled": enabled}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Auto-reply rule not found")
        
        return {"success": True, "message": f"Auto-reply {'enabled' if enabled else 'disabled'}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling auto-reply: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle auto-reply")

@router.delete("/auto-reply/{rule_id}")
async def delete_auto_reply(rule_id: str, current_user = Depends(get_current_user)):
    """
    Delete an auto-reply rule.
    """
    try:
        user_id = current_user["_id"]
        
        result = await db.auto_reply_rules.delete_one({
            "id": rule_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Auto-reply rule not found")
        
        return {"success": True, "message": "Auto-reply rule deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting auto-reply: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete auto-reply")

# SMS Templates
@router.post("/template")
async def create_template(template: SMSTemplate, current_user = Depends(get_current_user)):
    """
    Create an SMS template.
    """
    try:
        user_id = current_user["_id"]
        
        template_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": template.name,
            "content": template.content,
            "category": template.category,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.sms_templates.insert_one(template_doc)
        
        return {
            "success": True,
            "template_id": template_doc["id"],
            "message": "Template created"
        }
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create template")

@router.get("/templates")
async def get_templates(current_user = Depends(get_current_user)):
    """
    Get all SMS templates for current user.
    """
    try:
        user_id = current_user["_id"]
        
        templates = await db.sms_templates.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        return {"templates": templates, "total": len(templates)}
    except Exception as e:
        logger.error(f"Error getting templates: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get templates")

@router.delete("/template/{template_id}")
async def delete_template(template_id: str, current_user = Depends(get_current_user)):
    """
    Delete an SMS template.
    """
    try:
        user_id = current_user["_id"]
        
        result = await db.sms_templates.delete_one({
            "id": template_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"success": True, "message": "Template deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting template: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete template")

# Helper function to check auto-reply rules (called when SMS received)
async def check_auto_reply(from_number, to_number, message_content):
    """
    Check if incoming message matches any auto-reply rules.
    """
    try:
        # Get user who owns to_number
        number_doc = await db.purchased_numbers.find_one({"phone_number": to_number})
        if not number_doc:
            return None
        
        user_id = number_doc["user_id"]
        
        # Get enabled auto-reply rules for this number
        rules = await db.auto_reply_rules.find({
            "user_id": user_id,
            "from_number": to_number,
            "enabled": True
        }).to_list(100)
        
        for rule in rules:
            keyword = rule["keyword"]
            content = message_content if rule["case_sensitive"] else message_content.lower()
            
            if keyword in content:
                # Increment trigger count
                await db.auto_reply_rules.update_one(
                    {"id": rule["id"]},
                    {"$inc": {"trigger_count": 1}}
                )
                
                logger.info(f"Auto-reply triggered: {rule['name']} for message from {from_number}")
                return rule["reply_message"]
        
        return None
    except Exception as e:
        logger.error(f"Error checking auto-reply: {str(e)}")
        return None
