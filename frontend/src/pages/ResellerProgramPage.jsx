import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Building2, ArrowLeft, CheckCircle, TrendingUp, Users, DollarSign, Zap } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResellerProgramPage = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState('info'); // info, apply, success
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState(null);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    expected_monthly_volume: 10,
    business_description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/resellers/apply`, formData);
      setApplicationId(response.data.application_id);
      setStep('success');
    } catch (error) {
      alert(error.response?.data?.detail || 'Application failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#FAFAF8]'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light/50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Reseller Program
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    White-label wholesale API for agencies
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 'info' && (
          <>
            {/* Hero Banner */}
            <div className="mb-8 p-8 rounded-2xl bg-gradient-to-r from-ember via-pink-600 to-orange-500 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-black mb-4">🏢 Become a Calliotel Reseller</h2>
                <p className="text-xl text-white/90 mb-6">
                  Earn up to 50% commission selling premium virtual numbers. White-label API, wholesale pricing, zero upfront costs.
                </p>
                <div className="flex items-center space-x-6">
                  <div>
                    <div className="text-3xl font-black">$0.60-$0.80</div>
                    <div className="text-sm text-white/80">Wholesale per number</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black">50%</div>
                    <div className="text-sm text-white/80">Commission rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black">API</div>
                    <div className="text-sm text-white/80">White-label access</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Comparison */}
            <div className="mb-8">
              <h3 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Reseller Tiers
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* Basic Tier */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-6 h-6 text-ember" />
                    <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Basic
                    </h4>
                  </div>
                  <div className="mb-4">
                    <div className="text-4xl font-black bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                      $0.80
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      per number
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>40% commission</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>No minimum volume</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>API access</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Email support</span>
                    </li>
                  </ul>
                </div>

                {/* Pro Tier */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border-2 border-green-500 relative scale-105`}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                      RECOMMENDED
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                    <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Pro
                    </h4>
                  </div>
                  <div className="mb-4">
                    <div className="text-4xl font-black bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                      $0.70
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      per number
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>45% commission</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>50+ numbers/month</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Priority API access</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Priority support</span>
                    </li>
                  </ul>
                </div>

                {/* Enterprise Tier */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="w-6 h-6 text-ember" />
                    <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Enterprise
                    </h4>
                  </div>
                  <div className="mb-4">
                    <div className="text-4xl font-black bg-gradient-to-r from-ember to-ember-light/50 bg-clip-text text-transparent">
                      $0.60
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      per number
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>50% commission</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>200+ numbers/month</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Dedicated API</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Dedicated account manager</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className={`mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8`}>
              <h3 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Why Become a Reseller?
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <DollarSign className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <div>
                    <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      High Margins
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Buy at $0.60-$0.80, sell at $2+ = Up to $1.40 profit per number
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Building2 className="w-6 h-6 text-ember flex-shrink-0" />
                  <div>
                    <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      White-Label API
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Integrate into your platform. Your brand, your customers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                  <div>
                    <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Zero Upfront Cost
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No fees to join. Pay only for what you sell.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-6 h-6 text-ember flex-shrink-0" />
                  <div>
                    <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Dedicated Support
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Priority support for all reseller partners.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                onClick={() => setStep('apply')}
                className="px-8 py-4 bg-gradient-to-r from-ember to-ember-light text-white font-bold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                Apply to Become a Reseller →
              </button>
            </div>
          </>
        )}

        {step === 'apply' && (
          <div className="max-w-2xl mx-auto">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-lg`}>
              <h2 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Reseller Application
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contact_name}
                      onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expected Monthly Volume *
                  </label>
                  <select
                    required
                    value={formData.expected_monthly_volume}
                    onChange={(e) => setFormData({...formData, expected_monthly_volume: parseInt(e.target.value)})}
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value={10}>1-50 numbers/month (Basic Tier)</option>
                    <option value={75}>50-199 numbers/month (Pro Tier)</option>
                    <option value={300}>200+ numbers/month (Enterprise Tier)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Business Description *
                  </label>
                  <textarea
                    required
                    value={formData.business_description}
                    onChange={(e) => setFormData({...formData, business_description: e.target.value})}
                    rows={4}
                    placeholder="Tell us about your business and how you plan to resell Calliotel services..."
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-ember to-ember-light text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-lg`}>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className={`text-3xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Application Submitted!
              </h2>
              <p className={`text-lg mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your application ID: <strong>{applicationId}</strong>
              </p>
              <p className={`mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Our team will review your application within 24-48 hours. You'll receive an email with your API keys and wholesale rates once approved.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-gradient-to-r from-ember to-ember-light text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Back to Homepage
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResellerProgramPage;
