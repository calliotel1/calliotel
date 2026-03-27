# 🔔 Push Notifications - User Guide

## What are Push Notifications?
Push notifications are popup alerts that appear on your device (phone/computer) even when the Calliotel app is closed or your screen is locked. They work like notifications from other apps (WhatsApp, Facebook, etc.).

## ✨ Key Features

### What You'll Receive:
- 💬 **New Messages** - "John sent you a message"
- 👥 **Friend Requests** - "Sarah wants to be friends"
- ✅ **Friend Accepted** - "Mike accepted your request"
- ❤️ **Story Reactions** - "Emma reacted to your story"
- @ **Mentions** - "You were mentioned in a channel"

### Where It Works:
- ✅ Desktop (Chrome, Firefox, Edge, Safari)
- ✅ Mobile (Android Chrome, iOS Safari)
- ✅ Lock screen notifications
- ✅ App closed or minimized
- ✅ Different browser tabs

---

## 📱 How to Enable

### Step 1: Go to Settings
1. Open Calliotel app
2. Go to **Account** page
3. Click **"Notification Settings"**

### Step 2: Enable Push Notifications
1. You'll see "Push Notifications" section at the top
2. Click **"Enable Push Notifications"** button
3. Browser will ask: **"Allow notifications?"**
4. Click **"Allow"** ✅

### Step 3: Test It!
1. Click **"Send Test Notification"** button
2. You should see a popup: "Test Notification - Push notifications are working! 🎉"
3. If you see it → You're all set! ✅

---

## 🔕 How to Disable

### Option 1: In-App Toggle
1. Go to Notification Settings
2. Click **"Disable Push Notifications"**
3. Done!

### Option 2: Browser Settings
**Chrome/Edge:**
1. Click lock icon in address bar
2. Click "Site settings"
3. Set "Notifications" to "Block"

**Firefox:**
1. Click shield icon in address bar
2. Click "Site permissions"
3. Disable notifications

**Safari (macOS):**
1. Safari → Preferences → Websites
2. Click "Notifications"
3. Set Calliotel to "Deny"

---

## 🔍 How It Works Technically

### Architecture:
```
[Server Event] → [Backend] → [Web Push Service] → [Your Device]
                                    ↓
                         [Browser Service Worker]
                                    ↓
                          [Notification Popup]
```

### Components:
1. **Service Worker** - Runs in background, receives push events
2. **VAPID Keys** - Secure identification for push service
3. **Push Manager API** - Browser's notification system
4. **MongoDB** - Stores your push subscriptions

### What Happens:
1. You enable push notifications
2. Browser creates a unique subscription
3. Subscription sent to Calliotel server
4. When event happens (new message):
   - Server sends push to Web Push Service
   - Service delivers to your browser
   - Service Worker shows notification
   - You see popup on screen!

---

## 🛠️ Troubleshooting

### No Popup Appearing?

**Check 1: Permission Granted?**
- Go to Notification Settings
- Check "Permission" status
- Should say "✓ Granted"
- If "✗ Denied", re-enable in browser settings

**Check 2: Notifications Enabled in OS?**
- **Windows 10/11:** Settings → System → Notifications
- **macOS:** System Preferences → Notifications
- **Android:** Settings → Apps → Chrome → Notifications
- **iOS:** Settings → Safari → Advanced → Website Data

**Check 3: Browser Supports Push?**
- Chrome: ✅ Yes
- Firefox: ✅ Yes
- Edge: ✅ Yes
- Safari: ✅ Yes (macOS 16.1+, iOS 16.4+)
- Internet Explorer: ❌ No

**Check 4: Service Worker Active?**
- Open browser DevTools (F12)
- Go to "Application" tab
- Check "Service Workers"
- Should see `service-worker.js` active

### Test Notification Not Working?

1. Check internet connection
2. Try disabling and re-enabling
3. Clear browser cache
4. Re-register service worker:
   - DevTools → Application → Service Workers
   - Click "Unregister"
   - Refresh page
   - Re-enable push notifications

### Notifications Delayed?

- Normal! Can take 5-30 seconds
- Depends on:
  - Network speed
  - Device battery saver mode
  - Browser power management
  - Push service load

---

## 🔒 Privacy & Security

### What Data is Stored?
- Push subscription endpoint (unique per device)
- Encryption keys (p256dh, auth)
- User ID association
- Active/inactive status

### Is It Secure?
- ✅ End-to-end encrypted
- ✅ HTTPS required
- ✅ VAPID authentication
- ✅ No message content in subscription
- ✅ Follows Web Push standard

### Can Others See My Notifications?
- ❌ No! Notifications are device-specific
- ❌ Subscriptions are tied to your browser/device
- ✅ Only you see your notifications
- ✅ Unsubscribing removes all data

---

## 📊 API Endpoints (For Developers)

### Subscribe to Push
```bash
curl -X POST $API_URL/api/push/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://push.service.mozilla.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }'
```

### Unsubscribe
```bash
curl -X POST $API_URL/api/push/unsubscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "endpoint": "..." }'
```

### Get VAPID Public Key
```bash
curl -X GET $API_URL/api/push/vapid-public-key
```

### Send Test Notification
```bash
curl -X POST $API_URL/api/push/test \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💡 Best Practices

### Do:
✅ Enable for important alerts
✅ Test before relying on it
✅ Keep browser updated
✅ Allow permissions when prompted
✅ Check settings if issues occur

### Don't:
❌ Block and expect notifications
❌ Use in private/incognito mode (won't persist)
❌ Expect instant delivery (slight delays normal)
❌ Use on very old devices/browsers

---

## 🆚 Push vs Sound Notifications

| Feature | Push Notifications | Sound Notifications |
|---------|-------------------|---------------------|
| **Works when app closed** | ✅ Yes | ❌ No |
| **Lock screen alerts** | ✅ Yes | ❌ No |
| **Desktop popup** | ✅ Yes | ❌ No |
| **Sound only** | ❌ No | ✅ Yes |
| **Requires permission** | ✅ Yes | ❌ No |
| **Browser dependent** | ✅ Yes | ✅ Yes |

**Recommendation:** Enable BOTH for best experience!
- **Push** = Get notified anywhere
- **Sound** = Hear alerts when app is open

---

## 🔮 Coming Soon
- Custom notification sounds
- Do Not Disturb schedule
- Per-notification type control
- Rich notifications (buttons, images)
- Notification history
- Group notifications
- Reply directly from notification

---

## 📞 Support

**Not working?**
1. Check this guide's troubleshooting section
2. Try disabling and re-enabling
3. Test on different browser
4. Contact support with:
   - Browser & version
   - Device & OS
   - Error messages (if any)
   - Screenshot of settings page
