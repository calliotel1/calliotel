import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle, Clock, Zap } from 'lucide-react';

const FreshnessBadge = ({ 
  lastTested = new Date(),
  platform = 'WhatsApp',
  status = 'verified',
  size = 'medium'
}) => {
  const { darkMode } = useTheme();

  // Calculate time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const timeAgo = getTimeAgo(lastTested);

  // Status colors
  const getStatusConfig = () => {
    const isFresh = new Date() - new Date(lastTested) < 600000; // 10 mins

    if (status === 'verified' && isFresh) {
      return {
        bg: darkMode ? 'bg-green-500/20' : 'bg-green-50',
        border: 'border-green-500',
        text: 'text-green-500',
        icon: CheckCircle,
        label: 'VERIFIED FRESH',
        glow: true
      };
    }

    if (status === 'verified') {
      return {
        bg: darkMode ? 'bg-ember/20' : 'bg-blue-50',
        border: 'border-ember',
        text: 'text-ember',
        icon: CheckCircle,
        label: 'VERIFIED',
        glow: false
      };
    }

    return {
      bg: darkMode ? 'bg-gray-700/50' : 'bg-gray-100',
      border: 'border-gray-500',
      text: 'text-gray-500',
      icon: Clock,
      label: 'TESTING',
      glow: false
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-xs',
    large: 'px-4 py-2 text-sm'
  };

  return (
    <div className="relative inline-block">
      {/* Glow effect for fresh numbers */}
      {config.glow && (
        <div className="absolute inset-0 bg-green-500 rounded-lg blur-md opacity-30 animate-pulse"></div>
      )}
      
      {/* Badge */}
      <div
        className={`
          relative
          ${config.bg}
          ${sizeClasses[size]}
          rounded-lg
          border
          ${config.border}
          ${config.text}
          font-bold
          flex
          items-center
          space-x-1.5
          transition-all
          duration-300
          hover:scale-105
        `}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
        {config.glow && <Zap className="w-3 h-3 animate-pulse" />}
      </div>

      {/* Tooltip on hover */}
      <div className={`
        absolute
        left-1/2
        -translate-x-1/2
        top-full
        mt-2
        px-3
        py-2
        rounded-lg
        ${darkMode ? 'bg-gray-800' : 'bg-gray-900'}
        text-white
        text-xs
        whitespace-nowrap
        opacity-0
        pointer-events-none
        transition-opacity
        duration-200
        z-50
        group-hover:opacity-100
      `}>
        <div className="font-semibold mb-1">Last tested for {platform}</div>
        <div className="flex items-center space-x-1 text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{timeAgo}</span>
        </div>
        {/* Arrow */}
        <div className={`
          absolute
          left-1/2
          -translate-x-1/2
          bottom-full
          w-0
          h-0
          border-l-4
          border-r-4
          border-b-4
          border-transparent
          ${darkMode ? 'border-b-gray-800' : 'border-b-gray-900'}
        `}></div>
      </div>
    </div>
  );
};

export default FreshnessBadge;
