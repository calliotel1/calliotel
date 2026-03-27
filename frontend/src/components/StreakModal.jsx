import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Award, Calendar, Flame } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import PlantAnimation from './PlantAnimation';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StreakModal = ({ isOpen, onClose, friendUserId, friendName }) => {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && friendUserId) {
      fetchStreak();
    }
  }, [isOpen, friendUserId]);

  const fetchStreak = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(
        `${API}/streaks/streak/${friendUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStreak(response.data);
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
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
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
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
                Streak with {friendName}
              </h2>
              <p className="text-sm text-gray-600">
                Keep chatting daily to grow your plant! 🌱
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
              </div>
            ) : streak ? (
              <>
                {/* Plant Animation */}
                <div className="flex justify-center mb-6">
                  <PlantAnimation streakCount={streak.streak_count} size="large" />
                </div>

                {/* Streak Stats */}
                <div className="space-y-4 mb-6">
                  {/* Current Streak */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-ember-light/5 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        <Flame className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Streak</p>
                        <p className="text-2xl font-bold text-gray-900">{streak.streak_count} days</p>
                      </div>
                    </div>
                    {streak.streak_active ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        Broken
                      </span>
                    )}
                  </div>

                  {/* Highest Streak */}
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Best Streak</p>
                        <p className="text-xl font-bold text-gray-900">{streak.highest_streak} days</p>
                      </div>
                    </div>
                  </div>

                  {/* Next Milestone */}
                  {streak.streak_active && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-ember rounded-full flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Next Milestone</p>
                          <p className="text-xl font-bold text-gray-900">{streak.next_milestone} days</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {streak.next_milestone - streak.streak_count} more!
                      </p>
                    </div>
                  )}
                </div>

                {/* Motivational Message */}
                <div className="bg-gradient-to-r from-ember/5 to-ember-light/5 rounded-xl p-4 border-2 border-ember/20">
                  <div className="flex items-start space-x-2">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        {streak.streak_active ? (
                          streak.days_until_reset > 0 ? (
                            `Don't break the streak! ${streak.days_until_reset}h left`
                          ) : (
                            "Keep the conversation going!"
                          )
                        ) : (
                          "Send a message to start a new streak!"
                        )}
                      </p>
                      <p className="text-xs text-gray-600">
                        Message daily to keep your plant growing! 🌱
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Failed to load streak data
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StreakModal;
