import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, MessageSquare, DollarSign, Activity, 
  Award, Zap, Download, Calendar, Target, TrendingDown,
  Heart, Eye, Mic, Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const EnhancedAnalyticsPage = () => {
  const [engagement, setEngagement] = useState(null);
  const [social, setSocial] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    fetchAllAnalytics();
  }, [period]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [engagementRes, socialRes, gamificationRes] = await Promise.all([
        axios.get(`${API}/analytics/engagement-metrics?days=${period}`, { headers }),
        axios.get(`${API}/analytics/social-metrics?days=${period}`, { headers }),
        axios.get(`${API}/analytics/gamification-analytics`, { headers })
      ]);

      setEngagement(engagementRes.data);
      setSocial(socialRes.data);
      setGamification(gamificationRes.data);
    } catch (error) {
      console.error('Analytics error:', error);
      toast({
        title: 'Error',
        description: 'Could not load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/analytics/export-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Download as JSON
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calliotel-analytics-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast({
        title: 'Success',
        description: 'Analytics data exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div>
          {trend && (
            <div className={`text-sm flex items-center justify-end gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
      <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{title}</h3>
      {subtitle && <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center pb-24`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-ember mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-purple-50 to-ember-light/5'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Analytics Dashboard</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your comprehensive activity insights</p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors shadow-sm"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mt-4">
            {[7, 14, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === days 
                    ? 'bg-ember text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Engagement Overview */}
        <section>
          <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <MessageSquare className="text-ember" />
            Engagement Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={MessageSquare}
              title="Messages Sent"
              value={engagement?.messages_sent || 0}
              subtitle={`${engagement?.avg_messages_per_day || 0}/day average`}
              color="from-ember to-ember-light"
            />
            <StatCard
              icon={ImageIcon}
              title="Stories Posted"
              value={engagement?.stories_posted || 0}
              subtitle={`${engagement?.avg_stories_per_day || 0}/day average`}
              color="from-ember to-ember-light"
            />
            <StatCard
              icon={Mic}
              title="Voice Notes"
              value={engagement?.voice_notes_sent || 0}
              subtitle="Sent this period"
              color="from-ember/50 to-ember-light"
            />
            <StatCard
              icon={Eye}
              title="Story Views"
              value={engagement?.story_views_received || 0}
              subtitle="Your stories viewed"
              color="from-orange-500 to-orange-600"
            />
          </div>
        </section>

        {/* Daily Activity Chart */}
        <section className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Daily Activity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={engagement?.daily_activity || []}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorStories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="messages" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMessages)" name="Messages" />
              <Area type="monotone" dataKey="stories" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorStories)" name="Stories" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {/* Social Metrics */}
        <section>
          <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Users className="text-ember" />
            Social Interactions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={Users}
              title="Total Friends"
              value={social?.total_friends || 0}
              subtitle={`+${social?.new_friends || 0} new this period`}
              color="from-green-500 to-green-600"
            />
            <StatCard
              icon={MessageSquare}
              title="Interaction Rate"
              value={social?.interaction_rate || 0}
              subtitle="Messages per friend"
              color="from-ember to-ember-light"
            />
            <StatCard
              icon={Eye}
              title="Story Engagement"
              value={social?.story_views_given || 0}
              subtitle="Stories you viewed"
              color="from-ember to-ember-light"
            />
          </div>

          {/* Top Friends */}
          {social?.top_friends && social.top_friends.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-sm p-6 mt-4 border`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Most Active Friends</h3>
              <div className="space-y-3">
                {social.top_friends.map((friend, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center text-white font-bold">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{friend.name}</span>
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{friend.interactions} messages</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Gamification Analytics */}
        <section>
          <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Award className="text-yellow-600" />
            Gamification Progress
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Zap}
              title="Total XP"
              value={gamification?.total_xp || 0}
              subtitle="Experience points"
              color="from-yellow-500 to-orange-600"
            />
            <StatCard
              icon={Target}
              title="Level"
              value={gamification?.level || 1}
              subtitle="Current level"
              color="from-ember to-ember-light"
            />
            <StatCard
              icon={Award}
              title="Achievements"
              value={gamification?.achievements_unlocked || 0}
              subtitle="Unlocked"
              color="from-ember to-ember-light"
            />
            <StatCard
              icon={TrendingUp}
              title="Activities"
              value={gamification?.top_activities?.length || 0}
              subtitle="Active categories"
              color="from-green-500 to-green-600"
            />
          </div>

          {/* XP Sources */}
          {gamification?.top_activities && gamification.top_activities.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>XP Sources</h3>
                <div className="space-y-3">
                  {gamification.top_activities.map((activity, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{activity.activity}</span>
                        <span className="text-ember font-bold">{activity.xp} XP</span>
                      </div>
                      <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className="bg-gradient-to-r from-ember to-ember-light h-2 rounded-full transition-all"
                          style={{ width: `${(activity.xp / gamification.total_xp) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-sm p-6 border`}>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>XP Trend (7 Days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={gamification?.xp_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="xp" stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>

        {/* Channel Insights Section */}
        {social && (
          <section>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              📢 Channel Insights
            </h2>

            {/* Channel Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={Award}
                title="Channels Joined"
                value={social?.channels_joined || 0}
                subtitle="Active memberships"
                color="from-ember to-ember-light"
              />
              <StatCard
                icon={MessageSquare}
                title="Total Posts"
                value={social?.posts_created || 0}
                subtitle="Content shared"
                color="from-ember to-cyan-500"
              />
              <StatCard
                icon={Heart}
                title="Engagement Rate"
                value={`${social?.avg_engagement_rate || 0}%`}
                subtitle="Likes + comments / posts"
                color="from-ember/50 to-red-500"
              />
            </div>

            {/* Top Channels */}
            {social?.top_channels && social.top_channels.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-sm p-6 border mb-6`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  🏆 Your Most Active Channels
                </h3>
                <div className="space-y-3">
                  {social.top_channels.map((channel, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 ${
                        darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      } rounded-lg`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                          idx === 0
                            ? 'from-yellow-400 to-orange-500'
                            : idx === 1
                              ? 'from-gray-300 to-gray-400'
                              : 'from-orange-400 to-red-500'
                        } flex items-center justify-center text-white font-bold`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {channel.name}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {channel.post_count} posts • {channel.engagement} interactions
                          </p>
                        </div>
                      </div>
                      <div className={`text-right`}>
                        <p className={`text-lg font-bold ${darkMode ? 'text-ember' : 'text-ember'}`}>
                          {channel.score}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          activity score
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

      </div>

      <BottomNav />
    </div>
  );
};

export default EnhancedAnalyticsPage;
