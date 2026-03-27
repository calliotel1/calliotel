import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Phone, 
  Clock, 
  Calendar,
  Search,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VirtualNumbersHub = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState('verification'); // 'verification' or 'rental'
  const [verificationServices, setVerificationServices] = useState([]);
  const [rentalNumbers, setRentalNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock popular verification services (will be replaced with real API data)
  const popularServices = [
    {
      name: 'WhatsApp',
      slug: 'whatsapp',
      icon: '💬',
      price: 0.14,
      countries: 193
    },
    {
      name: 'Telegram',
      slug: 'telegram',
      icon: '✈️',
      price: 0.12,
      countries: 184
    },
    {
      name: 'Google/Gmail',
      slug: 'google',
      icon: '🔍',
      price: 0.06,
      countries: 183
    },
    {
      name: 'Discord',
      slug: 'discord',
      icon: '🎮',
      price: 0.08,
      countries: 171
    },
    {
      name: 'Facebook',
      slug: 'facebook',
      icon: '👥',
      price: 0.07,
      countries: 192
    },
    {
      name: 'Instagram',
      slug: 'instagram',
      icon: '📸',
      price: 0.07,
      countries: 192
    },
    {
      name: 'Twitter/X',
      slug: 'twitter',
      icon: '🐦',
      price: 0.08,
      countries: 192
    },
    {
      name: 'TikTok',
      slug: 'tiktok',
      icon: '🎵',
      price: 0.06,
      countries: 189
    }
  ];

  // Rental number plans - WHITE LABEL (no provider names shown to client)
  const rentalPlans = [
    {
      name: 'Standard Plan',
      type: 'Most Popular',
      features: ['Voice + SMS', 'Global Coverage', 'Call Forwarding', '24/7 Support'],
      monthlyFrom: 4.99,
      setupFee: 0,
      countries: 150,
      recommended: true
    },
    {
      name: 'Business Plan',
      type: 'Advanced',
      features: ['Voice + SMS', 'Priority Support', 'Call Recording', 'Advanced Routing'],
      monthlyFrom: 9.99,
      setupFee: 0,
      countries: 150,
      recommended: false
    }
  ];

  const handleServiceClick = (service) => {
    // NO LOGIN REQUIRED - instant purchase flow
    navigate(`/verification/purchase/${service.slug}`);
  };

  const handleRentalClick = (plan) => {
    // NO LOGIN REQUIRED - browse numbers directly
    navigate('/browse-rental-numbers');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 border-b border-gray-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="mb-6 inline-flex items-center px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <Zap className="w-4 h-4 text-orange-400 mr-2" />
            <span className="text-orange-400 text-sm font-semibold">791 Services • 250 Countries</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Virtual Phone Numbers
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              Instant Activation
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Get virtual numbers for verification or long-term use. Instant delivery, global coverage.
          </p>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Instant Activation</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-purple-400" />
              <span>250+ Countries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-4 py-4">
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'verification'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-700 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Verification Numbers</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">One-Time</span>
            </button>
            
            <button
              onClick={() => setActiveTab('rental')}
              className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'rental'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-700 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Rental Numbers</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Long-Term</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'verification' ? (
          <>
            {/* Verification Numbers Section - NorthSMS Style */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Zap className="w-6 h-6 text-orange-400 mr-2" />
                  Popular Services
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Popular Services Grid - NorthSMS Dark Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {popularServices.map((service) => (
                  <button
                    key={service.slug}
                    onClick={() => handleServiceClick(service)}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-orange-500 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{service.icon}</div>
                        <div>
                          <h3 className="text-white font-bold">{service.name}</h3>
                          <p className="text-xs text-gray-500">Global</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-orange-400 font-bold">from ${service.price}</span>
                        <p className="text-xs text-gray-500">{service.countries} Countries</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">How Verification Numbers Work</h3>
                    <ul className="space-y-1 text-gray-300 text-sm">
                      <li>• Choose the service you want to verify (WhatsApp, Telegram, etc.)</li>
                      <li>• **No account needed** - instant checkout</li>
                      <li>• Receive a temporary number within seconds</li>
                      <li>• Use it to receive your verification code</li>
                      <li>• Number expires after successful verification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Rental Numbers Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Calendar className="w-6 h-6 text-orange-400 mr-2" />
                Long-Term Virtual Numbers
              </h2>

              {/* Rental Plans - WHITE LABEL */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {rentalPlans.map((plan, index) => (
                  <div
                    key={index}
                    className={`bg-gray-900 border rounded-xl p-6 hover:border-orange-500 transition-all ${
                      plan.recommended ? 'border-orange-500' : 'border-gray-800'
                    }`}
                  >
                    {plan.recommended && (
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full">
                          ⭐ RECOMMENDED
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                        <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full mt-2">
                          {plan.type}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                          ${plan.monthlyFrom}
                          <span className="text-sm text-gray-500 font-normal">/mo</span>
                        </div>
                        <p className="text-xs text-green-400">No Setup Fee</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <span className="text-gray-400 text-sm">{plan.countries}+ Countries</span>
                      <button
                        onClick={() => handleRentalClick(plan)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
                      >
                        <span>Get Started</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">Why Choose Long-Term Numbers?</h3>
                    <ul className="space-y-1 text-gray-300 text-sm">
                      <li>• **Instant activation** - no verification required</li>
                      <li>• Keep the same number for as long as you need</li>
                      <li>• Make and receive calls + SMS</li>
                      <li>• Perfect for business use or long-term projects</li>
                      <li>• Cancel anytime - no contracts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CTA Section - NO SIGNUP REQUIRED */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 rounded-3xl p-8 shadow-2xl">
            <Phone className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Ready to Get Your Number?</h3>
            <p className="text-white/90 mb-6">
              No signup required • Instant activation • Pay as you go
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setActiveTab('verification')}
                className="px-8 py-3 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Get Verification Number
              </button>
              <button
                onClick={() => setActiveTab('rental')}
                className="px-8 py-3 bg-white/10 backdrop-blur-lg text-white font-bold rounded-lg hover:bg-white/20 transition-all shadow-lg border border-white/20"
              >
                Browse Rental Numbers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualNumbersHub;
