import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Mic, Clock, Eye, Sparkles, Zap, Shield, Globe, MessageSquare, Phone, Star, Check, ArrowRight, Play, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import TrustedByBar from '../components/TrustedByBar';

const LandingPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Video className="w-12 h-12" />,
      title: "Voice-Changed Videos",
      description: "Send videos with Darth Vader, Chipmunk, or Robot voice. NO competitor has this!",
      gradient: "from-ember to-ember-light",
      emoji: "🎤",
      badge: "UNIQUE"
    },
    {
      icon: <Clock className="w-12 h-12" />,
      title: "Scheduled Videos",
      description: "Record now, send later. Schedule birthday videos, reminders, or surprises!",
      gradient: "from-ember to-ember-light",
      emoji: "📅",
      badge: "EXCLUSIVE"
    },
    {
      icon: <Sparkles className="w-12 h-12" />,
      title: "Fun Filters",
      description: "Transform into Cat 🐱, Dog 🐶, Donkey 🫏, Alien 👽, or add Vintage effects!",
      gradient: "from-orange-600 to-red-600",
      emoji: "🎨",
      badge: "VIRAL"
    },
    {
      icon: <Eye className="w-12 h-12" />,
      title: "View-Once Messages",
      description: "Self-destructing videos & messages. Perfect for private moments.",
      gradient: "from-ember to-ember-light",
      emoji: "🔒",
      badge: "PRIVACY"
    },
    {
      icon: <Mic className="w-12 h-12" />,
      title: "Voice Cloning",
      description: "Clone your voice with AI. Create custom voices for calls & messages.",
      gradient: "from-ember to-ember-light",
      emoji: "🎙️",
      badge: "AI-POWERED"
    },
    {
      icon: <Phone className="w-12 h-12" />,
      title: "Virtual Numbers",
      description: "Get numbers from 50+ countries. $1.99/month with auto-renew.",
      gradient: "from-green-600 to-emerald-600",
      emoji: "📞",
      badge: "AFFORDABLE"
    }
  ];

  const stats = [
    { number: "22+", label: "Features", icon: <Zap /> },
    { number: "50+", label: "Countries", icon: <Globe /> },
    { number: "69", label: "Filters", icon: <Sparkles /> },
    { number: "7", label: "Voice Effects", icon: <Mic /> }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section - CLEAN & PROFESSIONAL */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 border-b border-gray-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="mb-6 inline-flex items-center px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <Zap className="w-4 h-4 text-orange-400 mr-2" />
            <span className="text-orange-400 text-sm font-semibold">Global Virtual Phone Solutions</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
            Virtual Numbers for
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              WhatsApp & Telegram
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Instant activation • 250+ countries • Affordable pricing • No contracts
          </p>

          {/* Main CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => navigate('/verification')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg hover:shadow-[0_4px_20px_rgba(255,140,0,0.6)] hover:scale-105 transition-all shadow-lg text-lg"
            >
              Get Virtual Number Now →
            </button>
            <button
              onClick={() => navigate('/smm-marketplace')}
              className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white font-bold rounded-lg hover:bg-white/20 transition-all border border-white/20"
            >
              View All Services
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span>250+ Countries</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-400" />
              <span>Instant Activation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core 4 Services Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white">
          Professional Communication Solutions
        </h2>
        <p className="text-center mb-12 text-gray-400">
          Everything you need to connect globally
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Virtual Numbers */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500 transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-700 rounded-lg flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Virtual Numbers</h3>
            <p className="text-gray-400 mb-4 text-sm">Verification & long-term numbers for global communication</p>
            <button
              onClick={() => navigate('/verification')}
              className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Get Started →
            </button>
          </div>

          {/* SMM Growth */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500 transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-700 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">SMM Growth</h3>
            <p className="text-gray-400 mb-4 text-sm">Instagram, TikTok, YouTube followers & engagement</p>
            <button
              onClick={() => navigate('/smm-marketplace')}
              className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Browse Services →
            </button>
          </div>

          {/* Bulk SMS */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500 transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-700 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Bulk SMS</h3>
            <p className="text-gray-400 mb-4 text-sm">Enterprise messaging with 50% profit margins</p>
            <button
              onClick={() => navigate('/bulk-sms')}
              className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Learn More →
            </button>
          </div>

          {/* AI Features */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500 transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI Assistant</h3>
            <p className="text-gray-400 mb-4 text-sm">Affordable AI-powered communication tools</p>
            <button
              onClick={() => navigate('/ai-hub')}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Explore AI →
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">250+</div>
              <div className="text-gray-400">Countries</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">791</div>
              <div className="text-gray-400">Services</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">24/7</div>
              <div className="text-gray-400">Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Connect Globally?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Get started in seconds. No credit card required for browsing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/verification')}
              className="px-8 py-4 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
            >
              Get Virtual Number
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white font-bold rounded-lg hover:bg-white/20 transition-all shadow-xl border border-white/20"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>

      {/* Trusted By Bar - NEW! */}
      <TrustedByBar />

      {/* Ghost Verification Showcase - EXACT DARK DESIGN */}
      <div className="py-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-orange-500 text-sm font-bold uppercase tracking-wider mb-4">
              BROWSE
            </div>
            <h3 className="text-5xl sm:text-6xl font-black text-white mb-4">
              Explore Our Network
            </h3>
            <p className="text-gray-400 text-lg">
              804+ services across 250+ countries — find exactly what you need.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg flex items-center gap-2">
              <span>⚡</span>
              <span>Popular Services</span>
              <span className="text-orange-300 text-sm">804+</span>
            </button>
            <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold rounded-lg flex items-center gap-2 transition">
              <span>🌍</span>
              <span>Top Countries</span>
              <span className="text-gray-500 text-sm">250+</span>
            </button>
          </div>

          {/* Service Grid - EXACT DESIGN */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mb-12">
            {[
              { name: 'Google Chat', color: 'from-gray-600 to-gray-700' },
              { name: 'Google Messenger', color: 'from-ember to-ember-dark' },
              { name: 'Whatsapp', color: 'from-green-500 to-green-600', glow: 'shadow-green-500/50' },
              { name: 'Telegram', color: 'from-ember/40 to-ember-light', glow: 'shadow-blue-500/50' },
              { name: 'facebook', color: 'from-ember to-ember-dark', glow: 'shadow-blue-600/50' },
              { name: 'Google,youtube,Gmail', color: 'from-red-500 to-red-600', glow: 'shadow-red-500/50' },
              { name: 'Twitter', color: 'from-sky-400 to-sky-500', glow: 'shadow-sky-500/50' },
              { name: 'TikTok/Douyin', color: 'from-gray-800 to-black' },
              { name: 'Discord', color: 'from-ember to-ember-light', glow: 'shadow-indigo-500/50' },
              { name: 'Instagram/Threads', color: 'from-ember/50 to-ember-light', glow: 'shadow-pink-500/50' },
              { name: 'PAO Cash', color: 'from-gray-600 to-gray-700' },
              { name: 'Cruzeiro', color: 'from-gray-600 to-gray-700' },
              { name: 'Amazon', color: 'from-gray-700 to-gray-800' },
              { name: 'Microsoft', color: 'from-green-600 to-green-700' },
              { name: 'Ticketmaster', color: 'from-ember to-ember-dark' },
              { name: 'WeChat', color: 'from-green-500 to-green-600' },
              { name: 'Alipay/Alibaba/1688', color: 'from-ember/40 to-ember-light' },
              { name: 'Grindr', color: 'from-yellow-500 to-orange-600' }
            ].map((service, index) => (
              <button
                key={index}
                onClick={() => navigate('/signup')}
                className="group relative bg-gray-800 hover:bg-gray-750 rounded-2xl p-6 transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-gray-600"
              >
                {/* Phone Mockup */}
                <div className={`w-16 h-28 mx-auto mb-4 bg-gradient-to-b ${service.color} rounded-xl flex items-center justify-center relative ${service.glow || ''} group-hover:shadow-2xl transition-shadow`}>
                  <div className="w-12 h-20 bg-black/20 rounded-lg"></div>
                  {/* Glowing dot */}
                  <div className="absolute top-2 w-1 h-1 bg-white/60 rounded-full"></div>
                </div>
                
                {/* Service Name */}
                <div className="text-white text-sm font-medium text-center">
                  {service.name}
                </div>
              </button>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <button
              onClick={() => navigate('/verification')}
              className="group inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-bold transition-colors"
            >
              <span>View all 804+ services</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`py-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className={`text-4xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Revolutionary Features
            </h3>
            <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Features that NO other platform has. Built for the future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`relative group cursor-pointer transform hover:scale-105 transition-all duration-300 ${
                  activeFeature === index ? 'scale-105 shadow-2xl' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-3xl group-hover:opacity-20 transition-opacity`}></div>
                
                <div className={`relative p-8 rounded-3xl ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 bg-gradient-to-r ${feature.gradient} text-white text-xs font-bold rounded-full`}>
                      {feature.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6`}>
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <div className="flex items-center space-x-2 mb-3">
                    <h4 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {feature.title}
                    </h4>
                    <span className="text-3xl">{feature.emoji}</span>
                  </div>
                  
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>

                  {/* Hover Arrow */}
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className={`text-4xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Why Calliotel Wins
            </h3>
            <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Compare us with the competition. We're in a league of our own.
            </p>
          </div>

          <div className={`rounded-3xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-600 to-ember-light">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-bold">Feature</th>
                  <th className="px-6 py-4 text-center text-white font-bold">WhatsApp</th>
                  <th className="px-6 py-4 text-center text-white font-bold">Telegram</th>
                  <th className="px-6 py-4 text-center text-white font-bold">Snapchat</th>
                  <th className="px-6 py-4 text-center text-white font-bold bg-orange-700">Calliotel 👑</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Voice-Changed Videos", values: [false, false, false, true] },
                  { feature: "Scheduled Videos", values: [false, false, false, true] },
                  { feature: "View-Once Messages", values: [true, false, true, true] },
                  { feature: "Fun Filters", values: [false, false, true, true] },
                  { feature: "Voice Cloning", values: [false, false, false, true] },
                  { feature: "Virtual Numbers", values: [false, false, false, true] },
                ].map((row, index) => (
                  <tr key={index} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className={`px-6 py-4 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {row.feature}
                    </td>
                    {row.values.map((value, i) => (
                      <td key={i} className={`px-6 py-4 text-center ${i === 3 ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                        {value ? (
                          <Check className="w-6 h-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-600 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-orange-600 via-pink-600 to-ember-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Ready to Be Different?
          </h3>
          <p className="text-xl text-white/90 mb-12">
            Join the platform that's redefining communication. Start free, no credit card needed.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-12 py-5 bg-white text-orange-600 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all inline-flex items-center space-x-2"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="mt-6 text-white/80 text-sm">
            No credit card required • Free forever • Cancel anytime
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className={`py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-ember-light rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Calliotel
            </h1>
          </div>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2026 Calliotel. The most innovative communication platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
