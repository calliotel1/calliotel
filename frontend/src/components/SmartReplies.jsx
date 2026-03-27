import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SmartReplies = ({ lastMessage, conversationHistory, onSelectReply, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [aiTone, setAiTone] = useState('friendly');

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (lastMessage && enabled) {
      generateReplies();
    }
  }, [lastMessage, enabled, aiTone]);

  const fetchSettings = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/ai-settings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setEnabled(response.data.settings.smart_replies_enabled);
        setAiTone(response.data.settings.ai_tone);
      }
    } catch (err) {
      console.error('Error fetching AI settings:', err);
      // Default to enabled if settings fetch fails
      setEnabled(true);
    }
  };

  const generateReplies = async () => {
    try {
      setLoading(true);
      setError(false);
      
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/ai-chat/smart-replies`,
        {
          message: lastMessage,
          conversation_history: conversationHistory || [],
          ai_tone: aiTone
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (err) {
      console.error('Error generating smart replies:', err);
      setError(true);
      // Fallback suggestions
      setSuggestions(['Thanks!', 'Sounds good!', 'Got it 👍']);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReply = (reply) => {
    onSelectReply(reply);
    onClose();
  };

  // Don't render if disabled
  if (!enabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-ember/5 to-ember-light/5 dark:from-ember-dark/20 dark:to-obsidian-light/20 rounded-lg border border-ember/20 dark:border-ember/20 mb-3">
        <Loader2 className="w-5 h-5 text-ember dark:text-ember animate-spin" />
        <span className="text-sm text-ember-700 dark:text-ember">Generating smart replies...</span>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="mb-3 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-ember dark:text-ember" />
          <span className="text-xs font-semibold text-ember-700 dark:text-ember">
            AI Smart Replies
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSelectReply(suggestion)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-ember/20 dark:border-ember/30 hover:border-ember dark:hover:border-ember hover:bg-ember/5 dark:hover:bg-olive/30 rounded-full text-sm font-medium text-gray-800 dark:text-gray-200 transition-all transform hover:scale-105 active:scale-95"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
          ⚠️ Using fallback suggestions
        </p>
      )}
    </div>
  );
};

export default SmartReplies;
