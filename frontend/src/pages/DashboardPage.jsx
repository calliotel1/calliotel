import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, Smartphone, LogOut, CreditCard, Plus, Loader, HelpCircle, Trophy, Moon, Sun } from 'lucide-react';
import axios from 'axios';
import safeLocalStorage from '../utils/safeLocalStorage';
import BirthdayBanner from '../components/BirthdayBanner';
import UpcomingBirthdaysWidget from '../components/UpcomingBirthdaysWidget';
import NotificationBell from '../components/NotificationBell';
import TrustBanner from '../components/TrustBanner';
import LiveNumberPreview from '../components/LiveNumberPreview';
import SolutionQuiz from '../components/SolutionQuiz';
import IntegrationBadges from '../components/IntegrationBadges';
import DashboardBentoGrid from '../components/DashboardBentoGrid';
import WebhookTester from '../components/WebhookTester';
import ZeroBalanceEmptyState from '../components/ZeroBalanceEmptyState';
import NumberPortfolioAnalytics from '../components/NumberPortfolioAnalytics';
import FOMOTicker from '../components/FOMOTicker';
import SMMBoostWidget from '../components/SMMBoostWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({
    activeNumbers: 0,
    messagesSent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch wallet balance
      const balanceRes = await axios.get(`${API}/wallet/balance`, { headers });
      setBalance(balanceRes.data.balance);

      // Fetch active numbers count
      const numbersRes = await axios.get(`${API}/numbers/my-numbers`, { headers });
      const activeNumbers = numbersRes.data.numbers.filter(n => n.status === 'active').length;

      // Fetch messages count
      const messagesRes = await axios.get(`${API}/sms/inbox`, { headers });
      const sentMessages = messagesRes.data.messages.filter(m => m.direction === 'outbound').length;

      setStats({
        activeNumbers,
        messagesSent: sentMessages
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-ember-light bg-clip-text text-transparent">
                CALLIOTEL
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {/* Wallet Balance Display */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Available Balance</span>
                  <span className="text-lg text-green-400 font-mono font-bold tracking-tight">
                    ${loading ? '...' : balance.toFixed(2)}
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/wallet')}
                  className="bg-orange-500/20 hover:bg-orange-500/30 p-2 rounded-full transition-all group"
                  title="Add Funds"
                >
                  <Plus className="w-4 h-4 text-orange-400 group-hover:text-orange-300" />
                </button>
              </div>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {/* Notification Bell */}
              <NotificationBell />
              
              <button
                onClick={handleLogout}
                className={`flex items-center space-x-2 px-4 py-2 ${
                  darkMode ? 'text-gray-300 hover:text-orange-400' : 'text-gray-700 hover:text-orange-600'
                } transition-colors`}
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Trust Banner */}
      <TrustBanner />

      {/* FOMO Ticker - Gaming Activity */}
      <FOMOTicker />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Birthday Banner */}
        <BirthdayBanner />
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-orange-500 to-ember-light rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.full_name || user?.email}!
          </h1>
          <p className="text-orange-100">
            Manage your virtual numbers and communications
          </p>
        </div>

        {/* Live Number Preview */}
        <LiveNumberPreview />

        {/* Solution Quiz */}
        <SolutionQuiz />

        {/* Integration Badges */}
        <IntegrationBadges />

        {/* Zero Balance Empty State */}
        {balance === 0 && (
          <div className="mb-8">
            <ZeroBalanceEmptyState />
          </div>
        )}

        {/* Number Portfolio Analytics */}
        <div className="mb-8">
          <NumberPortfolioAnalytics />
        </div>

        {/* Bento Grid Dashboard */}
        <div className="mb-8">
          <DashboardBentoGrid />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <Phone className={`w-8 h-8 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                  <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? <Loader className="w-6 h-6 animate-spin" /> : stats.activeNumbers}
                  </span>
                </div>
                <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Active Numbers</h3>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className={`w-8 h-8 ${darkMode ? 'text-ember' : 'text-ember'}`} />
                  <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? <Loader className="w-6 h-6 animate-spin" /> : stats.messagesSent}
                  </span>
                </div>
                <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Messages Sent</h3>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 border-blue-100 dark:border-ember/20">
                <div className="flex items-center justify-between mb-4">
                  <CreditCard className="w-8 h-8 text-ember dark:text-blue-400" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? <Loader className="w-6 h-6 animate-spin" /> : `$${balance.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-600 dark:text-gray-400 font-medium">Account Balance</h3>
                  <button
                    onClick={() => navigate('/wallet')}
                    className="text-ember dark:text-blue-400 hover:text-ember-light dark:hover:text-blue-300 text-sm font-semibold flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
            </div>
          </div>
          
          {/* Upcoming Birthdays Widget - 1 column */}
          <div>
            <UpcomingBirthdaysWidget />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button onClick={() => navigate('/browse-numbers')} className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-left">
              <Phone className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Get a New Number</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Browse available numbers from 50+ countries</p>
            </button>

            <button onClick={() => navigate('/gamification')} className="p-6 border-2 border-ember/20 dark:border-ember/30 bg-gradient-to-br from-ember/5 to-ember-light/5 dark:from-ember-dark/20 dark:to-obsidian-light/20 rounded-xl hover:border-ember dark:hover:border-ember hover:shadow-lg transition-all text-left">
              <div className="flex items-center justify-between mb-3">
                <Trophy className="w-8 h-8 text-ember dark:text-ember" />
                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">NEW</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Gamification</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Achievements, XP, Leaderboard</p>
            </button>

            <button onClick={() => navigate('/daily-challenge')} className="p-6 border-2 border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl hover:border-yellow-500 dark:hover:border-yellow-400 hover:shadow-lg transition-all text-left">
              <div className="flex items-center justify-between mb-3">
                <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                <span className="px-2 py-1 bg-green-400 text-green-900 text-xs font-bold rounded-full animate-pulse">WIN $2</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Daily Challenge 🎮</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Play & win $2 every week!</p>
            </button>

            <button onClick={() => navigate('/my-numbers')} className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-ember dark:hover:border-ember hover:bg-ember/5 dark:hover:bg-olive/20 transition-all text-left">
              <Smartphone className="w-8 h-8 text-ember dark:text-ember mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">My Numbers</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">View and manage your virtual numbers</p>
            </button>

            <button onClick={() => navigate('/sms')} className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-ember dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left">
              <MessageSquare className="w-8 h-8 text-ember dark:text-blue-400 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">SMS Messaging</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Send and receive text messages</p>
            </button>

            <button onClick={() => navigate('/call-history')} className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left">
              <Phone className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Call History</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">View your call logs</p>
            </button>

            <button onClick={() => navigate('/help')} className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-left">
              <HelpCircle className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Help & Support</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Get help and contact support</p>
            </button>
          </div>

          {/* SMM Boost Widget */}
          <div className="mt-8">
            <SMMBoostWidget />
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Account Information</h3>
          <div className="space-y-2 text-sm">
            {user?.client_id && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-ember/20 rounded-lg mb-3">
                <p className="text-xs text-ember dark:text-blue-400 font-medium mb-1">Your Client ID</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-300 font-mono">{user.client_id}</p>
                <p className="text-xs text-ember dark:text-blue-400 mt-1">Share this ID to receive transfers</p>
              </div>
            )}
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Account ID:</span> {user?.id}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Member since:</span> {new Date(user?.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Developer Tools Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Developer Tools</h2>
          <WebhookTester />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
