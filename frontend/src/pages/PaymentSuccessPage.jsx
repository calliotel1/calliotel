import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader, ArrowRight, Home } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking'); // checking, success, error
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    } else {
      setStatus('error');
      setLoading(false);
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(
        `${API}/payments/checkout-status/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setPaymentDetails(response.data);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
      } else {
        setStatus('pending');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      setStatus('error');
      toast({
        title: 'Error',
        description: 'Could not verify payment status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-ember animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-ember-light/5 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            {/* Success Icon */}
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-200 rounded-full opacity-20 animate-ping"></div>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Payment Successful! 🎉
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your credits have been added to your wallet
            </p>

            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-gradient-to-r from-ember/5 to-ember-light/5 rounded-2xl p-6 mb-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${paymentDetails.amount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Credits Added</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${paymentDetails.credits_added?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/wallet')}
                className="w-full py-4 bg-gradient-to-r from-ember to-ember-dark text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>View Wallet</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
              >
                <Home className="w-5 h-5" />
                <span>Go to Dashboard</span>
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                A receipt has been sent to your email
              </p>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <Loader className="w-16 h-16 text-yellow-600 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Payment Processing
            </h1>
            <p className="text-gray-600 mb-8">
              Your payment is being processed. Please check back in a few moments.
            </p>
            <button
              onClick={checkPaymentStatus}
              className="px-6 py-3 bg-ember text-white rounded-lg hover:bg-ember-light transition-all"
            >
              Check Status Again
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Payment Verification Failed
          </h1>
          <p className="text-gray-600 mb-8">
            We couldn't verify your payment. Please contact support if you were charged.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/payment')}
              className="w-full py-3 bg-ember text-white rounded-lg hover:bg-ember-light transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/wallet')}
              className="w-full py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-all"
            >
              Go to Wallet
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PaymentSuccessPage;
