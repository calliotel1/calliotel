from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import re

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Spam keywords database
SPAM_KEYWORDS = [
    "win", "winner", "congratulations", "free", "prize", "claim",
    "click here", "act now", "limited time", "urgent", "verify your account",
    "suspended", "confirm", "click link", "bitcoin", "crypto", "investment",
    "loan", "debt", "credit", "casino", "viagra", "pharmacy"
]

# Models
class BlockedNumber(BaseModel):
    phone_number: str
    reason: Optional[str] = "Spam"

class SpamRule(BaseModel):
    name: str
    rule_type: str  # keyword, pattern, rate_limit
    value: str
    enabled: bool = True

class SpamReport(BaseModel):
    phone_number: str
    message_content: Optional[str] = None
    reason: str

# Block List Management
@router.post("/block")
async def block_number(data: BlockedNumber, current_user = Depends(get_current_user)):
    """
    Block a phone number.
    """
    try:
        user_id = current_user["_id"]
        
        # Check if already blocked
        existing = await db.blocked_numbers.find_one({
            "user_id": user_id,
            "phone_number": data.phone_number
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Number already blocked")
        
        block_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "phone_number": data.phone_number,
            "reason": data.reason,
            "blocked_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.blocked_numbers.insert_one(block_doc)
        
        return {"success": True, "message": "Number blocked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error blocking number: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to block number")

@router.delete("/unblock/{phone_number}")
async def unblock_number(phone_number: str, current_user = Depends(get_current_user)):
    """
    Unblock a phone number.
    """
    try:
        user_id = current_user["_id"]
        
        result = await db.blocked_numbers.delete_one({
            "user_id": user_id,
            "phone_number": phone_number
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Number not found in block list")
        
        return {"success": True, "message": "Number unblocked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unblocking number: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to unblock number")

@router.get("/blocked")
async def get_blocked_numbers(current_user = Depends(get_current_user)):
    """
    Get all blocked numbers for current user.
    """
    try:
        user_id = current_user["_id"]
        
        blocked = await db.blocked_numbers.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(1000)
        
        return {"blocked_numbers": blocked, "total": len(blocked)}
    except Exception as e:
        logger.error(f"Error getting blocked numbers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get blocked numbers")

# Allow List Management
@router.post("/allow")
async def add_to_allowlist(data: BlockedNumber, current_user = Depends(get_current_user)):
    """
    Add a number to allow list (whitelist).
    """
    try:
        user_id = current_user["_id"]
        
        # Check if already in allow list
        existing = await db.allowed_numbers.find_one({
            "user_id": user_id,
            "phone_number": data.phone_number
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Number already in allow list")
        
        allow_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "phone_number": data.phone_number,
            "added_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.allowed_numbers.insert_one(allow_doc)
        
        return {"success": True, "message": "Number added to allow list"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding to allow list: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add to allow list")

@router.get("/allowed")
async def get_allowed_numbers(current_user = Depends(get_current_user)):
    """
    Get allow list.
    """
    try:
        user_id = current_user["_id"]
        
        allowed = await db.allowed_numbers.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(1000)
        
        return {"allowed_numbers": allowed, "total": len(allowed)}
    except Exception as e:
        logger.error(f"Error getting allowed numbers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get allowed numbers")

# Spam Detection
@router.post("/report")
async def report_spam(report: SpamReport, current_user = Depends(get_current_user)):
    """
    Report a number as spam.
    """
    try:
        user_id = current_user["_id"]
        
        # Record spam report
        report_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "phone_number": report.phone_number,
            "message_content": report.message_content,
            "reason": report.reason,
            "reported_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.spam_reports.insert_one(report_doc)
        
        # Auto-block if multiple reports
        report_count = await db.spam_reports.count_documents({
            "phone_number": report.phone_number
        })
        
        if report_count >= 3:
            # Add to global spam database
            await db.global_spam.update_one(
                {"phone_number": report.phone_number},
                {
                    "$set": {
                        "phone_number": report.phone_number,
                        "report_count": report_count,
                        "last_reported": datetime.now(timezone.utc).isoformat()
                    }
                },
                upsert=True
            )
        
        return {"success": True, "message": "Spam reported successfully", "total_reports": report_count}
    except Exception as e:
        logger.error(f"Error reporting spam: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to report spam")

@router.get("/spam-score/{phone_number}")
async def get_spam_score(phone_number: str):
    """
    Get spam score for a phone number (0-100).
    """
    try:
        # Check global spam database
        global_spam = await db.global_spam.find_one({"phone_number": phone_number})
        
        if not global_spam:
            return {"phone_number": phone_number, "spam_score": 0, "risk_level": "low"}
        
        report_count = global_spam.get("report_count", 0)
        
        # Calculate spam score (0-100)
        spam_score = min(report_count * 10, 100)
        
        # Determine risk level
        if spam_score >= 70:
            risk_level = "high"
        elif spam_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "phone_number": phone_number,
            "spam_score": spam_score,
            "risk_level": risk_level,
            "total_reports": report_count
        }
    except Exception as e:
        logger.error(f"Error getting spam score: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get spam score")

# Spam Rules
@router.post("/rule")
async def create_spam_rule(rule: SpamRule, current_user = Depends(get_current_user)):
    """
    Create a custom spam detection rule.
    """
    try:
        user_id = current_user["_id"]
        
        rule_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": rule.name,
            "rule_type": rule.rule_type,
            "value": rule.value,
            "enabled": rule.enabled,
            "matches": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.spam_rules.insert_one(rule_doc)
        
        return {"success": True, "rule_id": rule_doc["id"]}
    except Exception as e:
        logger.error(f"Error creating spam rule: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create spam rule")

@router.get("/rules")
async def get_spam_rules(current_user = Depends(get_current_user)):
    """
    Get all spam detection rules.
    """
    try:
        user_id = current_user["_id"]
        
        rules = await db.spam_rules.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        return {"rules": rules, "total": len(rules)}
    except Exception as e:
        logger.error(f"Error getting spam rules: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get spam rules")

@router.delete("/rule/{rule_id}")
async def delete_spam_rule(rule_id: str, current_user = Depends(get_current_user)):
    """
    Delete a spam rule.
    """
    try:
        user_id = current_user["_id"]
        
        result = await db.spam_rules.delete_one({
            "id": rule_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        return {"success": True, "message": "Rule deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting spam rule: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete spam rule")

# Helper function to check if message is spam
async def is_spam(from_number: str, to_number: str, message_content: str, user_id: str) -> dict:
    """
    Check if incoming message is spam.
    Returns: {"is_spam": bool, "reason": str, "action": str}
    """
    try:
        # Check if sender is in allow list
        allowed = await db.allowed_numbers.find_one({
            "user_id": user_id,
            "phone_number": from_number
        })
        
        if allowed:
            return {"is_spam": False, "reason": "In allow list", "action": "allow"}
        
        # Check if sender is blocked
        blocked = await db.blocked_numbers.find_one({
            "user_id": user_id,
            "phone_number": from_number
        })
        
        if blocked:
            return {"is_spam": True, "reason": "Blocked number", "action": "block"}
        
        # Check global spam database
        global_spam = await db.global_spam.find_one({"phone_number": from_number})
        
        if global_spam and global_spam.get("report_count", 0) >= 5:
            return {"is_spam": True, "reason": "Known spam number", "action": "block"}
        
        # Check message content for spam keywords
        content_lower = message_content.lower()
        spam_keywords_found = []
        
        for keyword in SPAM_KEYWORDS:
            if keyword in content_lower:
                spam_keywords_found.append(keyword)
        
        if len(spam_keywords_found) >= 2:
            return {
                "is_spam": True,
                "reason": f"Spam keywords: {', '.join(spam_keywords_found)}",
                "action": "quarantine"
            }
        
        # Check custom rules
        rules = await db.spam_rules.find({
            "user_id": user_id,
            "enabled": True
        }).to_list(100)
        
        for rule in rules:
            if rule["rule_type"] == "keyword":
                if rule["value"].lower() in content_lower:
                    # Increment match count
                    await db.spam_rules.update_one(
                        {"id": rule["id"]},
                        {"$inc": {"matches": 1}}
                    )
                    return {
                        "is_spam": True,
                        "reason": f"Custom rule: {rule['name']}",
                        "action": "block"
                    }
            elif rule["rule_type"] == "pattern":
                if re.search(rule["value"], message_content, re.IGNORECASE):
                    await db.spam_rules.update_one(
                        {"id": rule["id"]},
                        {"$inc": {"matches": 1}}
                    )
                    return {
                        "is_spam": True,
                        "reason": f"Pattern match: {rule['name']}",
                        "action": "block"
                    }
        
        # Not spam
        return {"is_spam": False, "reason": "Passed all checks", "action": "allow"}
    
    except Exception as e:
        logger.error(f"Error checking spam: {str(e)}")
        return {"is_spam": False, "reason": "Error in spam check", "action": "allow"}

@router.get("/stats")
async def get_spam_stats(current_user = Depends(get_current_user)):
    """
    Get spam protection statistics.
    """
    try:
        user_id = current_user["_id"]
        
        blocked_count = await db.blocked_numbers.count_documents({"user_id": user_id})
        allowed_count = await db.allowed_numbers.count_documents({"user_id": user_id})
        reports_count = await db.spam_reports.count_documents({"user_id": user_id})
        rules_count = await db.spam_rules.count_documents({"user_id": user_id, "enabled": True})
        
        # Get recent spam detections (from messages)
        recent_spam = await db.messages.count_documents({
            "to_user_id": user_id,
            "spam_detected": True,
            "timestamp": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
        })
        
        return {
            "blocked_numbers": blocked_count,
            "allowed_numbers": allowed_count,
            "spam_reports": reports_count,
            "active_rules": rules_count,
            "spam_blocked_last_7_days": recent_spam
        }
    except Exception as e:
        logger.error(f"Error getting spam stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get spam statistics")

from datetime import timedelta
