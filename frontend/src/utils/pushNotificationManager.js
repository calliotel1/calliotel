/**
 * Push Notification Manager
 * Handles browser push notification subscriptions
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

class PushNotificationManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.registration = null;
    this.subscription = null;
    this.vapidPublicKey = null;
  }

  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from server
      await this.fetchVapidPublicKey();
      
      // Check existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      console.log('✅ Push Notification Manager initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async fetchVapidPublicKey() {
    try {
      const response = await fetch(`${API}/push/vapid-public-key`);
      const data = await response.json();
      this.vapidPublicKey = data.public_key;
    } catch (error) {
      console.error('Failed to fetch VAPID public key:', error);
      throw error;
    }
  }

  /**
   * Request permission and subscribe to push notifications
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        return {
          success: false,
          message: 'Permission denied'
        };
      }

      // Subscribe to push notifications
      await this.subscribe();

      return {
        success: true,
        message: 'Subscribed to push notifications'
      };
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.vapidPublicKey) {
      throw new Error('VAPID public key not loaded');
    }

    try {
      // Convert VAPID key to Uint8Array
      const convertedKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      // Subscribe
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      console.log('✅ Subscribed to push notifications');
      return this.subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.subscription) {
      return;
    }

    try {
      // Unsubscribe from push manager
      await this.subscription.unsubscribe();

      // Notify server
      await this.sendUnsubscribeToServer(this.subscription);

      this.subscription = null;
      console.log('✅ Unsubscribed from push notifications');
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      throw error;
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed() {
    if (!this.registration) {
      await this.initialize();
    }

    this.subscription = await this.registration.pushManager.getSubscription();
    return this.subscription !== null;
  }

  /**
   * Get current permission state
   */
  getPermissionState() {
    if (!this.isSupported) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    const token = safeLocalStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: this.arrayBufferToBase64(subscription.getKey('auth'))
      }
    };

    const response = await fetch(`${API}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }

    return await response.json();
  }

  /**
   * Send unsubscribe to server
   */
  async sendUnsubscribeToServer(subscription) {
    const token = safeLocalStorage.getItem('token');
    if (!token) return;

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: this.arrayBufferToBase64(subscription.getKey('auth'))
      }
    };

    await fetch(`${API}/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscriptionData)
    });
  }

  /**
   * Test push notification
   */
  async sendTestNotification() {
    const token = safeLocalStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API}/push/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to send test notification');
    }

    return await response.json();
  }

  /**
   * Helper: Convert VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    // Remove PEM headers/footers if present
    base64String = base64String
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');

    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Helper: Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Create singleton instance
const pushNotificationManager = new PushNotificationManager();

export default pushNotificationManager;
