import React, { useState, useEffect } from 'react';
import { DollarSign, Send, Copy, Check, ArrowRight, User, Mail, Shield, CreditCard, Bell, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import DarkModeToggle from '../components/DarkModeToggle';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountPage = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Transfer state
  const [transferring, setTransferring] = useState(false);
  const [recipientClientId, setRecipientClientId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(response.data.balance);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load balance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyClientId = () => {
    if (user?.client_id) {
      navigator.clipboard.writeText(user.client_id);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Client ID copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTransfer = async () => {
    if (!recipientClientId || !transferAmount) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both Client ID and amount',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: 'Insufficient Balance',
        description: `You only have $${balance.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }

    setTransferring(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/wallet/transfer-balance`,
        {
          recipient_client_id: recipientClientId,
          amount: amount
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: 'Transfer Successful!',
        description: `Sent $${amount.toFixed(2)} to ${response.data.recipient_email}`,
      });

      setRecipientClientId('');
      setTransferAmount('');
      fetchBalance();
    } catch (error) {
      toast({
        title: 'Transfer Failed',
        description: error.response?.data?.detail || 'Could not complete transfer',
        variant: 'destructive',
      });
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account</h1>
                <p className="text-sm text-gray-600">Manage your profile & balance</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-medium">{user?.email}</span>
                  </div>
                  {user?.is_verified && (
                    <div className="flex items-center space-x-1 text-sm text-green-600">
                      <Shield className="w-4 h-4" />
                      <span>Verified Account</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client ID */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Your Client ID</p>
                    <p className="text-xl font-bold text-ember">{user?.client_id || 'Loading...'}</p>
                    <p className="text-xs text-gray-500 mt-1">Share this ID to receive transfers</p>
                  </div>
                  <button
                    onClick={copyClientId}
                    className="px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-all flex items-center space-x-2"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Balance & Transfer Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm mb-2">Available Credit</p>
              <p className="text-4xl font-bold text-gray-900">
                {loading ? '...' : `$${balance.toFixed(3)}`}
              </p>
            </div>

            <p className="text-center text-sm text-gray-500 mb-6">
              <span className="font-medium">Note:</span> Credit can be transferred to Calliotel users only
            </p>

            {/* Transfer Section */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Credit Transfer</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number (Client ID)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipientClientId}
                      onChange={(e) => setRecipientClientId(e.target.value)}
                      placeholder="Enter recipient's Client ID"
                      className="w-full px-4 py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                    />
                    <User className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                  />
                </div>

                <button
                  onClick={handleTransfer}
                  disabled={transferring}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {transferring ? (
                    <>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>SEND</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings Link */}
          <button
            onClick={() => navigate('/settings/notifications')}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-ember/10 dark:bg-olive rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-ember dark:text-ember" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Notification Settings</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage sounds & alerts</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-ember dark:group-hover:text-ember transition-colors" />
          </button>

          {/* AI Settings Link */}
          <button
            onClick={() => navigate('/settings/ai')}
            className="w-full bg-gradient-to-r from-ember/5 to-ember-light/5 dark:from-ember-dark/20 dark:to-obsidian-light/20 rounded-xl shadow-sm p-4 hover:shadow-md transition-all flex items-center justify-between group border-2 border-ember/20 dark:border-ember/20"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">AI Settings</p>
                <p className="text-sm text-ember dark:text-ember">Smart Replies & Translation</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-ember dark:text-ember group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Privacy Settings Link */}
          <button
            onClick={() => navigate('/settings/privacy')}
            className="w-full bg-gradient-to-r from-ember/5 to-ember-light/5 dark:from-ember-dark/20 dark:to-ember-dark/20 rounded-xl shadow-sm p-4 hover:shadow-md transition-all flex items-center justify-between group border-2 border-ember/20 dark:border-ember/20"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light/50 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <span>Privacy & Security</span>
                  <span className="px-2 py-0.5 bg-gradient-to-r from-ember to-ember-light/50 text-white text-xs font-bold rounded-full">NEW</span>
                </p>
                <p className="text-sm text-ember dark:text-ember">Stealth Mode & Data Protection</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-ember dark:text-ember group-hover:translate-x-1 transition-transform" />
          </button>


          {/* Dark Mode Toggle */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <DarkModeToggle />
          </div>

          {/* Transaction History Link */}
          <button
            onClick={() => navigate('/wallet')}
            className="w-full bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-ember" />
              </div>
              <span className="font-medium text-gray-900">Transaction History</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Add Credits Link */}
          <button
            onClick={() => navigate('/wallet')}
            className="w-full bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-900">Add Credits</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AccountPage;
