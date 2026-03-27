import React from 'react';
import { MessageSquare, Briefcase, TrendingUp, Heart, Bot, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const NumberPresetFilter = ({ activePreset, onSelectPreset }) => {
  const { darkMode } = useTheme();

  const presets = [
    {
      id: 'all',
      name: 'All Numbers',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'Browse all available numbers',
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600',
      bgLight: 'bg-gray-50',
      bgDark: 'bg-gray-800',
      borderLight: 'border-gray-200',
      borderDark: 'border-gray-700',
      hoverLight: 'hover:border-gray-400',
      hoverDark: 'hover:border-gray-500'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp & Telegram',
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Best for messaging app verification',
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      bgLight: 'bg-green-50',
      bgDark: 'bg-green-900/20',
      borderLight: 'border-green-200',
      borderDark: 'border-green-700',
      hoverLight: 'hover:border-green-400',
      hoverDark: 'hover:border-green-500'
    },
    {
      id: 'business',
      name: 'Business Calls',
      icon: <Briefcase className="w-5 h-5" />,
      description: 'US/UK premium numbers for calls',
      color: 'blue',
      gradient: 'from-ember to-ember-light',
      bgLight: 'bg-blue-50',
      bgDark: 'bg-blue-900/20',
      borderLight: 'border-blue-200',
      borderDark: 'border-ember/30',
      hoverLight: 'hover:border-blue-400',
      hoverDark: 'hover:border-ember'
    },
    {
      id: 'sms_marketing',
      name: 'SMS Marketing',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'High-volume campaigns & promotions',
      color: 'purple',
      gradient: 'from-ember to-ember-light',
      bgLight: 'bg-ember/5',
      bgDark: 'bg-olive/20',
      borderLight: 'border-ember/20',
      borderDark: 'border-ember/30',
      hoverLight: 'hover:border-ember',
      hoverDark: 'hover:border-ember'
    },
    {
      id: 'dating',
      name: 'Dating Apps',
      icon: <Heart className="w-5 h-5" />,
      description: 'Perfect for Tinder, Bumble, etc.',
      color: 'pink',
      gradient: 'from-ember/50 to-rose-600',
      bgLight: 'bg-ember/5',
      bgDark: 'bg-olive/20',
      borderLight: 'border-ember/20',
      borderDark: 'border-ember-700',
      hoverLight: 'hover:border-ember-400',
      hoverDark: 'hover:border-ember-500'
    },
    {
      id: 'ai_testing',
      name: 'AI & API Testing',
      icon: <Bot className="w-5 h-5" />,
      description: 'OpenAI, automation, testing',
      color: 'indigo',
      gradient: 'from-ember to-ember-light',
      bgLight: 'bg-indigo-50',
      bgDark: 'bg-indigo-900/20',
      borderLight: 'border-indigo-200',
      borderDark: 'border-indigo-700',
      hoverLight: 'hover:border-indigo-400',
      hoverDark: 'hover:border-indigo-500'
    }
  ];

  return (
    <div data-testid="preset-filter-sidebar" className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
      <div className="mb-4">
        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
          📱 Solution Presets
        </h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Find the perfect number for your use case
        </p>
      </div>

      <div className="space-y-3">
        {presets.map((preset) => {
          const isActive = activePreset === preset.id;
          
          return (
            <button
              key={preset.id}
              data-testid={`preset-filter-${preset.id}`}
              onClick={() => onSelectPreset(preset.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? `${darkMode ? preset.bgDark : preset.bgLight} border-${preset.color}-500 shadow-md scale-[1.02]`
                  : `${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} ${
                      darkMode ? preset.hoverDark : preset.hoverLight
                    }`
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${preset.gradient} text-white flex-shrink-0 ${
                    isActive ? 'scale-110' : ''
                  } transition-transform`}
                >
                  {preset.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      } ${isActive ? 'text-base' : 'text-sm'}`}
                    >
                      {preset.name}
                    </h4>
                    {isActive && (
                      <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    } line-clamp-2`}
                  >
                    {preset.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} text-center`}>
          ✨ Numbers are curated based on success rates & compatibility
        </p>
      </div>
    </div>
  );
};

export default NumberPresetFilter;
