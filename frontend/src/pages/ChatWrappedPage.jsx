import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MessageCircle, Heart, TrendingUp, Clock, Image, Video, Smile, Trophy, Flame, Sparkles, X, Share2, Download } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatWrappedPage = () => {
  const [loading, setLoading] = useState(true);
  const [recap, setRecap] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [period, setPeriod] = useState('monthly'); // 'monthly' or 'yearly'
  const { user } = useAuth();
  const { darkMode } = useTheme();

  useEffect(() => {
    fetchRecap();
  }, [period]);

  const fetchRecap = async () => {
    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(
        `${API}/wrapped/recap/${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecap(response.data);
    } catch (error) {
      console.error('Error fetching recap:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ember via-ember-light to-orange-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold">Preparing your Wrapped...</p>
          <p className="text-sm opacity-80 mt-2">✨ Analyzing your conversations ✨</p>
        </div>
      </div>
    );
  }

  if (!recap || recap.total_messages === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ember via-ember-light to-orange-500 flex items-center justify-center pb-20">
        <div className="text-center text-white p-8">
          <Sparkles className="w-20 h-20 mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold mb-4">No Messages Yet</h2>
          <p className="text-lg opacity-90 mb-6">
            Start chatting with friends to see your Wrapped!
          </p>
          <a
            href="/chat"
            className="px-8 py-3 bg-white text-ember rounded-full font-bold hover:bg-opacity-90 transition-all inline-block"
          >
            Start Chatting
          </a>
        </div>
        <BottomNav />
      </div>
    );
  }

  const slides = [
    // Slide 1: Welcome
    {
      bg: 'from-ember to-olive',
      content: (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white"
        >
          <Sparkles className="w-20 h-20 mx-auto mb-6 animate-bounce" />
          <h1 className="text-5xl font-bold mb-4">Your {period === 'yearly' ? '2026' : formatDate(recap.start_date)}</h1>
          <h2 className="text-6xl font-extrabold mb-6 bg-gradient-to-r from-yellow-300 to-ember-light/30 bg-clip-text text-transparent">
            WRAPPED
          </h2>
          <p className="text-xl opacity-90">
            Let's see what you've been up to...
          </p>
        </motion.div>
      )
    },
    
    // Slide 2: Total Messages
    {
      bg: 'from-ember to-indigo-800',
      content: (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center text-white"
        >
          <MessageCircle className="w-20 h-20 mx-auto mb-6" />
          <p className="text-2xl mb-4 opacity-90">You sent</p>
          <motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-8xl font-black mb-4"
          >
            {recap.messages_sent.toLocaleString()}
          </motion.h1>
          <p className="text-3xl font-bold">messages</p>
          <p className="text-xl mt-6 opacity-80">
            Out of {recap.total_messages.toLocaleString()} total messages
          </p>
        </motion.div>
      )
    },

    // Slide 3: Top Friend
    ...(recap.top_friend ? [{
      bg: 'from-ember-600 to-rose-800',
      content: (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white"
        >
          <Heart className="w-20 h-20 mx-auto mb-6 animate-pulse" />
          <p className="text-2xl mb-4 opacity-90">You chatted most with</p>
          <h2 className="text-5xl font-bold mb-4">
            {recap.top_friend.name}
          </h2>
          <p className="text-xl opacity-80">
            {recap.top_friend.message_count} messages exchanged
          </p>
          <p className="text-lg mt-6 opacity-70">
            That's {recap.total_friends_chatted} friends total!
          </p>
        </motion.div>
      )
    }] : []),

    // Slide 4: Top Words
    ...(recap.top_words.length > 0 ? [{
      bg: 'from-green-600 to-teal-800',
      content: (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center text-white"
        >
          <Sparkles className="w-16 h-16 mx-auto mb-6" />
          <p className="text-2xl mb-6 opacity-90">Your favorite words</p>
          <div className="space-y-3">
            {recap.top_words.slice(0, 5).map((word, idx) => (
              <motion.div
                key={word.word}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <span className="text-2xl font-bold">{word.word}</span>
                <span className="text-xl opacity-80">{word.count}x</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )
    }] : []),

    // Slide 5: Top Emojis
    ...(recap.top_emojis.length > 0 ? [{
      bg: 'from-yellow-500 to-orange-600',
      content: (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white"
        >
          <Smile className="w-16 h-16 mx-auto mb-6" />
          <p className="text-2xl mb-6 opacity-90">Your top emojis</p>
          <div className="flex justify-center gap-4 mb-8">
            {recap.top_emojis.slice(0, 3).map((emoji, idx) => (
              <motion.div
                key={emoji.emoji}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.2, type: 'spring' }}
                className="text-center"
              >
                <div className="text-7xl mb-2">{emoji.emoji}</div>
                <p className="text-sm opacity-80">{emoji.count}x</p>
              </motion.div>
            ))}
          </div>
          {recap.top_emojis[0] && (
            <p className="text-lg opacity-80">
              You used {recap.top_emojis[0].emoji} the most!
            </p>
          )}
        </motion.div>
      )
    }] : []),

    // Slide 6: Peak Hours
    ...(recap.peak_hours.length > 0 ? [{
      bg: 'from-ember to-olive',
      content: (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center text-white"
        >
          <Clock className="w-16 h-16 mx-auto mb-6" />
          <p className="text-2xl mb-6 opacity-90">You chat most at</p>
          <h2 className="text-6xl font-bold mb-2">
            {recap.peak_hours[0].label.split(' ')[0]}
          </h2>
          <p className="text-2xl opacity-80 mb-8">
            {recap.peak_hours[0].label.split(' ').slice(1).join(' ')}
          </p>
          <p className="text-lg opacity-70">
            {recap.peak_hours[0].count} messages sent at this hour
          </p>
        </motion.div>
      )
    }] : []),

    // Slide 7: Media Stats
    {
      bg: 'from-cyan-600 to-blue-800',
      content: (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white"
        >
          <Image className="w-16 h-16 mx-auto mb-6" />
          <p className="text-2xl mb-6 opacity-90">You shared</p>
          <div className="space-y-4">
            <div>
              <h3 className="text-6xl font-bold">{recap.total_photos}</h3>
              <p className="text-xl opacity-80">Photos</p>
            </div>
            <div>
              <h3 className="text-5xl font-bold">{recap.total_videos}</h3>
              <p className="text-xl opacity-80">Videos</p>
            </div>
            <div>
              <h3 className="text-5xl font-bold">{recap.total_stickers}</h3>
              <p className="text-xl opacity-80">Stickers</p>
            </div>
          </div>
        </motion.div>
      )
    },

    // Slide 8: Streak
    ...(recap.longest_streak > 0 ? [{
      bg: 'from-orange-600 to-red-700',
      content: (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white"
        >
          <Flame className="w-20 h-20 mx-auto mb-6 animate-pulse" />
          <p className="text-2xl mb-4 opacity-90">Your longest streak</p>
          <motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-8xl font-black mb-4"
          >
            {recap.longest_streak}
          </motion.h1>
          <p className="text-3xl font-bold">days</p>
          <p className="text-xl mt-6 opacity-80">
            Keep the fire burning! 🔥
          </p>
        </motion.div>
      )
    }] : []),

    // Slide 9: Personality Insight
    {
      bg: 'from-ember-dark to-ember-light',
      content: (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center text-white px-6"
        >
          <Trophy className="w-20 h-20 mx-auto mb-6" />
          <p className="text-2xl mb-6 opacity-90">Your chat personality</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <p className="text-2xl font-bold leading-relaxed">
              {recap.personality_insight}
            </p>
          </div>
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-ember-900 rounded-xl p-4">
            <p className="font-bold text-lg">
              {recap.fun_fact}
            </p>
          </div>
        </motion.div>
      )
    },

    // Slide 10: Thank You
    {
      bg: 'from-gradient-to-br from-ember via-ember-light to-orange-500',
      content: (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white"
        >
          <Sparkles className="w-20 h-20 mx-auto mb-6 animate-pulse" />
          <h2 className="text-5xl font-bold mb-4">Thanks for chatting!</h2>
          <p className="text-2xl opacity-90 mb-8">
            Here's to more conversations in the future! 🎉
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setCurrentSlide(0)}
              className="px-8 py-3 bg-white text-ember rounded-full font-bold hover:bg-opacity-90 transition-all"
            >
              View Again
            </button>
            <button className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2 mx-auto">
              <Share2 className="w-5 h-5" />
              Share Your Wrapped
            </button>
          </div>
        </motion.div>
      )
    }
  ];

  return (
    <div className="min-h-screen relative pb-20 overflow-hidden">
      {/* Period Toggle */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-full p-1">
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              period === 'monthly' ? 'bg-white text-ember' : 'text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              period === 'yearly' ? 'bg-white text-ember' : 'text-white'
            }`}
          >
            Yearly
          </button>
        </div>
        <button
          onClick={() => window.history.back()}
          className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${slides[currentSlide].bg} p-8`}
        >
          {slides[currentSlide].content}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="fixed bottom-24 left-0 right-0 z-20 flex items-center justify-center gap-4 px-8">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold hover:bg-white/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentSlide ? 'bg-white w-8' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold hover:bg-white/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ChatWrappedPage;
