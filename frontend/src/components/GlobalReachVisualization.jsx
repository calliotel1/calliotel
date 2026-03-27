import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const GlobalReachVisualization = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [hoveredCity, setHoveredCity] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Major cities with stock counts and country codes
    const cities = [
      { name: 'New York', x: width/2 - 150, y: height/2 - 50, connections: [1, 2], stock: 234, country: 'US' },
      { name: 'London', x: width/2, y: height/2 - 70, connections: [2, 3], stock: 189, country: 'GB' },
      { name: 'Tokyo', x: width/2 + 150, y: height/2 - 30, connections: [0, 3], stock: 142, country: 'JP' },
      { name: 'Sydney', x: width/2 + 120, y: height/2 + 80, connections: [1], stock: 97, country: 'AU' },
    ];

    // Handle canvas click
    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * 2;
      const y = (e.clientY - rect.top) * 2;

      cities.forEach(city => {
        const distance = Math.sqrt(Math.pow(x - city.x, 2) + Math.pow(y - city.y, 2));
        if (distance < 20) {
          // Navigate to browse page with country filter
          navigate(`/browse-numbers?country=${city.country}`);
        }
      });
    };

    // Handle canvas hover
    const handleCanvasMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * 2;
      const y = (e.clientY - rect.top) * 2;

      let foundCity = null;
      cities.forEach(city => {
        const distance = Math.sqrt(Math.pow(x - city.x, 2) + Math.pow(y - city.y, 2));
        if (distance < 20) {
          foundCity = city;
          canvas.style.cursor = 'pointer';
        }
      });

      if (!foundCity) {
        canvas.style.cursor = 'default';
      }

      setHoveredCity(foundCity);
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);

    let animationFrame;
    let pulsePhase = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width/2, height/2);

      // Draw connections
      cities.forEach((city, i) => {
        city.connections.forEach(targetIndex => {
          const target = cities[targetIndex];
          
          // Animated gradient line
          const gradient = ctx.createLinearGradient(city.x, city.y, target.x, target.y);
          gradient.addColorStop(0, darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)');
          gradient.addColorStop(0.5, darkMode ? 'rgba(147, 51, 234, 0.5)' : 'rgba(147, 51, 234, 0.6)');
          gradient.addColorStop(1, darkMode ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.4)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(city.x, city.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();

          // Animated pulse along the line
          const pulsePos = (pulsePhase + i * 0.3) % 1;
          const pulseX = city.x + (target.x - city.x) * pulsePos;
          const pulseY = city.y + (target.y - city.y) * pulsePos;

          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 4, 0, Math.PI * 2);
          ctx.fillStyle = darkMode ? 'rgba(147, 51, 234, 0.8)' : 'rgba(147, 51, 234, 1)';
          ctx.fill();
        });
      });

      // Draw city nodes
      cities.forEach(city => {
        const isHovered = hoveredCity && hoveredCity.name === city.name;
        
        // Stock-based glow intensity
        const glowIntensity = city.stock / 250; // 0 to 1 based on stock
        
        // Outer glow (brighter for higher stock)
        ctx.beginPath();
        ctx.arc(city.x, city.y, 12 + Math.sin(pulsePhase * Math.PI * 2) * 2 + (isHovered ? 4 : 0), 0, Math.PI * 2);
        ctx.fillStyle = darkMode 
          ? `rgba(59, 130, 246, ${0.2 + glowIntensity * 0.3})` 
          : `rgba(59, 130, 246, ${0.3 + glowIntensity * 0.3})`;
        ctx.fill();

        // Main node (larger if hovered)
        ctx.beginPath();
        ctx.arc(city.x, city.y, isHovered ? 10 : 8, 0, Math.PI * 2);
        const nodeGradient = ctx.createRadialGradient(city.x, city.y, 0, city.x, city.y, isHovered ? 10 : 8);
        nodeGradient.addColorStop(0, darkMode ? '#60A5FA' : '#3B82F6');
        nodeGradient.addColorStop(1, darkMode ? '#3B82F6' : '#1E40AF');
        ctx.fillStyle = nodeGradient;
        ctx.fill();

        // City name
        ctx.font = isHovered ? 'bold 14px sans-serif' : '12px sans-serif';
        ctx.fillStyle = darkMode ? '#E5E7EB' : '#374151';
        ctx.textAlign = 'center';
        ctx.fillText(city.name, city.x, city.y + 25);
        
        // Stock count
        if (isHovered) {
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#10B981';
          ctx.fillText(`${city.stock} available`, city.x, city.y + 40);
        }
      });

      pulsePhase += 0.01;
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
    };
  }, [darkMode, hoveredCity, navigate]);

  return (
    <div className={`py-24 relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-block mb-4">
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  darkMode
                    ? 'bg-gradient-to-r from-ember/20 to-ember-light/20 text-blue-300'
                    : 'bg-gradient-to-r from-ember/10 to-ember-light/10 text-blue-700'
                }`}
              >
                🌍 GLOBAL COVERAGE
              </span>
            </div>
            <h2 className={`text-4xl sm:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Connected Worldwide
            </h2>
            <p className={`text-xl mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Our carrier-grade infrastructure spans 50+ countries with direct connections to major telecom providers.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-4xl font-black bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent mb-2">
                  50+
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Countries
                </div>
              </div>
              <div>
                <div className="text-4xl font-black bg-gradient-to-r from-ember to-ember-light/50 bg-clip-text text-transparent mb-2">
                  99.9%
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Uptime SLA
                </div>
              </div>
              <div>
                <div className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                  &lt;50ms
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Avg Latency
                </div>
              </div>
              <div>
                <div className="text-4xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Support
                </div>
              </div>
            </div>
          </div>

          {/* Right: Network Visualization */}
          <div className="relative">
            <div
              className={`relative p-8 rounded-3xl border ${
                darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'
              }`}
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-96 rounded-2xl"
                style={{ width: '100%', height: '384px' }}
              />

              {/* Floating particles decoration */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-ember rounded-full animate-ping"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-ember rounded-full animate-ping delay-300"></div>
              <div className="absolute top-1/2 right-8 w-2 h-2 bg-orange-500 rounded-full animate-ping delay-500"></div>
            </div>

            {/* Caption */}
            <div className={`text-center mt-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Real-time network visualization • Live connections across major hubs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalReachVisualization;
