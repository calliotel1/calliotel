import React, { useState, useEffect } from 'react';
import { Copy, Check, AlertCircle, Loader, ArrowLeft, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import QRCode from 'qrcode';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const USDTPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('package');
  
  const [step, setStep] = useState(1); // 1: Select Package, 2: Payment Details, 3: Verify Transaction
  const [packages, setPackages] = useState({});
  const [selectedPackage, setSelectedPackage] = useState(packageId || null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Payment details
  const [paymentId, setPaymentId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [amountUSDT, setAmountUSDT] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  
  // Transaction verification
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
    if (packageId) {
      setSelectedPackage(packageId);
    }
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/usdt/packages`);
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

  const createPaymentOrder = async () => {
    if (!selectedPackage) {
      toast({
        title: 'Error',
        description: 'Please select a package',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/usdt/create-order`,
        { package_id: selectedPackage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data.data;
      setPaymentId(data.payment_id);
      setWalletAddress(data.wallet_address);
      setAmountUSDT(data.amount_usdt);
      setOrderNumber(data.order_number);

      // Generate QR code for wallet address with amount
      const qrData = `${data.wallet_address}?amount=${data.amount_usdt}`;
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrUrl);

      setStep(2);
      toast({
        title: 'Order Created!',
        description: 'Please send USDT to the address shown',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create order',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const verifyTransaction = async () => {
    if (!txHash.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter transaction hash',
        variant: 'destructive',
      });
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/usdt/verify-transaction`,
        {
          payment_id: paymentId,
          transaction_hash: txHash.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVerificationResult(response.data);
      
      if (response.data.success) {
        setStep(3);
        toast({
          title: '✅ Payment Verified!',
          description: `${response.data.credits_added} credits added to your account`,
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Verification failed';
      setVerificationResult({
        success: false,
        message: errorMsg,
      });
      toast({
        title: 'Verification Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Address copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const packageOrder = ['starter', 'basic', 'pro', 'premium'];
  const packageIcons = {
    starter: '🌱',
    basic: '⚡',
    pro: '🚀',
    premium: '💎',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 text-ember animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-ember-light/5 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/wallet')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">USDT Payment (TRC20)</h1>
              <p className="text-sm text-gray-600">
                {step === 1 && 'Select Package'}
                {step === 2 && 'Send Payment'}
                {step === 3 && 'Completed'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-semibold hidden sm:inline">Package</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                {step > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-semibold hidden sm:inline">Payment</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                {step >= 3 ? <Check className="w-5 h-5" /> : '3'}
              </div>
              <span className="font-semibold hidden sm:inline">Verify</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Package */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Choose Package</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {packageOrder.map((pkgId) => {
                const pkg = packages[pkgId];
                if (!pkg) return null;

                const isSelected = selectedPackage === pkgId;
                const bonus = pkg.credits - pkg.usdt;

                return (
                  <button
                    key={pkgId}
                    onClick={() => setSelectedPackage(pkgId)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-4xl mb-2">{packageIcons[pkgId]}</div>
                        <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                      </div>
                      {isSelected && <Check className="w-6 h-6 text-green-600" />}
                    </div>

                    <div className="mb-3">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-gray-900">{pkg.usdt}</span>
                        <span className="text-gray-600">USDT</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Get <span className="font-bold text-green-600">${pkg.credits}</span> credits
                      </div>
                      {bonus > 0 && (
                        <div className="mt-2 inline-block">
                          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                            +${bonus.toFixed(0)} Bonus!
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={createPaymentOrder}
              disabled={!selectedPackage || creating}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {creating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Creating Order...</span>
                </>
              ) : (
                <span>Continue to Payment</span>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {step === 2 && (
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Send {amountUSDT} USDT
              </h2>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                  {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="Payment QR Code" className="w-64 h-64" />
                  )}
                </div>
              </div>

              {/* Wallet Address */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Wallet Address (TRC20)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={walletAddress}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(walletAddress)}
                    className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount to Send
                </label>
                <div className="px-4 py-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{amountUSDT} USDT</span>
                    <span className="text-sm text-yellow-700 font-semibold">Exact Amount</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Important Instructions
                </h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Send <strong>exactly {amountUSDT} USDT</strong> to the address above</li>
                  <li>Make sure you're using <strong>TRC20 network (Tron)</strong></li>
                  <li>Using wrong network will result in <strong>lost funds</strong></li>
                  <li>Transaction confirms in 1-2 minutes</li>
                  <li>Copy the transaction hash after sending</li>
                </ol>
              </div>

              {/* Order Number */}
              <div className="text-center text-sm text-gray-600">
                Order #{orderNumber}
              </div>
            </div>

            {/* Transaction Hash Input */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                After Sending, Enter Transaction Hash
              </h3>

              <div className="mb-4">
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Paste your transaction hash (TXID)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Find the transaction hash in your wallet's transaction history
                </p>
              </div>

              <button
                onClick={verifyTransaction}
                disabled={!txHash.trim() || verifying}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {verifying ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Verifying Transaction...</span>
                  </>
                ) : (
                  <span>Verify & Complete Payment</span>
                )}
              </button>

              {verificationResult && !verificationResult.success && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{verificationResult.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && verificationResult && verificationResult.success && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Check className="w-16 h-16 text-green-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Payment Successful! 🎉
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Your credits have been added to your wallet
            </p>

            <div className="bg-gradient-to-r from-green-50 to-ember-light/5 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Credits Added</p>
                  <p className="text-3xl font-bold text-green-600">
                    +${verificationResult.credits_added}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">New Balance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${verificationResult.new_balance}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/wallet')}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                View Wallet
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Go to Dashboard
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <a
                href={`https://tronscan.org/#/transaction/${verificationResult.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ember hover:text-ember-light flex items-center justify-center space-x-1"
              >
                <span>View on TronScan</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Accepted Payment Methods Banner */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-ember-light/5 rounded-2xl shadow-lg p-6 border-2 border-green-200">
          <h3 className="text-center text-lg font-bold text-gray-900 mb-4">
            💳 We Also Accept
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2 text-center">Credit Cards via Stripe</p>
              <div className="flex items-center justify-center space-x-2 flex-wrap gap-2">
                <div className="px-2 py-1 bg-blue-50 rounded text-xs font-bold text-blue-700">VISA</div>
                <div className="px-2 py-1 bg-red-50 rounded text-xs font-bold text-red-700">Mastercard</div>
                <div className="px-2 py-1 bg-blue-50 rounded text-xs font-bold text-ember">AMEX</div>
              </div>
              <button
                onClick={() => navigate('/payment')}
                className="mt-3 w-full text-xs text-ember hover:text-ember-light font-semibold"
              >
                Pay with Card →
              </button>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2 text-center">Other Cryptocurrencies</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">₿</div>
                <div className="w-6 h-6 bg-ember rounded-full"></div>
                <div className="w-6 h-6 bg-ember rounded-full text-white text-[8px] flex items-center justify-center">USDC</div>
              </div>
              <button
                onClick={() => navigate('/payment')}
                className="mt-3 w-full text-xs text-ember hover:text-ember-light font-semibold"
              >
                Other Crypto →
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default USDTPaymentPage;
