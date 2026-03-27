import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Server, 
  Database, 
  Cloud,
  Zap,
  ArrowLeft,
  TrendingUp,
  Calendar
} from 'lucide-react';

const MaintenancePage = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  // System status
  const systemStatus = {
    api: 'operational',
    sms: 'operational',
    voice: 'operational',
    database: 'operational',
    uptime: '99.98%',
    lastIncident: '47 days ago'
  };

  // Scheduled maintenance
  const scheduledMaintenance = [
    {
      date: '2025-01-15',
      time: '02:00 AM - 04:00 AM UTC',
      type: 'Infrastructure Upgrade',
      impact: 'Low',
      description: 'Database optimization and carrier network upgrades'
    },
    {
      date: '2025-02-01',
      time: '01:00 AM - 02:00 AM UTC',
      type: 'Security Patch',
      impact: 'None',
      description: 'Routine security updates - Zero downtime'
    }
  ];

  // Historical uptime data (last 12 months)
  const uptimeHistory = [
    { month: 'Jan', uptime: 99.99 },
    { month: 'Feb', uptime: 99.97 },
    { month: 'Mar', uptime: 99.99 },
    { month: 'Apr', uptime: 99.98 },
    { month: 'May', uptime: 99.99 },
    { month: 'Jun', uptime: 99.99 },
    { month: 'Jul', uptime: 99.98 },
    { month: 'Aug', uptime: 99.99 },
    { month: 'Sep', uptime: 99.97 },
    { month: 'Oct', uptime: 99.99 },
    { month: 'Nov', uptime: 99.98 },
    { month: 'Dec', uptime: 99.98 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'outage':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5" />;
      case 'outage':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#FAFAF8]'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            <h1 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              System Status
            </h1>
          </div>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time status and scheduled maintenance for Calliotel's carrier-grade infrastructure
          </p>
        </div>

        {/* Current Status Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className="w-8 h-8" />
                <h2 className="text-3xl font-black">All Systems Operational</h2>
              </div>
              <p className="text-green-100 text-lg">
                99.98% Uptime • Last incident: {systemStatus.lastIncident}
              </p>
            </div>
            <div className="hidden md:block">
              <TrendingUp className="w-16 h-16 opacity-50" />
            </div>
          </div>
        </div>

        {/* System Components */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-sm mb-8`}>
          <h2 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            System Components
          </h2>
          
          <div className="space-y-4">
            {/* API Gateway */}
            <div className="flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
              <div className="flex items-center space-x-4">
                <Server className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-ember'}`} />
                <div>
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    API Gateway
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    RESTful API endpoints
                  </div>
                </div>
              </div>
              <div className={`flex items-center space-x-2 ${getStatusColor(systemStatus.api)}`}>
                {getStatusIcon(systemStatus.api)}
                <span className="font-bold capitalize">{systemStatus.api}</span>
              </div>
            </div>

            {/* SMS Service */}
            <div className="flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
              <div className="flex items-center space-x-4">
                <Zap className={`w-6 h-6 ${darkMode ? 'text-ember' : 'text-ember'}`} />
                <div>
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    SMS Service
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Message delivery platform
                  </div>
                </div>
              </div>
              <div className={`flex items-center space-x-2 ${getStatusColor(systemStatus.sms)}`}>
                {getStatusIcon(systemStatus.sms)}
                <span className="font-bold capitalize">{systemStatus.sms}</span>
              </div>
            </div>

            {/* Voice Network */}
            <div className="flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
              <div className="flex items-center space-x-4">
                <Cloud className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <div>
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Voice Network
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    VoIP infrastructure
                  </div>
                </div>
              </div>
              <div className={`flex items-center space-x-2 ${getStatusColor(systemStatus.voice)}`}>
                {getStatusIcon(systemStatus.voice)}
                <span className="font-bold capitalize">{systemStatus.voice}</span>
              </div>
            </div>

            {/* Database */}
            <div className="flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
              <div className="flex items-center space-x-4">
                <Database className={`w-6 h-6 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                <div>
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Database
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Data storage & retrieval
                  </div>
                </div>
              </div>
              <div className={`flex items-center space-x-2 ${getStatusColor(systemStatus.database)}`}>
                {getStatusIcon(systemStatus.database)}
                <span className="font-bold capitalize">{systemStatus.database}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Maintenance */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-sm mb-8`}>
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-ember'}`} />
            <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Scheduled Maintenance
            </h2>
          </div>

          <div className="space-y-4">
            {scheduledMaintenance.map((item, index) => (
              <div 
                key={index}
                className={`p-6 rounded-xl border-2 ${darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-blue-100 bg-blue-50'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.type}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.date} • {item.time}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.impact === 'None' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.impact} Impact
                  </span>
                </div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Uptime History */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-sm`}>
          <h2 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Uptime History (Last 12 Months)
          </h2>

          <div className="grid grid-cols-12 gap-2 mb-6">
            {uptimeHistory.map((data, index) => (
              <div key={index} className="text-center">
                <div 
                  className={`h-24 rounded-lg mb-2 ${
                    data.uptime >= 99.98 
                      ? 'bg-green-500' 
                      : data.uptime >= 99.95 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                  }`}
                  title={`${data.month}: ${data.uptime}%`}
                  style={{ opacity: data.uptime / 100 }}
                ></div>
                <div className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {data.month}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className={`text-4xl font-black bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2`}>
              99.98%
            </div>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Average Uptime (12 Months)
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MaintenancePage;
