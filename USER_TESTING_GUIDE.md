# 🧪 USER TESTING GUIDE - OAuth, Telegram & Email Verification

## Overview
Several features have been implemented but need real-world testing by you (the user) to confirm they work end-to-end. This guide provides step-by-step instructions.

---

## ✅ 1. GOOGLE OAUTH LOGIN

**What to Test:** Users can sign up/login using their Google account.

**Steps:**
1. Open Calliotel in incognito/private browsing mode (to test fresh signup)
2. Navigate to the **Login** page
3. Click the **"Continue with Google"** button
4. You'll be redirected to Google's authentication page
5. Select your Google account and grant permissions
6. You should be redirected back to Calliotel dashboard

**Expected Result:**
- ✅ New user account created with your Google email
- ✅ Logged into dashboard automatically
- ✅ Account balance: $0 (no welcome bonus)
- ✅ Client ID generated (e.g., CL12345678)

**If It Fails:**
- Check browser console for errors (F12 → Console tab)
- Take a screenshot and share with the agent
- Note any error messages displayed

---

## ✅ 2. MICROSOFT/OUTLOOK OAUTH LOGIN

**What to Test:** Users can sign up/login using Microsoft/Outlook account.

**Steps:**
1. Open Calliotel in incognito/private browsing mode
2. Navigate to the **Login** page
3. Click the **"Continue with Microsoft"** button
4. You'll be redirected to Microsoft's authentication page
5. Sign in with your Microsoft/Outlook account
6. Grant permissions when prompted
7. You should be redirected back to Calliotel dashboard

**Expected Result:**
- ✅ New user account created with your Microsoft email
- ✅ Logged into dashboard automatically
- ✅ Account balance: $0 (no welcome bonus)
- ✅ Client ID generated

**If It Fails:**
- Check browser console for errors
- Screenshot any error messages
- Share details with the agent

---

## ✅ 3. EMAIL VERIFICATION FLOW

**What to Test:** New users receive verification emails and can verify their accounts.

**Steps:**
1. Navigate to **Sign Up** page
2. Enter a NEW email address you have access to
3. Create a password and submit
4. Check your email inbox (and spam folder!)
5. Click the verification link in the email
6. You should be redirected to a success page

**Expected Result:**
- ✅ Email received within 1-2 minutes
- ✅ Email contains: Welcome message + verification link
- ✅ Clicking link marks account as `email_verified: true`
- ✅ Success page shows "Email Verified!" message
- ✅ You can now log in normally

**If It Fails:**
- Check if email was sent (check spam/junk folder)
- Try with a different email provider (Gmail, Outlook, etc.)
- Check backend logs: `tail -100 /var/log/supervisor/backend.err.log`

---

## ✅ 4. TELEGRAM BOT COMMANDS

**What to Test:** Telegram bot responds to commands and provides account info.

**Background:** Your account is already linked to the Telegram bot.
- Your Email: alinmy77@gmail.com
- Client ID: CL22231916

**Steps:**
1. Open Telegram and search for your bot: `@your_bot_name_bot`
2. Test each command below:

### Command 1: `/balance`
**Expected:**
```
💰 Account Balance
──────────────
Current Balance: $10.00

Last Updated: [timestamp]
```

### Command 2: `/numbers`
**Expected:**
```
📱 Your Numbers
──────────────
You have 0 numbers.

Get a number at: [your-app-url]/browse-numbers
```

### Command 3: `/inbox`
**Expected:**
```
📬 Recent Messages
──────────────
You have 0 messages.

Check your inbox at: [your-app-url]/sms
```

### Command 4: `/help`
**Expected:**
```
📖 Bot Commands
──────────────
/balance - Check your balance
/numbers - View your numbers
/inbox - Check recent messages
/help - Show this help message
```

**If Commands Fail:**
- Check backend Telegram bot logs: `tail -50 /app/backend/telegram_bot.log`
- Verify bot is running: `ps aux | grep telegram_bot`
- Share the exact error or response you received

---

## ✅ 5. PWA "ADD TO HOME SCREEN" (NEW!)

**What to Test:** PWA install prompt appears on mobile devices.

### On Android (Chrome/Edge)
**Steps:**
1. Open https://your-calliotel-url.com on your Android phone
2. Wait 3 seconds
3. A purple/orange banner should appear at the bottom
4. Click **"Add to Home Screen"** button
5. Confirm the installation
6. Check your home screen for the Calliotel app icon

**Expected Result:**
- ✅ Banner appears after 3 seconds
- ✅ App installs to home screen
- ✅ Opening from home screen shows full-screen app (no browser UI)
- ✅ App works offline (basic pages cached)

### On iOS (Safari)
**Steps:**
1. Open https://your-calliotel-url.com in Safari
2. Wait 3 seconds
3. A banner with iOS instructions should appear
4. Follow the instructions:
   - Tap the **Share** button (square with arrow)
   - Scroll down and tap **"Add to Home Screen"**
   - Tap **"Add"**
5. Check your home screen for the Calliotel icon

**Expected Result:**
- ✅ Banner shows iOS-specific instructions
- ✅ App appears on home screen
- ✅ Opens in standalone mode

**Dismissing the Prompt:**
- Click "Maybe Later" to dismiss
- Prompt won't show again for 7 days
- Clear browser storage to reset: `localStorage.clear()`

---

## 🐛 REPORTING ISSUES

When something doesn't work, please provide:
1. **What you were testing** (e.g., "Google OAuth Login")
2. **Steps you took** (e.g., "Clicked 'Continue with Google', selected account...")
3. **What happened** (e.g., "Got error: 'OAuth callback failed'")
4. **Screenshots** (if applicable)
5. **Browser console errors** (Press F12 → Console tab → screenshot any red errors)

Share all this info with the agent, and they'll fix it immediately!

---

## ✅ TESTING CHECKLIST

Use this to track your progress:

- [ ] Google OAuth Login - Fresh signup
- [ ] Google OAuth Login - Existing user login
- [ ] Microsoft OAuth Login - Fresh signup
- [ ] Microsoft OAuth Login - Existing user login
- [ ] Email Verification - Receive email
- [ ] Email Verification - Click link works
- [ ] Telegram Bot - `/balance` command
- [ ] Telegram Bot - `/numbers` command
- [ ] Telegram Bot - `/inbox` command
- [ ] Telegram Bot - `/help` command
- [ ] PWA Install - Android (if available)
- [ ] PWA Install - iOS (if available)
- [ ] PWA Install - Dismiss and re-show after 7 days

---

## 🎯 NEXT STEPS AFTER TESTING

Once you've tested these features and confirmed they work (or reported issues), we can:
1. Move forward with **Phase 2 Social Features** (Chat Recap, Channels)
2. Start **Code Refactoring** to improve maintainability
3. Build **Phase 3 Features** (Stories, Advanced Voice Notes, AI)

Thank you for testing! Your feedback makes Calliotel better! 🚀
