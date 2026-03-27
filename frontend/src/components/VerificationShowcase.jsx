import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const VerificationShowcase = () => {
  const { darkMode } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const verifiedServices = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      ),
      successRate: '99.8%',
      verified: true,
      bestFor: 'WhatsApp Business API & 2FA verification'
    },
    {
      name: 'Telegram',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="#0088cc">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      successRate: '99.9%',
      verified: true,
      bestFor: 'Private messaging & bot development'
    },
    {
      name: 'Tinder',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="#FF6B6B">
          <path d="M8.21 10.08c-.02 0-.04 0-.06-.02-.67-.9-.84-2.44-.89-3.03 0-.11-.13-.18-.23-.12C4.93 8.08 3 10.86 3 13.54 3 18.14 6.2 22 11.7 22c5.15 0 8.7-3.98 8.7-8.46 0-5.87-4.2-9.77-7.93-11.53a.13.13 0 0 0-.19.14c.48 3.16-.18 6.6-4.07 7.93z"/>
        </svg>
      ),
      successRate: '98.5%',
      verified: true,
      bestFor: 'Dating app verification & social profiles'
    },
    {
      name: 'Google',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      successRate: '99.7%',
      verified: true,
      bestFor: 'Gmail account creation & Google services'
    },
    {
      name: 'Discord',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="#5865F2">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      ),
      successRate: '99.5%',
      verified: true,
      bestFor: 'Gaming communities & server verification'
    },
    {
      name: 'Instagram',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
          <defs>
            <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FD5949" />
              <stop offset="50%" stopColor="#D6249F" />
              <stop offset="100%" stopColor="#285AEB" />
            </linearGradient>
          </defs>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      successRate: '98.9%',
      verified: true,
      bestFor: 'Influencer accounts & business profiles'
    }
  ];

  return (
    <div className={`py-24 relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                darkMode
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300'
                  : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
              }`}
            >
              ✅ 100% VERIFIED
            </span>
          </div>
          <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Works With Your Favorite Apps
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Our numbers are tested and verified to work seamlessly with the world's most popular platforms.
          </p>
        </div>

        {/* Verification Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {verifiedServices.map((service, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                darkMode
                  ? 'bg-gray-800/50 border-gray-700 hover:border-green-500/50'
                  : 'bg-white/80 border-gray-200 hover:border-green-500/50'
              }`}
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              {/* Verified Badge */}
              <div className="absolute -top-3 -right-3">
                <div className="bg-green-500 rounded-full p-2 shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Service Icon */}
              <div className="flex justify-center mb-4">
                {service.icon}
              </div>

              {/* Service Name */}
              <h3 className={`text-xl font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {service.name}
              </h3>

              {/* Verified Text */}
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-green-500 font-bold text-sm">VERIFIED</span>
              </div>

              {/* Success Rate */}
              <div className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Success Rate: <span className="font-bold text-green-500">{service.successRate}</span>
              </div>

              {/* Hover Tooltip - "Best For" */}
              {hoveredIndex === index && service.bestFor && (
                <div className={`mt-4 p-3 rounded-xl transition-all duration-300 ${
                  darkMode ? 'bg-gray-700/80' : 'bg-orange-50'
                }`}>
                  <div className="text-xs font-semibold text-orange-500 mb-1">BEST FOR:</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {service.bestFor}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div
          className={`p-8 rounded-2xl border ${
            darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
          }`}
          style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className={`text-4xl font-black mb-2 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent`}>
                99.5%+
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Overall Success Rate
              </div>
            </div>
            <div>
              <div className={`text-4xl font-black mb-2 bg-gradient-to-r from-ember to-cyan-500 bg-clip-text text-transparent`}>
                50M+
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Verifications Completed
              </div>
            </div>
            <div>
              <div className={`text-4xl font-black mb-2 bg-gradient-to-r from-ember to-ember-light/50 bg-clip-text text-transparent`}>
                24/7
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Instant Activation
              </div>
            </div>
          </div>
        </div>

        {/* Trust Statement */}
        <div className="text-center mt-8">
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            🔒 All numbers tested daily • No blocks • No bans • Guaranteed compatibility
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationShowcase;
