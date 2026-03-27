import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Send, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle,
  Globe,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

const BulkSMSPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Zap,
      title: 'Instant Delivery',
      description: 'Send thousands of messages in seconds with 99.9% delivery rate'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Reach customers in 250+ countries with local number support'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and compliance with international standards'
    },
    {
      icon: TrendingUp,
      title: '50% Profit Margin',
      description: 'Transparent pricing with industry-leading margins for resellers'
    }
  ];

  const useCases = [
    {
      title: 'Marketing Campaigns',
      description: 'Promotional messages, flash sales, seasonal offers',
      icon: '📢'
    },
    {
      title: 'Transactional SMS',
      description: 'Order confirmations, delivery updates, payment notifications',
      icon: '💳'
    },
    {
      title: 'OTP & Verification',
      description: 'Two-factor authentication, account verification codes',
      icon: '🔐'
    },
    {
      title: 'Alerts & Reminders',
      description: 'Appointment reminders, subscription renewals, system alerts',
      icon: '⏰'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Send className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Enterprise Bulk SMS
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              50% Profit Margins
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Send millions of messages worldwide with industry-leading delivery rates and transparent pricing
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg hover:shadow-[0_4px_20px_rgba(255,140,0,0.6)] hover:scale-105 transition-all shadow-lg flex items-center space-x-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Start Sending SMS</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg hover:shadow-[0_4px_20px_rgba(255,140,0,0.6)] hover:scale-105 transition-all shadow-lg flex items-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Get Started Free</span>
              </button>
            )}
            
            <button
              onClick={() => navigate('/pricing')}
              className="px-8 py-4 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-all border border-gray-700"
            >
              View Pricing
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center space-x-2 text-gray-400 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>No Setup Fees • Pay As You Go • Cancel Anytime</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white">
          Why Choose Our Bulk SMS?
        </h2>
        <p className="text-center mb-12 text-gray-400">
          Enterprise-grade infrastructure with transparent pricing
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500 transition-all hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-700 rounded-lg flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-white">
                  {feature.title}
                </h3>
                
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white">
            Perfect For Every Business
          </h2>
          <p className="text-center mb-12 text-gray-400">
            From startups to enterprises - one platform for all messaging needs
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-black border border-gray-800 rounded-xl p-6 hover:border-orange-500 transition-all"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{useCase.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">
                      {useCase.title}
                    </h3>
                    <p className="text-gray-400">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="rounded-3xl p-12 bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 shadow-2xl">
          <Send className="w-16 h-16 text-white mx-auto mb-6" />
          
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Scale Your Messaging?
          </h2>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses sending millions of messages monthly
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white font-bold rounded-lg hover:bg-white/20 transition-all shadow-xl border border-white/20"
                >
                  View Pricing
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSMSPage;
