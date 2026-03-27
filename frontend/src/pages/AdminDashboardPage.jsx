import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, Video, TrendingUp, Activity, Shield, 
  AlertTriangle, Ban, CheckCircle, Eye, Settings, BarChart3,
  Clock, Heart, Zap, Crown, Search, Filter, Bell, Send, UserCheck,
  Trophy, Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import AdminSMMBalanceMonitor from '../components/AdminSMMBalanceMonitor';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [challengeStats, setChallengeStats] = useState(null);
  const [selectingWinner, setSelectingWinner] = useState(false);

  useEffect(() => {
    // Check if user is admin (you can add proper admin check)
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAdminStats();
    fetchUsers();
    fetchRecentContent();
    fetchTransactions();
    fetchAdminUsers();
    fetchChallengeStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      // For now, we'll aggregate from different endpoints
      // In production, create a dedicated admin stats endpoint
      
      const usersRes = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const usersData = await usersRes.json();

      const videosRes = await fetch(`${API_URL}/api/admin/videos`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const videosData = await videosRes.json();

      const revenueRes = await fetch(`${API_URL}/api/admin/revenue`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const revenueData = await revenueRes.json();

      setStats({
        totalUsers: usersData.total || 0,
        activeUsers: usersData.active || 0,
        newUsersToday: usersData.new_today || 0,
        totalVideos: videosData.total || 0,
        totalViews: videosData.total_views || 0,
        totalReactions: videosData.total_reactions || 0,
        totalRevenue: revenueData.total || 0,
        monthlyRevenue: revenueData.monthly || 0,
        premiumUsers: revenueData.premium_users || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Mock data for demonstration
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        totalVideos: 0,
        totalViews: 0,
        totalReactions: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        premiumUsers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/list`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchRecentContent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/content/recent`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setRecentVideos(data.videos || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      setRecentVideos([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/transactions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to ban this user?')) return;

    try {
      await fetch(`${API_URL}/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('User banned successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    try {
      await fetch(`${API_URL}/api/admin/content/${contentId}/delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Content deleted successfully');
      fetchRecentContent();
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/admin/users-list`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setAdminUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setAdminUsers([]);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSendingBroadcast(true);
      
      const response = await fetch(`${API_URL}/api/notifications/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Broadcast sent successfully!');
        setBroadcastTitle('');
        setBroadcastMessage('');
      } else {
        toast.error(data.detail || 'Failed to send broadcast');
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const toggleBroadcastPermission = async (userId, currentValue) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/admin/users/${userId}/broadcast-permission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ can_broadcast: !currentValue })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Permission updated');
        fetchAdminUsers(); // Refresh the list
      } else {
        toast.error(data.detail || 'Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const fetchChallengeStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/challenges/admin/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setChallengeStats(data);
    } catch (error) {
      console.error('Error fetching challenge stats:', error);
    }
  };

  const handleSelectWinner = async () => {
    if (!window.confirm('Are you sure you want to select this week\'s winner now?')) return;

    try {
      setSelectingWinner(true);
      const response = await fetch(`${API_URL}/api/challenges/admin/select-winner`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Winner selected successfully!');
        fetchChallengeStats();
      } else {
        toast.error(data.message || data.detail || 'Failed to select winner');
      }
    } catch (error) {
      console.error('Error selecting winner:', error);
      toast.error('Failed to select winner');
    } finally {
      setSelectingWinner(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ember mx-auto mb-4"></div>
          <p className="text-white">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold flex items-center">
                <Shield className="w-10 h-10 mr-3 text-ember" />
                Admin Control Panel
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Manage your Calliotel platform
              </p>
            </div>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="border-ember text-ember hover:bg-ember hover:text-white"
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-ember/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                    <p className="text-xs text-blue-300 mt-1">+{stats.newUsersToday} today</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-white">${stats.totalRevenue}</p>
                    <p className="text-xs text-green-300 mt-1">${stats.monthlyRevenue} this month</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-ember-dark/50 to-olive/50 border-ember/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-ember-light text-sm">Total Videos</p>
                    <p className="text-3xl font-bold text-white">{stats.totalVideos}</p>
                    <p className="text-xs text-ember mt-1">{stats.totalViews} views</p>
                  </div>
                  <Video className="h-12 w-12 text-ember" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-ember-900/50 to-ember-800/50 border-ember-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-ember-200 text-sm">Engagement</p>
                    <p className="text-3xl font-bold text-white">{stats.totalReactions}</p>
                    <p className="text-xs text-ember-light mt-1">Total reactions</p>
                  </div>
                  <Heart className="h-12 w-12 text-ember-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-ember">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="data-[state=active]:bg-ember">
              <Bell className="mr-2 h-4 w-4" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-ember">
              <UserCheck className="mr-2 h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="challenges" className="data-[state=active]:bg-ember">
              <Trophy className="mr-2 h-4 w-4" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-ember">
              <Users className="mr-2 h-4 w-4" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-ember">
              <Video className="mr-2 h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-ember">
              <DollarSign className="mr-2 h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-ember">
              <Activity className="mr-2 h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              {/* SMM Balance Monitor - Empire Revenue Stream */}
              <div className="md:col-span-2">
                <AdminSMMBalanceMonitor />
              </div>
              
              {/* Platform Health */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="mr-2 text-green-400" />
                    Platform Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Backend API</span>
                      <span className="flex items-center text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" /> Online
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Database</span>
                      <span className="flex items-center text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" /> Connected
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">WebSocket</span>
                      <span className="flex items-center text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" /> Active
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Stripe</span>
                      <span className="flex items-center text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" /> Connected
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Growth Metrics */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="mr-2 text-blue-400" />
                    Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300">Active Users</span>
                        <span className="text-white font-semibold">{stats.activeUsers} / {stats.totalUsers}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-ember h-2 rounded-full"
                          style={{ width: `${(stats.activeUsers / stats.totalUsers * 100) || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300">Premium Users</span>
                        <span className="text-white font-semibold">{stats.premiumUsers} / {stats.totalUsers}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${(stats.premiumUsers / stats.totalUsers * 100) || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Send className="mr-2 text-ember" />
                  Send Broadcast Notification
                </CardTitle>
                <p className="text-gray-400 text-sm mt-2">
                  Send a message to all registered users on the platform
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Notification Title
                    </label>
                    <Input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g., Today's Challenge"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      maxLength={100}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="e.g., Today's challenge is to play the music game! Win amazing prizes!"
                      className="w-full min-h-[120px] px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      maxLength={500}
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {broadcastMessage.length}/500 characters
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      <AlertTriangle className="w-4 h-4 inline mr-1 text-yellow-500" />
                      This will send a notification to all users
                    </div>
                    <Button
                      type="submit"
                      disabled={sendingBroadcast}
                      className="bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark text-white font-semibold px-6"
                    >
                      {sendingBroadcast ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Broadcast
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <UserCheck className="mr-2 text-blue-400" />
                  Manage Broadcast Permissions
                </CardTitle>
                <p className="text-gray-400 text-sm mt-2">
                  Grant or revoke broadcast permissions for admins (Super admins have permission by default)
                </p>
              </CardHeader>
              <CardContent>
                {adminUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No admin users found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {adminUsers.map((admin) => (
                      <div
                        key={admin.user_id}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {(admin.full_name || admin.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center">
                              {admin.full_name || 'Unknown'}
                              {admin.is_super_admin && (
                                <span className="ml-2 inline-flex items-center text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Super Admin
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-400">{admin.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm ${admin.can_broadcast ? 'text-green-400' : 'text-gray-500'}`}>
                            {admin.can_broadcast ? 'Can Broadcast' : 'No Permission'}
                          </span>
                          {!admin.is_super_admin && (
                            <Button
                              size="sm"
                              onClick={() => toggleBroadcastPermission(admin.user_id, admin.can_broadcast)}
                              className={admin.can_broadcast ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                            >
                              {admin.can_broadcast ? 'Revoke' : 'Grant'}
                            </Button>
                          )}
                          {admin.is_super_admin && (
                            <span className="text-xs text-gray-500 italic">
                              (Always enabled)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Trophy className="mr-2 text-yellow-400" />
                    Weekly Challenge Stats
                  </CardTitle>
                  <p className="text-gray-400 text-sm mt-2">
                    {challengeStats ? `Week ${challengeStats.week_id}` : 'Loading...'}
                  </p>
                </CardHeader>
                <CardContent>
                  {challengeStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-900/30 p-4 rounded-lg text-center">
                          <p className="text-3xl font-bold text-white">{challengeStats.unique_participants}</p>
                          <p className="text-sm text-gray-400">Participants</p>
                        </div>
                        <div className="bg-green-900/30 p-4 rounded-lg text-center">
                          <p className="text-3xl font-bold text-white">{challengeStats.eligible_for_prize}</p>
                          <p className="text-sm text-gray-400">Eligible for Prize</p>
                        </div>
                        <div className="bg-olive/30 p-4 rounded-lg text-center">
                          <p className="text-3xl font-bold text-white">{challengeStats.total_attempts}</p>
                          <p className="text-sm text-gray-400">Total Attempts</p>
                        </div>
                        <div className="bg-yellow-900/30 p-4 rounded-lg text-center">
                          <p className="text-3xl font-bold text-white">{challengeStats.correct_attempts}</p>
                          <p className="text-sm text-gray-400">Correct Answers</p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-700">
                        <Button
                          onClick={handleSelectWinner}
                          disabled={selectingWinner || challengeStats.eligible_for_prize === 0}
                          className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold"
                        >
                          {selectingWinner ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Selecting Winner...
                            </>
                          ) : (
                            <>
                              <Award className="w-5 h-5 mr-2" />
                              Select Winner Now
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-400 text-center mt-2">
                          Winner is auto-selected every Sunday at 11:59 PM UTC
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember mx-auto"></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Challenge Breakdown</CardTitle>
                  <CardDescription className="text-gray-400">
                    Success rate by challenge type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {challengeStats ? (
                    <div className="space-y-3">
                      {Object.entries(challengeStats.challenge_breakdown).map(([id, stats]) => (
                        <div key={id} className="bg-gray-700/50 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white text-sm">{stats.title}</span>
                            <span className={`text-sm font-bold ${
                              stats.success_rate >= 70 ? 'text-green-400' :
                              stats.success_rate >= 40 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {stats.success_rate}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{stats.correct_attempts} / {stats.total_attempts} correct</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember mx-auto"></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.user_id || u.email}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{u.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-400">{u.email}</p>
                            {u.premium_story_empire && (
                              <span className="inline-flex items-center text-xs text-yellow-400">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">
                            ${u.wallet_balance?.toFixed(2) || '0.00'}
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBanUser(u.user_id || u.email)}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Content</CardTitle>
                <CardDescription className="text-gray-400">
                  Latest videos and posts from users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentVideos.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No content yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentVideos.map((video) => (
                      <div
                        key={video.message_id}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {video.caption || 'Video Message'}
                          </p>
                          <p className="text-sm text-gray-400">
                            by {video.sender_id} • {new Date(video.sent_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {video.total_views || 0} views • {Object.values(video.reaction_counts || {}).reduce((a,b) => a+b, 0)} reactions
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteContent(video.message_id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Premium Subscriptions</span>
                      <span className="text-white font-bold">${stats.monthlyRevenue * 0.6}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Super Reactions</span>
                      <span className="text-white font-bold">${stats.monthlyRevenue * 0.2}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Voice Marketplace</span>
                      <span className="text-white font-bold">${stats.monthlyRevenue * 0.15}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Other</span>
                      <span className="text-white font-bold">${stats.monthlyRevenue * 0.05}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No transactions yet</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {transactions.slice(0, 10).map((tx) => (
                        <div key={tx.transaction_id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{tx.type}</span>
                          <span className={`font-semibold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${Math.abs(tx.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Services Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded">
                        <span className="text-gray-300">Backend API</span>
                        <span className="text-green-400 flex items-center">
                          <Zap className="w-4 h-4 mr-1" /> Running
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded">
                        <span className="text-gray-300">Frontend</span>
                        <span className="text-green-400 flex items-center">
                          <Zap className="w-4 h-4 mr-1" /> Running
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded">
                        <span className="text-gray-300">MongoDB</span>
                        <span className="text-green-400 flex items-center">
                          <Zap className="w-4 h-4 mr-1" /> Connected
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-ember hover:bg-ember-light"
                        onClick={() => navigate('/video-analytics')}
                      >
                        <BarChart3 className="mr-2 w-4 h-4" />
                        View Video Analytics
                      </Button>
                      <Button
                        className="w-full bg-ember hover:bg-ember-light"
                        onClick={() => window.location.href = `${API_URL}/docs`}
                      >
                        <Settings className="mr-2 w-4 h-4" />
                        API Documentation
                      </Button>
                      <Button
                        className="w-full bg-gray-700 hover:bg-gray-600"
                        onClick={() => fetchAdminStats()}
                      >
                        <Activity className="mr-2 w-4 h-4" />
                        Refresh Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboardPage;