import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Languages, 
  ArrowLeft, 
  Loader2, 
  Check,
  Info
} from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi'
];

const TONES = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and casual suggestions' },
  { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and informal' }
];

const AISettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { darkMode } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    smart_replies_enabled: true,
    translation_enabled: true,
    preferred_translation_language: 'English',
    quick_translate_language: 'English',
    ai_tone: 'friendly'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/ai-settings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching AI settings:', error);
      toast({
        title: 'Error',
        description: 'Could not load AI settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/ai-settings/`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast({
          title: 'Success!',
          description: 'AI settings saved successfully'
        });
      }
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        title: 'Error',
        description: 'Could not save AI settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-ember dark:text-ember" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Settings</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure AI-powered features</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Smart Replies Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-ember/10 dark:bg-olive/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-ember dark:text-ember" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Smart Replies</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  AI-generated reply suggestions when you receive messages
                </p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('smart_replies_enabled', !settings.smart_replies_enabled)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                settings.smart_replies_enabled
                  ? 'bg-ember'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  settings.smart_replies_enabled ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.smart_replies_enabled && (
            <div className="mt-4 p-4 bg-ember/5 dark:bg-olive/20 rounded-lg border border-ember/20 dark:border-ember/20">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Tone
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {TONES.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => updateSetting('ai_tone', tone.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      settings.ai_tone === tone.value
                        ? 'border-ember dark:border-ember bg-ember/10 dark:bg-olive/40'
                        : 'border-gray-200 dark:border-gray-700 hover:border-ember-300 dark:hover:border-ember/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">{tone.label}</span>
                      {settings.ai_tone === tone.value && (
                        <Check className="w-5 h-5 text-ember dark:text-ember" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{tone.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Translation Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Languages className="w-6 h-6 text-ember dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Translation</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Translate messages to your preferred language
                </p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('translation_enabled', !settings.translation_enabled)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                settings.translation_enabled
                  ? 'bg-ember'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  settings.translation_enabled ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.translation_enabled && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-ember/20">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Translate Language
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Default language when you click "Translate" button
                </p>
                <select
                  value={settings.quick_translate_language}
                  onChange={(e) => updateSetting('quick_translate_language', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-ember/20">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Translation Language
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Your main language for translations
                </p>
                <select
                  value={settings.preferred_translation_language}
                  onChange={(e) => updateSetting('preferred_translation_language', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-ember/5 to-ember-light/5 dark:from-ember-dark/20 dark:to-obsidian-light/20 rounded-xl p-6 mb-6 border border-ember/20 dark:border-ember/20">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-ember dark:text-ember flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About AI Features</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Smart Replies use GPT-4o-mini for context-aware suggestions</li>
                <li>• Translation supports 12+ languages instantly</li>
                <li>• All AI features are powered by Emergent LLM Key</li>
                <li>• Your conversations remain private and secure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-ember to-ember-light text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettingsPage;
