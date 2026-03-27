import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader, CheckCircle, AlertCircle, ExternalLink, Inbox } from 'lucide-react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  // Cooldown timer
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cooldown > 0) return;
    
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/password/request-reset`, { email });
      setSubmitted(true);
      setCooldown(60); // 60 second cooldown
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const emailDomain = email.split('@')[1];
  const emailProviders = {
    'gmail.com': { name: 'Gmail', url: 'https://mail.google.com' },
    'yahoo.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
    'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com' },
    'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com' },
    'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  };
  const provider = submitted ? emailProviders[emailDomain] : null;

  if (submitted) {
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
            } rounded-full flex items-center justify-center mx-auto mb-6`}>
              <CheckCircle className={`w-10 h-10 ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            
            <h2 className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            } mb-3`}>Check Your Email</h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
              If an account exists with{' '}
              <strong className={darkMode ? 'text-ember' : 'text-orange-600'}>
                {email}
              </strong>
              , you'll receive a password reset link shortly.
            </p>

            <div className={`${
              darkMode ? 'bg-blue-900/20 border-ember/30' : 'bg-blue-50 border-blue-200'
            } border rounded-lg p-4 my-6`}>
              <div className="flex items-start space-x-3">
                <Inbox className={`w-5 h-5 ${
                  darkMode ? 'text-blue-400' : 'text-ember'
                } mt-0.5 flex-shrink-0`} />
                <div className="text-left">
                  <p className={`text-sm ${
                    darkMode ? 'text-blue-300' : 'text-blue-800'
                  } font-semibold mb-1`}>
                    📧 Check your inbox!
                  </p>
                  <p className={`text-sm ${
                    darkMode ? 'text-blue-400' : 'text-blue-700'
                  }`}>
                    The email may take a few minutes to arrive. Don't forget to check your spam folder! The link expires in <strong>1 hour</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Open Email Provider Button */}
            {provider && (
              <a
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3 mb-4 ${
                  darkMode
                    ? 'bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-indigo-700'
                    : 'bg-gradient-to-r from-ember to-ember-light hover:from-ember hover:to-ember-light'
                } text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2`}
              >
                <ExternalLink className="w-5 h-5" />
                <span>Open {provider.name}</span>
              </a>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className={`w-full py-3 ${
                  darkMode
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                } text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
              >
                Back to Login
              </button>
              
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                  setCooldown(0);
                }}
                disabled={cooldown > 0}
                className={`w-full py-3 ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {cooldown > 0 ? `Send Another Email (${cooldown}s)` : 'Send Another Email'}
              </button>
            </div>

            {/* Help Section */}
            <div className={`mt-6 pt-6 border-t ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-start space-x-2">
                <AlertCircle className={`w-5 h-5 ${
                  darkMode ? 'text-yellow-500' : 'text-yellow-600'
                } mt-0.5 flex-shrink-0`} />
                <div className="text-left">
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <strong>Not receiving emails?</strong> Check spam folder or contact{' '}
                    <a 
                      href="mailto:support@calliotel.com" 
                      className={`${
                        darkMode ? 'text-ember' : 'text-orange-600'
                      } hover:underline font-medium`}
                    >
                      support@calliotel.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-ember-light bg-clip-text text-transparent">CALLIOTEL</span>
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Forgot Password?
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
            No worries! Enter your email and we'll send you a reset link.
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
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-10 pr-4 py-3 border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className={`w-full py-3 ${
              darkMode
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
            } text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Wait ${cooldown}s...`
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
            Remember your password?{' '}
            <Link to="/login" className={`${
              darkMode ? 'text-ember' : 'text-orange-600'
            } font-semibold hover:underline`}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
