import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, AlertTriangle, Home } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmailVerificationSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [status, setStatus] = useState('loading'); // loading, success, error, expired
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification link. Please check your email for the correct link.');
      return;
    }

    verifyEmail();
  }, [token]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/login');
    }
  }, [status, countdown, navigate]);

  const verifyEmail = async () => {
    try {
      const response = await axios.post(`${API}/email/verify`, {
        token: token
      });
      
      if (response.data.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      }
    } catch (error) {
      const detail = error.response?.data?.detail || 'Verification failed';
      
      if (detail.includes('expired')) {
        setStatus('expired');
        setMessage('Your verification link has expired. Please request a new one.');
      } else if (detail.includes('Invalid')) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email or request a new verification.');
      } else {
        setStatus('error');
        setMessage(detail);
      }
    }
  };

  const handleResendEmail = () => {
    navigate('/verify-email');
  };

  return (
    <div className={`min-h-screen ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900'
        : 'bg-gradient-to-br from-ember via-purple-600 to-orange-600'
    } flex items-center justify-center px-4`}>
      <div className={`max-w-md w-full ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-2xl shadow-2xl p-8 sm:p-10`}>
        <div className="text-center">
          
          {/* Loading State */}
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <div className={`w-24 h-24 ${
                  darkMode ? 'bg-blue-900' : 'bg-blue-100'
                } rounded-full flex items-center justify-center`}>
                  <Loader className={`w-12 h-12 ${
                    darkMode ? 'text-blue-400' : 'text-ember'
                  } animate-spin`} />
                </div>
              </div>
              <h2 className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              } mb-2`}>
                Verifying Your Email...
              </h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Please wait while we verify your email address
              </p>
              <div className={`mt-6 h-2 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              } rounded-full overflow-hidden`}>
                <div className="h-full bg-gradient-to-r from-ember to-ember-light animate-progress"></div>
              </div>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6 animate-bounce-once">
                <div className={`w-24 h-24 ${
                  darkMode ? 'bg-green-900' : 'bg-green-100'
                } rounded-full flex items-center justify-center`}>
                  <CheckCircle className={`w-14 h-14 ${
                    darkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
              </div>
              <h2 className={`text-3xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              } mb-3`}>
                🎉 Email Verified!
              </h2>
              <p className={`${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              } mb-6 text-lg`}>
                {message}
              </p>
              <div className={`${
                darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
              } border rounded-lg p-4 mb-6`}>
                <p className={`text-sm ${
                  darkMode ? 'text-green-300' : 'text-green-800'
                }`}>
                  You can now access all features of your Calliotel account!
                </p>
              </div>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              } mb-4`}>
                Redirecting to login in <strong>{countdown}</strong> seconds...
              </p>
              <button
                onClick={() => navigate('/login')}
                className={`w-full px-8 py-3 ${
                  darkMode
                    ? 'bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-indigo-700'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                } text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2`}
              >
                <Home className="w-5 h-5" />
                <span>Go to Login Now</span>
              </button>
            </>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <>
              <div className="flex justify-center mb-6">
                <div className={`w-24 h-24 ${
                  darkMode ? 'bg-yellow-900' : 'bg-yellow-100'
                } rounded-full flex items-center justify-center`}>
                  <AlertTriangle className={`w-14 h-14 ${
                    darkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                </div>
              </div>
              <h2 className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              } mb-3`}>
                Link Expired
              </h2>
              <p className={`${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              } mb-6`}>
                {message}
              </p>
              <div className={`${
                darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
              } border rounded-lg p-4 mb-6`}>
                <p className={`text-sm ${
                  darkMode ? 'text-yellow-300' : 'text-yellow-800'
                }`}>
                  Verification links expire after 24 hours for security reasons.
                </p>
              </div>
              <button
                onClick={handleResendEmail}
                className={`w-full px-8 py-3 ${
                  darkMode
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                } text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg`}
              >
                Request New Verification Link
              </button>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className={`w-24 h-24 ${
                  darkMode ? 'bg-red-900' : 'bg-red-100'
                } rounded-full flex items-center justify-center`}>
                  <XCircle className={`w-14 h-14 ${
                    darkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
              </div>
              <h2 className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              } mb-3`}>
                Verification Failed
              </h2>
              <p className={`${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              } mb-6`}>
                {message}
              </p>
              <div className={`${
                darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
              } border rounded-lg p-4 mb-6`}>
                <p className={`text-sm ${
                  darkMode ? 'text-red-300' : 'text-red-800'
                }`}>
                  <strong>Possible reasons:</strong>
                </p>
                <ul className={`text-sm ${
                  darkMode ? 'text-red-400' : 'text-red-700'
                } list-disc list-inside mt-2 text-left`}>
                  <li>The link may have already been used</li>
                  <li>The link might have been copied incorrectly</li>
                  <li>The link has expired (24 hours)</li>
                </ul>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  className={`w-full px-8 py-3 ${
                    darkMode
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                  } text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg`}
                >
                  Request New Link
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full px-8 py-3 ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } font-semibold rounded-lg transition-all`}
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>

        {/* Help Footer */}
        <div className={`mt-8 pt-6 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <p className={`text-xs ${
            darkMode ? 'text-gray-500' : 'text-gray-500'
          } text-center`}>
            Need help?{' '}
            <a 
              href="mailto:support@calliotel.com" 
              className={`${
                darkMode ? 'text-ember' : 'text-orange-600'
              } hover:underline font-medium`}
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default EmailVerificationSuccessPage;