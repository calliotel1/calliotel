"""
Sonetel API Router
Virtual number provisioning and management
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging
import os
import httpx
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorClient

from routes.auth import get_current_user
from services.sonetel_auth import sonetel_auth
from models.sonetel import (
    SonetelNumber, 
    SonetelSubscription, 
    SonetelPurchaseRequest,
    SonetelAvailableNumbersRequest
)

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Sonetel API base URL
SONETEL_API_BASE = os.environ.get('SONETEL_API_BASE_URL', 'https://api.sonetel.com')

# Markup percentage for profit (200% = 2x price)
PRICE_MARKUP_MULTIPLIER = 2.0


@router.get("/available-numbers", response_model=List[SonetelNumber])
async def get_available_numbers(
    country: str = "US",
    city: str = None,
    contains: str = None,
    limit: int = 20
):
    """
    Get available virtual numbers from Sonetel using direct REST API
    Public endpoint - browse before buy
    
    Uses Sonetel's undocumented inventory endpoints that the Python SDK omits
    """
    try:
        # Get OAuth2 token
        token = await sonetel_auth.get_access_token()
        
        # Extract account ID from JWT token (required for some endpoints)
        import jwt
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        account_id = decoded_token.get('acc_id', '210232345')  # Fallback to known account ID
        
        # Map country codes to calling codes
        country_calling_codes = {
            "US": "1", "UK": "44", "CA": "1", "AU": "61", "FR": "33",
            "DE": "49", "ES": "34", "IT": "39", "NL": "31", "SE": "46",
            "NO": "47", "DK": "45", "FI": "358", "PL": "48", "BE": "32",
            "CH": "41", "AT": "43", "IE": "353", "NZ": "64", "SG": "65",
            "HK": "852", "JP": "81", "KR": "82", "IN": "91", "BR": "55",
            "MX": "52", "AR": "54", "CL": "56", "CO": "57", "PE": "51",
            "ZA": "27", "IL": "972", "TR": "90", "AE": "971", "SA": "966"
        }
        
        calling_code = country_calling_codes.get(country, "1")
        
        # Try multiple endpoint variations based on Sonetel API patterns
        endpoints_to_try = [
            # Pattern 1: Direct availablephonenumber
            (f"https://public-api.sonetel.com/availablephonenumber", {"countrycode": calling_code}),
            # Pattern 2: With account ID in path
            (f"https://public-api.sonetel.com/account/{account_id}/availablephonenumber", {"countrycode": calling_code}),
            # Pattern 3: Inventory endpoint
            (f"https://public-api.sonetel.com/inventory/availablephonenumber", {"countrycode": calling_code}),
            # Pattern 4: Number stock summary
            (f"https://public-api.sonetel.com/numberstocksummary/{calling_code}", {}),
        ]
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        result = []
        last_error = None
        
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            for url, params in endpoints_to_try:
                try:
                    logger.info(f"🔍 Trying Sonetel endpoint: {url}")
                    response = await http_client.get(url, headers=headers, params=params)
                    
                    if response.status_code == 200:
                        data = response.json()
                        logger.info(f"✅ Success with {url}: {type(data)}")
                        
                        # Handle different response formats
                        if isinstance(data, list):
                            # Direct array of phone numbers
                            for item in data[:limit]:
                                if isinstance(item, str):
                                    # Simple E.164 string
                                    phone_number = item
                                    provider_cost = 2.50
                                elif isinstance(item, dict):
                                    # Object with details
                                    phone_number = item.get('phnum') or item.get('phone_number') or item.get('number')
                                    provider_cost = float(item.get('recurring_fee', 2.50))
                                else:
                                    continue
                                
                                reseller_price = provider_cost * PRICE_MARKUP_MULTIPLIER
                                
                                result.append(SonetelNumber(
                                    number_id=str(uuid4()),
                                    phone_number=phone_number,
                                    country=country,
                                    country_name=country,
                                    city=item.get('city') if isinstance(item, dict) else "Various",
                                    number_type="local",
                                    monthly_cost=round(reseller_price, 2),
                                    setup_fee=float(item.get('setup_fee', 0)) if isinstance(item, dict) else 0.0,
                                    features=["voice", "sms"] if isinstance(item, dict) and item.get('sms_support') else ["voice"],
                                    is_available=True
                                ))
                        
                        elif isinstance(data, dict):
                            # Object with nested numbers
                            numbers = data.get('numbers') or data.get('available') or data.get('stock') or []
                            for item in numbers[:limit]:
                                phone_number = item.get('phnum') or item.get('phone_number')
                                provider_cost = float(item.get('recurring_fee', 2.50))
                                reseller_price = provider_cost * PRICE_MARKUP_MULTIPLIER
                                
                                result.append(SonetelNumber(
                                    number_id=str(uuid4()),
                                    phone_number=phone_number,
                                    country=country,
                                    country_name=country,
                                    city=item.get('city', "Various"),
                                    number_type=item.get('type', 'local'),
                                    monthly_cost=round(reseller_price, 2),
                                    setup_fee=float(item.get('setup_fee', 0)),
                                    features=["voice", "sms"] if item.get('sms_support') else ["voice"],
                                    is_available=True
                                ))
                        
                        if result:
                            logger.info(f"✅ Found {len(result)} available numbers in {country}")
                            return result
                        
                except httpx.HTTPStatusError as e:
                    last_error = f"{url}: {e.response.status_code}"
                    logger.warning(f"⚠️ Endpoint failed: {last_error}")
                    continue
                except Exception as e:
                    last_error = f"{url}: {str(e)}"
                    logger.warning(f"⚠️ Endpoint error: {last_error}")
                    continue
            
            # If all endpoints fail, raise error
            raise HTTPException(
                status_code=502,
                detail=f"Unable to fetch available numbers. Last error: {last_error}. Sonetel API may require different authentication or the account may need activation."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching available numbers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch available numbers: {str(e)}")


@router.post("/purchase")
async def purchase_number(
    request: SonetelPurchaseRequest,
    current_user = Depends(get_current_user)
):
    """
    Purchase a virtual number from Sonetel
    Deducts cost from user's wallet
    """
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        # Get OAuth2 token
        token = await sonetel_auth.get_access_token()
        
        # First, get the actual cost from Sonetel
        url = f"{SONETEL_API_BASE}/phone-numbers/buy"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "phone_number": request.phone_number,
            "forward_to": request.forward_to
        }
        
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            # Purchase from Sonetel
            response = await http_client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            purchase_data = response.json()
            provider_cost = float(purchase_data.get('monthly_cost', 0.79))
            
            # Calculate our pricing
            reseller_price = provider_cost * PRICE_MARKUP_MULTIPLIER
            profit_margin = reseller_price - provider_cost
            
            # Check user's wallet balance
            user = await db.users.find_one({"email": user_id}, {"_id": 0})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            wallet_balance = user.get("wallet_balance", 0)
            if wallet_balance < reseller_price:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient balance. Required: ${reseller_price:.2f}, Available: ${wallet_balance:.2f}"
                )
            
            # Deduct from wallet
            new_balance = wallet_balance - reseller_price
            await db.users.update_one(
                {"email": user_id},
                {"$set": {"wallet_balance": new_balance}}
            )
            
            # Create subscription record
            now = datetime.now(timezone.utc)
            next_renewal = now + timedelta(days=30)
            
            subscription = {
                "subscription_id": str(uuid4()),
                "user_id": user_id,
                "sonetel_number_id": purchase_data.get('number_id', str(uuid4())),
                "phone_number": request.phone_number,
                "country": request.country,
                "monthly_cost": round(reseller_price, 2),
                "provider_cost": round(provider_cost, 2),
                "profit_margin": round(profit_margin, 2),
                "status": "active",
                "auto_renew": request.auto_renew,
                "purchase_date": now.isoformat(),
                "next_renewal_date": next_renewal.isoformat(),
                "forward_to": request.forward_to,
                "voicemail_enabled": False
            }
            
            await db.sonetel_subscriptions.insert_one(subscription)
            
            # Log transaction
            transaction = {
                "transaction_id": str(uuid4()),
                "user_id": user_id,
                "type": "sonetel_number_purchase",
                "amount": -reseller_price,
                "description": f"Purchased Sonetel number {request.phone_number}",
                "timestamp": now.isoformat(),
                "balance_after": new_balance
            }
            await db.transactions.insert_one(transaction)
            
            logger.info(f"✅ User {user_id} purchased {request.phone_number} for ${reseller_price:.2f}")
            
            return {
                "success": True,
                "message": f"Successfully purchased {request.phone_number}",
                "subscription": subscription,
                "new_balance": round(new_balance, 2),
                "next_renewal": next_renewal.isoformat()
            }
            
    except httpx.HTTPStatusError as e:
        logger.error(f"❌ Sonetel purchase error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=502, detail=f"Purchase failed: {e.response.text}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error purchasing number: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to purchase number")


@router.get("/my-numbers")
async def get_my_numbers(current_user = Depends(get_current_user)):
    """Get user's active Sonetel subscriptions"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        subscriptions = await db.sonetel_subscriptions.find(
            {"user_id": user_id, "status": "active"},
            {"_id": 0}
        ).to_list(100)
        
        return {"numbers": subscriptions}
        
    except Exception as e:
        logger.error(f"❌ Error fetching user numbers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch numbers")


@router.post("/cancel/{subscription_id}")
async def cancel_subscription(
    subscription_id: str,
    current_user = Depends(get_current_user)
):
    """Cancel a Sonetel number subscription"""
    try:
        user_id = current_user.get("_id") or current_user.get("email")
        
        # Find subscription
        subscription = await db.sonetel_subscriptions.find_one(
            {"subscription_id": subscription_id, "user_id": user_id},
            {"_id": 0}
        )
        
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        # Update status
        await db.sonetel_subscriptions.update_one(
            {"subscription_id": subscription_id},
            {
                "$set": {
                    "status": "cancelled",
                    "cancellation_date": datetime.now(timezone.utc).isoformat(),
                    "auto_renew": False
                }
            }
        )
        
        # TODO: Call Sonetel API to release the number
        # (Sonetel will release at end of billing cycle)
        
        logger.info(f"✅ User {user_id} cancelled subscription {subscription_id}")
        
        return {
            "success": True,
            "message": f"Subscription cancelled. Number will remain active until {subscription['next_renewal_date']}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error cancelling subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")


@router.get("/pricing/{country}")
async def get_country_pricing(country: str):
    """
    Get pricing for a specific country
    Public endpoint - no auth required
    """
    try:
        # Get sample numbers to determine pricing
        numbers = await get_available_numbers(country=country, limit=5)
        
        if not numbers:
            return {
                "country": country,
                "available": False,
                "message": "No numbers available for this country"
            }
        
        # Calculate average pricing
        avg_monthly = sum(n.monthly_cost for n in numbers) / len(numbers)
        min_monthly = min(n.monthly_cost for n in numbers)
        
        return {
            "country": country,
            "available": True,
            "pricing": {
                "starting_from": round(min_monthly, 2),
                "average_monthly": round(avg_monthly, 2),
                "currency": "USD"
            },
            "sample_numbers": [n.phone_number for n in numbers[:3]]
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching country pricing: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch pricing")
