import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle, Clock, AlertCircle, ExternalLink, Inbox } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VerifyEmailPage = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.email_verified) {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  if (!user) {
    return null;
  }

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/email/resend?email=${encodeURIComponent(user.email)}`);
      
      setEmailSent(true);
      setCooldown(60); // 60 second cooldown
      
      toast({
        title: "✅ Email Sent!",
        description: "Check your inbox for the verification link",
      });

      // Hide the success message after 5 seconds
      setTimeout(() => setEmailSent(false), 5000);
    } catch (error) {
      const detail = error.response?.data?.detail || "Please try again";
      
      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        const match = detail.match(/(\d+) seconds/);
        if (match) {
          setCooldown(parseInt(match[1]));
        }
      }
      
      toast({
        title: "Failed to Send",
        description: detail,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const emailDomain = user.email.split('@')[1];
  const emailProviders = {
    'gmail.com': { name: 'Gmail', url: 'https://mail.google.com' },
    'yahoo.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
    'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com' },
    'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com' },
    'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  };

  const provider = emailProviders[emailDomain];

  return (
    <div className={`min-h-screen ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900'
        : 'bg-gradient-to-br from-ember via-purple-600 to-orange-600'
    } flex items-center justify-center px-4 py-8`}>
      <div className={`max-w-lg w-full ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-2xl shadow-2xl p-8 sm:p-10`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`w-20 h-20 ${
              darkMode ? 'bg-olive-900' : 'bg-orange-100'
            } rounded-full flex items-center justify-center animate-pulse`}>
              <Mail className={`w-10 h-10 ${
                darkMode ? 'text-ember' : 'text-orange-600'
              }`} />
            </div>
          </div>
          <h2 className={`text-3xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          } mb-2`}>
            Verify Your Email
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
            We've sent a verification link to:
          </p>
          <p className={`${
            darkMode ? 'text-ember' : 'text-orange-600'
          } font-semibold mt-2 text-lg break-all`}>
            {user.email}
          </p>
        </div>

        {/* Success Animation */}
        {emailSent && (
          <div className={`${
            darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
          } border rounded-lg p-4 mb-6 animate-fade-in`}>
            <div className="flex items-center space-x-3">
              <CheckCircle className={`w-5 h-5 ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`} />
              <p className={`text-sm ${
                darkMode ? 'text-green-300' : 'text-green-800'
              } font-medium`}>
                Email sent successfully! Check your inbox.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={`${
          darkMode ? 'bg-blue-900/20 border-ember/30' : 'bg-blue-50 border-blue-200'
        } border rounded-lg p-4 mb-6`}>
          <div className="flex items-start space-x-3">
            <Inbox className={`w-5 h-5 ${
              darkMode ? 'text-blue-400' : 'text-ember'
            } mt-0.5 flex-shrink-0`} />
            <div>
              <p className={`text-sm ${
                darkMode ? 'text-blue-300' : 'text-blue-800'
              } font-semibold mb-1`}>
                Check your inbox!
              </p>
              <p className={`text-sm ${
                darkMode ? 'text-blue-400' : 'text-blue-700'
              }`}>
                Click the verification link in the email to activate your account. The link expires in <strong>24 hours</strong>.
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

        {/* Resend Button */}
        <div className="space-y-4">
          <p className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          } text-center`}>
            Didn't receive the email?
          </p>
          <button
            onClick={handleResend}
            disabled={loading || cooldown > 0}
            className={`w-full py-3 ${
              darkMode
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
            } text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-5 h-5" />
                <span>Resend in {cooldown}s</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
        </div>

        {/* Help Section */}
        <div className={`mt-8 pt-6 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-start space-x-2 mb-4">
            <AlertCircle className={`w-5 h-5 ${
              darkMode ? 'text-yellow-500' : 'text-yellow-600'
            } mt-0.5 flex-shrink-0`} />
            <div>
              <p className={`text-sm font-semibold ${
                darkMode ? 'text-yellow-400' : 'text-yellow-700'
              } mb-1`}>
                Troubleshooting Tips:
              </p>
              <ul className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              } space-y-1 list-disc list-inside`}>
                <li>Check your <strong>spam/junk folder</strong></li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes for the email to arrive</li>
                <li>Add <strong>support@calliotel.com</strong> to your contacts</li>
              </ul>
            </div>
          </div>

          <p className={`text-xs ${
            darkMode ? 'text-gray-500' : 'text-gray-500'
          } text-center mt-6`}>
            Having trouble? Contact us at{' '}
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
  );
};

export default VerifyEmailPage;