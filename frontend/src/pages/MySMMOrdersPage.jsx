import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaTiktok, FaYoutube, FaFacebook, FaTwitter, FaTelegram, FaClock, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowLeft, FaFire } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MySMMOrdersPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const categoryIcons = {
    instagram: <FaInstagram className="text-pink-500" />,
    tiktok: <FaTiktok className="text-black" />,
    youtube: <FaYoutube className="text-red-500" />,
    facebook: <FaFacebook className="text-blue-500" />,
    twitter: <FaTwitter className="text-blue-400" />,
    telegram: <FaTelegram className="text-blue-600" />
  };

  const statusIcons = {
    pending: <FaClock className="text-yellow-500" />,
    processing: <FaSpinner className="text-blue-500 animate-spin" />,
    completed: <FaCheckCircle className="text-green-500" />,
    failed: <FaExclamationTriangle className="text-red-500" />,
    partial: <FaExclamationTriangle className="text-orange-500" />
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/smm/orders/my`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshOrderStatus = async (orderId) => {
    setRefreshing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/smm/order/${orderId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Update the order in the list
        setOrders(prev => prev.map(o => 
          o.id === orderId ? data.order : o
        ));
      }
    } catch (err) {
      console.error('Failed to refresh order:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400',
      processing: 'bg-blue-900/20 border-blue-500/50 text-blue-400',
      completed: 'bg-green-900/20 border-green-500/50 text-green-400',
      failed: 'bg-red-900/20 border-red-500/50 text-red-400',
      partial: 'bg-orange-900/20 border-orange-500/50 text-orange-400'
    };
    return colors[status] || 'bg-gray-900/20 border-gray-500/50 text-gray-400';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-6xl text-[#C74E1E] animate-spin mx-auto mb-4" />
          <p className="text-[#C74E1E] text-lg">Loading Tactical Log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-[#2a2a1f] to-black border-b border-[#C74E1E]/20 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-[#C74E1E] transition-colors mb-4"
          >
            <FaArrowLeft />
            Back to Command Center
          </button>

          <div className="flex items-center gap-3 mb-4">
            <FaFire className="text-4xl text-[#C74E1E]" />
            <h1 className="text-4xl font-bold text-white">
              My SMM <span className="text-[#C74E1E]">Deployments</span>
            </h1>
          </div>
          <p className="text-gray-400 text-sm">Tactical Log: Monitor Your Social Growth Operations</p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-[#2a2a1f] border border-[#C74E1E]/20 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">Total Deployments</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
            <div className="bg-[#2a2a1f] border border-green-500/20 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-400">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
            <div className="bg-[#2a2a1f] border border-blue-500/20 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">In Progress</p>
              <p className="text-2xl font-bold text-blue-400">
                {orders.filter(o => o.status === 'processing').length}
              </p>
            </div>
            <div className="bg-[#2a2a1f] border border-yellow-500/20 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterStatus === 'all'
                ? 'bg-[#C74E1E] text-white'
                : 'bg-[#2a2a1f] text-gray-400 hover:bg-[#C74E1E]/20 border border-[#C74E1E]/30'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterStatus === 'pending'
                ? 'bg-[#C74E1E] text-white'
                : 'bg-[#2a2a1f] text-gray-400 hover:bg-[#C74E1E]/20 border border-[#C74E1E]/30'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('processing')}
            className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterStatus === 'processing'
                ? 'bg-[#C74E1E] text-white'
                : 'bg-[#2a2a1f] text-gray-400 hover:bg-[#C74E1E]/20 border border-[#C74E1E]/30'
            }`}
          >
            Processing
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterStatus === 'completed'
                ? 'bg-[#C74E1E] text-white'
                : 'bg-[#2a2a1f] text-gray-400 hover:bg-[#C74E1E]/20 border border-[#C74E1E]/30'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <FaExclamationTriangle className="text-red-500 text-xl" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <FaFire className="text-6xl text-[#C74E1E]/30 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">
              {filterStatus === 'all' 
                ? 'No deployments yet. Start your first SMM campaign!' 
                : `No ${filterStatus} orders`}
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={() => navigate('/smm-marketplace')}
                className="bg-[#C74E1E] hover:bg-[#C74E1E]/80 text-white font-bold py-3 px-8 rounded-lg transition-all"
              >
                Browse SMM Arsenal
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                className="bg-[#2a2a1f] border border-[#C74E1E]/30 rounded-lg p-6 hover:border-[#C74E1E] transition-all"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {categoryIcons[order.service_name?.toLowerCase().includes('instagram') ? 'instagram' :
                        order.service_name?.toLowerCase().includes('tiktok') ? 'tiktok' :
                        order.service_name?.toLowerCase().includes('youtube') ? 'youtube' :
                        order.service_name?.toLowerCase().includes('facebook') ? 'facebook' :
                        order.service_name?.toLowerCase().includes('twitter') ? 'twitter' :
                        order.service_name?.toLowerCase().includes('telegram') ? 'telegram' : 'instagram'
                      ]}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{order.service_name}</h3>
                      <p className="text-gray-400 text-sm">Order ID: {order.id}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(order.status)}`}>
                    {statusIcons[order.status]}
                    <span className="font-semibold capitalize">{order.status}</span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-black/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Quantity</p>
                    <p className="text-white font-bold">{order.quantity.toLocaleString()}</p>
                  </div>

                  <div className="bg-black/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Total Cost</p>
                    <p className="text-[#C74E1E] font-bold">${order.total_cost.toFixed(2)}</p>
                  </div>

                  <div className="bg-black/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Your Profit</p>
                    <p className="text-green-400 font-bold">${order.profit_earned.toFixed(2)}</p>
                  </div>

                  <div className="bg-black/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Progress</p>
                    <p className="text-white font-bold">{order.progress}%</p>
                  </div>
                </div>

                {/* Target & Timestamps */}
                <div className="bg-black/30 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Target</p>
                      <p className="text-white font-mono text-sm break-all">
                        {order.target_url || order.target_username || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Deployed At</p>
                      <p className="text-white text-sm">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {order.status === 'processing' && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-[#C74E1E] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {(order.status === 'pending' || order.status === 'processing') && (
                  <button
                    onClick={() => refreshOrderStatus(order.id)}
                    disabled={refreshing}
                    className="w-full bg-[#C74E1E]/20 hover:bg-[#C74E1E]/30 border border-[#C74E1E]/50 text-[#C74E1E] font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
                  >
                    {refreshing ? 'Refreshing...' : 'Refresh Status'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySMMOrdersPage;
