import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Phone,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const EmpireAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [timeframe, setTimeframe] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API}/api/analytics/empire?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Empire Analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Failed to load analytics</div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, subValue, trend, color = "orange" }) => (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-orange-500/50 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${
          color === 'orange' ? 'from-orange-500 to-orange-600' : 
          color === 'green' ? 'from-green-500 to-green-600' : 
          'from-purple-500 to-purple-600'
        }`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="text-sm font-bold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-white text-3xl font-bold mb-1">{value}</div>
      {subValue && <div className="text-gray-500 text-sm">{subValue}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">
                🏛️ Empire Command Center
              </h1>
              <p className="text-gray-400">100% Markup Visibility • Real-Time Revenue Tracking</p>
            </div>
            
            {/* Timeframe selector */}
            <div className="flex gap-2">
              {['today', 'week', 'month', 'all'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    timeframe === tf
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Top-level metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${analytics.total_revenue.toLocaleString()}`}
            subValue={`$${analytics.total_profit.toLocaleString()} profit`}
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            label="Profit Margin"
            value={`${analytics.profit_margin_percent}%`}
            subValue={`$${analytics.total_cost.toLocaleString()} cost`}
            color="green"
          />
          <StatCard
            icon={ShoppingBag}
            label="SMM Orders"
            value={analytics.smm.orders}
            subValue={`$${analytics.smm.revenue.toLocaleString()} revenue`}
            color="purple"
          />
          <StatCard
            icon={Phone}
            label="Voice Numbers"
            value={analytics.telecom.subscriptions}
            subValue={`$${analytics.telecom.revenue.toLocaleString()} revenue`}
            color="orange"
          />
        </div>

        {/* SMM vs Telecom breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* SMM Panel */}
          <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">SMM Marketplace</h3>
                <p className="text-gray-400 text-sm">{analytics.smm.markup_percent}% Markup</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Revenue</span>
                <span className="text-white font-bold text-lg">${analytics.smm.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Cost</span>
                <span className="text-gray-500 font-semibold">${analytics.smm.cost.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-semibold">Pure Profit</span>
                <span className="text-green-500 font-bold text-xl">${analytics.smm.profit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Telecom Panel */}
          <div className="bg-gradient-to-br from-orange-900/20 to-black border border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Telecom Services</h3>
                <p className="text-gray-400 text-sm">{analytics.telecom.markup_percent}% Markup</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Revenue</span>
                <span className="text-white font-bold text-lg">${analytics.telecom.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Cost</span>
                <span className="text-gray-500 font-semibold">${analytics.telecom.cost.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-semibold">Pure Profit</span>
                <span className="text-green-500 font-bold text-xl">${analytics.telecom.profit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top services */}
        {analytics.top_services.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              Top Performing Services
            </h3>
            <div className="space-y-3">
              {analytics.top_services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{service.service}</div>
                      <div className="text-gray-400 text-sm">{service.orders} orders</div>
                    </div>
                  </div>
                  <div className="text-green-500 font-bold">${service.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active users */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Active Users</div>
              <div className="text-white text-2xl font-bold">{analytics.active_users}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpireAnalyticsDashboard;
