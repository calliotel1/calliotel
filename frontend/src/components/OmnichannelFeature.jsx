import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { MessageSquare, Phone, Headphones, Zap, CheckCircle, Globe } from 'lucide-react';

const OmnichannelFeature = () => {
  const { darkMode } = useTheme();

  const channels = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      name: 'WhatsApp Business',
      color: 'from-green-500 to-emerald-500',
      features: ['Business API', 'Rich Media', 'Quick Replies', 'Catalog Integration']
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      name: 'SMS & MMS',
      color: 'from-ember to-cyan-500',
      features: ['Global Reach', 'Delivery Reports', 'Two-Way Messaging', 'Link Tracking']
    },
    {
      icon: <Phone className="w-8 h-8" />,
      name: 'Voice Calls',
      color: 'from-ember to-ember-light/50',
      features: ['HD Quality', 'Call Recording', 'Voicemail-to-Email', 'IVR Menus']
    }
  ];

  const useCases = [
    {
      icon: <Headphones className="w-6 h-6" />,
      title: 'Customer Support',
      description: 'Unified inbox for all channels. Never miss a customer message.',
      example: 'Customer starts on WhatsApp, continues via SMS, calls if urgent'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Marketing Campaigns',
      description: 'Send bulk campaigns, track engagement across all channels.',
      example: 'SMS promo → WhatsApp follow-up → Voice reminder = 3x conversion'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Business',
      description: 'One number works worldwide. Local presence, global reach.',
      example: 'UK number receives WhatsApp from India, SMS from US, calls from EU'
    }
  ];

  return (
    <div className={`py-24 ${darkMode ? 'bg-gray-900' : 'bg-white'} relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${
                darkMode
                  ? 'bg-gradient-to-r from-green-500/20 to-ember-light/20 text-green-300'
                  : 'bg-gradient-to-r from-green-100 to-ember-light/10 text-green-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>TRUE OMNICHANNEL SUPPORT</span>
            </span>
          </div>
          <h2 className={`text-4xl sm:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            One Number, <span className="bg-gradient-to-r from-green-500 via-blue-500 to-ember-light bg-clip-text text-transparent">Three Channels</span>
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto mb-8`}>
            Unlike basic SMS-only providers, Calliotel gives you WhatsApp, SMS, <strong>and</strong> Voice 
            — all managed from one unified dashboard.
          </p>
          
          {/* Premium Badge */}
          <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-ember-light/50 text-white font-bold shadow-lg">
            <Zap className="w-5 h-5" />
            <span>Premium Feature - Not Available on Cheap Platforms</span>
          </div>
        </div>

        {/* Channels Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {channels.map((channel, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 group ${
                darkMode
                  ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  : 'bg-white/80 border-gray-200 hover:border-gray-300'
              }`}
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${channel.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                {channel.icon}
              </div>

              {/* Channel Name */}
              <h3 className={`text-2xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {channel.name}
              </h3>

              {/* Features */}
              <ul className="space-y-2">
                {channel.features.map((feature, idx) => (
                  <li key={idx} className={`flex items-center space-x-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Glow Effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${channel.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>
            </div>
          ))}
        </div>

        {/* Unified Dashboard Preview */}
        <div className={`rounded-2xl overflow-hidden border-2 mb-20 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-2xl`}>
          <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Unified Inbox - All Channels in One Place
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-500">LIVE</span>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mock Inbox View */}
              <div className="space-y-3">
                {/* WhatsApp Message */}
                <div className={`p-4 rounded-xl flex items-start space-x-3 ${darkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>+44 20 1234 5678</span>
                      <span className="text-xs text-green-500">WhatsApp</span>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      "Hi! Can I get a quote for your service?"
                    </p>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>2 min ago</span>
                  </div>
                </div>

                {/* SMS Message */}
                <div className={`p-4 rounded-xl flex items-start space-x-3 ${darkMode ? 'bg-blue-900/20 border border-ember/30' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ember to-cyan-500 flex items-center justify-center text-white flex-shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>+1 555 0123</span>
                      <span className="text-xs text-ember">SMS</span>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      "Order confirmed! Tracking: #ABC123"
                    </p>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>5 min ago</span>
                  </div>
                </div>

                {/* Voice Call */}
                <div className={`p-4 rounded-xl flex items-start space-x-3 ${darkMode ? 'bg-olive/20 border border-ember/30' : 'bg-ember/5 border border-ember/20'}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ember to-ember-light/50 flex items-center justify-center text-white flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>+49 30 12345</span>
                      <span className="text-xs text-ember">Voice</span>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Missed call (3:42 duration) - Voicemail available
                    </p>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>12 min ago</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Never Miss a Message
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      All channels in one inbox. Reply from any device, anytime.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Seamless Handoffs
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Customer starts on WhatsApp, escalates to voice. Full context preserved.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Smart Routing
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      AI-powered routing based on urgency, time zone, and channel preference.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div>
          <h3 className={`text-3xl font-black text-center mb-12 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Real-World Use Cases
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-ember-light/50 flex items-center justify-center text-white mb-4">
                  {useCase.icon}
                </div>
                <h4 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {useCase.title}
                </h4>
                <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {useCase.description}
                </p>
                <div className={`p-3 rounded-lg text-xs italic ${darkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-white text-gray-600'}`}>
                  💡 {useCase.example}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={() => window.location.href = '/browse-numbers'}
            className="px-8 py-4 bg-gradient-to-r from-green-500 via-blue-500 to-ember-light text-white font-bold text-lg rounded-xl shadow-2xl hover:scale-105 transition-all"
          >
            Get Your Omnichannel Number Now →
          </button>
          <p className={`mt-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            All channels included • No extra fees • 24/7 support
          </p>
        </div>
      </div>
    </div>
  );
};

export default OmnichannelFeature;
