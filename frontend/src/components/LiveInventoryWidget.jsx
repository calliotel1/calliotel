import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Zap, Globe, Phone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LiveInventoryWidget = () => {
  const { darkMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [fadeState, setFadeState] = useState('fade-in');

  // Activity messages
  const activities = [
    {
      type: 'new',
      icon: <Phone className="w-4 h-4" />,
      flag: '🇺🇸',
      country: 'USA',
      text: 'number added',
      time: '2 min ago',
      color: 'blue',
      gradient: 'from-ember to-cyan-500'
    },
    {
      type: 'inventory',
      icon: <Globe className="w-4 h-4" />,
      flag: '📊',
      text: '1,240+ USA numbers available',
      subtext: 'right now',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      type: 'hot',
      icon: <TrendingUp className="w-4 h-4" />,
      flag: '🔥',
      text: '15 UK numbers claimed',
      subtext: 'in the last hour',
      color: 'orange',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      type: 'new',
      icon: <Phone className="w-4 h-4" />,
      flag: '🇬🇧',
      country: 'UK',
      text: 'number added',
      time: '5 min ago',
      color: 'blue',
      gradient: 'from-ember to-cyan-500'
    },
    {
      type: 'fresh',
      icon: <Zap className="w-4 h-4" />,
      flag: '✨',
      text: '50+ Germany numbers',
      subtext: 'just added',
      color: 'purple',
      gradient: 'from-ember to-ember-light/50'
    },
    {
      type: 'inventory',
      icon: <Globe className="w-4 h-4" />,
      flag: '📊',
      text: '890+ UK numbers available',
      subtext: 'instant activation',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      type: 'hot',
      icon: <TrendingUp className="w-4 h-4" />,
      flag: '🔥',
      text: 'WhatsApp numbers',
      subtext: 'selling fast',
      color: 'orange',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      type: 'new',
      icon: <Phone className="w-4 h-4" />,
      flag: '🇨🇦',
      country: 'Canada',
      text: 'number added',
      time: '1 min ago',
      color: 'blue',
      gradient: 'from-ember to-cyan-500'
    }
  ];

  // Show widget after 3 seconds, check if previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('liveInventoryDismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Rotate messages every 40 seconds
  useEffect(() => {
    if (!isVisible || isDismissed) return;

    const interval = setInterval(() => {
      // Fade out
      setFadeState('fade-out');

      // Wait for fade out, then change message and fade in
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % activities.length);
        setFadeState('fade-in');
      }, 300);
    }, 40000); // 40 seconds

    return () => clearInterval(interval);
  }, [isVisible, isDismissed, activities.length]);

  const handleDismiss = () => {
    setFadeState('fade-out');
    setTimeout(() => {
      setIsDismissed(true);
      localStorage.setItem('liveInventoryDismissed', 'true');
    }, 300);
  };

  if (isDismissed || !isVisible) return null;

  const activity = activities[currentMessage];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        fadeState === 'fade-in' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div
        className={`relative w-80 rounded-2xl border shadow-2xl ${
          darkMode
            ? 'bg-gray-800/90 border-white/10'
            : 'bg-white/90 border-white/60'
        }`}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Gradient Top Border */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{
            background: `linear-gradient(90deg, ${activity.gradient.split(' ')[0].replace('from-', '')}, ${activity.gradient.split(' ')[1].replace('to-', '')})`
          }}
        />

        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activity.gradient} flex items-center justify-center text-white shadow-lg`}
              >
                {activity.icon}
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-2 h-2 rounded-full bg-gradient-to-br ${activity.gradient} animate-pulse`}
                  />
                  <span
                    className={`text-xs font-bold uppercase tracking-wide ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Live Activity
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className={`${
                darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              } transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message */}
          <div className="flex items-start space-x-3">
            <div className="text-2xl flex-shrink-0">{activity.flag}</div>
            <div className="flex-1">
              {activity.type === 'new' ? (
                <>
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {activity.country} {activity.text}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.time}
                  </p>
                </>
              ) : (
                <>
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {activity.text}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.subtext}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-3 flex space-x-1">
            {activities.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index === currentMessage
                    ? `bg-gradient-to-r ${activity.gradient}`
                    : darkMode
                    ? 'bg-gray-700'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Subtle Glow Effect */}
        <div
          className="absolute inset-0 rounded-2xl opacity-20 blur-xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${activity.gradient.split(' ')[0].replace('from-', '')}, ${activity.gradient.split(' ')[1].replace('to-', '')})`
          }}
        />
      </div>
    </div>
  );
};

export default LiveInventoryWidget;
