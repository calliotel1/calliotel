from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import httpx

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class SmartPurchaseRequest(BaseModel):
    country: str
    service: str
    price: float

class SmartPurchaseResponse(BaseModel):
    success: bool
    number: Optional[str] = None
    message: str
    balance_used: bool = False
    remaining_balance: Optional[float] = None

@router.post("/purchase-with-balance", response_model=SmartPurchaseResponse)
async def purchase_with_balance(
    request: SmartPurchaseRequest, 
    current_user = Depends(get_current_user)
):
    """
    SMART BALANCE LOGIC:
    1. Check if user has sufficient wallet balance
    2. If YES: Deduct balance, purchase number, return success
    3. If NO: Return 402 error (frontend will route to payment gateway)
    """
    try:
        user_email = current_user.get("email") or current_user.get("id")
        logger.info(f"Smart purchase attempt by {user_email} for {request.country} - {request.service}")
        
        # Step 1: Check wallet balance
        wallet = await db.wallets.find_one({"user_id": user_email})
        
        if not wallet:
            # Create wallet if doesn't exist
            await db.wallets.insert_one({
                "user_id": user_email,
                "balance": 0.0,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            wallet = {"balance": 0.0}
        
        current_balance = wallet.get("balance", 0.0)
        
        # Step 2: Check if sufficient funds
        if current_balance < request.price:
            logger.info(f"Insufficient balance for {user_email}: {current_balance} < {request.price}")
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient balance. You have ${current_balance:.2f}, need ${request.price:.2f}"
            )
        
        # Step 3: Deduct balance
        new_balance = current_balance - request.price
        
        await db.wallets.update_one(
            {"user_id": user_email},
            {
                "$set": {"balance": new_balance},
                "$push": {
                    "transactions": {
                        "type": "purchase",
                        "amount": -request.price,
                        "description": f"Purchased {request.country} number for {request.service}",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                }
            }
        )
        
        # Step 4: Call NorthSMS/Sonetel API to actually get the number
        # For now, we'll return a mock number
        # TODO: Integrate with actual NorthSMS/Sonetel API
        mock_number = f"+1555{str(int(datetime.now().timestamp()))[-7:]}"
        
        # Step 5: Save purchased number to database
        purchased_number = {
            "user_id": user_email,
            "phone_number": mock_number,
            "country": request.country,
            "service": request.service,
            "monthly_cost": request.price,
            "status": "active",
            "purchased_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": None  # For one-time verification numbers
        }
        
        await db.purchased_numbers.insert_one(purchased_number)
        
        logger.info(f"✅ Purchase successful for {user_email}: {mock_number}")
        
        return SmartPurchaseResponse(
            success=True,
            number=mock_number,
            message=f"Successfully purchased {request.country} number!",
            balance_used=True,
            remaining_balance=new_balance
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Smart purchase error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="CALLIOTEL: Verification node busy. Please try again."
        )
