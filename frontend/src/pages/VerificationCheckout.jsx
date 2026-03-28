import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Phone, 
  CreditCard,
  Wallet,
  Bitcoin,
  ArrowRight,
  CheckCircle,
  Shield,
  Zap,
  AlertCircle,
  Loader
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VerificationCheckout = () => {
  const { serviceSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { isAuthenticated, user } = useAuth();
  
  const [service, setService] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [availableCountries, setAvailableCountries] = useState([]);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // wallet, stripe, crypto
  const [walletBalance, setWalletBalance] = useState(0);
  const [error, setError] = useState('');
  
  // Get data from URL parameters (from SolutionQuiz)
  const urlCountry = searchParams.get('country');
  const urlPrice = searchParams.get('price');
  const urlCode = searchParams.get('code');
  const urlService = searchParams.get('service');
  
  // Service icons mapping
  const serviceIcons = {
    whatsapp: '💬',
    telegram: '✈️',
    google: '🔍',
    discord: '🎮',
    facebook: '👥',
    instagram: '📸',
    twitter: '🐦',
    tiktok: '🎵'
  };

  // Service names
  const serviceNames = {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    google: 'Google/Gmail',
    discord: 'Discord',
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter/X',
    tiktok: 'TikTok'
  };

  // Popular countries with pricing (this would normally come from API)
  const countries = [
    { code: 'US', name: 'United States', price: 0.14 },
    { code: 'GB', name: 'United Kingdom', price: 0.12 },
    { code: 'CA', name: 'Canada', price: 0.13 },
    { code: 'IN', name: 'India', price: 0.06 },
    { code: 'PH', name: 'Philippines', price: 0.07 },
    { code: 'ID', name: 'Indonesia', price: 0.08 },
    { code: 'BR', name: 'Brazil', price: 0.09 },
    { code: 'DE', name: 'Germany', price: 0.11 }
  ];

  useEffect(() => {
    fetchServiceInfo();
    if (isAuthenticated) {
      fetchWalletBalance();
    }
  }, [serviceSlug, isAuthenticated, urlCountry, urlPrice]);

  const fetchServiceInfo = async () => {
    try {
      setLoading(true);
      
      // Use URL parameters if available (from SolutionQuiz)
      if (urlCountry && urlPrice) {
        setService({
          slug: urlService?.toLowerCase() || 'whatsapp',
          name: urlService || 'WhatsApp',
          icon: '📱'
        });
        setSelectedCountry(urlCountry);
        // Remove $ and /mo from price string
        const cleanPrice = parseFloat(urlPrice.replace('$', '').replace('/mo', ''));
        setPrice(cleanPrice);
      } else {
        // Fallback to default
        setService({
          slug: serviceSlug,
          name: serviceNames[serviceSlug] || serviceSlug,
          icon: serviceIcons[serviceSlug] || '📱'
        });
        setPrice(countries[0].price);
      }
      
      setAvailableCountries(countries);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch service info:', error);
      setError('Service not available');
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletBalance(response.data.balance || 0);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setPrice(country.price);
    }
  };

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      setError('');

      // Guest checkout or logged in
      const token = localStorage.getItem('token');
      
      if (paymentMethod === 'wallet') {
        // Wallet payment (requires login)
        if (!isAuthenticated) {
          setError('Please login to use wallet balance');
          setPurchasing(false);
          return;
        }

        if (walletBalance < price) {
          setError(`Insufficient balance. You need $${price.toFixed(2)} but have $${walletBalance.toFixed(2)}`);
          setPurchasing(false);
          return;
        }

        // Purchase with wallet
        const response = await axios.post(
          `${API}/verification/purchase`,
          {
            service_slug: serviceSlug,
            country_code: selectedCountry
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Success - show the number
        navigate(`/verification/success/${response.data.order_code}`);
      } else if (paymentMethod === 'stripe') {
        // Stripe checkout (works for guests too)
        const checkoutData = {
          service: serviceSlug,
          country: selectedCountry,
          amount: price,
          payment_method: 'card'
        };

        if (isAuthenticated) {
          const response = await axios.post(
            `${API}/verification/checkout/stripe`,
            checkoutData,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          window.location.href = response.data.url;
        } else {
          // Guest checkout
          const response = await axios.post(
            `${API}/verification/checkout/guest`,
            {
              ...checkoutData,
              email: prompt('Enter your email to receive the number:')
            }
          );
          window.location.href = response.data.url;
        }
      } else if (paymentMethod === 'crypto') {
        // Crypto payment
        const response = await axios.post(
          `${API}/verification/checkout/crypto`,
          {
            service: serviceSlug,
            country: selectedCountry,
            amount: price
          },
          isAuthenticated ? {
            headers: { Authorization: `Bearer ${token}` }
          } : {}
        );
        
        navigate(`/crypto-payment/${response.data.payment_id}`);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      setError(error.response?.data?.detail || 'Purchase failed. Please try again.');
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // FAILSAFE GUARD: If no data provided, redirect back to dashboard
  if (!urlCountry && !urlService && !service) {
    console.error('CALLIOTEL: Missing purchase data. Redirecting to dashboard...');
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{service?.icon}</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Get {service?.name} Verification Number
          </h1>
          <p className="text-gray-400">
            Instant activation • Receive SMS codes in seconds
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Order Summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-orange-500" />
              Order Details
            </h2>

            {/* Country Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Select Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:border-orange-500 focus:outline-none"
              >
                {availableCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} - ${country.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-gray-800 pt-4 space-y-3">
              <div className="flex items-center justify-between text-gray-400">
                <span>Service</span>
                <span className="text-white">{service?.name}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Country</span>
                <span className="text-white">
                  {countries.find(c => c.code === selectedCountry)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-2xl font-bold pt-3 border-t border-gray-800">
                <span className="text-white">Total</span>
                <span className="text-orange-500">${price.toFixed(2)}</span>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Instant number activation</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>SMS code delivery within 60 seconds</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No account required</span>
              </div>
            </div>
          </div>

          {/* Right: Payment Method */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-orange-500" />
              Payment Method
            </h2>

            {/* Payment Options */}
            <div className="space-y-3 mb-6">
              {isAuthenticated && walletBalance > 0 && (
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    paymentMethod === 'wallet'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Wallet className="w-5 h-5 text-orange-500" />
                      <div>
                        <div className="text-white font-bold">Wallet Balance</div>
                        <div className="text-sm text-gray-400">
                          Available: ${walletBalance.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {walletBalance >= price && (
                      <Zap className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                </button>
              )}

              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === 'stripe'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-bold">Credit/Debit Card</div>
                    <div className="text-sm text-gray-400">
                      Visa, Mastercard, Amex
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('crypto')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === 'crypto'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Bitcoin className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-white font-bold">Cryptocurrency</div>
                    <div className="text-sm text-gray-400">
                      USDT (TRC20) - Total Privacy
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purchasing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Complete Purchase ${price.toFixed(2)}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Security Badge */}
            <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Secure payment • Instant delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationCheckout;
