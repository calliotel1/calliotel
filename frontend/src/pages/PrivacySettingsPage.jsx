import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import safeLocalStorage from '../utils/safeLocalStorage';
import { useToast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PrivacySettingsPage = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stealthMode, setStealthMode] = useState(false);
  const [maskNumbers, setMaskNumbers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/settings/privacy/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStealthMode(response.data.stealth_mode);
      setMaskNumbers(response.data.mask_phone_numbers);
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/settings/privacy/${user.id}`,
        {
          stealth_mode: stealthMode,
          mask_phone_numbers: maskNumbers
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: 'Privacy Settings Updated',
        description: 'Your privacy preferences have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/account')}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light/50 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Privacy & Security
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Stealth Mode & Data Protection
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className={`mb-8 p-6 rounded-2xl ${darkMode ? 'bg-blue-900/20 border-2 border-ember/20' : 'bg-blue-50 border-2 border-blue-200'}`}>
          <div className="flex items-start space-x-3">
            <Shield className={`w-6 h-6 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-ember'}`} />
            <div>
              <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🔐 Carrier-Grade Privacy Controls
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Calliotel offers enterprise-level privacy features designed for users who value data security and anonymity. Perfect for security professionals, journalists, and privacy-conscious businesses.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Settings Cards */}
        <div className="space-y-6">
          {/* Stealth Mode */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  stealthMode 
                    ? 'bg-gradient-to-br from-ember to-ember-light/50' 
                    : darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {stealthMode ? (
                    <EyeOff className="w-6 h-6 text-white" />
                  ) : (
                    <Eye className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Stealth Mode
                  </h3>
                  <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Automatically delete SMS logs older than 24 hours. Your messages will still be sent/received normally, but won't be stored long-term.
                  </p>
                  
                  {stealthMode && (
                    <div className={`flex items-center space-x-2 text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-semibold">Active - Logs auto-delete after 24hrs</span>
                    </div>
                  )}

                  {!stealthMode && (
                    <div className={`flex items-center space-x-2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Messages stored indefinitely</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => setStealthMode(!stealthMode)}
                disabled={loading}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  stealthMode 
                    ? 'bg-gradient-to-r from-ember to-ember-light/50' 
                    : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  stealthMode ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </button>
            </div>
          </div>

          {/* Mask Phone Numbers */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  maskNumbers 
                    ? 'bg-gradient-to-br from-orange-500 to-ember-light' 
                    : darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Lock className={`w-6 h-6 ${maskNumbers ? 'text-white' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Mask Phone Numbers
                  </h3>
                  <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Hide middle digits of phone numbers in the UI for extra privacy. Numbers will display as +1-555-••••-890 instead of full digits.
                  </p>
                  
                  {maskNumbers && (
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        EXAMPLE:
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          +1-555-1234-890
                        </span>
                        <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          → +1-555-••••-890
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => setMaskNumbers(!maskNumbers)}
                disabled={loading}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  maskNumbers 
                    ? 'bg-gradient-to-r from-orange-500 to-ember-light' 
                    : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  maskNumbers ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <button
            onClick={handleSaveSettings}
            disabled={saving || loading}
            className="w-full py-4 bg-gradient-to-r from-ember to-ember-light/50 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Privacy Settings'}
          </button>
        </div>

        {/* Security Notice */}
        <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <strong>Note:</strong> These settings apply to your account only. Messages sent to other users are still stored on their end according to their own privacy settings. Stealth Mode does not delete messages from carrier logs required for legal compliance.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacySettingsPage;
