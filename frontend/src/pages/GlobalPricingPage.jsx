import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Globe } from 'lucide-react';
import InteractivePricingMap from '../components/InteractivePricingMap';

const GlobalPricingPage = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-black'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-black'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Global Pricing Exchange
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Real-time rates across 50+ countries
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InteractivePricingMap />
      </main>
    </div>
  );
};

export default GlobalPricingPage;
