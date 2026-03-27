# Google Ads Conversion Tracking - Integration Guide

## 🎯 Setup Instructions

### Step 1: Get Your Conversion IDs from Google Ads

1. Go to **Google Ads** → **Tools & Settings** → **Conversions**
2. Create 4 conversion actions:
   - **SMM Purchase** (Purchase/Sale)
   - **Voice Number Purchase** (Purchase/Sale)  
   - **Wallet Deposit** (Lead/Sign-up)
   - **Account Signup** (Lead/Sign-up)

3. For each conversion, you'll get a Conversion ID like: `AW-123456789/AbC-D_efG-h12_34`

4. Update `/app/frontend/src/utils/conversionTracker.js`:
   ```javascript
   this.conversionIds = {
     SMM_PURCHASE: 'AW-123456789/YOUR_SMM_LABEL',
     TELECOM_PURCHASE: 'AW-123456789/YOUR_TELECOM_LABEL', 
     WALLET_DEPOSIT: 'AW-123456789/YOUR_WALLET_LABEL',
     SIGNUP: 'AW-123456789/YOUR_SIGNUP_LABEL'
   };
   ```

5. Update `/app/frontend/public/index.html`:
   - Replace `AW-CONVERSION_ID` with your main account ID (e.g., `AW-123456789`)

---

## 🔥 Integration Examples

### 1. Track SMM Marketplace Purchase

**File:** `/app/frontend/src/pages/SMMMarketplacePage.jsx` (or wherever SMM orders are placed)

```javascript
import conversionTracker from '../utils/conversionTracker';

// After successful SMM order API response
const handleSMMOrderSuccess = (orderData) => {
  // Track conversion
  conversionTracker.trackSMMPurchase({
    amount: orderData.amount,
    orderId: orderData.order_id,
    serviceName: orderData.service_name
  });
  
  // Show success message
  toast.success('Order placed successfully!');
};
```

---

### 2. Track Voice Number Purchase

**File:** `/app/frontend/src/pages/BrowseNumbersPage.jsx` (or purchase flow)

```javascript
import conversionTracker from '../utils/conversionTracker';

// After successful voice number purchase
const handleVoiceNumberPurchase = (subscriptionData) => {
  // Track conversion
  conversionTracker.trackTelecomPurchase({
    monthlyPrice: subscriptionData.monthly_cost,
    phoneNumber: subscriptionData.phone_number,
    subscriptionId: subscriptionData.subscription_id
  });
  
  // Navigate to success page
  navigate('/my-numbers');
};
```

---

### 3. Track Wallet Deposit

**File:** `/app/frontend/src/pages/PaymentPage.jsx` or `/app/frontend/src/pages/PaymentSuccessPage.jsx`

```javascript
import conversionTracker from '../utils/conversionTracker';

// After successful payment
const handlePaymentSuccess = (paymentData) => {
  // Track conversion
  conversionTracker.trackWalletDeposit({
    amount: paymentData.amount,
    transactionId: paymentData.transaction_id,
    method: 'stripe' // or 'crypto', 'paypal'
  });
  
  // Update wallet balance
  fetchWalletBalance();
};
```

---

### 4. Track Signup

**File:** `/app/frontend/src/pages/SignupPage.jsx`

```javascript
import conversionTracker from '../utils/conversionTracker';

// After successful signup
const handleSignupSuccess = (userData) => {
  // Track conversion
  conversionTracker.trackSignup({
    email: userData.email,
    userId: userData.id
  });
  
  // Navigate to dashboard
  navigate('/dashboard');
};
```

---

## 📊 Testing Your Setup

### Test in Browser Console

```javascript
// Open browser console (F12) and test manually
window.gtag('event', 'conversion', {
  'send_to': 'AW-123456789/YOUR_LABEL',
  'value': 10.00,
  'currency': 'USD',
  'transaction_id': 'TEST_' + Date.now()
});
```

### Verify in Google Ads

1. Go to **Google Ads** → **Tools & Settings** → **Conversions**
2. Click on your conversion action
3. Check **"Recent conversions"** tab
4. You should see test conversions appear within 3 hours

---

## 🚀 Advanced: Enhanced Conversions

For better tracking accuracy, enable **Enhanced Conversions**:

```javascript
// In conversionTracker.js, add to trackSMMPurchase():
window.gtag('set', 'user_data', {
  'email': userEmail,  // Hashed automatically by gtag
  'phone_number': userPhone,
  'address': {
    'first_name': firstName,
    'last_name': lastName,
    'country': 'US'
  }
});
```

---

## 🎯 ROAS Calculation

Google Ads automatically calculates **Return on Ad Spend (ROAS)** using:
- **Conversion Value** (the `value` we pass)
- **Ad Spend** (what you paid for the click)

**Example:**
- You spend $5 on a click
- User buys SMM service for $50 (with 100% markup = $25 profit)
- ROAS = $50 / $5 = **10x return**

Google will optimize your campaigns toward high-ROAS conversions! 💰

---

## 🛡️ Notes

1. **Do NOT track conversions twice** - only fire once per purchase
2. **Use unique transaction IDs** - prevents duplicate tracking
3. **Test in Incognito mode** - avoid cookie conflicts
4. **Wait 3 hours** - conversions take time to show in Google Ads dashboard

---

## 🔥 Commander's Checklist

- [ ] Replace placeholder Conversion IDs in `conversionTracker.js`
- [ ] Replace `AW-CONVERSION_ID` in `index.html`
- [ ] Add `trackSMMPurchase()` to SMM order success handler
- [ ] Add `trackTelecomPurchase()` to voice number purchase
- [ ] Add `trackWalletDeposit()` to payment success
- [ ] Add `trackSignup()` to signup success
- [ ] Test with browser console
- [ ] Verify in Google Ads dashboard (wait 3 hours)

**The Marketing Tripwires are armed and ready! 🎯💰**
