import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send, Image, Video, Smile, Calendar, Flame, Trophy, Clock } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatStatsModal = ({ isOpen, onClose, friendUserId, friendName }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && friendUserId) {
      fetchStats();
    }
  }, [isOpen, friendUserId]);

  const fetchStats = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(
        `${API}/chat/stats/${friendUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Chat Stats with {friendName}
              </h2>
              <p className="text-sm text-gray-600">
                Your friendship journey in numbers 📊
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
              </div>
            ) : stats ? (
              <>
                {/* Friendship Duration Banner */}
                <div className="bg-gradient-to-r from-ember to-ember-light/50 rounded-xl p-6 mb-6 text-white text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-3xl font-bold mb-1">{stats.days_as_friends}</p>
                  <p className="text-sm opacity-90">Days as Friends</p>
                  {stats.first_message_date && (
                    <p className="text-xs opacity-75 mt-2">
                      Since {formatDate(stats.first_message_date)}
                    </p>
                  )}
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Total Messages */}
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-ember rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_messages}</p>
                    <p className="text-sm text-gray-600">Total Messages</p>
                  </div>

                  {/* Messages Sent */}
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Send className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.messages_sent}</p>
                    <p className="text-sm text-gray-600">You Sent</p>
                  </div>

                  {/* Photos */}
                  <div className="bg-ember/5 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-ember rounded-full flex items-center justify-center mx-auto mb-3">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.photos_shared}</p>
                    <p className="text-sm text-gray-600">Photos Shared</p>
                  </div>

                  {/* Videos */}
                  <div className="bg-ember/5 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-ember/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.videos_shared}</p>
                    <p className="text-sm text-gray-600">Videos Shared</p>
                  </div>
                </div>

                {/* Streak Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        <Flame className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Current Streak</p>
                        <p className="text-xl font-bold text-gray-900">{stats.current_streak} days</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Best Streak</p>
                        <p className="text-xl font-bold text-gray-900">{stats.best_streak} days</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="space-y-3">
                  {/* Stickers */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Smile className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-700">Stickers You Sent</span>
                    </div>
                    <span className="font-bold text-gray-900">{stats.stickers_sent}</span>
                  </div>

                  {/* Favorite Time */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-700">You Chat Most At</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{stats.favorite_time}</span>
                  </div>

                  {/* Last Message */}
                  {stats.last_message_date && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-700">Last Message</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{formatDate(stats.last_message_date)}</span>
                    </div>
                  )}
                </div>

                {/* Fun Fact */}
                {stats.total_messages > 0 && (
                  <div className="mt-6 bg-gradient-to-r from-ember/5 to-ember-light/5 rounded-xl p-4 border-2 border-ember/20">
                    <p className="text-center text-sm text-gray-700">
                      <span className="font-semibold">💬 Fun Fact: </span>
                      {stats.messages_sent > stats.messages_received ? (
                        "You're the conversation starter! 🚀"
                      ) : stats.messages_sent === stats.messages_received ? (
                        "Perfectly balanced conversation! ⚖️"
                      ) : (
                        "You're a great listener! 👂"
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Failed to load statistics
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatStatsModal;
