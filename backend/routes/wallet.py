from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from email_service import send_balance_added_email

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Pricing (in credits)
SMS_COST = 0.01  # $0.01 per SMS
CALL_COST_PER_MINUTE = 0.02  # $0.02 per minute
NUMBER_MONTHLY_COST = 1.49  # $1.49 per month

class AddCreditsRequest(BaseModel):
    amount: float
    payment_method: str = "manual"  # manual, stripe, crypto

class TransferBalanceRequest(BaseModel):
    recipient_client_id: str
    amount: float
    note: Optional[str] = None

class Transaction(BaseModel):
    id: str
    user_id: str
    type: str  # credit, debit
    amount: float
    description: str
    balance_after: float
    created_at: str

@router.get("/balance")
async def get_balance(current_user = Depends(get_current_user)):
    """
    Get current wallet balance for user.
    """
    try:
        # Get or create wallet
        wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        
        if not wallet:
            # Create wallet with initial balance
            wallet = {
                "user_id": current_user["_id"],
                "balance": 10.00,  # $10 starting credit
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.wallets.insert_one(wallet)
            
            # Log initial credit transaction
            transaction = {
                "user_id": current_user["_id"],
                "type": "credit",
                "amount": 10.00,
                "description": "Welcome bonus",
                "balance_after": 10.00,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.transactions.insert_one(transaction)
        
        return {
            "balance": wallet["balance"],
            "currency": "USD"
        }
    except Exception as e:
        logger.error(f"Error fetching balance: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch balance")

@router.post("/add-credits")
async def add_credits(request: AddCreditsRequest, current_user = Depends(get_current_user)):
    """
    Add credits to user wallet.
    For now, this is manual. Will integrate with payment gateways later.
    """
    try:
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        
        # Get wallet
        wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        
        if not wallet:
            # Create wallet
            wallet = {
                "user_id": current_user["_id"],
                "balance": 0.00,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.wallets.insert_one(wallet)
        
        # Update balance
        new_balance = wallet["balance"] + request.amount
        await db.wallets.update_one(
            {"user_id": current_user["_id"]},
            {
                "$set": {
                    "balance": new_balance,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Log transaction
        transaction = {
            "user_id": current_user["_id"],
            "type": "credit",
            "amount": request.amount,
            "description": f"Added credits via {request.payment_method}",
            "balance_after": new_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        logger.info(f"Added ${request.amount} to {current_user['_id']}")
        
        # Send confirmation email
        try:
            user_name = current_user.get('full_name') or current_user.get('email', '').split('@')[0]
            await send_balance_added_email(
                to_email=current_user['email'],
                name=user_name,
                amount=request.amount,
                new_balance=new_balance,
                payment_method=request.payment_method.capitalize()
            )
        except Exception as e:
            logger.error(f"Failed to send balance confirmation email: {str(e)}")
            # Don't fail the request if email fails
        
        return {
            "success": True,
            "new_balance": new_balance,
            "amount_added": request.amount
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding credits: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add credits")

@router.post("/deduct")
async def deduct_credits(amount: float, description: str, current_user = Depends(get_current_user)):
    """
    Internal endpoint to deduct credits.
    Called by other services (SMS, calls, etc.)
    """
    try:
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        
        wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        
        if not wallet or wallet["balance"] < amount:
            raise HTTPException(status_code=402, detail="Insufficient balance")
        
        # Deduct balance
        new_balance = wallet["balance"] - amount
        await db.wallets.update_one(
            {"user_id": current_user["_id"]},
            {
                "$set": {
                    "balance": new_balance,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Log transaction
        transaction = {
            "user_id": current_user["_id"],
            "type": "debit",
            "amount": amount,
            "description": description,
            "balance_after": new_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        return {
            "success": True,
            "new_balance": new_balance,
            "amount_deducted": amount
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deducting credits: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to deduct credits")

@router.get("/transactions")
async def get_transactions(limit: int = 50, current_user = Depends(get_current_user)):
    """
    Get transaction history for user.
    """
    try:
        cursor = db.transactions.find({"user_id": current_user["_id"]})
        transactions = await cursor.sort("created_at", -1).to_list(length=limit)
        
        result = []
        for txn in transactions:
            result.append({
                "id": str(txn.get("_id", "")),
                "type": txn.get("type", "unknown"),
                "amount": txn.get("amount", 0),
                "description": txn.get("description", ""),
                "balance_after": txn.get("balance_after", 0),
                "created_at": txn.get("created_at", txn.get("timestamp", ""))
            })
        
        return {"transactions": result, "total": len(result)}
    except Exception as e:
        logger.error(f"Error fetching transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")

@router.get("/pricing")
async def get_pricing():
    """
    Get current pricing information.
    """
    return {
        "sms_cost": SMS_COST,
        "call_cost_per_minute": CALL_COST_PER_MINUTE,
        "number_monthly_cost": NUMBER_MONTHLY_COST,
        "number_transfer_cost": 1.00,
        "currency": "USD"
    }

@router.post("/transfer-balance")
async def transfer_balance(request: TransferBalanceRequest, current_user = Depends(get_current_user)):
    """
    Transfer balance to another user using their client ID.
    """
    try:
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        
        # Find recipient by client_id
        recipient = await db.users.find_one({"client_id": request.recipient_client_id})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found. Please check the Client ID.")
        
        # Can't transfer to self
        if recipient["_id"] == current_user["_id"]:
            raise HTTPException(status_code=400, detail="Cannot transfer to yourself")
        
        # Check sender's balance
        sender_wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        if not sender_wallet or sender_wallet["balance"] < request.amount:
            raise HTTPException(status_code=402, detail=f"Insufficient balance. You need ${request.amount:.2f}")
        
        # Get or create recipient wallet
        recipient_wallet = await db.wallets.find_one({"user_id": recipient["_id"]})
        if not recipient_wallet:
            recipient_wallet = {
                "user_id": recipient["_id"],
                "balance": 0.00,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.wallets.insert_one(recipient_wallet)
            recipient_wallet["balance"] = 0.00
        
        # Perform transfer
        sender_new_balance = sender_wallet["balance"] - request.amount
        recipient_new_balance = recipient_wallet["balance"] + request.amount
        
        # Update sender wallet
        await db.wallets.update_one(
            {"user_id": current_user["_id"]},
            {"$set": {"balance": sender_new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Update recipient wallet
        await db.wallets.update_one(
            {"user_id": recipient["_id"]},
            {"$set": {"balance": recipient_new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Log transactions
        note_text = f" - {request.note}" if request.note else ""
        
        # Sender transaction
        sender_tx = {
            "user_id": current_user["_id"],
            "type": "debit",
            "amount": request.amount,
            "description": f"Transfer to {request.recipient_client_id}{note_text}",
            "balance_after": sender_new_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(sender_tx)
        
        # Recipient transaction
        recipient_tx = {
            "user_id": recipient["_id"],
            "type": "credit",
            "amount": request.amount,
            "description": f"Transfer from {current_user.get('client_id', 'user')}{note_text}",
            "balance_after": recipient_new_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(recipient_tx)
        
        logger.info(f"Balance transfer: ${request.amount} from {current_user['_id']} to {recipient['_id']}")
        
        return {
            "success": True,
            "amount_transferred": request.amount,
            "recipient_client_id": request.recipient_client_id,
            "recipient_email": recipient["email"],
            "new_balance": sender_new_balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transferring balance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to transfer balance: {str(e)}")
