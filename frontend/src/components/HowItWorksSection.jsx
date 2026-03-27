import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Globe, Zap, Phone, ArrowRight } from 'lucide-react';

const HowItWorksSection = () => {
  const { darkMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const steps = [
    {
      number: '1',
      title: 'Select',
      description: 'Pick your country and number type',
      detail: 'Browse 50+ countries',
      icon: <Globe className="w-8 h-8" />,
      gradient: 'from-ember to-cyan-500',
      color: 'blue',
      delay: '0ms',
      shape: (
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#blue-gradient)" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="url(#blue-gradient)" strokeWidth="2" opacity="0.5" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="url(#blue-gradient)" strokeWidth="2" opacity="0.3" />
        </svg>
      )
    },
    {
      number: '2',
      title: 'Activate',
      description: 'Instant setup via our automated API',
      detail: 'Takes 60 seconds',
      icon: <Zap className="w-8 h-8" />,
      gradient: 'from-ember to-ember-light/50',
      color: 'purple',
      delay: '200ms',
      shape: (
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          <polygon points="100,20 180,180 20,180" fill="url(#purple-gradient)" />
          <polygon points="100,40 160,160 40,160" fill="none" stroke="url(#purple-gradient)" strokeWidth="2" opacity="0.5" />
        </svg>
      )
    },
    {
      number: '3',
      title: 'Connect',
      description: 'Start receiving SMS and calls immediately',
      detail: 'Works with WhatsApp, Telegram, etc.',
      icon: <Phone className="w-8 h-8" />,
      gradient: 'from-orange-500 to-red-500',
      color: 'orange',
      delay: '400ms',
      shape: (
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          <rect x="40" y="40" width="120" height="120" rx="15" fill="url(#orange-gradient)" />
          <rect x="50" y="50" width="100" height="100" rx="10" fill="none" stroke="url(#orange-gradient)" strokeWidth="2" opacity="0.5" />
        </svg>
      )
    }
  ];

  return (
    <div
      ref={sectionRef}
      className={`py-24 relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
    >
      {/* Background Gradient Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                darkMode
                  ? 'bg-gradient-to-r from-ember/20 to-ember-light/20 text-blue-300'
                  : 'bg-gradient-to-r from-ember/10 to-ember-light/10 text-blue-700'
              }`}
            >
              SIMPLE & FAST
            </span>
          </div>
          <h2
            className={`text-4xl sm:text-5xl font-black mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Get Started in 3 Simple Steps
          </h2>
          <p
            className={`text-xl ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            } max-w-2xl mx-auto`}
          >
            No complex setup. No waiting. Your virtual number is ready in under 60 seconds.
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Progress Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/4 left-0 right-0 h-1 -translate-y-1/2">
            <div
              className={`h-full mx-auto ${
                darkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}
              style={{ width: 'calc(100% - 200px)' }}
            >
              <div
                className={`h-full bg-gradient-to-r from-ember via-ember to-orange-500 transition-all duration-1000 ${
                  isVisible ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative transition-all duration-700 ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: step.delay }}
              >
                {/* Glass Card */}
                <div
                  className={`relative p-8 rounded-3xl border transition-all duration-500 hover:scale-105 ${
                    darkMode
                      ? 'bg-white/5 border-white/10 hover:border-white/20'
                      : 'bg-white/60 border-white/80 hover:border-white/100'
                  }`}
                  style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Abstract Shape Background */}
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    {step.shape}
                  </div>

                  {/* Step Number Circle */}
                  <div className="relative flex justify-center mb-6">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black bg-gradient-to-br ${step.gradient} shadow-lg relative z-10`}
                      style={{
                        boxShadow: `0 10px 40px rgba(${
                          step.color === 'blue'
                            ? '59, 130, 246'
                            : step.color === 'purple'
                            ? '168, 85, 247'
                            : '249, 115, 22'
                        }, 0.3)`,
                      }}
                    >
                      {step.number}
                      
                      {/* Pulsing Ring */}
                      <div
                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.gradient} animate-ping opacity-20`}
                      />
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="relative flex justify-center mb-4">
                    <div className={`text-${step.color}-500`}>
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative text-center">
                    <h3
                      className={`text-2xl font-black mb-3 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-base mb-4 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {step.description}
                    </p>
                    <div
                      className={`inline-flex items-center text-sm font-semibold ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full bg-gradient-to-br ${step.gradient} mr-2`}
                      />
                      {step.detail}
                    </div>
                  </div>

                  {/* Arrow (Not on last card) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/4 -right-6 transform -translate-y-1/2">
                      <ArrowRight
                        className={`w-6 h-6 ${
                          darkMode ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p
            className={`text-sm ${
              darkMode ? 'text-gray-500' : 'text-gray-500'
            } mb-6`}
          >
            Join thousands of businesses using Calliotel
          </p>
          <button
            onClick={() => window.location.href = '/signup'}
            className="px-10 py-4 bg-gradient-to-r from-ember to-ember-light text-white font-bold rounded-full hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 mx-auto"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
