import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowLeft, Check, Loader, Zap, Bitcoin, DollarSign } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentPage = () => {
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/payments/packages`);
      setPackages(response.data.packages);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load payment packages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId) => {
    setProcessing(true);
    setSelectedPackage(packageId);
    
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/payments/create-checkout`,
        {
          package_id: packageId,
          payment_method: paymentMethod,
          origin_url: window.location.origin
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Could not initiate payment',
        variant: 'destructive',
      });
      setProcessing(false);
      setSelectedPackage(null);
    }
  };

  const packageOrder = ['starter', 'basic', 'pro', 'premium'];
  const packageIcons = {
    starter: '🌱',
    basic: '⚡',
    pro: '🚀',
    premium: '💎'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ember/5 via-blue-50 to-orange-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/wallet')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Credits</h1>
              <p className="text-sm text-gray-600">Choose a package to top up your wallet</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Method Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'card'
                  ? 'border-ember bg-ember/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-ember' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-semibold ${paymentMethod === 'card' ? 'text-ember' : 'text-gray-700'}`}>
                    Card Payment
                  </p>
                  <p className="text-xs text-gray-500">Credit/Debit Card</p>
                </div>
                {paymentMethod === 'card' && (
                  <Check className="w-5 h-5 text-ember ml-auto" />
                )}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('crypto')}
              className={`p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'crypto'
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Bitcoin className={`w-6 h-6 ${paymentMethod === 'crypto' ? 'text-orange-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-semibold ${paymentMethod === 'crypto' ? 'text-orange-600' : 'text-gray-700'}`}>
                    Cryptocurrency
                  </p>
                  <p className="text-xs text-gray-500">BTC, ETH, USDC</p>
                </div>
                {paymentMethod === 'crypto' && (
                  <Check className="w-5 h-5 text-orange-600 ml-auto" />
                )}
              </div>
            </button>

            <button
              onClick={() => navigate(`/usdt-payment`)}
              className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-green-300 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">₮</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-700">USDT TRC20</p>
                  <p className="text-xs text-gray-500">Direct Transfer</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Credit Packages */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Package</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packageOrder.map((packageId) => {
              const pkg = packages[packageId];
              if (!pkg) return null;
              
              const isPopular = packageId === 'pro';
              const bonus = pkg.credits - pkg.amount;
              const isProcessing = processing && selectedPackage === packageId;
              
              return (
                <div
                  key={packageId}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                    isPopular ? 'border-ember' : 'border-gray-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-ember to-ember-dark text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                        POPULAR
                      </span>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-5xl mb-3">{packageIcons[packageId]}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    </div>
                    
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center space-x-1 mb-2">
                        <span className="text-4xl font-bold text-gray-900">${pkg.amount}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm text-gray-500">Get</span>
                        <span className="text-2xl font-bold text-green-600">${pkg.credits}</span>
                        <span className="text-sm text-gray-500">credits</span>
                      </div>
                      {bonus > 0 && (
                        <div className="mt-2 inline-block">
                          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                            +${bonus.toFixed(0)} Bonus!
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handlePurchase(packageId)}
                      disabled={processing}
                      className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 ${
                        isPopular
                          ? 'bg-gradient-to-r from-ember to-ember-dark text-white hover:shadow-lg disabled:opacity-50'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-5 h-5" />
                          <span>Purchase</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Why Add Credits?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-ember/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-ember" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-600">
                PCI-compliant with industry-leading encryption
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Instant Credit</h3>
              <p className="text-sm text-gray-600">
                Credits appear in your wallet immediately
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Bitcoin className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Crypto Friendly</h3>
              <p className="text-sm text-gray-600">
                Accept Bitcoin, Ethereum, and more
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Larger packages offer better value with bonus credits. Credits never expire and can be used for phone numbers, SMS, and calls.
          </p>
        </div>

        {/* Accepted Payment Methods */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">We Accept</h2>
          
          {/* Credit Cards */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 text-center">Credit & Debit Cards</h3>
            <div className="flex items-center justify-center space-x-6 flex-wrap gap-4">
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
                <svg className="w-12 h-8" viewBox="0 0 48 32" fill="none">
                  <rect width="48" height="32" rx="4" fill="#1434CB"/>
                  <path d="M17.5 16L14 11h3l1.5 2.5L20 11h3l-3.5 5 3.5 5h-3l-1.5-2.5L17 21h-3l3.5-5z" fill="white"/>
                  <path d="M27 11h-3v10h3v-10zM34 11h-3l-2.5 6.5L26 11h-3l4 10h3l4-10z" fill="white"/>
                  <text x="14" y="28" fill="#FFB900" fontSize="6" fontWeight="bold">VISA</text>
                </svg>
              </div>
              
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
                <svg className="w-12 h-8" viewBox="0 0 48 32" fill="none">
                  <rect width="48" height="32" rx="4" fill="#EB001B"/>
                  <circle cx="18" cy="16" r="10" fill="#EB001B"/>
                  <circle cx="30" cy="16" r="10" fill="#FF5F00"/>
                  <path d="M24 10c-2.2 1.7-3.5 4.2-3.5 7s1.3 5.3 3.5 7c2.2-1.7 3.5-4.2 3.5-7s-1.3-5.3-3.5-7z" fill="#F79E1B"/>
                </svg>
                <span className="text-xs font-semibold text-gray-700">Mastercard</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
                <svg className="w-12 h-8" viewBox="0 0 48 32" fill="none">
                  <rect width="48" height="32" rx="4" fill="#016FD0"/>
                  <path d="M16 11l-3 10h6l3-10h-6zm8 0l-1.5 4h3l-1.5 4-3 2 4-6h-3l1-4h-3l4-2z" fill="white"/>
                  <text x="14" y="28" fill="white" fontSize="6" fontWeight="bold">AMEX</text>
                </svg>
              </div>

              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
                <svg className="w-12 h-8" viewBox="0 0 48 32" fill="none">
                  <rect width="48" height="32" rx="4" fill="#FF6000"/>
                  <circle cx="14" cy="16" r="6" fill="#FF6000"/>
                  <circle cx="34" cy="16" r="6" fill="#F7981D"/>
                  <text x="6" y="28" fill="white" fontSize="5" fontWeight="bold">DISCOVER</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">AND</span>
            </div>
          </div>

          {/* Cryptocurrencies */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 text-center">Cryptocurrencies</h3>
            <div className="flex items-center justify-center space-x-6 flex-wrap gap-4">
              <div className="flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  ₿
                </div>
                <span className="text-sm font-semibold text-gray-700">Bitcoin</span>
              </div>

              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-ember rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-700">Ethereum</span>
              </div>

              <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  ₮
                </div>
                <span className="text-sm font-semibold text-gray-700">USDT</span>
              </div>

              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-ember rounded-full flex items-center justify-center text-white font-bold text-xs">
                  USDC
                </div>
                <span className="text-sm font-semibold text-gray-700">USD Coin</span>
              </div>

              <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  BNB
                </div>
                <span className="text-sm font-semibold text-gray-700">Binance Coin</span>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                <span>SSL Encrypted</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-ember" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>PCI Compliant</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-ember" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                </svg>
                <span>Instant Notification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PaymentPage;
