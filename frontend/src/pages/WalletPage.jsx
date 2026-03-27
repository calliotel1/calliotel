import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, ArrowUpRight, ArrowDownRight, Loader, DollarSign, Send, X, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import safeLocalStorage from '../utils/safeLocalStorage';
import CreditPackagesWidget from '../components/CreditPackagesWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WalletPage = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [amount, setAmount] = useState('');
  
  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferClientId, setTransferClientId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch balance
      const balanceRes = await axios.get(`${API}/wallet/balance`, { headers });
      setBalance(balanceRes.data.balance);

      // Fetch transactions
      const txRes = await axios.get(`${API}/wallet/transactions?limit=20`, { headers });
      setTransactions(txRes.data.transactions);

      // Fetch pricing
      const priceRes = await axios.get(`${API}/wallet/pricing`);
      setPricing(priceRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load wallet data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addCredits = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/wallet/add-credits`,
        {
          amount: amountNum,
          payment_method: 'manual'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: 'Credits Added!',
        description: `$${amountNum.toFixed(2)} added to your account`,
      });

      setAmount('');
      fetchWalletData();
    } catch (error) {
      toast({
        title: 'Failed',
        description: error.response?.data?.detail || 'Could not add credits',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const transferBalance = async () => {
    const amountNum = parseFloat(transferAmount);
    if (!transferClientId || !amountNum || amountNum <= 0) {
      toast({
        title: 'Invalid input',
        description: 'Please enter recipient Client ID and valid amount',
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
          recipient_client_id: transferClientId,
          amount: amountNum,
          note: transferNote || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: 'Transfer Successful!',
        description: `$${amountNum.toFixed(2)} sent to ${response.data.recipient_email}`,
      });

      setTransferClientId('');
      setTransferAmount('');
      setTransferNote('');
      setShowTransfer(false);
      fetchWalletData();
    } catch (error) {
      toast({
        title: 'Transfer Failed',
        description: error.response?.data?.detail || 'Could not transfer balance',
        variant: 'destructive',
      });
    } finally {
      setTransferring(false);
    }
  };

  const quickAmounts = [5, 10, 25, 50];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account balance</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-12 h-12 animate-spin text-ember dark:text-blue-400 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading wallet...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-ember to-ember-light rounded-2xl p-8 text-white">
                <p className="text-blue-100 mb-2">Current Balance</p>
                <h2 className="text-5xl font-bold mb-6">${balance.toFixed(2)}</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-100">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">USD</span>
                  </div>
                  <button
                    onClick={() => setShowTransfer(true)}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-sm font-semibold">Transfer</span>
                  </button>
                </div>
              </div>


              {/* Credit Packages Widget */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
                <CreditPackagesWidget />
              </div>

              {/* Transaction Vault - Enhanced History */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                {/* Header with Premium Branding */}
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Transaction Vault 🏛️</h3>
                      <p className="text-orange-100 text-sm">Your complete purchase history</p>
                    </div>
                  </div>
                </div>

                {/* Transaction Table */}
                <div className="p-6">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your purchase history will appear here</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Type</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Description</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Date & Time</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Balance</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx, index) => {
                            // Extract number from description if it's a virtual number purchase
                            const isVirtualNumber = tx.description?.includes('Virtual number purchase');
                            const phoneNumber = isVirtualNumber ? tx.description.split(': ')[1] : null;
                            
                            return (
                              <tr 
                                key={tx.id} 
                                className={`border-b border-gray-100 dark:border-gray-700/50 ${
                                  index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''
                                }`}
                              >
                                {/* Type Icon */}
                                <td className="py-4 px-4">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                    tx.type === 'credit' 
                                      ? 'bg-green-100 dark:bg-green-900/30' 
                                      : 'bg-orange-100 dark:bg-orange-900/30'
                                  }`}>
                                    {tx.type === 'credit' ? (
                                      <ArrowDownRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <ArrowUpRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    )}
                                  </div>
                                </td>

                                {/* Description */}
                                <td className="py-4 px-4">
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                      {isVirtualNumber ? 'Virtual Number Purchase' : tx.description}
                                    </p>
                                    {phoneNumber && (
                                      <p className="text-sm text-orange-600 dark:text-orange-400 font-mono mt-1">
                                        📱 {phoneNumber}
                                      </p>
                                    )}
                                  </div>
                                </td>

                                {/* Date/Time */}
                                <td className="py-4 px-4">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {new Date(tx.created_at).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </td>

                                {/* Amount */}
                                <td className="py-4 px-4 text-right">
                                  <p className={`font-bold text-lg ${
                                    tx.type === 'credit' 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-orange-600 dark:text-orange-400'
                                  }`}>
                                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                                  </p>
                                </td>

                                {/* Balance After */}
                                <td className="py-4 px-4 text-right">
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    ${tx.balance_after.toFixed(2)}
                                  </p>
                                </td>

                                {/* Status Badge */}
                                <td className="py-4 px-4 text-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    ✓ Completed
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Add Credits Card */}
              <div className="bg-gradient-to-br from-ember/5 to-ember-light/5 rounded-xl shadow-sm p-6 border-2 border-ember/20">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Add Credits</h3>
                <p className="text-sm text-gray-600 mb-4">Top up your wallet with secure payments</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/payment')}
                    className="w-full px-6 py-4 bg-gradient-to-r from-ember to-ember-dark text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Add Credits with Card</span>
                  </button>

                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span>Secure Payment</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs text-gray-600">
                    <div className="flex items-center justify-center space-x-1">
                      <span>💳</span>
                      <span>Cards</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <span>₿</span>
                      <span>Crypto</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white rounded-lg border border-ember/20">
                    <p className="text-xs text-gray-600 mb-2 font-semibold">💡 Available Packages:</p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Starter:</span>
                        <span className="font-semibold text-ember">$10 → $10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Basic:</span>
                        <span className="font-semibold text-ember">$25 → $27 (+$2)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pro:</span>
                        <span className="font-semibold text-ember">$50 → $55 (+$5)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Premium:</span>
                        <span className="font-semibold text-ember">$100 → $115 (+$15)</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods Preview */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-ember/5 to-ember-light/5 rounded-lg border border-ember/20">
                    <p className="text-xs text-gray-600 mb-2 font-semibold text-center">We Accept:</p>
                    <div className="flex items-center justify-center space-x-2 flex-wrap gap-2">
                      <div className="px-2 py-1 bg-white rounded text-[10px] font-bold text-blue-700 border border-blue-200">VISA</div>
                      <div className="px-2 py-1 bg-white rounded text-[10px] font-bold text-red-700 border border-red-200">MC</div>
                      <div className="px-2 py-1 bg-white rounded text-[10px] font-bold text-orange-600 border border-orange-200">₿</div>
                      <div className="px-2 py-1 bg-white rounded text-[10px] font-bold text-green-600 border border-green-200">₮</div>
                    </div>
                  </div>
                </div>

                {/* Old manual add method (hidden) */}
                <button
                  onClick={addCredits}
                  disabled={adding}
                  style={{ display: 'none' }}
                  className="w-full py-3 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-dark transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {adding ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Add Credits</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Payment gateway integration coming soon
                </p>
              </div>

              {/* Pricing Info */}
              {pricing && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">SMS per message</span>
                      <span className="font-semibold text-gray-900">${pricing.sms_cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Calls per minute</span>
                      <span className="font-semibold text-gray-900">${pricing.call_cost_per_minute}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number monthly fee</span>
                      <span className="font-semibold text-gray-900">${pricing.number_monthly_cost}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3">
                      <span className="text-gray-600">Number transfer fee</span>
                      <span className="font-semibold text-orange-600">${pricing.number_transfer_cost}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransfer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Transfer Balance</h3>
                <button
                  onClick={() => setShowTransfer(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Client ID
                  </label>
                  <input
                    type="text"
                    value={transferClientId}
                    onChange={(e) => setTransferClientId(e.target.value.toUpperCase())}
                    placeholder="CL12345678"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Available: ${balance.toFixed(2)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    placeholder="Payment for..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={transferBalance}
                  disabled={transferring}
                  className="w-full py-3 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-dark transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {transferring ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
