import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Activity, Zap, CheckCircle, Database, Cloud } from 'lucide-react';

const LiveAPIHeartbeatBento = () => {
  const { darkMode } = useTheme();
  const [latency, setLatency] = useState(45);
  const [pulse, setPulse] = useState(0);

  // Simulate live latency updates (35-55ms range)
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

  // Generate heartbeat wave points
  const generateHeartbeatPath = () => {
    const points = [];
    const width = 100;
    const height = 25;
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

  return (
    <div className="p-6 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center relative">
            <Activity className="w-5 h-5 text-white" />
            <div className="absolute inset-0 bg-green-500 rounded-lg animate-ping opacity-75"></div>
          </div>
          <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            LIVE MONITOR
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-500 font-semibold">LIVE</span>
        </div>
      </div>

      {/* Heartbeat Wave */}
      <div className={`mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <svg width="100" height="25" className="mx-auto">
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

      {/* Metrics */}
      <div className="space-y-2">
        {/* API Latency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-yellow-500" />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              API
            </span>
          </div>
          <span className={`text-sm font-bold ${getLatencyColor()}`}>
            {latency}ms
          </span>
        </div>

        {/* Carrier Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="w-3.5 h-3.5 text-ember" />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Carrier
            </span>
          </div>
          <span className="text-xs font-bold text-green-500">
            Nominal
          </span>
        </div>

        {/* Database */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-3.5 h-3.5 text-ember" />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Database
            </span>
          </div>
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
        </div>
      </div>

      {/* Footer */}
      <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between text-xs">
          <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>
            Uptime
          </span>
          <span className="font-bold text-green-500">99.98%</span>
        </div>
      </div>
    </div>
  );
};

export default LiveAPIHeartbeatBento;
