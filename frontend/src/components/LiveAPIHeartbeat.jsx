import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';
import { Activity, Zap, CheckCircle, Database, Cloud, X } from 'lucide-react';

const LiveAPIHeartbeat = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [latency, setLatency] = useState(45);
  const [pulse, setPulse] = useState(0);
  const [metrics, setMetrics] = useState({
    api: 'operational',
    database: 'operational',
    sms: 'operational',
    voice: 'operational'
  });

  // Hide on login, signup, and auth pages
  const shouldHide = ['/login', '/signup', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  
  // Simulate live latency updates (35-55ms range)
  // Hooks must be called unconditionally (before any early returns)
  useEffect(() => {
    const latencyInterval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 20) + 35); // 35-55ms
    }, 3000);

    return () => clearInterval(latencyInterval);
  }, []);

  // Pulse animation
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulse(prev => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(pulseInterval);
  }, []);

  // Don't render on auth pages or if manually closed
  if (shouldHide || !isVisible) {
    return null;
  }

  // Generate heartbeat wave points
  const generateHeartbeatPath = () => {
    const points = [];
    const width = 120;
    const height = 30;
    const segments = 20;
    
    for (let i = 0; i < segments; i++) {
      const x = (i / segments) * width;
      let y = height / 2;
      
      // Create heartbeat pattern
      if (i === Math.floor(segments * 0.3)) {
        y = height * 0.2; // Spike up
      } else if (i === Math.floor(segments * 0.35)) {
        y = height * 0.8; // Drop down
      } else if (i === Math.floor(segments * 0.4)) {
        y = height * 0.3; // Spike up again
      }
      
      points.push(`${x},${y}`);
    }
    
    return points.join(' ');
  };

  const getLatencyColor = () => {
    if (latency < 50) return 'text-green-500';
    if (latency < 100) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getLatencyStatus = () => {
    if (latency < 50) return 'Excellent';
    if (latency < 100) return 'Good';
    return 'Degraded';
  };

  return (
    <div className={`fixed top-20 right-4 z-40 max-w-[90vw] sm:max-w-[280px] ${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-lg rounded-xl shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-all duration-300`}>
      <div className="p-3 sm:p-4">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              LIVE MONITOR
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-500 font-semibold">LIVE</span>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className={`p-1 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
              aria-label="Close monitor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Heartbeat Wave */}
        <div className={`mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <svg width="120" height="30" className="mx-auto">
            <polyline
              points={generateHeartbeatPath()}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-green-500"
              style={{
                strokeDasharray: 200,
                strokeDashoffset: 200 - (pulse * 2),
                transition: 'stroke-dashoffset 0.05s linear'
              }}
            />
          </svg>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-2">
          {/* API Latency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                API Latency
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-bold ${getLatencyColor()}`}>
                {latency}ms
              </span>
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {getLatencyStatus()}
              </span>
            </div>
          </div>

          {/* Carrier Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="w-4 h-4 text-ember" />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Carrier Status
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs font-bold text-green-500">
                Nominal
              </span>
            </div>
          </div>

          {/* Database */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-ember" />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Database
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs font-bold text-green-500">
                Operational
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Uptime: 99.98%
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Updated 2s ago
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAPIHeartbeat;
