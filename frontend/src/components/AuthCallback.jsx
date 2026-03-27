import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('');

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id and provider from URL fragment
        const hash = location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');
        const authProvider = params.get('provider') || 'google';
        setProvider(authProvider);

        if (!sessionId) {
          console.error('No session_id in URL');
          setStatus('error');
          setError('Missing authentication session. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Exchange session_id for user data
        const response = await axios.post(
          `${API}/auth/emergent/${authProvider}/exchange-session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        if (response.data.success) {
          setStatus('success');
          // Wait 1.5 seconds to show success state
          setTimeout(() => {
            navigate('/dashboard', {
              state: { user: response.data.user },
              replace: true
            });
          }, 1500);
        } else {
          throw new Error('Session exchange failed');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        
        // Better error messages
        if (error.response?.status === 401) {
          setError('Authentication expired. Please sign in again.');
        } else if (error.response?.status === 404) {
          setError('Account not found. Please sign up first.');
        } else if (error.message.includes('Network')) {
          setError('Network error. Please check your connection.');
        } else {
          setError('Authentication failed. Please try again.');
        }
        
        setTimeout(() => navigate('/login?error=authentication_failed'), 4000);
      }
    };

    processSession();
  }, [location, navigate, darkMode]);

  const getProviderName = () => {
    return provider === 'microsoft' ? 'Microsoft' : 'Google';
  };

  return (
    <div className={`min-h-screen ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900'
        : 'bg-gradient-to-br from-ember/5 to-indigo-100'
    } flex items-center justify-center px-4`}>
      <div className={`max-w-md w-full ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-2xl shadow-2xl p-8 text-center`}>
        
        {/* Processing State */}
        {status === 'processing' && (
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
              Completing {getProviderName()} Sign In...
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Please wait while we secure your session
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
            <h2 className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            } mb-2`}>
              🎉 Welcome Back!
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Successfully signed in with {getProviderName()}
            </p>
            <div className={`${
              darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
            } border rounded-lg p-4`}>
              <p className={`text-sm ${
                darkMode ? 'text-green-300' : 'text-green-800'
              }`}>
                Redirecting to your dashboard...
              </p>
            </div>
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
            } mb-2`}>
              Authentication Failed
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              {error}
            </p>
            <div className={`${
              darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
            } border rounded-lg p-4 mb-4`}>
              <div className="flex items-start space-x-2">
                <AlertTriangle className={`w-5 h-5 ${
                  darkMode ? 'text-yellow-400' : 'text-yellow-600'
                } mt-0.5 flex-shrink-0`} />
                <p className={`text-sm ${
                  darkMode ? 'text-yellow-300' : 'text-yellow-800'
                } text-left`}>
                  <strong>Tip:</strong> Make sure you're using a valid {getProviderName()} account and have granted all required permissions.
                </p>
              </div>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Redirecting to login page...
            </p>
          </>
        )}

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
    </div>
  );
};

export default AuthCallback;
