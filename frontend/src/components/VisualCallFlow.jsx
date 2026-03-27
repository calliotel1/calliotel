import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { User, Cloud, Smartphone, Monitor, Tablet, Zap } from 'lucide-react';

const VisualCallFlow = () => {
  const { darkMode } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    let animationFrame;
    let flowPhase = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width/2, height/2);

      // Define positions for 3 main nodes
      const nodes = [
        { x: width/8, y: height/4, label: 'Your Business', color: '#3B82F6' },
        { x: width/4, y: height/4, label: 'Calliotel Cloud', color: '#8B5CF6' },
        { x: width/2 - width/8, y: height/4, label: 'Any Device', color: '#10B981' }
      ];

      // Draw connections with animated data flow
      for (let i = 0; i < nodes.length - 1; i++) {
        const start = nodes[i];
        const end = nodes[i + 1];

        // Connection line
        const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        gradient.addColorStop(0, darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.5)');
        gradient.addColorStop(0.5, darkMode ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.7)');
        gradient.addColorStop(1, darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.5)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Animated data packets (dots moving along line)
        const numPackets = 3;
        for (let p = 0; p < numPackets; p++) {
          const offset = (p / numPackets);
          const packetPos = (flowPhase + offset) % 1;
          const packetX = start.x + (end.x - start.x) * packetPos;
          const packetY = start.y + (end.y - start.y) * packetPos;

          ctx.beginPath();
          ctx.arc(packetX, packetY, 5, 0, Math.PI * 2);
          ctx.fillStyle = darkMode ? 'rgba(139, 92, 246, 0.9)' : 'rgba(139, 92, 246, 1)';
          ctx.fill();

          // Glow
          ctx.beginPath();
          ctx.arc(packetX, packetY, 8, 0, Math.PI * 2);
          ctx.fillStyle = darkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.3)';
          ctx.fill();
        }
      }

      // Draw nodes
      nodes.forEach((node, index) => {
        // Outer glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, 35 + Math.sin(flowPhase * Math.PI * 2) * 3, 0, Math.PI * 2);
        ctx.fillStyle = darkMode ? `${node.color}20` : `${node.color}30`;
        ctx.fill();

        // Main circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
        const nodeGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 30);
        nodeGradient.addColorStop(0, node.color);
        nodeGradient.addColorStop(1, node.color + 'CC');
        ctx.fillStyle = nodeGradient;
        ctx.fill();

        // Label
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = darkMode ? '#E5E7EB' : '#374151';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 55);
      });

      flowPhase += 0.01;
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [darkMode]);

  const steps = [
    {
      icon: <User className="w-8 h-8" />,
      title: 'Your Business',
      description: 'Start with your website, app, or CRM system',
      color: 'from-ember to-ember-light'
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: 'Calliotel Cloud',
      description: 'Enterprise-grade global infrastructure with 99.99% uptime',
      color: 'from-ember to-ember-light',
      features: ['Load Balancing', 'Auto-Scaling', 'Redundancy', 'DDoS Protection']
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Any Device',
      description: 'Reach customers on phone, desktop, or tablet worldwide',
      color: 'from-green-500 to-green-600'
    }
  ];

  const devices = [
    { icon: <Smartphone className="w-6 h-6" />, name: 'Mobile' },
    { icon: <Monitor className="w-6 h-6" />, name: 'Desktop' },
    { icon: <Tablet className="w-6 h-6" />, name: 'Tablet' }
  ];

  return (
    <div className={`py-24 ${darkMode ? 'bg-gray-900' : 'bg-white'} relative overflow-hidden`}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${
                darkMode
                  ? 'bg-gradient-to-r from-ember/20 to-ember-light/20 text-blue-300'
                  : 'bg-gradient-to-r from-ember/10 to-ember-light/10 text-blue-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>ENTERPRISE INFRASTRUCTURE</span>
            </span>
          </div>
          <h2 className={`text-4xl sm:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How <span className="bg-gradient-to-r from-ember via-ember to-green-500 bg-clip-text text-transparent">Calliotel</span> Works
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Cloud-native VoIP infrastructure designed for scale. From startup to enterprise.
          </p>
        </div>

        {/* Animated Flow Diagram */}
        <div className="mb-16">
          <canvas
            ref={canvasRef}
            className="w-full h-64 rounded-2xl"
            style={{ maxHeight: '250px' }}
          />
        </div>

        {/* Detailed Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-ember to-ember-light opacity-30 z-0">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-purple-500"></div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 z-10 ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    : 'bg-white/80 border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-4`}>
                  {step.icon}
                </div>

                <div className="mb-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      STEP {index + 1}
                    </span>
                  </div>
                  <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {step.title}
                  </h3>
                </div>

                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {step.description}
                </p>

                {step.features && (
                  <div className="space-y-1">
                    {step.features.map((feature, idx) => (
                      <div key={idx} className={`text-xs flex items-center space-x-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        <div className="w-1 h-1 rounded-full bg-ember"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Device Grid */}
        <div className={`rounded-2xl p-8 border-2 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-2xl font-black mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Works on Every Device
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {devices.map((device, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl text-center transition-all hover:scale-105 ${
                  darkMode ? 'bg-gray-700/50' : 'bg-white'
                }`}
              >
                <div className="flex justify-center mb-3 text-green-500">
                  {device.icon}
                </div>
                <span className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {device.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specs */}
        <div className="mt-16 grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`text-4xl font-black mb-2 bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent`}>
              99.99%
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Uptime SLA
            </div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-black mb-2 bg-gradient-to-r from-ember to-green-500 bg-clip-text text-transparent`}>
              &lt;50ms
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              API Latency
            </div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-black mb-2 bg-gradient-to-r from-green-500 to-ember-light bg-clip-text text-transparent`}>
              50+
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Countries
            </div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-black mb-2 bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent`}>
              24/7
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualCallFlow;
