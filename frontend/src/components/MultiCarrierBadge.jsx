import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Shield, Zap, Globe, CheckCircle } from 'lucide-react';

const MultiCarrierBadge = ({ placement = 'footer' }) => {
  const { darkMode } = useTheme();

  const carriers = [
    { name: 'Bandwidth', logo: '🌐', status: 'Operational' },
    { name: 'Telnyx', logo: '⚡', status: 'Operational' },
    { name: 'Calliotel', logo: '📡', status: 'Operational' }
  ];

  if (placement === 'inline') {
    // Compact version for under "Buy" buttons
    return (
      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
        darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-[#F9F9F7] border border-gray-200'
      }`}>
        <Shield className="w-4 h-4 text-green-500" />
        <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Multi-Carrier Redundancy
        </span>
        <div className="flex items-center space-x-1">
          {carriers.map((carrier, idx) => (
            <span key={idx} className="text-base">{carrier.logo}</span>
          ))}
        </div>
      </div>
    );
  }

  // Full version for footer
  return (
    <div className={`py-8 border-t-2 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-[#FAFAF8]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 mb-3">
            <Shield className="w-6 h-6 text-green-500" />
            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Resilient Global Infrastructure
            </h3>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Powered by Multi-Carrier Redundancy for 99.98% Uptime Guarantee
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {carriers.map((carrier, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl text-center transition-all hover:scale-105 ${
                darkMode 
                  ? 'bg-gray-800 border-2 border-gray-700' 
                  : 'bg-white border-2 border-gray-200'
              }`}
            >
              <div className="text-4xl mb-3">{carrier.logo}</div>
              <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {carrier.name}
              </h4>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-500 font-semibold">{carrier.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-8 p-6 rounded-2xl ${
          darkMode 
            ? 'bg-gradient-to-r from-green-900/20 to-blue-900/20 border-2 border-green-700/30' 
            : 'bg-gradient-to-r from-green-50 to-ember-light/5 border-2 border-green-200'
        }`}>
          <div className="flex items-start space-x-4">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                What is Multi-Carrier Redundancy?
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                If one carrier experiences downtime, your services automatically failover to backup carriers. 
                This ensures your business communications never stop, even during major outages. 
                <span className="font-semibold text-green-600"> No single point of failure.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="mt-6 text-center">
          <a 
            href="https://status.calliotel.com" 
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center space-x-2 text-sm font-semibold transition-colors ${
              darkMode 
                ? 'text-gray-400 hover:text-gray-300' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>View Live System Status</span>
            <Zap className="w-4 h-4 text-green-500" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default MultiCarrierBadge;
