# 📞 Voice Calling & 💰 Wallet System - Complete Guide

## ✅ What's Been Implemented

### 💰 Wallet/Credits System
**Backend (`/app/backend/routers/wallet.py`):**
- ✅ `GET /api/wallet/balance` - Get user's current balance
- ✅ `POST /api/wallet/add-credits` - Add credits to wallet
- ✅ `GET /api/wallet/transactions` - View transaction history
- ✅ `GET /api/wallet/pricing` - Get current pricing info
- ✅ Automatic welcome bonus ($10) for new users
- ✅ Transaction logging for all credits/debits
- ✅ Integrated with SMS sending (auto-deducts $0.01 per SMS)

**Frontend (`/app/frontend/src/pages/WalletPage.jsx`):**
- ✅ Beautiful wallet dashboard
- ✅ Large balance display
- ✅ Transaction history with credit/debit indicators
- ✅ Quick amount buttons ($5, $10, $25, $50)
- ✅ Pricing information sidebar
- ✅ Dashboard integration (balance shown on main page)

**Pricing:**
- SMS: $0.01 per message
- Calls: $0.02 per minute
- Number Monthly Fee: $1.49

### 📞 Voice Calling System
**Backend (`/app/backend/routers/calls.py`):**
- ✅ `POST /api/calls/make-call` - Initiate outbound calls
- ✅ `POST /api/calls/webhook` - Receive call events from Telnyx
- ✅ `GET /api/calls/history` - Get call history from database
- ✅ Balance checking before calls
- ✅ Auto-deduction of call costs based on duration
- ✅ Transaction logging for calls
- ✅ Call status tracking (initiated, answered, completed)

**Frontend (`/app/frontend/src/pages/CallHistoryPage.jsx`):**
- ✅ Clean call history table
- ✅ Shows direction (incoming/outgoing)
- ✅ Duration display
- ✅ Cost per call
- ✅ Status badges

---

## 🔧 Required Setup for Voice Calling

### Step 1: Create a Telnyx Voice Application

1. **Login to Telnyx Portal**: https://portal.telnyx.com
2. **Navigate to**: Voice → Applications → Call Control
3. **Click "Create Call Control Application"**
4. **Fill in details:**
   - Name: `Calliotel Voice`
   - Webhook URL: `https://calliotel.com/api/calls/webhook`
   - Webhook API Version: `2`
   - Failover URL: (optional)
5. **Save and copy the Application ID (Connection ID)**

### Step 2: Configure Voice Application Settings

In your Voice Application settings:

1. **Webhook Events to Enable:**
   - ✅ `call.initiated`
   - ✅ `call.answered`
   - ✅ `call.hangup`

2. **Webhook Configuration:**
   - URL: `https://calliotel.com/api/calls/webhook`
   - Method: POST
   - Timeout: 10 seconds

### Step 3: Associate Numbers with Voice Application

1. Go to **Phone Numbers** → **My Numbers**
2. Click on your purchased number
3. Under **"Voice Settings"** or **"Call Control Application"**
4. Select `Calliotel Voice` (the application you created)
5. **Save changes**

### Step 4: Store Connection ID (Optional but Recommended)

Add to `/app/backend/.env`:
```bash
TELNYX_CONNECTION_ID=your-application-id-here
```

This allows you to make calls without requiring users to provide connection_id.

---

## 🧪 Testing

### Test Wallet System

1. **Login to Calliotel**
2. **Go to Dashboard** - verify balance shows ($10 welcome bonus)
3. **Click "+ Add"** or navigate to `/wallet`
4. **Add test credits** (e.g., $20)
5. ✅ Balance should update to $30
6. ✅ Transaction history shows the addition

### Test SMS with Wallet

1. **Go to SMS Messaging**
2. **Send an SMS**
3. ✅ SMS should send successfully
4. ✅ Balance should decrease by $0.01
5. ✅ Transaction shows "SMS to +1..."

### Test Voice Calls (After Setup)

**Via API (for testing):**
```bash
curl -X POST https://calliotel.com/api/calls/make-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "from_number": "+15854979603",
    "to_number": "+1234567890",
    "connection_id": "your-connection-id"
  }'
```

**What Should Happen:**
1. ✅ Call initiates via Telnyx
2. ✅ Call record created in database (status: "initiated")
3. ✅ When answered, status updates to "answered"
4. ✅ When hangup, duration & cost calculated
5. ✅ Balance deducted automatically
6. ✅ Transaction logged
7. ✅ Call appears in Call History page

---

## 📊 Database Schema

### `wallets` Collection
```javascript
{
  user_id: "user@email.com",
  balance: 30.00,
  created_at: "ISO timestamp",
  updated_at: "ISO timestamp"
}
```

### `transactions` Collection
```javascript
{
  user_id: "user@email.com",
  type: "credit" | "debit",
  amount: 0.01,
  description: "SMS to +1234567890",
  balance_after: 29.99,
  created_at: "ISO timestamp"
}
```

### `calls` Collection
```javascript
{
  _id: "call-control-id",
  user_id: "user@email.com",
  call_control_id: "v3:abc123...",
  from_number: "+15854979603",
  to_number: "+1234567890",
  direction: "outbound" | "inbound",
  status: "initiated" | "answered" | "completed",
  duration: 120,  // seconds
  cost: 0.04,     // $0.02/min * 2 min
  created_at: "ISO timestamp",
  answered_at: "ISO timestamp",
  ended_at: "ISO timestamp"
}
```

---

## 🚨 Important Notes

### Voice Calling Limitations

1. **Requires Telnyx Voice Application**: Users MUST create a Voice Application and provide the connection_id
2. **Webhook Setup**: Webhook URL must be publicly accessible (works after deployment)
3. **Number Assignment**: Each number must be associated with the Voice Application in Telnyx Portal

### Current Implementation Status

**✅ Fully Working:**
- Wallet balance tracking
- Credit additions
- Transaction history
- SMS cost deduction
- Dashboard balance display

**⚠️ Requires Telnyx Setup:**
- Outbound calling (needs Voice Application)
- Call cost deduction (works via webhook)
- Call history (will populate after calls are made)

**🔮 Coming Soon:**
- Payment gateway integration (Stripe, crypto)
- Inbound call handling
- Call recording
- Call forwarding

---

## 🔍 Troubleshooting

### Balance Not Updating
**Check:**
1. Browser console for errors
2. Backend logs: `tail -f /var/log/supervisor/backend.err.log`
3. Verify wallet record exists in MongoDB

### SMS Not Deducting Credits
**Check:**
1. SMS sent successfully?
2. Backend logs for wallet update errors
3. Verify sufficient balance before sending

### Calls Not Working
**Causes:**
1. No Voice Application created in Telnyx
2. Number not associated with Voice Application
3. Invalid connection_id
4. Insufficient balance

**Fix:**
1. Complete "Required Setup for Voice Calling" above
2. Verify webhook URL is correct
3. Check backend logs for errors

---

## 💳 Future Payment Gateway Integration

The wallet system is ready for payment gateway integration:

**Stripe Integration Points:**
- `/api/wallet/add-credits` endpoint
- Frontend: `WalletPage.jsx` "Add Credits" button
- Will require Stripe API keys and Stripe Elements

**Crypto Integration Points:**
- Similar to Stripe
- Can support multiple cryptocurrencies
- Payment confirmation webhooks

---

## 📝 Summary

### Completed Features
✅ Complete wallet/credits system with transaction tracking
✅ SMS billing integration  
✅ Call initiation endpoint
✅ Call webhook receiver for events
✅ Call cost calculation and billing
✅ Beautiful frontend UI for wallet and transactions
✅ Dashboard integration showing real-time balance

### Next Steps
1. ✅ **Your Action**: Create Telnyx Voice Application
2. ✅ **Your Action**: Configure webhook URL
3. ✅ **Your Action**: Associate numbers with Voice Application
4. 🔄 **Future**: Integrate payment gateways (Stripe, crypto)
5. 🔄 **Future**: Add inbound call handling
