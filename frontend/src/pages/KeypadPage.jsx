import React, { useState, useEffect } from 'react';
import { Phone, Delete, ArrowLeft, Users, History } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const KeypadPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [myNumbers, setMyNumbers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyNumbers();
  }, []);

  const fetchMyNumbers = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/numbers/my-numbers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyNumbers(response.data.numbers);
      if (response.data.numbers.length > 0) {
        setSelectedNumber(response.data.numbers[0].phone_number);
      }
    } catch (error) {
      console.error('Failed to fetch numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNumberClick = (digit) => {
    if (phoneNumber.length < 20) {
      setPhoneNumber(phoneNumber + digit);
    }
  };

  const handleDelete = () => {
    setPhoneNumber(phoneNumber.slice(0, -1));
  };

  const handleCall = () => {
    if (!phoneNumber) {
      toast({
        title: 'Enter a number',
        description: 'Please enter a phone number to call',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedNumber) {
      toast({
        title: 'No Number Selected',
        description: 'Please purchase a phone number first to make calls',
        variant: 'destructive',
      });
      return;
    }

    // For now, show coming soon message
    toast({
      title: 'Coming Soon',
      description: 'Voice calling will be available once Telnyx Voice is configured',
    });
  };

  const formatPhoneNumber = (number) => {
    if (!number) return '';
    // Simple formatting: +1 (234) 567-8900
    if (number.startsWith('+1') && number.length >= 12) {
      return `+1 (${number.slice(2, 5)}) ${number.slice(5, 8)}-${number.slice(8)}`;
    }
    return number;
  };

  const keypadButtons = [
    { digit: '1', letters: '' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
    { digit: '*', letters: '' },
    { digit: '0', letters: '+' },
    { digit: '#', letters: '' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Keypad</h1>
                <p className="text-sm text-gray-600">Make a call</p>
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

      <div className="max-w-md mx-auto px-4 py-8">
        {/* From Number Selector */}
        {myNumbers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call From:
            </label>
            <select
              value={selectedNumber || ''}
              onChange={(e) => setSelectedNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {myNumbers.map((num) => (
                <option key={num.phone_number} value={num.phone_number}>
                  {num.phone_number} ({num.country})
                </option>
              ))}
            </select>
          </div>
        )}

        {myNumbers.length === 0 && !loading && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <p className="text-orange-800 text-sm">
              You need to purchase a phone number first to make calls.{' '}
              <button
                onClick={() => navigate('/browse-numbers')}
                className="underline font-medium"
              >
                Browse Numbers
              </button>
            </p>
          </div>
        )}

        {/* Display Area */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="w-full text-3xl font-light text-gray-900 bg-transparent border-none focus:outline-none text-center"
              />
            </div>
            {phoneNumber && (
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Delete className="w-6 h-6" />
              </button>
            )}
          </div>
          <p className="text-center text-sm text-gray-500">
            {formatPhoneNumber(phoneNumber) || 'Tap to dial'}
          </p>
        </div>

        {/* Keypad */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            {keypadButtons.map((btn) => (
              <button
                key={btn.digit}
                onClick={() => handleNumberClick(btn.digit)}
                className="aspect-square rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all flex flex-col items-center justify-center group"
              >
                <span className="text-3xl font-light text-gray-900 group-active:scale-95 transition-transform">
                  {btn.digit}
                </span>
                {btn.letters && (
                  <span className="text-xs text-gray-500 mt-1">{btn.letters}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Call Button */}
        <button
          onClick={handleCall}
          disabled={!phoneNumber || !selectedNumber}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg"
        >
          <Phone className="w-6 h-6" />
          <span className="text-lg font-semibold">Call</span>
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => navigate('/contacts')}
            className="py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <Users className="w-5 h-5" />
            <span>Contacts</span>
          </button>
          <button
            onClick={() => navigate('/call-history')}
            className="py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <History className="w-5 h-5" />
            <span>History</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default KeypadPage;
