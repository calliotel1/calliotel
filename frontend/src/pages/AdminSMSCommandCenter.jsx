import React, { useState, useEffect } from 'react';
import { Crown, Send, DollarSign, BarChart3, Users, MessageSquare, TrendingUp, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL;

const AdminSMSCommandCenter = () => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch balance, logs, and stats
      const [balanceRes, logsRes] = await Promise.all([
        axios.get(`${API}/api/bulksms/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/api/bulksms/admin/logs?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setBalance(balanceRes.data);
      setLogs(logsRes.data.logs || []);
      setStats(logsRes.data.statistics || {});
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (error.response?.status === 403) {
        toast({
          title: 'Access Denied',
          description: 'Admin access required',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      
      // Get all user IDs (you might want to filter by tier or specific users)
      const usersRes = await axios.get(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userIds = usersRes.data.users?.map(u => u.id) || [];

      if (userIds.length === 0) {
        toast({
          title: 'No Recipients',
          description: 'No users found to send broadcast',
          variant: 'destructive'
        });
        return;
      }

      const response = await axios.post(
        `${API}/api/bulksms/admin/broadcast`,
        {
          recipient_ids: userIds,
          message: broadcastMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Broadcast Sent!',
        description: `Message sent to ${response.data.successful} users`,
      });

      setBroadcastMessage('');
      fetchData(); // Refresh logs
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send broadcast',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const getCreditsColor = () => {
    if (!balance) return 'text-gray-400';
    const credits = balance.credits || 0;
    if (credits < 20) return 'text-red-400';
    if (credits < 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-olive-dark to-slate-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-ember animate-spin" />
      </div>
    );
  }

  const creditsColor = getCreditsColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-olive-dark to-slate-900 pb-24">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-ember/20 p-6">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">SMS Command Center</h1>
            <p className="text-sm text-gray-400">Admin SMS Management & Broadcasting</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Credits Balance */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-ember/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className={`w-5 h-5 ${creditsColor}`} />
              <h3 className="text-sm text-gray-400">Credits Balance</h3>
            </div>
            <p className={`text-3xl font-bold ${creditsColor}`}>
              {balance?.credits || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {balance?.username || 'calltelio'}
            </p>
            {balance && balance.credits < 20 && (
              <div className="mt-3 bg-red-900/20 border border-red-500/30 rounded p-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-300">Low balance!</span>
              </div>
            )}
          </div>

          {/* Total Sent */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-ember/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm text-gray-400">Total Sent</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats?.total_sent || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </div>

          {/* Success Rate */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-ember/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-sm text-gray-400">Success Rate</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">
              {stats?.total_sent > 0
                ? ((stats.total_sent / (stats.total_sent + (stats.total_failed || 0))) * 100).toFixed(1)
                : '100'}%
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.total_failed || 0} failed
            </p>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-ember/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-ember" />
              <h3 className="text-sm text-gray-400">Recent</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats?.recent_count || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">Last 50 logs</p>
          </div>
        </div>

        {/* Broadcast Tool */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-ember/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-ember" />
            Broadcast Message
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Message (sent to all users with SMS enabled)
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Calliotel: Server maintenance in 1 hour. Save your progress!"
                className="w-full bg-slate-700/50 border border-ember/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ember resize-none"
                rows={3}
                maxLength={160}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {broadcastMessage.length}/160 characters
                </p>
                <p className="text-xs text-gray-500">
                  Cost: ~${(balance?.credits || 0) > 0 ? (Math.ceil(logs.length / 100)).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>

            <button
              onClick={sendBroadcast}
              disabled={sending || !broadcastMessage.trim()}
              className="w-full bg-gradient-to-r from-ember to-ember-dark hover:from-ember-light hover:to-olive text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Broadcast
                </>
              )}
            </button>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-amber-400 mb-1">Broadcast Warning</p>
                  <p>This will send SMS to ALL users who have:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                    <li>Phone number configured</li>
                    <li>SMS quota available (Gold+ tier)</li>
                    <li>Admin broadcasts enabled in preferences</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Logs */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-ember/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-ember" />
              Recent SMS Logs
            </h2>
            <button
              onClick={fetchData}
              className="bg-ember hover:bg-ember-light text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-ember/20">
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Recipient</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No SMS logs yet
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 text-sm text-gray-400">
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          log.type === 'test' ? 'bg-blue-900/30 text-blue-400' :
                          log.type === 'duel_challenge' ? 'bg-orange-900/30 text-orange-400' :
                          log.type === 'duel_result' ? 'bg-olive/30 text-ember' :
                          log.type === 'achievement' ? 'bg-green-900/30 text-green-400' :
                          log.type === 'tier_upgrade' ? 'bg-amber-900/30 text-amber-400' :
                          'bg-gray-900/30 text-gray-400'
                        }`}>
                          {log.type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-white font-mono">
                        {log.to}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 text-xs ${
                          log.status === 'sent' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {log.status === 'sent' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-400 max-w-xs truncate">
                        {log.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminSMSCommandCenter;
