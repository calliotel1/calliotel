import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  MessageSquare, 
  Languages, 
  Mic, 
  Trophy, 
  Settings, 
  ArrowRight,
  Zap,
  Globe,
  Volume2,
  Target,
  Shield,
  Rocket
} from 'lucide-react';

const AIHubPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { isAuthenticated } = useAuth();

  const aiFeatures = [
    {
      icon: MessageSquare,
      title: 'AI Smart Replies',
      description: 'Instant context-aware message suggestions powered by GPT-4o',
      features: ['3 tone modes', 'Multi-language', 'Conversation aware'],
      gradient: 'from-ember to-orange-600',
      route: '/settings/ai',
      cta: 'Configure Now'
    },
    {
      icon: Languages,
      title: 'AI Translation',
      description: 'Break language barriers - translate to 12+ languages instantly',
      features: ['Real-time', '12+ languages', 'Context-aware'],
      gradient: 'from-blue-600 to-indigo-600',
      route: '/settings/ai',
      cta: 'Enable Translation'
    },
    {
      icon: Mic,
      title: 'AI Voicemail',
      description: 'Smart voicemail transcription and management',
      features: ['Auto-transcription', 'Smart sorting', 'Audio playback'],
      gradient: 'from-purple-600 to-pink-600',
      route: '/voicemail',
      cta: 'Manage Voicemails'
    },
    {
      icon: Trophy,
      title: 'Daily AI Challenges',
      description: 'Win real cash with daily AI-generated trivia challenges',
      features: ['$2 weekly prize', '$10 monthly prize', 'Streak bonuses'],
      gradient: 'from-yellow-600 to-amber-600',
      route: '/daily-challenge',
      cta: 'Play Now',
      badge: '💰 EARN MONEY'
    }
  ];

  const pricingHighlights = [
    {
      icon: Zap,
      title: 'Affordable AI',
      description: 'Professional-grade AI at budget prices',
      color: 'text-ember'
    },
    {
      icon: Shield,
      title: 'Private & Secure',
      description: 'Your data stays encrypted and private',
      color: 'text-blue-400'
    },
    {
      icon: Rocket,
      title: 'Always Updated',
      description: 'Latest AI models, no extra cost',
      color: 'text-purple-400'
    }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-obsidian' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-ember via-orange-600 to-ember-dark opacity-90"></div>
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Main Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
              <Sparkles className="w-14 h-14 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            AI-Powered Communication
            <br />
            <span className="text-yellow-300">At Unbeatable Prices</span>
          </h1>

          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Professional-grade AI features powered by GPT-4o, Gemini, and Claude. 
            <span className="font-bold text-yellow-300"> No expensive subscriptions.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/settings/ai')}
                className="px-8 py-4 bg-white text-ember font-bold rounded-full hover:bg-gray-100 transition-all shadow-2xl hover:shadow-white/20 hover:scale-105 flex items-center space-x-2"
              >
                <Settings className="w-5 h-5" />
                <span>Configure AI Settings</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-white text-ember font-bold rounded-full hover:bg-gray-100 transition-all shadow-2xl hover:shadow-white/20 hover:scale-105 flex items-center space-x-2"
              >
                <Rocket className="w-5 h-5" />
                <span>Get Started Free</span>
              </button>
            )}
            
            <button
              onClick={() => navigate('/daily-challenge')}
              className="px-8 py-4 bg-yellow-500 text-gray-900 font-bold rounded-full hover:bg-yellow-400 transition-all shadow-2xl hover:shadow-yellow-500/20 hover:scale-105 flex items-center space-x-2"
            >
              <Trophy className="w-5 h-5" />
              <span>Win Cash Daily 💰</span>
            </button>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 flex items-center justify-center space-x-2 text-white/80 text-sm">
            <Shield className="w-4 h-4" />
            <span>Powered by Emergent LLM • Secure • Private • Affordable</span>
          </div>
        </div>
      </div>

      {/* AI Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className={`text-3xl sm:text-4xl font-bold text-center mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          🤖 Your AI Arsenal
        </h2>
        <p className={`text-center mb-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Cutting-edge AI features that make communication effortless
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {aiFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className={`relative group ${
                  darkMode ? 'bg-olive/30 border border-ember/20' : 'bg-white border border-gray-200'
                } rounded-2xl p-8 hover:shadow-2xl transition-all hover:scale-105`}
              >
                {/* Badge */}
                {feature.badge && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                    {feature.badge}
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                
                <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.description}
                </p>

                {/* Feature List */}
                <div className="space-y-2 mb-6">
                  {feature.features.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.gradient}`}></div>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate(feature.route)}
                  className={`w-full py-3 bg-gradient-to-r ${feature.gradient} text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center space-x-2 group-hover:scale-105`}
                >
                  <span>{feature.cta}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why Choose Our AI Section */}
      <div className={`py-20 ${darkMode ? 'bg-obsidian-light' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl sm:text-4xl font-bold text-center mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Why Choose Our AI?
          </h2>
          <p className={`text-center mb-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Enterprise-grade AI without enterprise prices
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingHighlights.map((highlight, index) => {
              const IconComponent = highlight.icon;
              return (
                <div
                  key={index}
                  className={`text-center p-8 rounded-2xl ${
                    darkMode ? 'bg-olive/20 border border-ember/10' : 'bg-white border border-gray-200'
                  } hover:shadow-xl transition-all`}
                >
                  <IconComponent className={`w-12 h-12 mx-auto mb-4 ${highlight.color}`} />
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {highlight.title}
                  </h3>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {highlight.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className={`rounded-3xl p-12 ${
          darkMode 
            ? 'bg-gradient-to-br from-ember-dark via-ember to-orange-600' 
            : 'bg-gradient-to-br from-ember via-orange-500 to-ember-light'
        } shadow-2xl`}>
          <Sparkles className="w-16 h-16 text-white mx-auto mb-6" />
          
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Experience AI-Powered Communication?
          </h2>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands using affordable, professional AI features today
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/settings/ai')}
                  className="px-8 py-4 bg-white text-ember font-bold rounded-full hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
                >
                  Configure AI Now
                </button>
                <button
                  onClick={() => navigate('/daily-challenge')}
                  className="px-8 py-4 bg-yellow-500 text-gray-900 font-bold rounded-full hover:bg-yellow-400 transition-all shadow-xl hover:scale-105"
                >
                  Win Cash 💰
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-white text-ember font-bold rounded-full hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white font-bold rounded-full hover:bg-white/20 transition-all shadow-xl border border-white/20"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIHubPage;
