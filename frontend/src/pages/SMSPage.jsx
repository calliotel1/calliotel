import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Inbox, Loader, Plus, Phone as PhoneIcon, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SMSPage = () => {
  const [activeTab, setActiveTab] = useState('inbox'); // inbox or send
  const [messages, setMessages] = useState([]);
  const [myNumbers, setMyNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Send form
  const [fromNumber, setFromNumber] = useState('');
  const [toNumber, setToNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyNumbers();
    if (activeTab === 'inbox') {
      fetchMessages();
    }
  }, [activeTab]);

  const fetchMyNumbers = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/numbers/my-numbers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyNumbers(response.data.numbers);
      if (response.data.numbers.length > 0 && !fromNumber) {
        setFromNumber(response.data.numbers[0].phone_number);
      }
    } catch (error) {
      console.error('Error fetching numbers:', error);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/sms/inbox`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendSMS = async (e) => {
    e.preventDefault();
    
    if (!fromNumber || !toNumber || !messageText) {
      toast({
        title: 'Missing fields',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/sms/send`,
        {
          from_number: fromNumber,
          to_number: toNumber,
          text: messageText
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast({
        title: 'SMS Sent!',
        description: `Message sent to ${toNumber}`,
      });
      
      setToNumber('');
      setMessageText('');
      setActiveTab('inbox');
    } catch (error) {
      toast({
        title: 'Failed to send',
        description: error.response?.data?.detail || 'Could not send SMS',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SMS Messaging</h1>
                <p className="text-sm text-gray-600">Send and receive text messages</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {myNumbers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Numbers Yet</h3>
            <p className="text-gray-600 mb-6">You need a virtual number to send SMS</p>
            <button
              onClick={() => navigate('/browse-numbers')}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Get a Number
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-t-xl border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'inbox' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Inbox className="w-5 h-5 inline mr-2" />
                  Inbox
                </button>
                <button
                  onClick={() => setActiveTab('send')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'send' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Send className="w-5 h-5 inline mr-2" />
                  Send SMS
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-b-xl p-6">
              {activeTab === 'inbox' ? (
                // Inbox
                loading ? (
                  <div className="text-center py-12">
                    <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto" />
                    <p className="text-gray-600 mt-4">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${msg.direction === 'outbound' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {msg.direction === 'outbound' ? 'Sent' : 'Received'}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {msg.direction === 'outbound' ? `To: ${msg.to_number}` : `From: ${msg.from_number}`}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Send SMS Form
                <form onSubmit={sendSMS} className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Number</label>
                    <select
                      value={fromNumber}
                      onChange={(e) => setFromNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      {myNumbers.map((num) => (
                        <option key={num.phone_number} value={num.phone_number}>
                          {num.phone_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Number</label>
                    <input
                      type="tel"
                      value={toNumber}
                      onChange={(e) => setToNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message here..."
                      rows={6}
                      maxLength={160}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">{messageText.length}/160 characters</p>
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {sending ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send SMS</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SMSPage;