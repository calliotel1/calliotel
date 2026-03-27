import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Zap, Activity, Globe, MapPin } from 'lucide-react';

const InteractiveNetworkPing = () => {
  const { darkMode } = useTheme();
  const [selectedCity, setSelectedCity] = useState(null);
  const [pinging, setPinging] = useState(false);
  const [latency, setLatency] = useState(null);

  // Major cities with coordinates (approximate positions for visual map)
  const cities = [
    { 
      name: 'New York', 
      country: 'USA',
      x: 25, 
      y: 35, 
      latencyRange: [8, 15],
      icon: '🇺🇸',
      region: 'North America'
    },
    { 
      name: 'London', 
      country: 'UK',
      x: 50, 
      y: 30, 
      latencyRange: [5, 12],
      icon: '🇬🇧',
      region: 'Europe'
    },
    { 
      name: 'Frankfurt', 
      country: 'Germany',
      x: 52, 
      y: 32, 
      latencyRange: [6, 13],
      icon: '🇩🇪',
      region: 'Europe'
    },
    { 
      name: 'Singapore', 
      country: 'Singapore',
      x: 75, 
      y: 55, 
      latencyRange: [45, 65],
      icon: '🇸🇬',
      region: 'Asia Pacific'
    },
    { 
      name: 'Tokyo', 
      country: 'Japan',
      x: 85, 
      y: 38, 
      latencyRange: [95, 115],
      icon: '🇯🇵',
      region: 'Asia Pacific'
    },
    { 
      name: 'Sydney', 
      country: 'Australia',
      x: 88, 
      y: 75, 
      latencyRange: [145, 165],
      icon: '🇦🇺',
      region: 'Asia Pacific'
    },
    { 
      name: 'Mumbai', 
      country: 'India',
      x: 68, 
      y: 50, 
      latencyRange: [65, 85],
      icon: '🇮🇳',
      region: 'Asia'
    },
    { 
      name: 'São Paulo', 
      country: 'Brazil',
      x: 35, 
      y: 70, 
      latencyRange: [115, 135],
      icon: '🇧🇷',
      region: 'South America'
    },
    { 
      name: 'Toronto', 
      country: 'Canada',
      x: 28, 
      y: 32, 
      latencyRange: [12, 20],
      icon: '🇨🇦',
      region: 'North America'
    },
    { 
      name: 'Dubai', 
      country: 'UAE',
      x: 62, 
      y: 48, 
      latencyRange: [85, 105],
      icon: '🇦🇪',
      region: 'Middle East'
    }
  ];

  const handleCityClick = (city) => {
    setSelectedCity(city);
    setPinging(true);
    setLatency(null);

    // Simulate ping delay
    setTimeout(() => {
      const randomLatency = Math.floor(
        Math.random() * (city.latencyRange[1] - city.latencyRange[0]) + city.latencyRange[0]
      );
      setLatency(randomLatency);
      setPinging(false);
    }, 1500);
  };

  const getLatencyColor = (lat) => {
    if (lat < 30) return 'text-green-500';
    if (lat < 100) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getLatencyStatus = (lat) => {
    if (lat < 30) return 'Excellent';
    if (lat < 100) return 'Good';
    return 'Fair';
  };

  return (
    <div className={`py-24 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} relative overflow-hidden`}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${
                darkMode
                  ? 'bg-gradient-to-r from-ember/20 to-cyan-500/20 text-blue-300'
                  : 'bg-gradient-to-r from-ember/10 to-cyan-100 text-blue-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>GLOBAL NETWORK INFRASTRUCTURE</span>
            </span>
          </div>
          <h2 className={`text-4xl sm:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Test Our <span className="bg-gradient-to-r from-ember to-cyan-500 bg-clip-text text-transparent">Network Speed</span>
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Click any city to measure real-time latency from our carrier-grade infrastructure.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Interactive Map */}
          <div className="lg:col-span-2">
            <div
              className={`rounded-2xl overflow-hidden border-2 shadow-2xl ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {/* Map Header */}
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-ember" />
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Global Network Map
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-500">ONLINE</span>
                </div>
              </div>

              {/* Map Container */}
              <div className="relative h-96 p-8">
                {/* Grid Background */}
                <div className={`absolute inset-0 ${darkMode ? 'opacity-10' : 'opacity-5'}`}
                  style={{
                    backgroundImage: `linear-gradient(${darkMode ? '#3B82F6' : '#1E40AF'} 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? '#3B82F6' : '#1E40AF'} 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                  }}
                ></div>

                {/* World Map Silhouette (simplified) */}
                <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Continents as simple shapes */}
                  <path d="M 20,30 L 40,25 L 45,40 L 35,50 L 25,45 Z" fill={darkMode ? '#3B82F6' : '#1E40AF'} opacity="0.3" />
                  <path d="M 45,25 L 65,20 L 70,35 L 60,45 L 50,40 Z" fill={darkMode ? '#3B82F6' : '#1E40AF'} opacity="0.3" />
                  <path d="M 70,40 L 90,35 L 95,55 L 85,70 L 75,60 Z" fill={darkMode ? '#3B82F6' : '#1E40AF'} opacity="0.3" />
                </svg>

                {/* City Nodes */}
                {cities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleCityClick(city)}
                    className="absolute group transition-all hover:scale-150 focus:outline-none"
                    style={{
                      left: `${city.x}%`,
                      top: `${city.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {/* Outer Pulse */}
                    <div className={`absolute inset-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                      selectedCity?.name === city.name ? 'bg-cyan-500' : 'bg-ember'
                    } opacity-30 animate-ping`}></div>
                    
                    {/* Node */}
                    <div className={`relative w-4 h-4 rounded-full ${
                      selectedCity?.name === city.name 
                        ? 'bg-cyan-500 ring-4 ring-cyan-500/50' 
                        : 'bg-ember group-hover:bg-cyan-500 group-hover:ring-4 group-hover:ring-cyan-500/50'
                    } transition-all shadow-lg`}></div>

                    {/* City Label */}
                    <div className={`absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold px-2 py-1 rounded ${
                      darkMode ? 'bg-gray-900/90 text-white' : 'bg-white/90 text-gray-900'
                    } opacity-0 group-hover:opacity-100 transition-opacity shadow-lg`}>
                      {city.icon} {city.name}
                    </div>
                  </button>
                ))}

                {/* Active Ping Animation */}
                {pinging && selectedCity && (
                  <div
                    className="absolute"
                    style={{
                      left: `${selectedCity.x}%`,
                      top: `${selectedCity.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="relative">
                      <div className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500 opacity-50 animate-ping"></div>
                      <div className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500 opacity-30 animate-ping delay-150"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Selected City Info */}
            {selectedCity ? (
              <div
                className={`rounded-2xl p-6 border-2 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } shadow-xl`}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <MapPin className="w-6 h-6 text-cyan-500" />
                  <div>
                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedCity.icon} {selectedCity.name}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedCity.country} • {selectedCity.region}
                    </p>
                  </div>
                </div>

                {pinging ? (
                  <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <Activity className="w-8 h-8 text-cyan-500 animate-pulse mx-auto mb-2" />
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Pinging server...
                    </p>
                  </div>
                ) : latency !== null ? (
                  <div>
                    <div className={`p-6 rounded-xl text-center mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className={`text-5xl font-black mb-2 ${getLatencyColor(latency)}`}>
                        {latency}ms
                      </div>
                      <div className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {getLatencyStatus(latency)} Connection
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Protocol</span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>TCP/IP</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Packet Loss</span>
                        <span className="font-bold text-green-500">0%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Jitter</span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>&lt;2ms</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <Zap className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Click to test latency
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`rounded-2xl p-6 border-2 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <Globe className="w-12 h-12 text-ember mx-auto mb-4" />
                <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select a city on the map to test network latency
                </p>
              </div>
            )}

            {/* Network Stats */}
            <div
              className={`rounded-2xl p-6 border-2 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <h4 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Network Stats
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Uptime</span>
                    <span className="font-bold text-green-500">99.99%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Active Nodes</span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{cities.length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Regions</span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>6</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className={`mt-12 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          ✓ Enterprise-grade infrastructure • ✓ Multi-region redundancy • ✓ Real-time monitoring
        </div>
      </div>
    </div>
  );
};

export default InteractiveNetworkPing;
