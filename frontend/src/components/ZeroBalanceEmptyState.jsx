import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Wallet, Plus, Zap, DollarSign, ArrowRight, Sparkles } from 'lucide-react';

const ZeroBalanceEmptyState = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-sm border-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-ember-light flex items-center justify-center">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-5 h-5 text-yellow-900" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h2 className={`text-2xl font-black text-center mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Welcome to Calliotel! 🎉
      </h2>
      
      {/* Description */}
      <p className={`text-center mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Your account is ready to go. Add funds to get started with premium virtual numbers and carrier-grade communications.
      </p>

      {/* Quick Pricing Preview */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-gray-700/50' : 'bg-orange-50'}`}>
          <DollarSign className={`w-6 h-6 mx-auto mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          <div className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Virtual Numbers
          </div>
          <div className="text-xl font-black bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            $2.99/mo
          </div>
        </div>

        <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-gray-700/50' : 'bg-ember/5'}`}>
          <Zap className={`w-6 h-6 mx-auto mb-2 ${darkMode ? 'text-ember' : 'text-ember'}`} />
          <div className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            SMS Messages
          </div>
          <div className="text-xl font-black bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
            $0.05/msg
          </div>
        </div>

        <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
          <ArrowRight className={`w-6 h-6 mx-auto mb-2 ${darkMode ? 'text-blue-400' : 'text-ember'}`} />
          <div className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Voice Calls
          </div>
          <div className="text-xl font-black bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
            $0.02/min
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/wallet')}
          className="flex-1 bg-gradient-to-r from-orange-500 to-ember-light text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Funds Now</span>
        </button>

        <button
          onClick={() => navigate('/browse-numbers')}
          className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center space-x-2`}
        >
          <span>Browse Numbers</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Trust Badge */}
      <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-center`}>
        <div className="flex items-center justify-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            99.98% Uptime • 50+ Countries • Carrier-Grade Infrastructure
          </span>
        </div>
      </div>
    </div>
  );
};

export default ZeroBalanceEmptyState;
