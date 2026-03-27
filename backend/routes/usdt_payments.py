"""
USDT TRC20 Payment Router
Handles cryptocurrency payments via USDT on Tron (TRC20) network
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
import logging
import os
import httpx
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorClient
from routes.auth import get_current_user
from email_service import send_balance_added_email

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# USDT TRC20 Configuration
USDT_WALLET_ADDRESS = os.environ.get('USDT_TRC20_WALLET_ADDRESS')
USDT_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"  # Official USDT TRC20 contract
TRONGRID_API = "https://api.trongrid.io"
TRONSCAN_API = "https://apilist.tronscanapi.com/api"

# Credit packages with USDT pricing
USDT_PACKAGES = {
    "starter": {"usdt": 10.0, "credits": 10.0, "name": "Starter Pack"},
    "basic": {"usdt": 25.0, "credits": 27.0, "name": "Basic Pack (+$2 bonus)"},
    "pro": {"usdt": 50.0, "credits": 55.0, "name": "Pro Pack (+$5 bonus)"},
    "premium": {"usdt": 100.0, "credits": 115.0, "name": "Premium Pack (+$15 bonus)"}
}

class USDTPaymentRequest(BaseModel):
    package_id: str = Field(..., description="Package ID (starter, basic, pro, premium)")

class VerifyTransactionRequest(BaseModel):
    payment_id: str = Field(..., description="Payment ID from create order")
    transaction_hash: str = Field(..., description="Transaction hash (TXID) from Tron network")

@router.get("/wallet-info")
async def get_wallet_info():
    """Get USDT TRC20 wallet address and contract info"""
    if not USDT_WALLET_ADDRESS:
        raise HTTPException(status_code=500, detail="USDT wallet not configured")
    
    return {
        "wallet_address": USDT_WALLET_ADDRESS,
        "network": "TRC20 (Tron)",
        "contract_address": USDT_CONTRACT_ADDRESS,
        "currency": "USDT",
        "minimum_amount": 10.0,
        "note": "Please send exact amount shown in your order. Transaction typically confirms in 1-2 minutes."
    }

@router.get("/packages")
async def get_usdt_packages():
    """Get available USDT payment packages"""
    return {
        "packages": USDT_PACKAGES,
        "currency": "USDT",
        "network": "TRC20"
    }

@router.post("/create-order")
async def create_usdt_order(
    request: USDTPaymentRequest,
    current_user = Depends(get_current_user)
):
    """
    Create USDT TRC20 payment order
    Returns wallet address and amount to send
    """
    try:
        # Validate package
        if request.package_id not in USDT_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package selected")
        
        package = USDT_PACKAGES[request.package_id]
        usdt_amount = package["usdt"]
        credits_amount = package["credits"]
        
        # Generate unique payment ID
        payment_id = str(uuid4())
        order_number = f"USDT-{payment_id[:8].upper()}"
        
        # Create payment record
        payment_doc = {
            "id": payment_id,
            "order_number": order_number,
            "user_id": current_user["_id"],
            "user_email": current_user["email"],
            "package_id": request.package_id,
            "package_name": package["name"],
            "usdt_amount": usdt_amount,
            "credits_to_add": credits_amount,
            "wallet_address": USDT_WALLET_ADDRESS,
            "network": "TRC20",
            "status": "pending",  # pending, verifying, completed, failed, expired
            "transaction_hash": None,
            "verified_at": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": None,
            "processed": False
        }
        
        await db.usdt_payments.insert_one(payment_doc)
        
        logger.info(f"USDT payment created: {order_number} for {current_user['email']}")
        
        return {
            "success": True,
            "payment_id": payment_id,
            "order_number": order_number,
            "wallet_address": USDT_WALLET_ADDRESS,
            "amount_usdt": usdt_amount,
            "credits": credits_amount,
            "network": "TRC20 (Tron)",
            "contract_address": USDT_CONTRACT_ADDRESS,
            "instructions": [
                f"1. Send exactly {usdt_amount} USDT to the address above",
                "2. Make sure you're using TRC20 network (Tron)",
                "3. Copy the transaction hash after sending",
                "4. Paste it below to verify your payment",
                "5. Credits will be added automatically after verification"
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating USDT order: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

@router.post("/verify-transaction")
async def verify_transaction(
    request: VerifyTransactionRequest,
    current_user = Depends(get_current_user)
):
    """
    Verify USDT TRC20 transaction and auto-credit user account
    """
    try:
        # Get payment record
        payment = await db.usdt_payments.find_one(
            {"id": request.payment_id, "user_id": current_user["_id"]}
        )
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        if payment["status"] == "completed":
            return {
                "success": True,
                "status": "completed",
                "message": "Payment already verified and credited"
            }
        
        # Update status to verifying
        await db.usdt_payments.update_one(
            {"id": request.payment_id},
            {"$set": {
                "status": "verifying",
                "transaction_hash": request.transaction_hash
            }}
        )
        
        # Verify transaction via TronScan API
        verification_result = await verify_tron_transaction(
            tx_hash=request.transaction_hash,
            expected_to_address=USDT_WALLET_ADDRESS,
            expected_amount=payment["usdt_amount"]
        )
        
        if not verification_result["valid"]:
            await db.usdt_payments.update_one(
                {"id": request.payment_id},
                {"$set": {"status": "failed"}}
            )
            raise HTTPException(
                status_code=400,
                detail=f"Transaction verification failed: {verification_result['error']}"
            )
        
        # Transaction is valid - credit user account
        credits_to_add = payment["credits_to_add"]
        
        # Get user's wallet
        wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        
        if wallet:
            new_balance = wallet["balance"] + credits_to_add
            
            await db.wallets.update_one(
                {"user_id": current_user["_id"]},
                {"$set": {
                    "balance": new_balance,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Create wallet if doesn't exist
            new_balance = credits_to_add
            await db.wallets.insert_one({
                "user_id": current_user["_id"],
                "balance": new_balance,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Log transaction
        transaction = {
            "user_id": current_user["_id"],
            "type": "credit",
            "amount": credits_to_add,
            "description": f"USDT Payment: {payment['package_name']}",
            "balance_after": new_balance,
            "payment_id": request.payment_id,
            "transaction_hash": request.transaction_hash,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        # Mark payment as completed
        await db.usdt_payments.update_one(
            {"id": request.payment_id},
            {"$set": {
                "status": "completed",
                "processed": True,
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "credited_amount": credits_to_add,
                "new_balance": new_balance
            }}
        )
        
        logger.info(f"USDT payment verified and credited: {request.payment_id}, User: {current_user['email']}, Amount: ${credits_to_add}")
        
        # Send confirmation email
        try:
            user_name = current_user.get('full_name') or current_user.get('email', '').split('@')[0]
            await send_balance_added_email(
                to_email=current_user['email'],
                name=user_name,
                amount=credits_to_add,
                new_balance=new_balance,
                payment_method="USDT (Crypto)"
            )
        except Exception as e:
            logger.error(f"Failed to send balance confirmation email: {str(e)}")
            # Don't fail the request if email fails
        
        return {
            "success": True,
            "status": "completed",
            "message": "Payment verified successfully!",
            "credits_added": credits_to_add,
            "new_balance": new_balance,
            "transaction_hash": request.transaction_hash
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying transaction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify transaction")

async def verify_tron_transaction(
    tx_hash: str,
    expected_to_address: str,
    expected_amount: float
) -> dict:
    """
    Verify USDT TRC20 transaction on Tron blockchain
    Uses TronScan API to check transaction details
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Query transaction from TronScan API
            response = await client.get(
                f"{TRONSCAN_API}/transaction-info",
                params={"hash": tx_hash}
            )
            
            if response.status_code != 200:
                return {"valid": False, "error": "Transaction not found on blockchain"}
            
            data = response.json()
            
            # Check if transaction exists
            if not data or "contractRet" not in data:
                return {"valid": False, "error": "Invalid transaction"}
            
            # Check transaction success
            if data.get("contractRet") != "SUCCESS":
                return {"valid": False, "error": "Transaction failed on blockchain"}
            
            # Check if it's a TRC20 token transfer
            contract_data = data.get("trc20TransferInfo")
            if not contract_data or len(contract_data) == 0:
                return {"valid": False, "error": "Not a TRC20 transfer"}
            
            transfer = contract_data[0]
            
            # Verify contract address (USDT)
            if transfer.get("contract_address") != USDT_CONTRACT_ADDRESS:
                return {"valid": False, "error": "Not a USDT transfer"}
            
            # Verify recipient address
            to_address = transfer.get("to_address")
            if to_address.upper() != expected_to_address.upper():
                return {"valid": False, "error": "Payment sent to wrong address"}
            
            # Verify amount (convert from smallest unit - USDT has 6 decimals)
            amount_raw = int(transfer.get("amount_str", "0"))
            amount_usdt = amount_raw / 1_000_000  # USDT has 6 decimals
            
            # Allow 0.5% tolerance for amount differences
            amount_diff = abs(amount_usdt - expected_amount)
            if amount_diff > (expected_amount * 0.005):
                return {
                    "valid": False,
                    "error": f"Amount mismatch. Expected: {expected_amount} USDT, Received: {amount_usdt} USDT"
                }
            
            # Check confirmation status
            confirmed = data.get("confirmed", False)
            if not confirmed:
                return {
                    "valid": False,
                    "error": "Transaction not yet confirmed. Please wait a few minutes and try again."
                }
            
            logger.info(f"Transaction verified: {tx_hash}, Amount: {amount_usdt} USDT")
            
            return {
                "valid": True,
                "amount": amount_usdt,
                "from_address": transfer.get("from_address"),
                "to_address": to_address,
                "block_number": data.get("block"),
                "timestamp": data.get("timestamp")
            }
            
    except httpx.TimeoutException:
        return {"valid": False, "error": "Network timeout. Please try again."}
    except Exception as e:
        logger.error(f"Error verifying Tron transaction: {str(e)}")
        return {"valid": False, "error": "Verification failed. Please try again later."}

@router.get("/payment-status/{payment_id}")
async def get_payment_status(
    payment_id: str,
    current_user = Depends(get_current_user)
):
    """Get status of USDT payment"""
    try:
        payment = await db.usdt_payments.find_one(
            {"id": payment_id, "user_id": current_user["_id"]},
            {"_id": 0}
        )
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return {
            "success": True,
            "payment": payment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payment status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get payment status")

@router.get("/my-payments")
async def get_my_usdt_payments(
    current_user = Depends(get_current_user),
    limit: int = 20
):
    """Get user's USDT payment history"""
    try:
        payments = await db.usdt_payments.find(
            {"user_id": current_user["_id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "payments": payments,
            "total": len(payments)
        }
        
    except Exception as e:
        logger.error(f"Error fetching payments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payments")
