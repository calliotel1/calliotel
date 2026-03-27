import React, { useState, useEffect } from 'react';
import { Languages, Loader2, Check } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const POPULAR_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' }
];

const TranslateButton = ({ message, isMe }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [quickLanguage, setQuickLanguage] = useState('English');
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/ai-settings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setEnabled(response.data.settings.translation_enabled);
        setQuickLanguage(response.data.settings.quick_translate_language);
      }
    } catch (err) {
      console.error('Error fetching AI settings:', err);
      // Default to enabled if settings fetch fails
      setEnabled(true);
    }
  };

  const translateMessage = async (targetLanguage) => {
    try {
      setLoading(true);
      setShowLanguages(false);
      
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/ai-chat/translate`,
        {
          text: message,
          target_language: targetLanguage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setTranslatedText(response.data.translated);
        setShowTranslation(true);
      }
    } catch (err) {
      console.error('Error translating:', err);
      toast({
        title: 'Translation Error',
        description: 'Could not translate message',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTranslate = () => {
    // Quick translate to user's preferred language
    translateMessage(quickLanguage);
  };

  // Don't render if disabled
  if (!enabled) {
    return null;
  }

  return (
    <div className="relative mt-1">
      {!showTranslation ? (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleQuickTranslate}
            disabled={loading}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              isMe
                ? 'text-ember-light hover:text-white hover:bg-ember/30'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Languages className="w-3 h-3" />
            )}
            <span>Translate</span>
          </button>

          <button
            onClick={() => setShowLanguages(!showLanguages)}
            className={`text-xs ${
              isMe
                ? 'text-ember-light hover:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            ▼
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <div className={`flex items-center space-x-1 text-xs mb-1 ${
            isMe ? 'text-ember-light' : 'text-gray-500 dark:text-gray-400'
          }`}>
            <Check className="w-3 h-3" />
            <span>Translation:</span>
          </div>
          <p className={`text-sm italic ${
            isMe ? 'text-ember-100' : 'text-gray-700 dark:text-gray-300'
          }`}>
            "{translatedText}"
          </p>
          <button
            onClick={() => setShowTranslation(false)}
            className={`text-xs mt-1 ${
              isMe
                ? 'text-ember-light hover:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Hide
          </button>
        </div>
      )}

      {/* Language Picker Dropdown */}
      {showLanguages && !showTranslation && (
        <div className="absolute z-10 mt-1 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 grid grid-cols-2 gap-1 w-64">
          {POPULAR_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => translateMessage(lang.name)}
              disabled={loading}
              className="px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranslateButton;
