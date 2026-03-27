import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { X, Heart, Gift, Send, DollarSign, Sparkles } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SendBirthdayWishModal = ({ isOpen, onClose, friend }) => {
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [giftAmount, setGiftAmount] = useState(0);
  const [sending, setSending] = useState(false);
  const [includeGift, setIncludeGift] = useState(false);
  const [cardTemplates, setCardTemplates] = useState([]);
  const [selectedCard, setSelectedCard] = useState('balloons');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCardTemplates();
    }
  }, [isOpen]);

  const fetchCardTemplates = async () => {
    try {
      const response = await axios.get(`${API}/birthdays/card-templates`);
      setCardTemplates(response.data.templates || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching card templates:', error);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSendWish = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please write a birthday wish",
        variant: "destructive"
      });
      return;
    }

    if (includeGift && giftAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Gift amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Send wish with card template
      await axios.post(
        `${API}/birthdays/send-wish`,
        {
          recipient_id: friend.id || friend.email,
          message: message,
          card_template: selectedCard
        },
        { headers }
      );

      // Send gift if included
      if (includeGift && giftAmount > 0) {
        await axios.post(
          `${API}/birthdays/send-gift`,
          {
            recipient_id: friend.id || friend.email,
            gift_type: 'credits',
            amount: parseFloat(giftAmount)
          },
          { headers }
        );
      }

      toast({
        title: "Birthday wish sent! 🎉",
        description: includeGift 
          ? `Your wish and $${giftAmount} gift have been sent!`
          : "Your birthday wish has been sent!"
      });

      onClose();
      setMessage('');
      setGiftAmount(0);
      setIncludeGift(false);
      setSelectedCard('balloons');
    } catch (error) {
      console.error('Error sending wish:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to send birthday wish",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getCardGradient = (gradient) => {
    return `bg-gradient-to-br ${gradient}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative my-8`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            🎂 Send Birthday Wish
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Send wishes to {friend.name || friend.full_name || 'your friend'}
          </p>
        </div>

        {/* Card Template Selector */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
            <Sparkles className="w-4 h-4 inline mr-2" />
            Choose a Birthday Card *
          </label>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {cardTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedCard(template.id)}
                  className={`relative p-4 rounded-xl transition-all transform hover:scale-105 ${
                    selectedCard === template.id
                      ? 'ring-4 ring-purple-500 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className={`${getCardGradient(template.gradient)} rounded-lg p-6 text-center`}>
                    <div className="text-4xl mb-2">{template.preview}</div>
                    <div className="text-white text-xs font-semibold">{template.name}</div>
                  </div>
                  {selectedCard === template.id && (
                    <div className="absolute -top-2 -right-2 bg-ember text-white rounded-full p-1">
                      <Heart className="w-4 h-4 fill-current" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Wish Message */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Your Birthday Message *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="🎉 Happy Birthday! Wishing you an amazing day filled with joy and happiness! 🎂"
            rows={4}
            className={`w-full px-4 py-3 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          />
        </div>

        {/* Quick Message Templates */}
        <div className="mb-6">
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Quick Templates:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              '🎉 Happy Birthday! Have an amazing day!',
              '🎂 Wishing you joy and success!',
              '🎈 Another year wiser! Enjoy your day!',
              '✨ May all your wishes come true!'
            ].map((template, index) => (
              <button
                key={index}
                onClick={() => setMessage(template)}
                className={`text-xs px-3 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors`}
              >
                {template.slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>

        {/* Gift Option */}
        <div className="mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeGift}
              onChange={(e) => setIncludeGift(e.target.checked)}
              className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500"
            />
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Gift className="w-5 h-5 inline mr-2" />
              Include a gift (send credits)
            </span>
          </label>

          {includeGift && (
            <div className="mt-4 ml-8">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Gift Amount ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="5.00"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                />
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Credits will be deducted from your wallet
              </p>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendWish}
          disabled={sending || !message.trim()}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
            darkMode
              ? 'bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark'
              : 'bg-gradient-to-r from-ember to-ember-light/50 hover:from-ember hover:to-ember-light'
          }`}
        >
          {sending ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Sending...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Send className="w-5 h-5 mr-2" />
              Send Birthday Wish {includeGift && `& $${giftAmount} Gift`}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default SendBirthdayWishModal;
