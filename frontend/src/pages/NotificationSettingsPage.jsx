import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, BellOff, Volume2, VolumeX, TestTube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import notificationSoundManager from '../utils/notificationSoundManager';
import PushNotificationSettings from '../components/PushNotificationSettings';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState({
    sound_enabled: true,
    volume: 80,
    sound_theme: 'default',
    new_message_sound: true,
    friend_request_sound: true,
    friend_accept_sound: true,
    story_reaction_sound: true,
    mention_sound: true,
    dnd_enabled: false,
    dnd_start_time: '22:00',
    dnd_end_time: '08:00'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    initializeSoundManager();
  }, []);

  const initializeSoundManager = async () => {
    await notificationSoundManager.initialize();
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/notifications/settings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSettings(response.data.settings);
      
      // Update sound manager
      await notificationSoundManager.updateSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
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
      
      await axios.post(
        `${API}/notifications/settings/update`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update sound manager
      await notificationSoundManager.updateSettings(settings);

      toast({
        title: 'Success',
        description: 'Settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    
    // Auto-save
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/notifications/settings/update`,
        newSettings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await notificationSoundManager.updateSettings(newSettings);
    } catch (error) {
      console.error('Error saving toggle:', error);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setSettings({ ...settings, volume: newVolume });
    notificationSoundManager.setVolume(newVolume);
  };

  const handleThemeChange = (theme) => {
    setSettings({ ...settings, sound_theme: theme });
    notificationSoundManager.setSoundTheme(theme);
  };

  const handleTestSound = async () => {
    await notificationSoundManager.testSound();
    toast({
      title: 'Test Sound',
      description: 'Playing notification sound...'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-600">Manage sound preferences</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Push Notifications */}
        <PushNotificationSettings />

        {/* Master Toggle */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {settings.sound_enabled ? (
                <Bell className="w-6 h-6 text-ember" />
              ) : (
                <BellOff className="w-6 h-6 text-gray-400" />
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-900">Notification Sounds</h2>
                <p className="text-sm text-gray-600">
                  {settings.sound_enabled ? 'Sounds are enabled' : 'Sounds are muted'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('sound_enabled')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.sound_enabled ? 'bg-ember' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.sound_enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Volume Control */}
        {settings.sound_enabled && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              {settings.volume > 0 ? (
                <Volume2 className="w-6 h-6 text-ember" />
              ) : (
                <VolumeX className="w-6 h-6 text-gray-400" />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Volume</h3>
                <p className="text-sm text-gray-600">{settings.volume}%</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={handleVolumeChange}
              onMouseUp={saveSettings}
              onTouchEnd={saveSettings}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            
            {/* Test Sound Button */}
            <button
              onClick={handleTestSound}
              className="mt-4 w-full py-3 bg-ember/10 hover:bg-ember/20 text-ember-700 font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <TestTube className="w-5 h-5" />
              <span>Test Sound</span>
            </button>
          </div>
        )}

        {/* Sound Theme */}
        {settings.sound_enabled && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Sound Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              {['default', 'chime', 'bell', 'pop'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => {
                    handleThemeChange(theme);
                    saveSettings();
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.sound_theme === theme
                      ? 'border-ember bg-ember/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900 capitalize">{theme}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {theme === 'default' && 'Classic notification'}
                    {theme === 'chime' && 'Gentle chime'}
                    {theme === 'bell' && 'Clear bell'}
                    {theme === 'pop' && 'Quick pop'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notification Types */}
        {settings.sound_enabled && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Notification Types</h3>
            <div className="space-y-4">
              {[
                { key: 'new_message_sound', label: 'New Messages', icon: '💬' },
                { key: 'friend_request_sound', label: 'Friend Requests', icon: '👥' },
                { key: 'friend_accept_sound', label: 'Friend Accepted', icon: '✅' },
                { key: 'story_reaction_sound', label: 'Story Reactions', icon: '❤️' },
                { key: 'mention_sound', label: 'Mentions', icon: '@' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </div>
                  <button
                    onClick={() => handleToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings[item.key] ? 'bg-ember' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-gradient-to-br from-ember/5 to-ember-light/5 border border-ember/20 rounded-xl p-6">
          <h3 className="font-bold text-ember-900 mb-2">ℹ️ About Notification Sounds</h3>
          <ul className="text-sm text-ember-dark space-y-1">
            <li>• Sounds play for real-time events</li>
            <li>• Works only when app is open</li>
            <li>• Browser must allow audio playback</li>
            <li>• Settings sync across all devices</li>
          </ul>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NotificationSettingsPage;
