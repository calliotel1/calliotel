from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
import requests
from datetime import datetime, timedelta, timezone
from telnyx_client import get_telnyx_client
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from email_service import send_number_purchase_email

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class PurchaseNumberRequest(BaseModel):
    phone_number: str
    country_code: str
    monthly_cost: float

class TransferNumberRequest(BaseModel):
    phone_number: str
    recipient_client_id: str
    note: Optional[str] = None

class PurchasedNumber(BaseModel):
    id: str
    phone_number: str
    country_code: str
    status: str
    monthly_cost: float
    purchased_at: str
    user_id: str

@router.post("/purchase")
async def purchase_number(request: PurchaseNumberRequest, current_user = Depends(get_current_user)):
    """
    Purchase a phone number using Telnyx REST API.
    Deducts cost from user's wallet balance.
    """
    try:
        # Step 1: Check wallet balance BEFORE attempting purchase
        wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        
        if not wallet:
            raise HTTPException(
                status_code=400, 
                detail="Please add balance to your wallet before purchasing a number"
            )
        
        current_balance = wallet.get("balance", 0)
        
        if current_balance < request.monthly_cost:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. You need ${request.monthly_cost:.2f} but only have ${current_balance:.2f}. Please add balance to continue."
            )
        
        # Step 2: Purchase number from Telnyx using REST API
        telnyx_api_key = os.environ.get('TELNYX_API_KEY')
        if not telnyx_api_key:
            raise HTTPException(status_code=500, detail="Telnyx API key not configured")
        
        import requests
        
        headers = {
            "Authorization": f"Bearer {telnyx_api_key}",
            "Content-Type": "application/json"
        }
        
        # Telnyx requires phone_numbers as an array of objects
        payload = {
            "phone_numbers": [
                {
                    "phone_number": request.phone_number
                }
            ]
        }
        
        # Get messaging profile ID from environment (optional but recommended for SMS)
        messaging_profile_id = os.environ.get('TELNYX_MESSAGING_PROFILE_ID')
        if messaging_profile_id:
            payload["messaging_profile_id"] = messaging_profile_id
        
        try:
            response = requests.post(
                "https://api.telnyx.com/v2/number_orders",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Telnyx purchase error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=400, detail=f"Failed to purchase: {response.text}")
            
            telnyx_order = response.json().get('data', {})
        except requests.RequestException as e:
            logger.error(f"Telnyx request error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to connect to Telnyx: {str(e)}")
        
        # Step 3: Deduct from wallet
        new_balance = current_balance - request.monthly_cost
        await db.wallets.update_one(
            {"user_id": current_user["_id"]},
            {
                "$set": {
                    "balance": new_balance,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Step 4: Log transaction
        transaction = {
            "user_id": current_user["_id"],
            "type": "debit",
            "amount": request.monthly_cost,
            "description": f"Purchased virtual number {request.phone_number}",
            "phone_number": request.phone_number,
            "balance_after": new_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        # Step 5: Calculate next billing date (30 days from now)
        next_billing = datetime.now(timezone.utc) + timedelta(days=30)
        
        # Step 6: Save to database
        number_doc = {
            "_id": request.phone_number,
            "user_id": current_user["_id"],
            "phone_number": request.phone_number,
            "country_code": request.country_code,
            "status": "active",
            "monthly_cost": request.monthly_cost,
            "telnyx_order_id": telnyx_order.get('id'),
            "purchased_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "auto_renew": True,  # Default to auto-renew enabled
            "next_billing_date": next_billing.isoformat(),
            "cancel_requested": False,
            "cancel_effective_date": None,
        }
        
        await db.purchased_numbers.insert_one(number_doc)
        
        logger.info(f"Number {request.phone_number} purchased by {current_user['email']} for ${request.monthly_cost}")
        
        # Step 7: Send confirmation email
        try:
            user_name = current_user.get('full_name') or current_user.get('email', '').split('@')[0]
            country_names = {
                'US': 'United States',
                'CA': 'Canada',
                'GB': 'United Kingdom',
                'DE': 'Germany'
            }
            country_name = country_names.get(request.country_code, request.country_code)
            
            await send_number_purchase_email(
                to_email=current_user['email'],
                name=user_name,
                phone_number=request.phone_number,
                country=country_name,
                monthly_cost=request.monthly_cost,
                new_balance=new_balance,
                next_billing_date=next_billing.strftime('%B %d, %Y')
            )
        except Exception as e:
            logger.error(f"Failed to send purchase confirmation email: {str(e)}")
            # Don't fail the request if email fails
        
        return {
            "success": True,
            "message": f"Number purchased successfully! ${request.monthly_cost:.2f} deducted from your wallet.",
            "number": number_doc,
            "new_balance": new_balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error purchasing number: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to purchase number: {str(e)}")

@router.get("/my-numbers")
async def get_my_numbers(current_user = Depends(get_current_user)):
    """
    Get all numbers purchased by current user.
    """
    try:
        cursor = db.purchased_numbers.find({"user_id": current_user["_id"]})
        numbers = await cursor.to_list(length=100)
        
        result = []
        for num in numbers:
            result.append({
                "id": num["_id"],
                "phone_number": num["phone_number"],
                "country_code": num["country_code"],
                "status": num["status"],
                "monthly_cost": num["monthly_cost"],
                "purchased_at": num["purchased_at"],
                "auto_renew": num.get("auto_renew", True),
                "next_billing_date": num.get("next_billing_date"),
                "cancel_requested": num.get("cancel_requested", False),
                "cancel_effective_date": num.get("cancel_effective_date")
            })
        
        return {"numbers": result, "total": len(result)}
        
    except Exception as e:
        logger.error(f"Error fetching user numbers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch numbers")

@router.delete("/release/{phone_number}")
async def release_number(phone_number: str, current_user = Depends(get_current_user)):
    """
    Release/cancel a phone number.
    """
    try:
        # Check if number belongs to user
        number = await db.purchased_numbers.find_one({
            "_id": phone_number,
            "user_id": current_user["_id"]
        })
        
        if not number:
            raise HTTPException(status_code=404, detail="Number not found or doesn't belong to you")
        
        # Release from Telnyx (optional - depends on Telnyx API)
        try:
            telnyx = get_telnyx_client()
            # telnyx.PhoneNumber.delete(number["telnyx_id"])  # Uncomment if Telnyx supports deletion
        except Exception as e:
            logger.warning(f"Could not release from Telnyx: {str(e)}")
        
        # Update status in database
        await db.purchased_numbers.update_one(
            {"_id": phone_number},
            {"$set": {"status": "released", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"Number {phone_number} released by {current_user['email']}")
        
        return {"success": True, "message": "Number released successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error releasing number: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to release number")

@router.put("/toggle-auto-renew/{phone_number}")
async def toggle_auto_renew(phone_number: str, current_user = Depends(get_current_user)):
    """
    Toggle auto-renew setting for a phone number.
    """
    try:
        # Check if number belongs to user
        number = await db.purchased_numbers.find_one({
            "_id": phone_number,
            "user_id": current_user["_id"]
        })
        
        if not number:
            raise HTTPException(status_code=404, detail="Number not found or doesn't belong to you")
        
        # Toggle auto_renew
        new_auto_renew = not number.get("auto_renew", True)
        
        await db.purchased_numbers.update_one(
            {"_id": phone_number},
            {"$set": {
                "auto_renew": new_auto_renew,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Auto-renew toggled to {new_auto_renew} for {phone_number} by {current_user['email']}")
        
        return {
            "success": True,
            "auto_renew": new_auto_renew,
            "message": f"Auto-renew {'enabled' if new_auto_renew else 'disabled'}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling auto-renew: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle auto-renew")

@router.post("/cancel/{phone_number}")
async def cancel_number(phone_number: str, current_user = Depends(get_current_user)):
    """
    Cancel a phone number subscription. 
    Number will remain active until the end of current billing period.
    """
    try:
        # Check if number belongs to user
        number = await db.purchased_numbers.find_one({
            "_id": phone_number,
            "user_id": current_user["_id"],
            "status": "active"
        })
        
        if not number:
            raise HTTPException(status_code=404, detail="Number not found or doesn't belong to you")
        
        # Check if already cancelled
        if number.get("cancel_requested", False):
            raise HTTPException(status_code=400, detail="Number is already scheduled for cancellation")
        
        # Set cancellation date to next billing date
        next_billing = number.get("next_billing_date")
        if not next_billing:
            # If no billing date set, calculate it (30 days from purchase)
            purchased_at = datetime.fromisoformat(number["purchased_at"].replace('Z', '+00:00'))
            next_billing = (purchased_at + timedelta(days=30)).isoformat()
        
        await db.purchased_numbers.update_one(
            {"_id": phone_number},
            {"$set": {
                "cancel_requested": True,
                "cancel_effective_date": next_billing,
                "auto_renew": False,  # Disable auto-renew
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Number {phone_number} scheduled for cancellation by {current_user['email']}")
        
        return {
            "success": True,
            "message": "Number scheduled for cancellation",
            "cancel_effective_date": next_billing,
            "details": "Your number will remain active until the end of the current billing period"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling number: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel number")

@router.post("/reactivate/{phone_number}")
async def reactivate_number(phone_number: str, current_user = Depends(get_current_user)):
    """
    Reactivate a cancelled number (undo cancellation before it takes effect).
    """
    try:
        # Check if number belongs to user
        number = await db.purchased_numbers.find_one({
            "_id": phone_number,
            "user_id": current_user["_id"]
        })
        
        if not number:
            raise HTTPException(status_code=404, detail="Number not found or doesn't belong to you")
        
        if not number.get("cancel_requested", False):
            raise HTTPException(status_code=400, detail="Number is not scheduled for cancellation")
        
        await db.purchased_numbers.update_one(
            {"_id": phone_number},
            {"$set": {
                "cancel_requested": False,
                "cancel_effective_date": None,
                "auto_renew": True,  # Re-enable auto-renew
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Number {phone_number} reactivated by {current_user['email']}")
        
        return {
            "success": True,
            "message": "Number reactivated successfully",
            "auto_renew": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reactivating number: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reactivate number")

@router.get("/billing-info/{phone_number}")
async def get_billing_info(phone_number: str, current_user = Depends(get_current_user)):
    """
    Get billing information for a specific number.
    """
    try:
        number = await db.purchased_numbers.find_one({
            "_id": phone_number,
            "user_id": current_user["_id"]
        })
        
        if not number:
            raise HTTPException(status_code=404, detail="Number not found")
        
        return {
            "phone_number": number["phone_number"],
            "monthly_cost": number["monthly_cost"],
            "purchased_at": number["purchased_at"],
            "next_billing_date": number.get("next_billing_date"),
            "auto_renew": number.get("auto_renew", True),
            "cancel_requested": number.get("cancel_requested", False),
            "cancel_effective_date": number.get("cancel_effective_date"),
            "status": number["status"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching billing info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch billing info")

@router.post("/transfer")
async def transfer_number(request: TransferNumberRequest, current_user = Depends(get_current_user)):
    """
    Transfer a phone number to another user using their client ID.
    Transfer cost: $1.00
    """
    try:
        TRANSFER_COST = 1.00
        
        # Find recipient by client_id
        recipient = await db.users.find_one({"client_id": request.recipient_client_id})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found. Please check the Client ID.")
        
        # Can't transfer to self
        if recipient["_id"] == current_user["_id"]:
            raise HTTPException(status_code=400, detail="Cannot transfer to yourself")
        
        # Check if sender owns the number
        number = await db.purchased_numbers.find_one({
            "phone_number": request.phone_number,
            "user_id": current_user["_id"],
            "status": "active"
        })
        
        if not number:
            raise HTTPException(status_code=404, detail="Number not found or doesn't belong to you")
        
        # Check sender's balance for transfer cost
        sender_wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        if not sender_wallet or sender_wallet["balance"] < TRANSFER_COST:
            raise HTTPException(status_code=402, detail=f"Insufficient balance. Transfer costs ${TRANSFER_COST:.2f}")
        
        # Deduct transfer cost
        sender_new_balance = sender_wallet["balance"] - TRANSFER_COST
        await db.wallets.update_one(
            {"user_id": current_user["_id"]},
            {"$set": {"balance": sender_new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Log transfer cost transaction
        tx = {
            "user_id": current_user["_id"],
            "type": "debit",
            "amount": TRANSFER_COST,
            "description": f"Number transfer fee for {request.phone_number}",
            "balance_after": sender_new_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(tx)
        
        # Transfer the number
        await db.purchased_numbers.update_one(
            {"phone_number": request.phone_number},
            {
                "$set": {
                    "user_id": recipient["_id"],
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "transferred_from": current_user["_id"],
                    "transferred_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Log transfer activity
        transfer_log = {
            "phone_number": request.phone_number,
            "from_user_id": current_user["_id"],
            "from_client_id": current_user.get("client_id", "unknown"),
            "to_user_id": recipient["_id"],
            "to_client_id": request.recipient_client_id,
            "transfer_cost": TRANSFER_COST,
            "note": request.note,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.number_transfers.insert_one(transfer_log)
        
        logger.info(f"Number {request.phone_number} transferred from {current_user['_id']} to {recipient['_id']}")
        
        return {
            "success": True,
            "phone_number": request.phone_number,
            "recipient_client_id": request.recipient_client_id,
            "recipient_email": recipient["email"],
            "transfer_cost": TRANSFER_COST,
            "new_balance": sender_new_balance,
            "message": "Number transferred successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transferring number: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to transfer number: {str(e)}")