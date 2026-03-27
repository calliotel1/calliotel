import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, Lock, Zap, CheckCircle, Globe } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TrustBanner = () => {
  const [stats, setStats] = useState({
    active_numbers: 2450,
    sms_delivery_rate: 99.9,
    total_users: 500,
    uptime: "99.9%"
  });
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Rotate stats every 5 seconds
    const rotateInterval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(rotateInterval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats/trust-stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching trust stats:', error);
      // Keep default values on error
    }
  };

  const statItems = [
    {
      icon: <Globe className="w-4 h-4" />,
      text: `${stats.active_numbers.toLocaleString()}+ Active Numbers`,
      color: 'text-blue-400'
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      text: `${stats.sms_delivery_rate}% SMS Delivery Rate`,
      color: 'text-green-400'
    },
    {
      icon: <Lock className="w-4 h-4" />,
      text: '100% Private & Secure',
      color: 'text-ember'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-gray-900 via-olive-dark/20 to-gray-900 border-b border-ember/30">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-center space-x-8">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 text-sm font-medium transition-all"
            >
              <span className={item.color}>{item.icon}</span>
              <span className="text-gray-300">{item.text}</span>
            </div>
          ))}
          <div className="flex items-center space-x-2 text-sm font-medium">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300">24/7 Support</span>
          </div>
        </div>

        {/* Mobile View - Rotating Stats */}
        <div className="md:hidden flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm font-medium transition-all duration-500">
            <span className={statItems[currentStat].color}>
              {statItems[currentStat].icon}
            </span>
            <span className="text-gray-300">{statItems[currentStat].text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBanner;
