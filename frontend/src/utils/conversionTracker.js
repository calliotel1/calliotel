/**
 * Google Ads Conversion Tracking Utility
 * Tracks SMM purchases, voice number purchases, and wallet deposits
 * Automatically calculates ROAS with dynamic values
 */

class ConversionTracker {
  constructor() {
    this.conversionIds = {
      // Google Ads Conversion IDs - Updated with live account data
      SMM_PURCHASE: 'AW-824204080/1rRuCKvPhpAcELC2gYkD',           // Purchase conversion
      TELECOM_PURCHASE: 'AW-824204080/1rRuCKvPhpAcELC2gYkD',       // Purchase conversion (shared)
      WALLET_DEPOSIT: 'AW-824204080/04vYCLTPhpAcELC2gYkD',         // Subscribe conversion
      SIGNUP: 'AW-824204080/XSQ8CLHPhpAcELC2gYkD'                  // Sign-up conversion
    };
    
    this.isGtagLoaded = typeof window.gtag === 'function';
  }

  /**
   * Track SMM Marketplace Purchase
   * @param {Object} orderData - Order details
   * @param {number} orderData.amount - Total order amount
   * @param {string} orderData.orderId - Unique order ID
   * @param {string} orderData.serviceName - Service name
   */
  trackSMMPurchase(orderData) {
    if (!this.isGtagLoaded) {
      console.warn('⚠️ Google Ads gtag not loaded');
      return;
    }

    const { amount, orderId, serviceName } = orderData;

    // Track conversion
    window.gtag('event', 'conversion', {
      'send_to': this.conversionIds.SMM_PURCHASE,
      'value': amount,
      'currency': 'USD',
      'transaction_id': orderId
    });

    // Track as purchase event (for GA4 integration)
    window.gtag('event', 'purchase', {
      'transaction_id': orderId,
      'value': amount,
      'currency': 'USD',
      'items': [{
        'item_id': serviceName,
        'item_name': serviceName,
        'price': amount,
        'quantity': 1
      }]
    });

    console.log('✅ SMM Purchase tracked:', { orderId, amount });
  }

  /**
   * Track Voice Number Purchase
   * @param {Object} subscriptionData - Subscription details
   * @param {number} subscriptionData.monthlyPrice - Monthly cost
   * @param {string} subscriptionData.phoneNumber - Purchased number
   * @param {string} subscriptionData.subscriptionId - Subscription ID
   */
  trackTelecomPurchase(subscriptionData) {
    if (!this.isGtagLoaded) {
      console.warn('⚠️ Google Ads gtag not loaded');
      return;
    }

    const { monthlyPrice, phoneNumber, subscriptionId } = subscriptionData;

    // Track conversion (use annual value for better ROAS calculation)
    const annualValue = monthlyPrice * 12;

    window.gtag('event', 'conversion', {
      'send_to': this.conversionIds.TELECOM_PURCHASE,
      'value': annualValue,
      'currency': 'USD',
      'transaction_id': subscriptionId
    });

    // Track as lead event
    window.gtag('event', 'generate_lead', {
      'value': annualValue,
      'currency': 'USD'
    });

    console.log('✅ Telecom Purchase tracked:', { phoneNumber, monthlyPrice });
  }

  /**
   * Track Wallet Deposit
   * @param {Object} depositData - Deposit details
   * @param {number} depositData.amount - Deposit amount
   * @param {string} depositData.transactionId - Transaction ID
   * @param {string} depositData.method - Payment method (stripe, crypto, etc)
   */
  trackWalletDeposit(depositData) {
    if (!this.isGtagLoaded) {
      console.warn('⚠️ Google Ads gtag not loaded');
      return;
    }

    const { amount, transactionId, method } = depositData;

    window.gtag('event', 'conversion', {
      'send_to': this.conversionIds.WALLET_DEPOSIT,
      'value': amount,
      'currency': 'USD',
      'transaction_id': transactionId
    });

    // Track as add_payment_info
    window.gtag('event', 'add_payment_info', {
      'value': amount,
      'currency': 'USD',
      'payment_type': method
    });

    console.log('✅ Wallet Deposit tracked:', { amount, method });
  }

  /**
   * Track User Signup
   * @param {Object} userData - User details
   * @param {string} userData.email - User email
   * @param {string} userData.userId - User ID
   */
  trackSignup(userData) {
    if (!this.isGtagLoaded) {
      console.warn('⚠️ Google Ads gtag not loaded');
      return;
    }

    const { email, userId } = userData;

    window.gtag('event', 'conversion', {
      'send_to': this.conversionIds.SIGNUP
    });

    // Track as sign_up event
    window.gtag('event', 'sign_up', {
      'method': 'email'
    });

    console.log('✅ Signup tracked:', { userId });
  }

  /**
   * Track page view with enhanced data
   * @param {string} pagePath - Page path
   * @param {string} pageTitle - Page title
   */
  trackPageView(pagePath, pageTitle) {
    if (!this.isGtagLoaded) return;

    window.gtag('config', 'G-XXXXXXXXXX', {
      'page_path': pagePath,
      'page_title': pageTitle
    });
  }

  /**
   * Track custom event
   * @param {string} eventName - Event name
   * @param {Object} eventParams - Event parameters
   */
  trackCustomEvent(eventName, eventParams = {}) {
    if (!this.isGtagLoaded) return;

    window.gtag('event', eventName, eventParams);
    console.log(`✅ Custom event tracked: ${eventName}`, eventParams);
  }
}

// Export singleton instance
const conversionTracker = new ConversionTracker();
export default conversionTracker;
