import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, CheckCircle, XCircle, Loader, RefreshCw, History, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import { verificationSEO } from '../utils/seoData';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PlatformVerification = () => {
  const navigate = useNavigate();
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [userBalance, setUserBalance] = useState(0);

  // Fetch user balance (only if logged in)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return; // Skip if not logged in
        
        const response = await fetch(`${API_URL}/api/wallet/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUserBalance(data.balance || 0);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUserData();
  }, []);

  // Fetch available services
  useEffect(() => {
    fetchServices();
    fetchHistory();
  }, []);

  // Auto-poll active order status every 5 seconds
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'active' && activeOrder.order_code) {
      const interval = setInterval(() => {
        checkOrderStatus(activeOrder.order_code);
      }, 5000);
      setPollingInterval(interval);
      
      return () => clearInterval(interval);
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [activeOrder]);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/verification/services`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Skip if not logged in
      
      const response = await fetch(`${API_URL}/api/verification/history?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderHistory(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleServiceSelect = (service) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // User not logged in - redirect to login
      alert('Please login or sign up to purchase verification services!');
      navigate('/login');
      return;
    }
    setSelectedService(service);
    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedService) return;
    
    setPurchasing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/verification/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          service_slug: selectedService.slug,
          country_code: 'US'
        })
      });
      
      // Clone response before reading to avoid "body stream already read" error
      const data = await response.json();
      
      if (response.ok) {
        setActiveOrder(data);
        setUserBalance(data.new_balance);
        setShowConfirmModal(false);
        fetchHistory();
        
        // Show success notification
        showNotification('✅ Number Acquired!', `Use ${data.phone_number} for verification`, 'success');
      } else {
        showNotification('❌ Purchase Failed', data.detail || 'Unknown error', 'error');
        setShowConfirmModal(false);
      }
    } catch (error) {
      showNotification('❌ Error', 'Failed to purchase verification. Please try again.', 'error');
      console.error('Purchase error:', error);
      setShowConfirmModal(false);
    } finally {
      setPurchasing(false);
    }
  };

  const checkOrderStatus = async (orderCode) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/verification/status/${orderCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveOrder(data);
        
        // If SMS code received, show celebration
        if (data.sms_code && data.status === 'completed') {
          showNotification('🎯 CODE INTERCEPTED!', `Your code: ${data.sms_code}`, 'success');
        }
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const cancelOrder = async (orderCode) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/verification/cancel/${orderCode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveOrder(null);
        setUserBalance(prev => prev + data.refund_amount);
        fetchHistory();
        showNotification('✅ Order Cancelled', `Refunded $${data.refund_amount.toFixed(2)}`, 'success');
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      showNotification('❌ Cancellation Failed', 'Please try again', 'error');
    }
  };

  const showNotification = (title, message, type) => {
    // Simple notification - can be enhanced with toast library
    alert(`${title}\n${message}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'expired': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const isLoggedIn = !!localStorage.getItem('token');

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-ember mx-auto mb-4" />
          <div className="text-gray-400 text-xl font-semibold">Loading services...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian">
      <SEO 
        title={verificationSEO.title}
        description={verificationSEO.description}
        keywords={verificationSEO.keywords}
        url="https://calliotel.com/verification"
      />
      
      {/* Top Navigation Bar */}
      <div className="bg-olive shadow-lg border-b border-ember/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-ember font-medium transition flex items-center gap-2"
              >
                ← Back
              </button>
              <div className="h-8 w-px bg-gray-700"></div>
              <h1 className="text-2xl font-bold text-white">
                Ghost Verification
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
              {isLoggedIn && (
                <>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 text-gray-400 hover:text-ember transition"
                  >
                    <History className="w-5 h-5" />
                    <span className="font-medium">History</span>
                  </button>
                  <div className="text-right bg-green-900/30 px-4 py-2 rounded-lg border border-green-700/50">
                    <div className="text-xs text-green-400 font-semibold mb-0.5">Balance</div>
                    <div className="text-xl font-bold text-green-400">${userBalance.toFixed(2)}</div>
                  </div>
                </>
              )}
              {!isLoggedIn && (
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-blue-400 hover:text-blue-300 font-semibold transition"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-6 py-2 bg-gradient-to-r from-ember to-ember-light hover:from-ember-dark hover:to-ember-light text-white font-bold rounded-lg transition shadow-lg"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Active Order Card */}
        {activeOrder && (
          <div className="mb-8 bg-olive border-2 border-ember rounded-2xl shadow-[0_0_30px_rgba(199,78,30,0.4)] p-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-ember/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{activeOrder.service}</h2>
                  <p className="text-sm text-gray-400">Order #{activeOrder.order_id}</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                activeOrder.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                activeOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {activeOrder.status === 'active' && <Clock className="w-4 h-4 inline mr-1" />}
                {activeOrder.status === 'completed' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                {activeOrder.status.toUpperCase()}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-obsidian-light rounded-xl p-4 border border-ember/20">
                  <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Phone Number</div>
                  <div className="text-2xl font-mono font-bold text-white tracking-wide">
                    {activeOrder.phone_number}
                  </div>
                </div>

                {activeOrder.status === 'active' && (
                  <button
                    onClick={() => cancelOrder(activeOrder.order_id)}
                    className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-600/50 text-red-400 font-semibold px-4 py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel & Refund
                  </button>
                )}
              </div>

              <div className="relative">
                {activeOrder.sms_code ? (
                  <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500 rounded-2xl p-8 text-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <div className="text-sm font-semibold text-green-400 mb-3">SMS CODE RECEIVED</div>
                    <div className="text-5xl font-bold text-green-400 tracking-widest font-mono">
                      {activeOrder.sms_code}
                    </div>
                    <div className="text-sm text-green-400 mt-4 font-medium">✓ Verification Complete</div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-ember/10 to-ember/5 border-2 border-ember/40 rounded-2xl p-8 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <Loader className="w-24 h-24 text-ember animate-spin" />
                    </div>
                    <div className="text-white font-bold mb-2">Waiting for SMS...</div>
                    <div className="text-sm text-gray-400">Refreshing every 5 seconds</div>
                    <div className="text-xs text-gray-500 mt-3">The code will appear here automatically</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Services Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Available Services</h2>
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-400">{services.length}</span> services available
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {services.map((service) => (
              <button
                key={service.rate_id}
                onClick={() => handleServiceSelect(service)}
                className="group flex items-center gap-4 bg-olive hover:bg-olive-light border border-ember/20 hover:border-ember/40 rounded-xl p-4 transition-all duration-200 hover:shadow-[0_0_15px_rgba(199,78,30,0.2)]"
              >
                <div className="text-4xl">{service.icon}</div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-white mb-1">{service.service}</div>
                  <div className="text-xs text-gray-400 mb-2">{service.country}</div>
                  <div className="text-ember font-bold text-base">
                    ${service.price ? service.price.toFixed(2) : '0.50'}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-ember transition" />
              </button>
            ))}
          </div>
        </div>

        {/* History Section */}
        {showHistory && (
          <div className="bg-olive border border-ember/20 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <History className="w-6 h-6 text-ember" />
              Order History
            </h2>
            
            {orderHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📭</div>
                <div className="font-medium text-white">No previous orders</div>
              </div>
            ) : (
              <div className="space-y-3">
                {orderHistory.map((order) => (
                  <div
                    key={order.order_id}
                    className="bg-obsidian-light border border-ember/20 hover:border-ember/40 rounded-xl p-4 flex justify-between items-center transition"
                  >
                    <div className="flex-1 flex items-center gap-4">
                      <div className="w-12 h-12 bg-olive rounded-lg flex items-center justify-center text-2xl shadow-sm">
                        {services.find(s => s.service === order.service)?.icon || '📱'}
                      </div>
                      <div>
                        <div className="font-bold text-white">{order.service}</div>
                        <div className="text-sm text-gray-400 font-mono">{order.phone_number}</div>
                        {order.sms_code && (
                          <div className="text-sm text-green-400 font-semibold mt-1">
                            Code: {order.sms_code}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold mb-2 ${
                        order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {order.status}
                      </div>
                      <div className="text-lg font-bold text-ember">${order.cost?.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedService && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-olive border border-ember/40 rounded-3xl shadow-[0_0_50px_rgba(199,78,30,0.5)] max-w-md w-full p-8 animate-in zoom-in duration-200">
              <h2 className="text-3xl font-bold text-white mb-6">
                Confirm Purchase
              </h2>

              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-ember/20 to-ember/10 rounded-xl p-5 border-2 border-ember/40">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{selectedService.icon}</div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-xl">{selectedService.service}</div>
                      <div className="text-gray-400">{selectedService.country}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-obsidian-light rounded-xl p-5 border border-ember/20">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400">Price</span>
                    <span className="text-2xl font-bold text-green-400">${selectedService.price ? selectedService.price.toFixed(2) : '0.50'}</span>
                  </div>
                  <div className="h-px bg-ember/20 my-3"></div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Current Balance</span>
                    <span className="font-bold text-white">${userBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-400">After Purchase</span>
                    <span className="font-bold text-ember">${selectedService.price ? (userBalance - selectedService.price).toFixed(2) : userBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {userBalance < selectedService.price && (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="text-sm text-red-400 font-medium">
                    Insufficient balance. Please add funds to continue.
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={purchasing}
                  className="flex-1 bg-obsidian-light hover:bg-olive-dark text-gray-300 font-bold px-6 py-4 rounded-xl transition border border-ember/20"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPurchase}
                  disabled={purchasing || userBalance < selectedService.price}
                  className="flex-1 bg-ember hover:bg-ember-light text-white font-bold px-6 py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(199,78,30,0.4)] hover:shadow-[0_0_30px_rgba(199,78,30,0.6)] flex items-center justify-center gap-2"
                >
                  {purchasing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Purchase</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PlatformVerification;
