# 📱 SMS Setup Guide for Calliotel

## Current Status
- ✅ SMS sending code is implemented
- ✅ SMS inbox/history is implemented  
- ✅ Webhook receiver for incoming SMS is ready
- ⚠️ **Requires Telnyx Messaging Profile setup** (see below)

---

## 🔧 Required Setup in Telnyx Dashboard

### Step 1: Create a Messaging Profile

1. **Login to Telnyx Portal**: https://portal.telnyx.com
2. **Navigate to Messaging** → **Messaging Profiles**
3. **Click "Create Messaging Profile"**
4. **Fill in details:**
   - Name: `Calliotel SMS`
   - Enable SMS: ✅
   - Enable MMS: ✅ (optional)

### Step 2: Configure Webhook URL

In your Messaging Profile settings:

1. **Webhook URL**: Enter your deployed URL + `/api/sms/webhook`
   ```
   https://calliotel.com/api/sms/webhook
   ```
   OR (if using preview URL):
   ```
   https://call-management-3.preview.emergentagent.com/api/sms/webhook
   ```

2. **HTTP Method**: POST
3. **Failover URL**: (optional)
4. **Select Events to Receive:**
   - ✅ `message.received` (incoming SMS)
   - ✅ `message.sent` (delivery confirmation)
   - ✅ `message.finalized` (final delivery status)

### Step 3: Associate Your Numbers

1. Go to **Phone Numbers** → **My Numbers**
2. Find your purchased number(s) - e.g., `+15854979603`
3. Click on the number
4. Under **"Messaging Profile"**, select `Calliotel SMS`
5. **Save changes**

### Step 4: Get Messaging Profile ID (Optional but Recommended)

1. In your Messaging Profile, copy the **Profile ID**
2. Add it to `/app/backend/.env`:
   ```bash
   TELNYX_MESSAGING_PROFILE_ID=your-profile-id-here
   ```
3. Restart backend: `sudo supervisorctl restart backend`

---

## 🧪 Testing SMS Functionality

### Test Sending SMS

Once setup is complete:

1. **Login to Calliotel**: https://calliotel.com
2. **Go to SMS Messaging** page
3. **Select "Send SMS" tab**
4. **Fill the form:**
   - From: Select your purchased number
   - To: Enter your personal phone number (with country code, e.g., +1234567890)
   - Message: "Testing Calliotel SMS!"
5. **Click "Send SMS"**
6. ✅ You should receive the SMS on your phone

### Test Receiving SMS

1. **Reply to the SMS** you received (or send a new SMS to your Calliotel number)
2. **Go to "Inbox" tab** in the SMS page
3. ✅ You should see your incoming message

---

## 🔍 Troubleshooting

### Error: "Invalid 'from' address"
**Cause**: Number not associated with a Messaging Profile
**Fix**: Complete Step 3 above (Associate Your Numbers)

### Not Receiving Incoming SMS
**Causes**:
1. Webhook URL not configured
2. Webhook URL is incorrect
3. Number not associated with profile

**Fix**:
1. Verify webhook URL is exactly: `https://calliotel.com/api/sms/webhook`
2. Check Telnyx webhook logs in portal for errors
3. Verify number is assigned to your messaging profile

### Check Backend Logs
```bash
tail -f /var/log/supervisor/backend.err.log | grep -i sms
```

---

## 📊 Current Implementation

### Backend Endpoints
- ✅ `POST /api/sms/send` - Send SMS
- ✅ `GET /api/sms/inbox` - Get all messages
- ✅ `GET /api/sms/number/{phone_number}` - Get messages for specific number
- ✅ `POST /api/sms/webhook` - Receive incoming SMS from Telnyx

### Frontend Features
- ✅ Send SMS interface with character counter
- ✅ Inbox with sent/received message history
- ✅ Message direction indicators (sent/received badges)
- ✅ Auto-refresh capability

### Database Schema
```javascript
sms_messages: {
  _id: "telnyx_message_id",
  user_id: "user_email",
  from_number: "+1234567890",
  to_number: "+1987654321",
  text: "Message content",
  direction: "inbound" | "outbound",
  status: "sent" | "received" | "delivered" | "failed",
  created_at: "ISO timestamp",
  telnyx_id: "telnyx_message_id"
}
```

---

## 🚀 Next Steps After Setup

1. ✅ Complete Telnyx Messaging Profile setup
2. ✅ Test sending and receiving SMS
3. 📞 Implement voice calling features
4. 💳 Add wallet/credits system
5. 💰 Integrate payment gateways

---

## 📞 Need Help?

- **Telnyx Support**: https://support.telnyx.com
- **Telnyx SMS Docs**: https://developers.telnyx.com/docs/messaging/messages/send-message
- **Webhook Setup**: https://developers.telnyx.com/docs/messaging/webhooks
