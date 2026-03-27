import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Zap, TrendingUp, Award, CheckCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreditPackagesWidget = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [processingCustom, setProcessingCustom] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/credit-packages`);
      setPackages(response.data.packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId) => {
    if (!user) {
      alert('Please login to purchase credit packages');
      return;
    }

    setPurchasing(packageId);

    try {
      const token = safeLocalStorage.getItem('token');
      
      // Create Stripe checkout session
      const response = await axios.post(
        `${API}/payments/create-checkout`,
        { 
          package_id: packageId,
          payment_method: 'card',
          origin_url: window.location.origin
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect to Stripe checkout page
      window.location.href = response.data.url;
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create checkout session');
      setPurchasing(null);
    }
  };

  const handleCustomAmount = async () => {
    if (!user) {
      alert('Please login to purchase');
      return;
    }

    const amount = parseFloat(customAmount);
    if (!amount || amount < 5) {
      alert('Minimum amount is $5');
      return;
    }
    if (amount > 1000) {
      alert('Maximum amount is $1000');
      return;
    }

    setProcessingCustom(true);

    try {
      const token = safeLocalStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/payments/create-checkout`,
        { 
          custom_amount: amount,
          payment_method: 'card',
          origin_url: window.location.origin
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect to Stripe checkout page
      window.location.href = response.data.url;
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create checkout session');
      setProcessingCustom(false);
    }
  };

  if (loading) {
    return <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading packages...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            💰 Power User Bundles
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Save up to 20% with bulk credit purchases
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg transition-all hover:shadow-2xl border-2 ${
              pkg.is_best_value 
                ? 'border-green-500 scale-105' 
                : darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            {/* Best Value Badge */}
            {pkg.is_best_value && (
              <div className="absolute -top-3 -right-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                  <Award className="w-4 h-4" />
                  <span>BEST VALUE</span>
                </div>
              </div>
            )}

            {/* Package Icon */}
            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
              pkg.id === 'starter' ? 'bg-gradient-to-br from-ember to-ember-light' :
              pkg.id === 'pro' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
              'bg-gradient-to-br from-ember to-ember-light'
            }`}>
              {pkg.id === 'starter' && <Zap className="w-6 h-6 text-white" />}
              {pkg.id === 'pro' && <TrendingUp className="w-6 h-6 text-white" />}
              {pkg.id === 'premium' && <Sparkles className="w-6 h-6 text-white" />}
            </div>

            {/* Package Name */}
            <h4 className={`text-lg font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {pkg.name}
            </h4>

            {/* Pricing */}
            <div className="mb-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black bg-gradient-to-r from-orange-500 to-ember-light bg-clip-text text-transparent">
                  ${pkg.price}
                </span>
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Get ${pkg.credits.toFixed(2)} credits
              </div>
            </div>

            {/* Bonus Badge */}
            {pkg.bonus_percentage > 0 && (
              <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    +{pkg.bonus_percentage}% Bonus (${(pkg.credits - pkg.base_credits).toFixed(2)} FREE!)
                  </span>
                </div>
              </div>
            )}

            {/* Features */}
            <ul className="space-y-2 mb-6">
              <li className="flex items-center space-x-2 text-sm">
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  ${pkg.credits.toFixed(2)} total credits
                </span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Never expires
                </span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Use for SMS, calls, numbers
                </span>
              </li>
            </ul>

            {/* Purchase Button */}
            <button
              onClick={() => handlePurchase(pkg.id)}
              disabled={purchasing === pkg.id}
              className={`w-full py-3 rounded-xl font-bold transition-all ${
                pkg.is_best_value
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105'
                  : pkg.id === 'premium'
                  ? 'bg-gradient-to-r from-ember to-ember-light text-white hover:shadow-lg hover:scale-105'
                  : darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {purchasing === pkg.id ? 'Processing...' : 'Purchase Now'}
            </button>
          </div>
        ))}
      </div>

      {/* Custom Amount Option */}
      <div className={`mt-6 p-6 rounded-xl ${darkMode ? 'bg-blue-900/20 border border-ember/20' : 'bg-blue-50 border border-blue-200'}`}>
        <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          💳 Custom Amount
        </h4>
        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Need a different amount? Pay exactly what you need (min $5, max $1000)
        </p>
        <div className="flex space-x-3">
          <div className="flex-1">
            <div className="relative">
              <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>$</span>
              <input
                type="number"
                min="5"
                max="1000"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className={`w-full pl-8 pr-4 py-3 rounded-xl font-semibold text-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              You'll receive ${customAmount || '0'} credits (1:1 ratio)
            </p>
          </div>
          <button
            onClick={handleCustomAmount}
            disabled={processingCustom || !customAmount || parseFloat(customAmount) < 5}
            className="px-6 py-3 bg-gradient-to-r from-ember to-ember-light text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {processingCustom ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>

      {/* Trust Banner */}
      <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-blue-900/20 border border-ember/20' : 'bg-blue-50 border border-blue-200'}`}>
        <p className={`text-sm text-center ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
          💳 Secure payment processing • Credits never expire • Instant activation
        </p>
      </div>
    </div>
  );
};

export default CreditPackagesWidget;
