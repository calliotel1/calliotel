import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaSpinner, FaExclamationTriangle, FaFire } from 'react-icons/fa';

const SMMOrderToast = ({ order, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          icon: <FaCheckCircle className="text-2xl" />,
          title: '✅ Mission Complete!',
          bgColor: 'from-green-900/90 to-green-800/90',
          borderColor: 'border-green-500',
          textColor: 'text-green-400'
        };
      case 'processing':
        return {
          icon: <FaSpinner className="text-2xl animate-spin" />,
          title: '⚡ Deployment In Progress',
          bgColor: 'from-blue-900/90 to-blue-800/90',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-400'
        };
      case 'failed':
        return {
          icon: <FaExclamationTriangle className="text-2xl" />,
          title: '❌ Mission Failed',
          bgColor: 'from-red-900/90 to-red-800/90',
          borderColor: 'border-red-500',
          textColor: 'text-red-400'
        };
      default:
        return {
          icon: <FaFire className="text-2xl" />,
          title: '🔥 Order Update',
          bgColor: 'from-[#2a2a1f]/90 to-black/90',
          borderColor: 'border-[#C74E1E]',
          textColor: 'text-[#C74E1E]'
        };
    }
  };

  const config = getStatusConfig(order.status);

  return (
    <div
      className={`fixed bottom-20 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`bg-gradient-to-br ${config.bgColor} border-2 ${config.borderColor} rounded-lg p-4 shadow-2xl backdrop-blur-sm max-w-sm`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={config.textColor}>
              {config.icon}
            </div>
            <h3 className="text-white font-bold">{config.title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Order Info */}
        <div className="bg-black/50 rounded-lg p-3 mb-2">
          <p className="text-white font-semibold text-sm mb-1">{order.service_name}</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Quantity:</span>
            <span className="text-white font-bold">{order.quantity.toLocaleString()}</span>
          </div>
          {order.status === 'processing' && (
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-[#C74E1E] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${order.progress || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center mt-1">{order.progress || 0}% Complete</p>
            </div>
          )}
        </div>

        {/* Empire Stamp */}
        <div className="text-center">
          <p className="text-[#C74E1E] text-xs font-semibold">
            🏛️ CALLIOTEL EMPIRE
          </p>
        </div>
      </div>
    </div>
  );
};

// Toast Manager Component
const SMMToastManager = () => {
  const [toasts, setToasts] = useState([]);
  const [lastCheckedOrders, setLastCheckedOrders] = useState([]);

  useEffect(() => {
    // Poll for order updates every 30 seconds
    const checkOrderUpdates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${API_URL}/api/smm/orders/my?limit=10`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success && data.orders) {
          const currentOrders = data.orders;

          // Check for status changes
          currentOrders.forEach(order => {
            const prevOrder = lastCheckedOrders.find(o => o.id === order.id);
            
            // Show toast if status changed to completed or failed
            if (prevOrder && prevOrder.status !== order.status) {
              if (order.status === 'completed' || order.status === 'failed') {
                showToast(order);
              }
            }

            // Show toast for new processing orders
            if (!prevOrder && order.status === 'processing') {
              showToast(order);
            }
          });

          setLastCheckedOrders(currentOrders);
        }
      } catch (err) {
        console.error('Failed to check order updates:', err);
      }
    };

    // Initial check
    checkOrderUpdates();

    // Set up polling
    const interval = setInterval(checkOrderUpdates, 30000);

    return () => clearInterval(interval);
  }, [lastCheckedOrders]);

  const showToast = (order) => {
    const newToast = {
      id: `${order.id}-${Date.now()}`,
      order
    };

    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  return (
    <>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ bottom: `${80 + (index * 120)}px` }} className="fixed right-4">
          <SMMOrderToast
            order={toast.order}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </>
  );
};

export { SMMOrderToast, SMMToastManager };
export default SMMToastManager;
