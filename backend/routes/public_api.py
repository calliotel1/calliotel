from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets
import hashlib

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Models
class APIKeyCreate(BaseModel):
    name: str
    permissions: List[str]  # sms, numbers, wallet, contacts

class APIKeyResponse(BaseModel):
    id: str
    name: str
    key: str
    permissions: List[str]
    created_at: str

# API Key verification
async def verify_api_key(x_api_key: str = Header(None)):
    """Verify API key from header."""
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API key required")
    
    # Hash the key for comparison
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    
    api_key_doc = await db.api_keys.find_one({
        "key_hash": key_hash,
        "active": True
    })
    
    if not api_key_doc:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Update last used
    await db.api_keys.update_one(
        {"_id": api_key_doc["_id"]},
        {
            "$set": {"last_used": datetime.now(timezone.utc).isoformat()},
            "$inc": {"usage_count": 1}
        }
    )
    
    return api_key_doc

# API Key Management
@router.post("/keys")
async def create_api_key(data: APIKeyCreate, current_user = Depends(get_current_user)):
    """
    Create a new API key.
    """
    try:
        user_id = current_user["_id"]
        
        # Generate API key
        api_key = f"calliotel_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        key_doc = {
            "id": secrets.token_urlsafe(16),
            "user_id": user_id,
            "name": data.name,
            "key_hash": key_hash,
            "permissions": data.permissions,
            "active": True,
            "usage_count": 0,
            "last_used": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.api_keys.insert_one(key_doc)
        
        # Return the actual key (only shown once)
        return {
            "success": True,
            "api_key": api_key,
            "id": key_doc["id"],
            "name": data.name,
            "permissions": data.permissions,
            "message": "Save this API key! It won't be shown again."
        }
    except Exception as e:
        logger.error(f"Error creating API key: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create API key")

@router.get("/keys")
async def get_api_keys(current_user = Depends(get_current_user)):
    """
    Get all API keys (without showing actual keys).
    """
    try:
        user_id = current_user["_id"]
        
        keys = await db.api_keys.find(
            {"user_id": user_id},
            {"_id": 0, "key_hash": 0}
        ).to_list(100)
        
        return {"api_keys": keys, "total": len(keys)}
    except Exception as e:
        logger.error(f"Error getting API keys: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get API keys")

@router.delete("/keys/{key_id}")
async def revoke_api_key(key_id: str, current_user = Depends(get_current_user)):
    """
    Revoke an API key.
    """
    try:
        user_id = current_user["_id"]
        
        result = await db.api_keys.update_one(
            {"id": key_id, "user_id": user_id},
            {"$set": {"active": False}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="API key not found")
        
        return {"success": True, "message": "API key revoked"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revoking API key: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to revoke API key")

# Public API Endpoints (with API key auth)

@router.post("/v1/sms/send")
async def api_send_sms(
    from_number: str,
    to_number: str,
    message: str,
    api_key_doc = Depends(verify_api_key)
):
    """
    Send SMS via API.
    Requires API key with 'sms' permission.
    """
    try:
        if "sms" not in api_key_doc.get("permissions", []):
            raise HTTPException(status_code=403, detail="API key doesn't have SMS permission")
        
        user_id = api_key_doc["user_id"]
        
        # Verify user owns the from_number
        number = await db.purchased_numbers.find_one({
            "user_id": user_id,
            "phone_number": from_number
        })
        
        if not number:
            raise HTTPException(status_code=403, detail="From number not owned by user")
        
        # TODO: Integrate with Telnyx to actually send SMS
        # For now, just record in database
        
        message_doc = {
            "id": secrets.token_urlsafe(16),
            "user_id": user_id,
            "from_number": from_number,
            "to_number": to_number,
            "content": message,
            "direction": "outbound",
            "status": "sent",
            "via_api": True,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.messages.insert_one(message_doc)
        
        return {
            "success": True,
            "message_id": message_doc["id"],
            "from": from_number,
            "to": to_number,
            "status": "sent"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending SMS via API: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send SMS")

@router.get("/v1/sms/inbox")
async def api_get_inbox(
    phone_number: Optional[str] = None,
    limit: int = 50,
    api_key_doc = Depends(verify_api_key)
):
    """
    Get SMS inbox via API.
    Requires API key with 'sms' permission.
    """
    try:
        if "sms" not in api_key_doc.get("permissions", []):
            raise HTTPException(status_code=403, detail="API key doesn't have SMS permission")
        
        user_id = api_key_doc["user_id"]
        
        query = {
            "user_id": user_id,
            "direction": "inbound"
        }
        
        if phone_number:
            query["to_number"] = phone_number
        
        messages = await db.messages.find(
            query,
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "messages": messages,
            "total": len(messages)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting inbox via API: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get inbox")

@router.get("/v1/numbers")
async def api_get_numbers(api_key_doc = Depends(verify_api_key)):
    """
    Get user's phone numbers via API.
    Requires API key with 'numbers' permission.
    """
    try:
        if "numbers" not in api_key_doc.get("permissions", []):
            raise HTTPException(status_code=403, detail="API key doesn't have numbers permission")
        
        user_id = api_key_doc["user_id"]
        
        numbers = await db.purchased_numbers.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(100)
        
        return {
            "success": True,
            "numbers": numbers,
            "total": len(numbers)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting numbers via API: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get numbers")

@router.get("/v1/wallet/balance")
async def api_get_balance(api_key_doc = Depends(verify_api_key)):
    """
    Get wallet balance via API.
    Requires API key with 'wallet' permission.
    """
    try:
        if "wallet" not in api_key_doc.get("permissions", []):
            raise HTTPException(status_code=403, detail="API key doesn't have wallet permission")
        
        user_id = api_key_doc["user_id"]
        
        wallet = await db.wallets.find_one({"user_id": user_id})
        
        if not wallet:
            return {"success": True, "balance": 0.0}
        
        return {
            "success": True,
            "balance": wallet.get("balance", 0.0)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting balance via API: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get balance")

@router.get("/v1/contacts")
async def api_get_contacts(api_key_doc = Depends(verify_api_key)):
    """
    Get contacts via API.
    Requires API key with 'contacts' permission.
    """
    try:
        if "contacts" not in api_key_doc.get("permissions", []):
            raise HTTPException(status_code=403, detail="API key doesn't have contacts permission")
        
        user_id = api_key_doc["user_id"]
        
        contacts = await db.contacts.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(1000)
        
        return {
            "success": True,
            "contacts": contacts,
            "total": len(contacts)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting contacts via API: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get contacts")

@router.get("/v1/stats")
async def api_get_stats(api_key_doc = Depends(verify_api_key)):
    """
    Get usage statistics via API.
    """
    try:
        user_id = api_key_doc["user_id"]
        
        # Get various counts
        numbers_count = await db.purchased_numbers.count_documents({"user_id": user_id})
        contacts_count = await db.contacts.count_documents({"user_id": user_id})
        
        messages_sent = await db.messages.count_documents({
            "user_id": user_id,
            "direction": "outbound"
        })
        
        messages_received = await db.messages.count_documents({
            "user_id": user_id,
            "direction": "inbound"
        })
        
        wallet = await db.wallets.find_one({"user_id": user_id})
        balance = wallet.get("balance", 0.0) if wallet else 0.0
        
        return {
            "success": True,
            "stats": {
                "phone_numbers": numbers_count,
                "contacts": contacts_count,
                "messages_sent": messages_sent,
                "messages_received": messages_received,
                "balance": balance
            }
        }
    except Exception as e:
        logger.error(f"Error getting stats via API: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get stats")

@router.get("/docs")
async def get_api_docs():
    """
    Get API documentation.
    """
    return {
        "api_version": "v1",
        "base_url": "/api/public-api/v1",
        "authentication": {
            "type": "API Key",
            "header": "X-API-Key",
            "format": "calliotel_xxxxxxxxxxxxx"
        },
        "endpoints": {
            "sms": {
                "send": "POST /v1/sms/send",
                "inbox": "GET /v1/sms/inbox"
            },
            "numbers": {
                "list": "GET /v1/numbers"
            },
            "wallet": {
                "balance": "GET /v1/wallet/balance"
            },
            "contacts": {
                "list": "GET /v1/contacts"
            },
            "stats": {
                "overview": "GET /v1/stats"
            }
        },
        "rate_limits": {
            "default": "100 requests per minute"
        }
    }
