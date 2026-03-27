import React, { useState, useEffect } from 'react';
import { Lock, ArrowLeft, Loader, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setTokenValid(false);
      setValidating(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/password/validate-token/${token}`);
      if (response.data.valid) {
        setTokenValid(true);
        setEmail(response.data.email);
      } else {
        setTokenValid(false);
        setError(response.data.message);
      }
    } catch (err) {
      setTokenValid(false);
      setError('Invalid or expired reset link');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/password/reset-password`, {
        token,
        new_password: password
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className={`min-h-screen ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900'
          : 'bg-gradient-to-br from-ember via-purple-600 to-orange-600'
      } flex items-center justify-center px-4`}>
        <div className={`max-w-md w-full ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-2xl shadow-2xl p-8 text-center`}>
          <Loader className={`w-12 h-12 ${
            darkMode ? 'text-ember' : 'text-ember'
          } animate-spin mx-auto mb-4`} />
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Validating reset link...
          </p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <div className={`min-h-screen ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900'
          : 'bg-gradient-to-br from-ember via-purple-600 to-orange-600'
      } flex items-center justify-center px-4`}>
        <div className={`max-w-md w-full ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-2xl shadow-2xl p-8`}>
          <div className="text-center">
            <div className={`w-16 h-16 ${
              darkMode ? 'bg-red-900' : 'bg-red-100'
            } rounded-full flex items-center justify-center mx-auto mb-6`}>
              <AlertCircle className={`w-10 h-10 ${
                darkMode ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            
            <h2 className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            } mb-3`}>Invalid Reset Link</h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              {error || 'This password reset link is invalid or has expired.'}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/forgot-password')}
                className={`w-full py-3 ${
                  darkMode
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                } text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
              >
                Request New Link
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className={`w-full py-3 ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } rounded-lg font-semibold transition-all`}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className={`min-h-screen ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900'
          : 'bg-gradient-to-br from-ember via-purple-600 to-orange-600'
      } flex items-center justify-center px-4`}>
        <div className={`max-w-md w-full ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-2xl shadow-2xl p-8`}>
          <div className="text-center">
            <div className={`w-16 h-16 ${
              darkMode ? 'bg-green-900' : 'bg-green-100'
            } rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce`}>
              <CheckCircle className={`w-10 h-10 ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            
            <h2 className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            } mb-3`}>Password Reset Successful! 🎉</h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              Your password has been changed successfully. You can now log in with your new password.
            </p>

            <button
              onClick={() => navigate('/login')}
              className={`w-full py-4 ${
                darkMode
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
              } text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className={`min-h-screen ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900'
        : 'bg-gradient-to-br from-ember via-purple-600 to-orange-600'
    } flex items-center justify-center px-4`}>
      <div className={`max-w-md w-full ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-2xl shadow-2xl p-8`}>
        <div className="mb-6">
          <button
            onClick={() => navigate('/login')}
            className={`flex items-center ${
              darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Login
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-ember-light bg-clip-text text-transparent">CALLIOTEL</span>
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Reset Your Password
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
            For{' '}
            <span className={darkMode ? 'text-ember' : 'text-orange-600'}>{email}</span>
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 ${
            darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
          } border rounded-lg`}>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={`w-full pl-10 pr-12 py-3 border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className={`text-xs ${
              darkMode ? 'text-gray-500' : 'text-gray-500'
            } mt-1`}>Must be at least 8 characters long</p>
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full pl-10 pr-12 py-3 border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 ${
              darkMode
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
            } text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
