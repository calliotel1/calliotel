import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import BentoBox from './BentoBox';
import LiveAPIHeartbeatBento from './LiveAPIHeartbeatBento';
import { 
  Target, 
  TrendingUp, 
  Phone, 
  MessageSquare, 
  Clock, 
  DollarSign,
  Zap,
  CheckCircle,
  AlertCircle,
  Activity,
  Globe,
  Wifi,
  Server,
  ArrowRight
} from 'lucide-react';

const DashboardBentoGrid = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    api: 'operational',
    sms: 'operational',
    voice: 'operational',
    uptime: '99.98%'
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API_URL}/api/gamification/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Mock data for latest numbers (we'll integrate with real API later)
  const latestNumbers = [
    { country: '🇺🇸', number: '+1-555-0123', price: '$2.99/mo', addedTime: '2 min ago' },
    { country: '🇬🇧', number: '+44-20-1234', price: '$2.49/mo', addedTime: '5 min ago' },
    { country: '🇨🇦', number: '+1-416-5678', price: '$2.99/mo', addedTime: '12 min ago' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[200px]">
      
      {/* LARGE BOX: Daily Challenge */}
      <BentoBox 
        size="large" 
        gradient="#F97316, #EC4899"
        glow
        onClick={() => navigate('/daily-challenge')}
      >
        <div className="p-6 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-ember-light/50 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  DAILY CHALLENGE
                </span>
              </div>
              <ArrowRight className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            
            <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Send 5 Messages
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Complete today's challenge to earn 50 XP
            </p>
          </div>

          <div>
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Progress</span>
                <span className="font-bold bg-gradient-to-r from-orange-500 to-ember-light/50 bg-clip-text text-transparent">
                  2/5
                </span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-ember-light/50 transition-all duration-500"
                  style={{ width: '40%' }}
                />
              </div>
            </div>

            {/* Reward Badge */}
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                +50 XP Reward
              </span>
            </div>
          </div>
        </div>
      </BentoBox>

      {/* SMALL BOX: Live API Heartbeat Monitor */}
      <BentoBox 
        size="small" 
        gradient="#10B981, #059669"
        glow
      >
        <LiveAPIHeartbeatBento />
      </BentoBox>

      {/* MEDIUM BOX: Latest Added Numbers */}
      <BentoBox 
        size="medium" 
        gradient="#8B5CF6, #6366F1"
        onClick={() => navigate('/browse-numbers')}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ember to-indigo-500 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                LATEST NUMBERS
              </span>
            </div>
            <ArrowRight className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          <div className="space-y-3 flex-1">
            {latestNumbers.map((num, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                  darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{num.country}</span>
                  <div>
                    <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {num.number}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {num.addedTime}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-bold text-ember">
                  {num.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </BentoBox>

      {/* MEDIUM BOX: Your Stats */}
      <BentoBox 
        size="medium" 
        gradient="#3B82F6, #2563EB"
        onClick={() => navigate('/analytics')}
      >
        <div className="p-6 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ember to-ember-light flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                YOUR STATS
              </span>
            </div>
            <ArrowRight className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <MessageSquare className="w-4 h-4 text-ember" />
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Messages</span>
              </div>
              <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats?.messages_sent || 0}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-ember" />
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Minutes</span>
              </div>
              <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats?.call_minutes || 0}
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Balance</span>
              </div>
              <div className={`text-3xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent`}>
                $12.50
              </div>
            </div>
          </div>
        </div>
      </BentoBox>

      {/* SMALL BOX: Quick Actions */}
      <BentoBox 
        size="small" 
        gradient="#F59E0B, #D97706"
        onClick={() => navigate('/browse-numbers')}
      >
        <div className="p-6 h-full flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Browse Numbers
          </h3>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            50+ Countries
          </p>
        </div>
      </BentoBox>

      {/* SMALL BOX: Network Status */}
      <BentoBox 
        size="small" 
        gradient="#06B6D4, #0891B2"
      >
        <div className="p-6 h-full flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-cyan-500" />
            <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              NETWORK
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>API</span>
              <Wifi className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>SMS</span>
              <Wifi className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Voice</span>
              <Wifi className="w-4 h-4 text-green-500" />
            </div>
          </div>
        </div>
      </BentoBox>

    </div>
  );
};

export default DashboardBentoGrid;
