from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class CreditPackage(BaseModel):
    id: str
    name: str
    price: float
    credits: float
    bonus_percentage: int
    base_credits: float
    is_best_value: bool

class PurchasePackageRequest(BaseModel):
    package_id: str
    user_id: str

@router.get("/credit-packages")
async def get_credit_packages():
    """Get available credit multiplier packages - matches payment system"""
    # These IDs must match the payment system in payments.py
    packages = [
        CreditPackage(
            id="starter",
            name="Starter",
            price=10.00,
            credits=10.00,
            bonus_percentage=0,
            base_credits=10.00,
            is_best_value=False
        ),
        CreditPackage(
            id="pro",
            name="Pro",
            price=50.00,
            credits=55.00,
            bonus_percentage=10,
            base_credits=50.00,
            is_best_value=True
        ),
        CreditPackage(
            id="premium",
            name="Premium",
            price=100.00,
            credits=115.00,
            bonus_percentage=15,
            base_credits=100.00,
            is_best_value=False
        )
    ]
    
    return {"packages": packages}

@router.post("/credit-packages/purchase")
async def purchase_credit_package(request: PurchasePackageRequest):
    """Purchase a credit package with bonus credits"""
    try:
        # Define packages
        packages = {
            "starter": {"price": 10.00, "credits": 10.00, "bonus": 0},
            "business": {"price": 50.00, "credits": 55.00, "bonus": 10},
            "enterprise": {"price": 200.00, "credits": 240.00, "bonus": 20}
        }
        
        if request.package_id not in packages:
            raise HTTPException(status_code=400, detail="Invalid package ID")
        
        package = packages[request.package_id]
        
        # Get user wallet
        wallet = await db.wallets.find_one({"user_id": request.user_id}, {"_id": 0})
        
        if not wallet:
            # Create wallet if doesn't exist
            wallet = {
                "user_id": request.user_id,
                "balance": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.wallets.insert_one(wallet)
        
        # Add credits to wallet (including bonus)
        new_balance = wallet.get("balance", 0) + package["credits"]
        
        await db.wallets.update_one(
            {"user_id": request.user_id},
            {"$set": {"balance": new_balance}}
        )
        
        # Create transaction record
        transaction = {
            "user_id": request.user_id,
            "type": "credit_package_purchase",
            "package_id": request.package_id,
            "package_name": request.package_id.capitalize(),
            "amount_paid": package["price"],
            "credits_received": package["credits"],
            "bonus_percentage": package["bonus"],
            "balance_after": new_balance,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        return {
            "message": "Credit package purchased successfully",
            "package": request.package_id,
            "credits_added": package["credits"],
            "bonus_credits": package["credits"] - package["price"],
            "new_balance": new_balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error purchasing package: {str(e)}")
