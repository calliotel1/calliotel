import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { Gift, Heart, Calendar, DollarSign, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BirthdayWishesPage = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wishes, setWishes] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wishes');

  useEffect(() => {
    fetchWishesAndGifts();
  }, []);

  const fetchWishesAndGifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [wishesRes, giftsRes] = await Promise.all([
        axios.get(`${API}/birthdays/my-wishes`, { headers }),
        axios.get(`${API}/birthdays/my-gifts`, { headers })
      ]);

      setWishes(wishesRes.data.wishes || []);
      setGifts(giftsRes.data.gifts || []);
    } catch (error) {
      console.error('Error fetching wishes/gifts:', error);
      toast({
        title: "Error",
        description: "Failed to load birthday wishes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCardGradient = (cardTemplate) => {
    const gradients = {
      'balloons': 'from-ember-400 via-purple-400 to-ember-light/40',
      'cake': 'from-orange-400 via-red-400 to-ember-light/40',
      'party': 'from-yellow-400 via-orange-400 to-red-400',
      'sparkles': 'from-ember/40 via-pink-400 to-indigo-400',
      'gifts': 'from-green-400 via-teal-400 to-ember-light/40',
      'fireworks': 'from-ember via-ember to-ember-light/50',
      'rainbow': 'from-red-400 via-yellow-400 to-green-400',
      'hearts': 'from-ember/50 via-rose-500 to-red-500',
      'confetti': 'from-amber-400 via-pink-400 to-ember-light/40',
      'music': 'from-ember/40 via-cyan-400 to-teal-400',
      'crown': 'from-yellow-500 via-amber-500 to-orange-500',
      'magic': 'from-violet-500 via-ember to-fuchsia-500',
      'tropical': 'from-lime-400 via-emerald-400 to-teal-500',
      'winter': 'from-ember/30 via-cyan-300 to-sky-400',
      'stars': 'from-ember via-blue-600 to-ember-light',
      'flowers': 'from-ember-300 via-rose-300 to-fuchsia-400',
      'sunset': 'from-orange-500 via-rose-500 to-ember-light',
      'champagne': 'from-yellow-300 via-amber-400 to-yellow-500',
      'default': 'from-ember to-ember-light/50'
    };
    return gradients[cardTemplate] || gradients['default'];
  };

  const getCardEmoji = (cardTemplate) => {
    const emojis = {
      'balloons': '🎈',
      'cake': '🎂',
      'party': '🎉',
      'sparkles': '✨',
      'gifts': '🎁',
      'fireworks': '🎆',
      'rainbow': '🌈',
      'hearts': '💖',
      'confetti': '🎊',
      'music': '🎵',
      'crown': '👑',
      'magic': '🪄',
      'tropical': '🌺',
      'winter': '❄️',
      'stars': '⭐',
      'flowers': '🌸',
      'sunset': '🌅',
      'champagne': '🥂',
      'default': '🎂'
    };
    return emojis[cardTemplate] || emojis['default'];
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🎂 Birthday Wishes & Gifts
                </h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  See all the love from your friends!
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setActiveTab('wishes')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'wishes'
                  ? 'bg-gradient-to-r from-ember to-ember-light text-white shadow-lg'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Heart className="w-5 h-5 inline mr-2" />
              Wishes ({wishes.length})
            </button>
            <button
              onClick={() => setActiveTab('gifts')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'gifts'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Gift className="w-5 h-5 inline mr-2" />
              Gifts ({gifts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember mx-auto"></div>
            <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
          </div>
        ) : (
          <>
            {/* Wishes Tab */}
            {activeTab === 'wishes' && (
              <div className="space-y-4">
                {wishes.length === 0 ? (
                  <div className={`text-center py-12 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl`}>
                    <Heart className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No birthday wishes yet
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                      Your friends will send you wishes on your birthday!
                    </p>
                  </div>
                ) : (
                  wishes.map((wish) => (
                    <div
                      key={wish.id}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow`}
                    >
                      {/* Card Header with Gradient */}
                      <div className={`bg-gradient-to-r ${getCardGradient(wish.card_template)} p-4 text-white`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-4xl">{getCardEmoji(wish.card_template)}</div>
                            <div>
                              <h3 className="font-bold text-lg">
                                {wish.sender_name}
                                {wish.type === 'admin_wish' && (
                                  <span className="ml-2 text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                                    Admin
                                  </span>
                                )}
                              </h3>
                              <span className="text-xs text-white/80">
                                {formatDate(wish.created_at)}
                              </span>
                            </div>
                          </div>
                          <Heart className="w-6 h-6 fill-current" />
                        </div>
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-6">
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed text-lg`}>
                          {wish.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Gifts Tab */}
            {activeTab === 'gifts' && (
              <div className="space-y-4">
                {gifts.length === 0 ? (
                  <div className={`text-center py-12 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl`}>
                    <Gift className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No birthday gifts yet
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                      Your friends can send you credits as birthday gifts!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Total Gifts Summary */}
                    <div className={`${darkMode ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'bg-gradient-to-r from-orange-500 to-red-500'} text-white rounded-xl p-6 shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Total Gifts Received</p>
                          <p className="text-4xl font-bold mt-1">
                            ${gifts.reduce((sum, g) => sum + (g.amount || 0), 0).toFixed(2)}
                          </p>
                        </div>
                        <Sparkles className="w-16 h-16 opacity-50" />
                      </div>
                    </div>

                    {/* Individual Gifts */}
                    {gifts.map((gift) => (
                      <div
                        key={gift.id}
                        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-full p-3">
                            <Gift className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {gift.sender_name}
                              </h3>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formatDate(gift.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <DollarSign className="w-5 h-5 text-green-500" />
                              <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                ${gift.amount?.toFixed(2)}
                              </span>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                sent as {gift.gift_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BirthdayWishesPage;
