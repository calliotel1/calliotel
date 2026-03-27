"""
SMMWiz SMM Reseller Routes
Handles service catalog, order creation, and order tracking

PRICING PROTECTION:
- All services apply 100% markup (2x provider price)
- Minimum price floor: $0.01 (prevents negative or zero pricing)
- Dynamic price refresh every 24 hours
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
import os
import httpx
from datetime import datetime, timezone
from uuid import uuid4

from routes.auth import get_current_user
from models.smm import (
    SMMService, CreateSMMOrderRequest, SMMOrder, 
    SMMOrderResponse, OrderStatus, ServiceCategory
)

router = APIRouter(prefix="/api/smm", tags=["SMM Services"])

# Import shared MongoDB instance (breaks circular dependency)
from database import db

# SMMWiz API Configuration
SMMWIZ_API_KEY = os.environ.get('SMMWIZ_API_KEY')
SMMWIZ_API_URL = os.environ.get('SMMWIZ_API_URL', 'https://smmwiz.com/api/v2')
MARKUP_PERCENTAGE = 100  # 100% profit margin
MINIMUM_PRICE_FLOOR = 0.01  # Never sell below $0.01


# ============================================
# SMMWIZ API CLIENT
# ============================================

async def smmwiz_request(action: str, params: dict = None):
    """
    Make request to SMMWiz API with authentication
    
    SMMWiz API uses POST requests with 'action' parameter:
    - action=services: Get services catalog
    - action=balance: Get account balance
    - action=add: Create new order
    - action=status: Get order status
    """
    url = SMMWIZ_API_URL
    
    # Build form data with API key and action
    form_data = {
        "key": SMMWIZ_API_KEY,
        "action": action
    }
    
    # Add additional parameters if provided
    if params:
        form_data.update(params)
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            # SMMWiz uses POST for all requests
            response = await http_client.post(url, data=form_data)
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="SMMWiz API timeout")
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"SMMWiz API error: {e.response.text}"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"API request failed: {str(e)}")


# ============================================
# SERVICE CATALOG MANAGEMENT
# ============================================

@router.get("/services")
async def get_smm_services(
    category: Optional[ServiceCategory] = None,
    force_refresh: bool = False
):
    """
    Get SMM services catalog with 100% markup pricing (PUBLIC endpoint)
    
    Services are cached for 24 hours to minimize API calls.
    Returns services with 2x provider pricing for reseller profit.
    """
    services_col = db.smm_services
    
    # Check cache (24-hour TTL)
    if not force_refresh:
        cached = await services_col.find_one(
            {"is_current": True},
            {"_id": 0}
        )
        
        # Handle timezone-aware comparison
        if cached:
            last_updated = cached["last_updated"]
            # Make sure both datetimes are timezone-aware
            if last_updated.tzinfo is None:
                last_updated = last_updated.replace(tzinfo=timezone.utc)
            cache_valid = (datetime.now(timezone.utc) - last_updated).total_seconds() < 86400
        else:
            cache_valid = False
        
        if cached and cache_valid:
            services = cached["services"]
            
            # Filter by category if specified
            if category:
                services = [s for s in services if s.get("category") == category.value]
            
            return {
                "success": True,
                "services": services,
                "count": len(services),
                "cached": True
            }
    
    # Fetch from SMMWiz API
    try:
        response = await smmwiz_request("services")
        provider_services = response if isinstance(response, list) else response.get("services", [])
        
        # Apply 100% markup to all services with PRICE PROTECTION
        reseller_services = []
        for service in provider_services:
            # Get provider price with safety checks
            try:
                provider_price = float(service.get("rate", 0))
            except (ValueError, TypeError):
                provider_price = 0.0
            
            # Apply 100% markup
            reseller_price = provider_price * 2
            
            # PRICE FLOOR PROTECTION: Never sell below minimum
            if reseller_price < MINIMUM_PRICE_FLOOR:
                reseller_price = MINIMUM_PRICE_FLOOR
            
            # PROFIT VALIDATION: Ensure we never lose money
            profit_margin = reseller_price - provider_price
            if profit_margin < 0:
                # Emergency: If somehow negative, force minimum profit
                reseller_price = provider_price + MINIMUM_PRICE_FLOOR
                profit_margin = MINIMUM_PRICE_FLOOR
            
            reseller_service = {
                "service_id": str(service.get("service")),
                "name": service.get("name", ""),
                "category": categorize_service(service.get("name", "").lower()),
                "description": service.get("name", ""),
                "provider_price": round(provider_price, 4),
                "reseller_price": round(reseller_price, 4),
                "profit_margin": round(profit_margin, 4),
                "min_quantity": int(service.get("min", 10)),
                "max_quantity": int(service.get("max", 100000)),
                "rate_per_1000": round(provider_price, 4)
            }
            reseller_services.append(reseller_service)
        
        # Cache the results
        await services_col.update_one(
            {"is_current": True},
            {
                "$set": {
                    "services": reseller_services,
                    "last_updated": datetime.now(timezone.utc),
                    "is_current": True
                }
            },
            upsert=True
        )
        
        # Filter by category if specified
        if category:
            reseller_services = [s for s in reseller_services if s.get("category") == category.value]
        
        return {
            "success": True,
            "services": reseller_services,
            "count": len(reseller_services),
            "cached": False
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch services: {str(e)}")


def categorize_service(name: str) -> str:
    """Categorize service based on name"""
    if "instagram" in name or "ig " in name:
        return ServiceCategory.INSTAGRAM.value
    elif "tiktok" in name or "tik tok" in name:
        return ServiceCategory.TIKTOK.value
    elif "youtube" in name or "yt " in name:
        return ServiceCategory.YOUTUBE.value
    elif "facebook" in name or "fb " in name:
        return ServiceCategory.FACEBOOK.value
    elif "twitter" in name or "x " in name:
        return ServiceCategory.TWITTER.value
    elif "telegram" in name:
        return ServiceCategory.TELEGRAM.value
    else:
        return ServiceCategory.OTHER.value


@router.get("/categories")
async def get_categories():
    """Get available SMM service categories (PUBLIC - no auth required)"""
    return {
        "success": True,
        "categories": [cat.value for cat in ServiceCategory]
    }


# ============================================
# ORDER MANAGEMENT
# ============================================

@router.post("/order")
async def create_smm_order(
    request: CreateSMMOrderRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """
    Create a new SMM service order
    
    Process:
    1. Validate service exists and get pricing
    2. Check user wallet balance
    3. Deduct from wallet
    4. Submit order to SMMWiz
    5. Create order record
    6. Schedule status polling
    """
    user_id = current_user["_id"]
    
    # Get service details from cache
    services_col = db.smm_services
    cached = await services_col.find_one({"is_current": True}, {"_id": 0})
    
    if not cached:
        raise HTTPException(status_code=503, detail="Service catalog not available")
    
    # Find the requested service
    service = next(
        (s for s in cached["services"] if s["service_id"] == request.service_id),
        None
    )
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Validate quantity
    if request.quantity < service["min_quantity"] or request.quantity > service["max_quantity"]:
        raise HTTPException(
            status_code=400,
            detail=f"Quantity must be between {service['min_quantity']} and {service['max_quantity']}"
        )
    
    # Calculate total cost (reseller price)
    total_cost = service["reseller_price"] * (request.quantity / 1000)
    profit_earned = service["profit_margin"] * (request.quantity / 1000)
    
    # Check wallet balance
    wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet or wallet.get("balance", 0) < total_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Need ${total_cost:.2f}, have ${wallet.get('balance', 0):.2f}"
        )
    
    # Deduct from wallet
    new_balance = wallet["balance"] - total_cost
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Log transaction
    transaction_doc = {
        "id": f"txn_{uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "debit",
        "amount": total_cost,
        "description": f"SMM Order: {service['name']} ({request.quantity} units)",
        "order_code": None,
        "timestamp": datetime.now(timezone.utc),
        "balance_after": new_balance
    }
    await db.transactions.insert_one(transaction_doc)
    
    # Submit order to SMMWiz
    try:
        smm_response = await smmwiz_request(
            "add",
            params={
                "service": request.service_id,
                "link": request.target_url or request.target_username or "",
                "quantity": request.quantity
            }
        )
        
        provider_order_id = smm_response.get("order")
        
    except Exception as e:
        # Refund wallet if SMMWiz order fails
        await db.wallets.update_one(
            {"user_id": user_id},
            {"$set": {"balance": wallet["balance"]}}
        )
        raise HTTPException(status_code=500, detail=f"Failed to place order with provider: {str(e)}")
    
    # Create order record
    order_id = f"smm_{uuid4().hex[:12]}"
    order_doc = {
        "id": order_id,
        "user_id": user_id,
        "service_id": request.service_id,
        "service_name": service["name"],
        "quantity": request.quantity,
        "total_cost": total_cost,
        "profit_earned": profit_earned,
        "status": OrderStatus.PROCESSING.value,
        "target_url": request.target_url,
        "target_username": request.target_username,
        "provider_order_id": str(provider_order_id),
        "progress": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "completed_at": None
    }
    
    await db.smm_orders.insert_one(order_doc)
    
    # Schedule background status polling
    background_tasks.add_task(poll_order_status, order_id, provider_order_id)
    
    return {
        "success": True,
        "message": "Order placed successfully",
        "order": {
            "order_id": order_id,
            "service_name": service["name"],
            "quantity": request.quantity,
            "total_cost": total_cost,
            "profit_earned": profit_earned,
            "status": OrderStatus.PROCESSING.value,
            "provider_order_id": provider_order_id
        },
        "new_balance": new_balance
    }


@router.get("/orders/my")
async def get_my_orders(
    status: Optional[OrderStatus] = None,
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """Get user's SMM order history"""
    user_id = current_user["_id"]
    
    query = {"user_id": user_id}
    if status:
        query["status"] = status.value
    
    orders = await db.smm_orders.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "success": True,
        "orders": orders,
        "count": len(orders)
    }


@router.get("/order/{order_id}/status")
async def get_order_status(
    order_id: str,
    current_user = Depends(get_current_user)
):
    """Get real-time status of a specific order"""
    user_id = current_user["_id"]
    
    order = await db.smm_orders.find_one(
        {"id": order_id, "user_id": user_id},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Poll SMMWiz for latest status if order is not completed
    if order["status"] in [OrderStatus.PENDING.value, OrderStatus.PROCESSING.value]:
        try:
            status_response = await smmwiz_request(
                "status",
                params={"order": order["provider_order_id"]}
            )
            
            # Update order status
            provider_status = status_response.get("status", "").lower()
            progress = int(status_response.get("charge", 0))
            
            new_status = map_provider_status(provider_status)
            
            update_data = {
                "status": new_status,
                "progress": progress,
                "updated_at": datetime.now(timezone.utc)
            }
            
            if new_status in [OrderStatus.COMPLETED.value, OrderStatus.FAILED.value]:
                update_data["completed_at"] = datetime.now(timezone.utc)
            
            await db.smm_orders.update_one(
                {"id": order_id},
                {"$set": update_data}
            )
            
            order["status"] = new_status
            order["progress"] = progress
            
        except Exception as e:
            # Return cached status if API fails
            pass
    
    return {
        "success": True,
        "order": order
    }


def map_provider_status(provider_status: str) -> str:
    """Map SMMWiz status to our OrderStatus enum"""
    status_map = {
        "pending": OrderStatus.PENDING.value,
        "in progress": OrderStatus.PROCESSING.value,
        "processing": OrderStatus.PROCESSING.value,
        "completed": OrderStatus.COMPLETED.value,
        "partial": OrderStatus.PARTIAL.value,
        "failed": OrderStatus.FAILED.value,
        "canceled": OrderStatus.CANCELLED.value
    }
    return status_map.get(provider_status.lower(), OrderStatus.PROCESSING.value)


async def poll_order_status(order_id: str, provider_order_id: str):
    """Background task to poll order status from SMMWiz"""
    import asyncio
    
    max_polls = 10
    poll_count = 0
    
    while poll_count < max_polls:
        await asyncio.sleep(60)  # Wait 1 minute between polls
        
        try:
            order = await db.smm_orders.find_one({"id": order_id}, {"_id": 0})
            
            # Stop polling if order is completed
            if not order or order["status"] in [
                OrderStatus.COMPLETED.value,
                OrderStatus.FAILED.value,
                OrderStatus.CANCELLED.value
            ]:
                break
            
            # Poll SMMWiz
            status_response = await smmwiz_request(
                "status",
                params={"order": provider_order_id}
            )
            
            provider_status = status_response.get("status", "").lower()
            progress = int(status_response.get("charge", 0))
            new_status = map_provider_status(provider_status)
            
            update_data = {
                "status": new_status,
                "progress": progress,
                "updated_at": datetime.now(timezone.utc)
            }
            
            if new_status in [OrderStatus.COMPLETED.value, OrderStatus.FAILED.value]:
                update_data["completed_at"] = datetime.now(timezone.utc)
            
            await db.smm_orders.update_one(
                {"id": order_id},
                {"$set": update_data}
            )
            
            # Stop if completed
            if new_status in [OrderStatus.COMPLETED.value, OrderStatus.FAILED.value]:
                break
                
        except Exception as e:
            # Continue polling even if one request fails
            pass
        
        poll_count += 1


# ============================================
# ADMIN & STATS
# ============================================

@router.get("/admin/balance")
async def get_provider_balance(current_user = Depends(get_current_user)):
    """Get SMMWiz account balance (Admin only)"""
    # TODO: Add admin role check
    
    try:
        balance_response = await smmwiz_request("balance")
        return {
            "success": True,
            "balance": float(balance_response.get("balance", 0)),
            "currency": balance_response.get("currency", "USD")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch balance: {str(e)}")


@router.get("/stats")
async def get_smm_stats(current_user = Depends(get_current_user)):
    """Get user's SMM order statistics"""
    user_id = current_user["_id"]
    
    # Count orders by status
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "total_spent": {"$sum": "$total_cost"}
        }}
    ]
    
    stats_by_status = await db.smm_orders.aggregate(pipeline).to_list(None)
    
    # Total orders
    total_orders = await db.smm_orders.count_documents({"user_id": user_id})
    
    return {
        "success": True,
        "stats": {
            "total_orders": total_orders,
            "by_status": stats_by_status
        }
    }
