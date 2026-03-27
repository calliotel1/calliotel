import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, MessageSquare, DollarSign, Activity, Phone, Gift, Award } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const AnalyticsPage = () => {
  const [smsStats, setSmsStats] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState([]);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllAnalytics();
  }, [period]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [smsRes, usageRes, costRes] = await Promise.all([
        axios.get(`${API}/analytics/sms-stats?days=${period}`, { headers }),
        axios.get(`${API}/analytics/usage-stats`, { headers }),
        axios.get(`${API}/analytics/cost-breakdown`, { headers })
      ]);

      setSmsStats(smsRes.data);
      setUsageStats(usageRes.data);
      setCostBreakdown(costRes.data.breakdown);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-600">Your activity insights</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod(7)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  period === 7 ? 'bg-ember text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setPeriod(30)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  period === 30 ? 'bg-ember text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Phone}
            title="Phone Numbers"
            value={usageStats?.phone_numbers || 0}
            subtitle="Active numbers"
            color="from-ember to-ember-light"
          />
          <StatCard
            icon={MessageSquare}
            title="Total Messages"
            value={(smsStats?.total_sent || 0) + (smsStats?.total_received || 0)}
            subtitle={`${smsStats?.total_sent || 0} sent, ${smsStats?.total_received || 0} received`}
            color="from-ember to-ember-light"
          />
          <StatCard
            icon={Users}
            title="Contacts"
            value={usageStats?.contacts || 0}
            subtitle="Saved contacts"
            color="from-green-500 to-green-600"
          />
          <StatCard
            icon={DollarSign}
            title="Balance"
            value={`$${usageStats?.balance?.toFixed(2) || '0.00'}`}
            subtitle={`${usageStats?.referrals || 0} referrals`}
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* SMS Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">SMS Activity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={smsStats?.daily_activity || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sent" stroke="#8b5cf6" strokeWidth={2} name="Sent" />
              <Line type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2} name="Received" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Top Contacts */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Contacts</h2>
            {smsStats?.top_contacts && smsStats.top_contacts.length > 0 ? (
              <div className="space-y-3">
                {smsStats.top_contacts.slice(0, 5).map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{contact.number}</p>
                        <p className="text-sm text-gray-600">
                          {contact.sent} sent, {contact.received} received
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-ember">{contact.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No contact data yet</p>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Cost Breakdown</h2>
            {costBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {costBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-700">{item.category}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">No spending data yet</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-ember to-ember-light rounded-xl p-6 text-white">
            <TrendingUp className="w-8 h-8 mb-3" />
            <p className="text-sm opacity-90">Response Rate</p>
            <p className="text-3xl font-bold">{smsStats?.response_rate || 0}%</p>
          </div>

          <div className="bg-gradient-to-br from-ember to-ember-light rounded-xl p-6 text-white">
            <Users className="w-8 h-8 mb-3" />
            <p className="text-sm opacity-90">Friends</p>
            <p className="text-3xl font-bold">{usageStats?.friends || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <Gift className="w-8 h-8 mb-3" />
            <p className="text-sm opacity-90">Total Earned</p>
            <p className="text-3xl font-bold">${usageStats?.total_earned?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AnalyticsPage;
