import React, { useState, useEffect } from 'react';
import { Phone, Trash2, Loader, Plus, Send, X, RotateCcw, Calendar, DollarSign, AlertTriangle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MyNumbersPage = () => {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [transferClientId, setTransferClientId] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [toggling, setToggling] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchMyNumbers = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/numbers/my-numbers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNumbers(response.data.numbers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load your numbers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const releaseNumber = async (phoneNumber) => {
    if (!window.confirm(`Are you sure you want to release ${phoneNumber}?`)) {
      return;
    }

    setDeleting(phoneNumber);
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(`${API}/numbers/release/${phoneNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: 'Released',
        description: `Number ${phoneNumber} has been released`,
      });
      
      fetchMyNumbers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not release number',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const initiateTransfer = (number) => {
    setSelectedNumber(number);
    setShowTransfer(true);
  };

  const transferNumber = async () => {
    if (!transferClientId || !selectedNumber) {
      toast({
        title: 'Invalid input',
        description: 'Please enter recipient Client ID',
        variant: 'destructive',
      });
      return;
    }

    setTransferring(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/numbers/transfer`,
        {
          phone_number: selectedNumber.phone_number,
          recipient_client_id: transferClientId,
          note: transferNote || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: 'Transfer Successful!',
        description: `Number transferred to ${response.data.recipient_email}. Cost: $${response.data.transfer_cost}`,
      });

      setTransferClientId('');
      setTransferNote('');
      setShowTransfer(false);
      setSelectedNumber(null);
      fetchMyNumbers();
    } catch (error) {
      toast({
        title: 'Transfer Failed',
        description: error.response?.data?.detail || 'Could not transfer number',
        variant: 'destructive',
      });
    } finally {
      setTransferring(false);
    }
  };

  const toggleAutoRenew = async (phoneNumber) => {
    setToggling(phoneNumber);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.put(
        `${API}/numbers/toggle-auto-renew/${phoneNumber}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: 'Success',
        description: response.data.message,
      });
      
      fetchMyNumbers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not toggle auto-renew',
        variant: 'destructive',
      });
    } finally {
      setToggling(null);
    }
  };

  const initiateCancelNumber = (number) => {
    setSelectedNumber(number);
    setShowCancelModal(true);
  };

  const cancelNumber = async () => {
    if (!selectedNumber) return;

    setCancelling(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/numbers/cancel/${selectedNumber.phone_number}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: 'Cancellation Scheduled',
        description: response.data.details,
      });
      
      setShowCancelModal(false);
      setSelectedNumber(null);
      fetchMyNumbers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Could not cancel number',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const reactivateNumber = async (phoneNumber) => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/numbers/reactivate/${phoneNumber}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: 'Success',
        description: response.data.message,
      });
      
      fetchMyNumbers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not reactivate number',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchMyNumbers();
  }, []);

  const getCountryFlag = (code) => {
    const flags = {
      'US': '🇺🇸',
      'CA': '🇨🇦',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
    };
    return flags[code] || '🌍';
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-700'
                }`}
                title="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Numbers</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{numbers.length} active number(s)</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:text-orange-400' : 'text-gray-700 hover:text-orange-600'} transition-colors`}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/browse-numbers')}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Get New Number</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-12 h-12 animate-spin text-orange-600 mx-auto" />
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4`}>Loading your numbers...</p>
          </div>
        ) : numbers.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl`}>
            <Phone className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Numbers Yet</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Get started by purchasing your first virtual number</p>
            <button
              onClick={() => navigate('/browse-numbers')}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Browse Available Numbers</span>
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {numbers.map((number) => (
              <div key={number.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${number.cancel_requested ? 'border-2 border-orange-300' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-3xl">{getCountryFlag(number.country_code)}</span>
                    <div>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{number.phone_number}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{number.country_code}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    number.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {number.status}
                  </span>
                </div>

                {/* Cancellation Warning */}
                {number.cancel_requested && (
                  <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-orange-900">Cancellation Scheduled</p>
                        <p className="text-xs text-orange-700">
                          Active until {new Date(number.cancel_effective_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`space-y-2 mb-4 pb-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Monthly Cost:</span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>${number.monthly_cost}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Purchased:</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-900'}>{new Date(number.purchased_at).toLocaleDateString()}</span>
                  </div>
                  {number.next_billing_date && !number.cancel_requested && (
                    <div className="flex justify-between text-sm">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Next Billing:</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-900'}>{new Date(number.next_billing_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Auto-Renew Toggle */}
                {!number.cancel_requested && (
                  <div className={`mb-4 flex items-center justify-between ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
                    <div className="flex items-center space-x-2">
                      <RotateCcw className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Auto-Renew</span>
                    </div>
                    <button
                      onClick={() => toggleAutoRenew(number.phone_number)}
                      disabled={toggling === number.phone_number}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        number.auto_renew ? 'bg-green-500' : 'bg-gray-300'
                      } ${toggling === number.phone_number ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          number.auto_renew ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {number.cancel_requested ? (
                    <button
                      onClick={() => reactivateNumber(number.phone_number)}
                      className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reactivate Number</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => initiateTransfer(number)}
                        disabled={number.status !== 'active'}
                        className="w-full py-2 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Transfer Number ($1.00)</span>
                      </button>
                      
                      <button
                        onClick={() => initiateCancelNumber(number)}
                        disabled={number.status !== 'active'}
                        className="w-full py-2 border-2 border-orange-500 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel Subscription</span>
                      </button>

                      <button
                        onClick={() => releaseNumber(number.phone_number)}
                        disabled={deleting === number.phone_number || number.status !== 'active'}
                        className="w-full py-2 border-2 border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {deleting === number.phone_number ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Releasing...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Release Immediately</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transfer Modal */}
        {showTransfer && selectedNumber && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl max-w-md w-full p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transfer Number</h3>
                <button
                  onClick={() => setShowTransfer(false)}
                  className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-ember font-medium mb-1">Transferring Number</p>
                <p className="text-xl font-bold text-blue-900 font-mono">{selectedNumber.phone_number}</p>
                <p className="text-xs text-orange-600 mt-2">Transfer Fee: $1.00</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Recipient Client ID
                  </label>
                  <input
                    type="text"
                    value={transferClientId}
                    onChange={(e) => setTransferClientId(e.target.value.toUpperCase())}
                    placeholder="CL12345678"
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    placeholder="Transfer reason..."
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <button
                  onClick={transferNumber}
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
                      <span>Confirm Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && selectedNumber && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl max-w-md w-full p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cancel Subscription</h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-600 font-medium mb-1">Number to Cancel</p>
                <p className="text-xl font-bold text-orange-900 font-mono">{selectedNumber.phone_number}</p>
              </div>

              <div className="bg-blue-50 border-l-4 border-ember p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-ember mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">What happens next?</p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Your number will remain active until the end of your current billing period</li>
                      <li>• You can continue using it normally until then</li>
                      <li>• Auto-renew will be disabled</li>
                      <li>• You can reactivate anytime before it expires</li>
                      {selectedNumber.next_billing_date && (
                        <li className="font-semibold mt-2">
                          • Expiration: {new Date(selectedNumber.next_billing_date).toLocaleDateString()}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className={`flex-1 py-3 border-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} font-semibold rounded-lg transition-all`}
                >
                  Keep Number
                </button>
                <button
                  onClick={cancelNumber}
                  disabled={cancelling}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {cancelling ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5" />
                      <span>Cancel Subscription</span>
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

export default MyNumbersPage;