# 🔐 Outline VPN Integration - Complete Implementation Plan

## What is Outline VPN?

**Outline VPN** is an open-source VPN solution created by **Google's Jigsaw team**.
- **Free & Open Source**
- **Self-hosted** (you control the servers)
- **Built on Shadowsocks** (very secure and fast)
- **Management API** for automation
- **Multi-platform** (Windows, Mac, iOS, Android, Linux)

---

## 📋 Implementation Steps Overview

### Phase 1: Server Setup (30 mins)
1. Create VPS server (DigitalOcean/AWS)
2. Install Outline Manager
3. Deploy Outline Server

### Phase 2: Backend Integration (2-3 hours)
1. Connect to Outline Management API
2. Create user key management endpoints
3. Integrate with wallet for billing

### Phase 3: Frontend (2-3 hours)
1. VPN management page
2. Key generation UI
3. Usage tracking

---

## 🚀 Phase 1: Server Setup

### Option A: DigitalOcean (Recommended - Easiest)

**Cost:** ~$6-12/month per server

**Steps:**
1. Create DigitalOcean account: https://www.digitalocean.com
2. Create a Droplet:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($6/month for 1GB RAM - good for 10-20 users)
   - **Location:** Choose based on your target users (US, EU, Asia)
   - **Add Tag:** "outline-vpn"

3. Install Outline Server (SSH into your droplet):
```bash
# Run this single command
sudo bash -c "$(wget -qO- https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/server_manager/install_scripts/install_server.sh)"
```

4. **Copy the Management API URL** - You'll see output like:
```
{"apiUrl":"https://xxx.xxx.xxx.xxx:xxxxx/xxxxxxxxxxxxxx","certSha256":"xxxxx"}
```
**Save this entire JSON - you'll need it!**

### Option B: AWS EC2 (More Scalable)

**Cost:** ~$3.50-10/month

1. Launch EC2 instance (t3.micro or t3.small)
2. Security Group: Allow ports 443, 1024-65535 (UDP/TCP)
3. Follow same installation steps as DigitalOcean

---

## 🔧 Phase 2: Backend Integration

### Step 1: Install Outline SDK

```bash
cd /app/backend
pip install requests
```

### Step 2: Create VPN Router

**File:** `/app/backend/routers/vpn.py`

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
import requests
import os
from datetime import datetime, timezone
from routers.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)
router = APIRouter()

# Outline Management API Configuration
OUTLINE_API_URL = os.environ.get('OUTLINE_API_URL')  # From .env
OUTLINE_CERT_SHA256 = os.environ.get('OUTLINE_CERT_SHA256')  # From .env

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Pricing
VPN_MONTHLY_COST = 5.00  # $5/month for VPN access

class VPNKeyRequest(BaseModel):
    server_location: str = "default"

class VPNKey(BaseModel):
    id: str
    name: str
    access_url: str
    data_limit: Optional[int] = None
    created_at: str

class OutlineClient:
    def __init__(self, api_url: str):
        self.api_url = api_url.rstrip('/')
        self.session = requests.Session()
        # Disable SSL verification for self-signed certs
        self.session.verify = False
        
    def create_key(self, name: str) -> dict:
        """Create a new access key"""
        response = self.session.post(f"{self.api_url}/access-keys")
        if response.status_code == 201:
            key_data = response.json()
            # Set name for the key
            self.session.put(
                f"{self.api_url}/access-keys/{key_data['id']}/name",
                json={"name": name}
            )
            return key_data
        raise Exception(f"Failed to create key: {response.text}")
    
    def delete_key(self, key_id: str):
        """Delete an access key"""
        response = self.session.delete(f"{self.api_url}/access-keys/{key_id}")
        if response.status_code == 204:
            return True
        raise Exception(f"Failed to delete key: {response.text}")
    
    def get_keys(self) -> list:
        """Get all access keys"""
        response = self.session.get(f"{self.api_url}/access-keys")
        if response.status_code == 200:
            data = response.json()
            return data.get('accessKeys', [])
        raise Exception(f"Failed to get keys: {response.text}")
    
    def set_data_limit(self, key_id: str, limit_bytes: int):
        """Set data limit for a key (in bytes)"""
        response = self.session.put(
            f"{self.api_url}/access-keys/{key_id}/data-limit",
            json={"limit": {"bytes": limit_bytes}}
        )
        return response.status_code == 204

@router.post("/create-key")
async def create_vpn_key(request: VPNKeyRequest, current_user = Depends(get_current_user)):
    """
    Create a VPN access key for the user.
    Cost: $5/month
    """
    try:
        if not OUTLINE_API_URL:
            raise HTTPException(status_code=500, detail="VPN service not configured")
        
        # Check if user already has an active key
        existing_key = await db.vpn_keys.find_one({
            "user_id": current_user["_id"],
            "status": "active"
        })
        
        if existing_key:
            raise HTTPException(status_code=400, detail="You already have an active VPN key")
        
        # Check wallet balance
        wallet = await db.wallets.find_one({"user_id": current_user["_id"]})
        if not wallet or wallet["balance"] < VPN_MONTHLY_COST:
            raise HTTPException(
                status_code=402, 
                detail=f"Insufficient balance. VPN costs ${VPN_MONTHLY_COST}/month"
            )
        
        # Create Outline key
        outline = OutlineClient(OUTLINE_API_URL)
        key_name = f"{current_user['email']}-{current_user.get('client_id', 'user')}"
        key_data = outline.create_key(key_name)
        
        # Deduct monthly cost
        new_balance = wallet["balance"] - VPN_MONTHLY_COST
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
            "amount": VPN_MONTHLY_COST,
            "description": "VPN monthly subscription",
            "balance_after": new_balance,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(transaction)
        
        # Save VPN key to database
        vpn_key_doc = {
            "user_id": current_user["_id"],
            "outline_key_id": key_data["id"],
            "access_url": key_data["accessUrl"],
            "name": key_data.get("name", key_name),
            "status": "active",
            "server_location": request.server_location,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": None,  # Add expiry logic if needed
            "data_limit_bytes": None
        }
        
        await db.vpn_keys.insert_one(vpn_key_doc)
        
        logger.info(f"VPN key created for {current_user['_id']}")
        
        return {
            "success": True,
            "access_url": key_data["accessUrl"],
            "key_id": key_data["id"],
            "cost": VPN_MONTHLY_COST,
            "new_balance": new_balance,
            "message": "VPN key created successfully. Download Outline client and use this access key."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating VPN key: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create VPN key: {str(e)}")

@router.get("/my-keys")
async def get_my_vpn_keys(current_user = Depends(get_current_user)):
    """
    Get user's VPN keys
    """
    try:
        cursor = db.vpn_keys.find({"user_id": current_user["_id"]})
        keys = await cursor.to_list(length=100)
        
        result = []
        for key in keys:
            result.append({
                "id": key["outline_key_id"],
                "access_url": key["access_url"],
                "status": key["status"],
                "server_location": key.get("server_location", "default"),
                "created_at": key["created_at"]
            })
        
        return {"keys": result, "total": len(result)}
        
    except Exception as e:
        logger.error(f"Error fetching VPN keys: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch VPN keys")

@router.delete("/delete-key/{key_id}")
async def delete_vpn_key(key_id: str, current_user = Depends(get_current_user)):
    """
    Delete a VPN key
    """
    try:
        # Check if key belongs to user
        key = await db.vpn_keys.find_one({
            "outline_key_id": key_id,
            "user_id": current_user["_id"]
        })
        
        if not key:
            raise HTTPException(status_code=404, detail="VPN key not found")
        
        # Delete from Outline
        if OUTLINE_API_URL:
            outline = OutlineClient(OUTLINE_API_URL)
            outline.delete_key(key_id)
        
        # Update status in database
        await db.vpn_keys.update_one(
            {"outline_key_id": key_id},
            {"$set": {"status": "deleted"}}
        )
        
        logger.info(f"VPN key {key_id} deleted by {current_user['_id']}")
        
        return {"success": True, "message": "VPN key deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting VPN key: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete VPN key")

@router.get("/pricing")
async def get_vpn_pricing():
    """
    Get VPN pricing information
    """
    return {
        "monthly_cost": VPN_MONTHLY_COST,
        "currency": "USD",
        "features": [
            "Unlimited bandwidth",
            "Multiple device support",
            "24/7 access",
            "High-speed servers",
            "Secure encryption"
        ]
    }
```

### Step 3: Add Environment Variables

Add to `/app/backend/.env`:
```bash
# Outline VPN Configuration
OUTLINE_API_URL=https://xxx.xxx.xxx.xxx:xxxxx/xxxxxxxxxxxxxx
OUTLINE_CERT_SHA256=xxxxx
```

### Step 4: Register VPN Router

Add to `/app/backend/server.py`:
```python
# Include VPN router
from routers import vpn
app.include_router(vpn.router, prefix="/api/vpn", tags=["VPN"])
```

---

## 🎨 Phase 3: Frontend Integration

### Create VPN Page

**File:** `/app/frontend/src/pages/VPNPage.jsx`

**Features:**
- Display active VPN keys
- Create new key button
- QR code for easy mobile setup
- Copy access URL
- Delete key option
- Installation instructions

---

## 💰 Pricing & Business Model

**Recommended Pricing:**
- **$5/month** per user
- Unlimited bandwidth
- Multiple devices per key
- Cancel anytime

**Your Costs:**
- VPS: $6-12/month (supports 10-50 users)
- Profit margin: ~80%

---

## 📱 User Flow

1. User goes to VPN page
2. Clicks "Activate VPN" ($5/month)
3. System generates Outline access key
4. User downloads Outline Client app
5. User imports access key
6. User connects to VPN ✅

---

## 🔒 Security Features

- **Encryption:** AES-256
- **Protocol:** Shadowsocks (very secure, hard to block)
- **No logs:** Self-hosted means no third-party logs
- **Per-user keys:** Easy to manage and revoke

---

## 📊 Monitoring & Management

**Admin Features (Optional):**
- View all active keys
- Monitor bandwidth usage
- Add/remove servers
- Block abusive users

---

## 🌍 Multiple Server Locations (Future)

To offer multiple locations (US, EU, Asia):
1. Deploy Outline on servers in each region
2. Store multiple `OUTLINE_API_URL` configs
3. Let users choose location when activating

---

## 📦 Required Downloads for Users

**Outline Client Apps:**
- **Windows:** https://s3.amazonaws.com/outline-releases/client/windows/stable/Outline-Client.exe
- **Mac:** https://s3.amazonaws.com/outline-releases/client/macos/stable/Outline-Client.dmg
- **iOS:** App Store - "Outline VPN"
- **Android:** Play Store - "Outline VPN"
- **Linux:** https://s3.amazonaws.com/outline-releases/client/linux/stable/Outline-Client.AppImage

---

## 🧪 Testing Checklist

- [ ] Deploy Outline Server
- [ ] Test API connection
- [ ] Create test key via backend
- [ ] Import key in Outline Client
- [ ] Test VPN connection
- [ ] Test billing/wallet integration
- [ ] Test key deletion

---

## 🚨 Important Notes

1. **SSL Verification:** Outline uses self-signed certificates - disable SSL verification in API calls
2. **Ports:** Ensure ports 443 and 1024-65535 are open on your VPS
3. **Scalability:** One $12/month server can handle ~50 concurrent users
4. **Backup:** Keep your API URL safe - if lost, you'll need to redeploy

---

## 📈 Growth Strategy

**Month 1-3:** Start with 1 server (US location)
**Month 4-6:** Add EU server if demand grows
**Month 7+:** Add Asia server, implement auto-scaling

---

## 💡 Next Steps

1. **Set up DigitalOcean account** (if you don't have one)
2. **Deploy Outline Server** (30 mins)
3. **Share API URL with me** → I'll implement backend
4. **Test everything** → Deploy to production

---

## 🆘 Need Help?

- **Outline Docs:** https://getoutline.org/
- **GitHub:** https://github.com/Jigsaw-Code/outline-server
- **Community:** Reddit r/outlinevpn

---

Ready to start? Let me know when you have the Outline Server deployed and I'll implement the full integration! 🚀
