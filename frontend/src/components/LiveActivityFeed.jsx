import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * 🏛️ LIVE ACTIVITY FEED - Empire Social Proof Engine
 * 
 * Shows REAL-TIME purchase notifications to create urgency and trust.
 * Connected to /api/telecom/recent-purchases for sovereign reality.
 */

// Country flag mapping
const countryFlags = {
  'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪', 
  'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'SE': '🇸🇪',
  'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'CH': '🇨🇭', 'AT': '🇦🇹',
  'BE': '🇧🇪', 'PL': '🇵🇱', 'IE': '🇮🇪', 'PT': '🇵🇹', 'CZ': '🇨🇿',
  'IN': '🇮🇳', 'SG': '🇸🇬', 'HK': '🇭🇰', 'JP': '🇯🇵', 'KR': '🇰🇷',
  'BR': '🇧🇷', 'MX': '🇲🇽', 'AR': '🇦🇷', 'CL': '🇨🇱', 'ZA': '🇿🇦'
};

const LiveActivityFeed = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [purchasePool, setPurchasePool] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch real purchase data from API
  const fetchRecentPurchases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/telecom/recent-purchases?limit=20&min_quantity=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.purchases.length > 0) {
          setPurchasePool(data.purchases);
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent purchases:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchRecentPurchases();
    
    // Refresh purchase data every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchRecentPurchases();
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (purchasePool.length === 0) return;

    // Show a new notification every 8-12 seconds
    const showInterval = setInterval(() => {
      const purchase = purchasePool[currentIndex % purchasePool.length];
      setNotifications([purchase]);
      setShowNotification(true);
      setCurrentIndex(prev => prev + 1);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }, 10000);

    // Show first notification after 3 seconds
    setTimeout(() => {
      if (purchasePool.length > 0) {
        const firstPurchase = purchasePool[0];
        setNotifications([firstPurchase]);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    }, 3000);

    return () => clearInterval(showInterval);
  }, [purchasePool, currentIndex]);

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification || notifications.length === 0) return null;

  const purchase = notifications[0];
  const flag = countryFlags[purchase.country_code] || '🌍';
  
  // Format action text based on purchase type
  let actionText = '';
  if (purchase.type === 'bulk') {
    if (purchase.quantity >= 50) {
      actionText = `${purchase.user_display} acquired ${purchase.quantity}x numbers`;
    } else {
      actionText = `Bulk purchase: ${purchase.quantity} numbers`;
    }
  } else {
    actionText = `${purchase.country_name} number added`;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
      {/* Notification Card */}
      <div className="bg-olive border-2 border-ember/30 rounded-lg shadow-2xl overflow-hidden w-80 animate-pulse-glow">
        {/* Header with close button */}
        <div className="bg-ember/10 px-4 py-2 flex items-center justify-between border-b border-ember/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-ember rounded-full animate-pulse"></div>
            <span className="text-ember font-bold text-xs uppercase tracking-wide">
              🔥 Live Activity
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Icon */}
          <div className="w-10 h-10 bg-ember/20 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-ember" />
          </div>

          {/* Text */}
          <div className="flex-1">
            <div className="text-white font-semibold text-sm">
              {flag} {actionText}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">
              {purchase.time_ago}
            </div>
          </div>
        </div>

        {/* Subtle bottom glow */}
        <div className="h-1 bg-gradient-to-r from-transparent via-ember to-transparent"></div>
      </div>
    </div>
  );
};

export default LiveActivityFeed;
