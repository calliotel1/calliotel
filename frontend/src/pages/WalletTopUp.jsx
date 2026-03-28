import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, CreditCard, DollarSign, Zap, CheckCircle, Wallet, Bitcoin } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WalletTopUp = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Credit packages (like Fanytel example)
  const packages = [
    { credits: 5, price: 4.99, popular: false },
    { credits: 10, price: 9.99, popular: true, badge: 'Most Popular' },
    { credits: 20, price: 19.99, popular: false, badge: '5% Bonus' },
    { credits: 50, price: 49.99, popular: false, badge: '10% Bonus' },
    { credits: 100, price: 95.99, popular: false, badge: '15% Bonus' }
  ];

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (pkg) => {
    setSelectedPackage(pkg);
    // For now, show alert that payment integration is coming
    // TODO: Integrate with Stripe/Crypto checkout
    alert(`🔥 Adding $${pkg.credits} to your wallet for $${pkg.price}\n\nPayment integration coming soon!\n\nFor now, this would:\n1. Open Stripe/Crypto payment\n2. Process $${pkg.price} payment\n3. Add $${pkg.credits} to your balance`);
    
    // Temporary: Just navigate back to dashboard
    // navigate('/dashboard');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center space-x-2 ${darkMode ? 'text-gray-300 hover:text-orange-400' : 'text-gray-700 hover:text-orange-600'} transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add Balance
            </h1>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Balance Card */}
        <div className="bg-gradient-to-r from-orange-500 to-ember-light rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Current Balance</p>
              <p className="text-4xl font-bold">
                ${loading ? '...' : balance.toFixed(2)}
              </p>
            </div>
            <Wallet className="w-16 h-16 text-white/30" />
          </div>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            CALLIOTEL Credits
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Purchase credits and use them anytime for virtual numbers, SMS, and more
          </p>
        </div>

        {/* Credit Packages */}
        <div className="space-y-3">
          {packages.map((pkg, index) => (
            <div
              key={index}
              className={`
                ${darkMode ? 'bg-gray-800' : 'bg-white'} 
                rounded-xl p-5 transition-all border-2
                ${pkg.popular 
                  ? 'border-orange-500 shadow-lg shadow-orange-500/20' 
                  : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }
                ${selectedPackage === pkg ? 'ring-2 ring-orange-500' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${pkg.popular ? 'bg-orange-500/20' : darkMode ? 'bg-gray-700' : 'bg-gray-100'}
                  `}>
                    <DollarSign className={`w-6 h-6 ${pkg.popular ? 'text-orange-500' : darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      ${pkg.credits} Credits
                    </h3>
                    {pkg.badge && (
                      <span className={`text-xs font-semibold ${pkg.popular ? 'text-orange-500' : 'text-green-500'}`}>
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      ${pkg.price}
                    </p>
                    {pkg.credits !== pkg.price && (
                      <p className="text-xs text-green-500 font-semibold">
                        Save ${(pkg.credits - pkg.price).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasing}
                    className={`
                      p-3 rounded-full transition-all
                      ${pkg.popular 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg' 
                        : darkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <CreditCard className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="mt-8">
          <h3 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Accepted Payment Methods
          </h3>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Credit/Debit Card</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <Bitcoin className="w-5 h-5 text-orange-500" />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cryptocurrency</span>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className={`mt-8 p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-100'}`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Why Add Balance?
          </h3>
          <div className="space-y-3">
            {[
              'Instant purchases without entering card details every time',
              'Buy numbers and services in one click',
              'Bonus credits on larger packages',
              'Never miss a deal due to payment delays'
            ].map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletTopUp;
