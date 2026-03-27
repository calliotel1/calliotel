import React, { useState, useEffect } from 'react';
import { FaDollarSign, FaChartLine, FaFire, FaSync } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminSMMBalanceMonitor = () => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchBalance();
    // Refresh every 5 minutes
    const interval = setInterval(fetchBalance, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/smm/admin/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error('Failed to fetch balance');
      }
    } catch (err) {
      console.error('Failed to fetch SMMWiz balance:', err);
      setError('Unable to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gradient-to-br from-[#2a2a1f] to-black border-2 border-[#C74E1E]/30 rounded-xl p-6 hover:border-[#C74E1E] transition-all hover:shadow-lg hover:shadow-[#C74E1E]/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FaFire className="text-3xl text-[#C74E1E]" />
          <div>
            <h3 className="text-white font-bold text-lg">SMMWiz Balance</h3>
            <p className="text-gray-400 text-xs">Provider Account Funds</p>
          </div>
        </div>

        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-2 bg-[#C74E1E]/20 hover:bg-[#C74E1E]/30 border border-[#C74E1E]/50 rounded-lg transition-all disabled:opacity-50"
          title="Refresh Balance"
        >
          <FaSync className={`text-[#C74E1E] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Balance Display */}
      {error ? (
        <div className="text-center py-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : loading && !balance ? (
        <div className="text-center py-6">
          <FaSync className="text-4xl text-[#C74E1E] animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      ) : (
        <>
          <div className="bg-black/50 border border-[#C74E1E]/20 rounded-lg p-6 mb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FaDollarSign className="text-3xl text-green-400" />
              <p className="text-5xl font-bold text-white">{balance?.toFixed(2) || '0.00'}</p>
            </div>
            <p className="text-gray-400 text-sm">Available Provider Credits</p>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <FaChartLine className="text-[#C74E1E] text-xl mx-auto mb-1" />
              <p className="text-xs text-gray-400">Status</p>
              <p className={`text-sm font-bold ${balance > 10 ? 'text-green-400' : balance > 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {balance > 10 ? 'Healthy' : balance > 5 ? 'Low' : 'Critical'}
              </p>
            </div>

            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Last Updated</div>
              <p className="text-sm font-bold text-white">{formatTime(lastUpdated)}</p>
            </div>
          </div>

          {/* Warning Messages */}
          {balance < 5 && (
            <div className="mt-4 bg-red-900/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-xs text-center">
                ⚠️ Low balance! Add funds to your SMMWiz account to continue processing orders.
              </p>
            </div>
          )}

          {balance < 10 && balance >= 5 && (
            <div className="mt-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3">
              <p className="text-yellow-400 text-xs text-center">
                ⚡ Consider topping up your SMMWiz balance soon.
              </p>
            </div>
          )}
        </>
      )}

      {/* Empire Note */}
      <div className="mt-4 text-center">
        <p className="text-[#C74E1E] text-xs font-semibold">
          💎 100% Profit Margin Active
        </p>
      </div>
    </div>
  );
};

export default AdminSMMBalanceMonitor;
