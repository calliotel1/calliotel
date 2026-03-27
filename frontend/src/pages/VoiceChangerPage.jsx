import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, Lock, Crown, Play, Check, Loader, DollarSign } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VoiceChangerPage = () => {
  const [effects, setEffects] = useState([]);
  const [currentSettings, setCurrentSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [playingPreview, setPlayingPreview] = useState(null);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVoiceEffects();
    fetchCurrentSettings();
  }, []);

  const fetchVoiceEffects = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/voice-changer/effects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEffects(response.data.effects);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load voice effects',
        variant: 'destructive',
      });
    }
  };

  const fetchCurrentSettings = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/voice-changer/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSettings(response.data.settings);
      setSelectedEffect(response.data.settings.effect);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEffect = async (effectId) => {
    const effect = effects.find(e => e.id === effectId);
    
    // Check if locked (premium required)
    if (effect.locked) {
      toast({
        title: 'Premium Required',
        description: 'Upgrade to Premium ($2.99/month) to use this voice effect',
        variant: 'destructive',
      });
      return;
    }

    setSelectedEffect(effectId);

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.put(
        `${API}/voice-changer/settings`,
        {
          effect: effectId,
          enabled: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: 'Voice Changed!',
        description: `Now using ${effect.name}`,
      });

      fetchCurrentSettings();
    } catch (error) {
      if (error.response?.status === 403) {
        toast({
          title: 'Premium Required',
          description: error.response.data.detail,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Could not update voice settings',
          variant: 'destructive',
        });
      }
    }
  };

  const handleUpgradePremium = async () => {
    setUpgrading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/voice-changer/upgrade-premium`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: '🎉 Premium Activated!',
        description: response.data.message,
      });

      // Refresh effects and settings
      fetchVoiceEffects();
      fetchCurrentSettings();
    } catch (error) {
      toast({
        title: 'Upgrade Failed',
        description: error.response?.data?.detail || 'Could not upgrade to premium',
        variant: 'destructive',
      });
    } finally {
      setUpgrading(false);
    }
  };

  const playPreview = (effectId) => {
    setPlayingPreview(effectId);
    // Simulate preview playing
    setTimeout(() => setPlayingPreview(null), 2000);
    
    // Play a beep or sample audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Modify frequency based on effect
    const effect = effects.find(e => e.id === effectId);
    if (effect) {
      if (effectId === 'male_deep') oscillator.frequency.value = 150;
      else if (effectId === 'female_high') oscillator.frequency.value = 400;
      else if (effectId === 'robot') oscillator.frequency.value = 200;
      else if (effectId === 'child') oscillator.frequency.value = 500;
      else if (effectId === 'darth_vader') oscillator.frequency.value = 100;
      else if (effectId === 'chipmunk') oscillator.frequency.value = 600;
      else if (effectId === 'monster') oscillator.frequency.value = 80;
      else oscillator.frequency.value = 250;
    }
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <Loader className="w-12 h-12 animate-spin text-ember" />
      </div>
    );
  }

  const hasPremium = currentSettings?.has_premium;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-ember to-ember-light/50 rounded-2xl flex items-center justify-center">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Voice Changer 🎤
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Transform your voice during calls
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:text-ember' : 'text-gray-700 hover:text-ember'} transition-colors`}
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Banner */}
        {!hasPremium && (
          <div className="mb-8 bg-gradient-to-r from-ember to-ember-light rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Unlock All Voice Effects</h3>
                </div>
                <p className="text-ember-100 mb-4">
                  Get access to 8 amazing voice effects for just $2.99/month
                </p>
                <ul className="space-y-1 text-sm text-ember-100">
                  <li>✨ Professional male & female voices</li>
                  <li>🤖 Robot, Darth Vader, Monster effects</li>
                  <li>🎭 Perfect for privacy, pranks, and fun</li>
                </ul>
              </div>
              <button
                onClick={handleUpgradePremium}
                disabled={upgrading}
                className="px-8 py-4 bg-white text-ember font-bold rounded-xl hover:bg-ember/5 transition-all disabled:opacity-50 flex items-center space-x-2 shadow-lg"
              >
                {upgrading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    <span>Upgrade Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Premium Badge */}
        {hasPremium && (
          <div className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 flex items-center space-x-3">
            <Crown className="w-6 h-6 text-white" />
            <div>
              <p className="text-white font-bold">Premium Active</p>
              <p className="text-white text-sm opacity-90">
                All voice effects unlocked until {new Date(currentSettings?.premium_until || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Current Voice */}
        <div className={`mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Current Voice Effect
          </h3>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center text-3xl">
              {effects.find(e => e.id === selectedEffect)?.icon || '🎤'}
            </div>
            <div>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {effects.find(e => e.id === selectedEffect)?.name || 'Normal Voice'}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {effects.find(e => e.id === selectedEffect)?.description || 'No effects applied'}
              </p>
            </div>
          </div>
        </div>

        {/* Voice Effects Grid */}
        <div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Available Voice Effects
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {effects.map((effect) => (
              <div
                key={effect.id}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  selectedEffect === effect.id ? 'ring-2 ring-purple-500' : ''
                } ${effect.locked ? 'opacity-75' : ''}`}
                onClick={() => !effect.locked && handleSelectEffect(effect.id)}
              >
                {/* Premium Badge */}
                {effect.locked && (
                  <div className="mb-3">
                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-ember to-ember-light/50 text-white text-xs font-bold rounded-full">
                      <Lock className="w-3 h-3" />
                      <span>PREMIUM</span>
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-ember to-ember-light/50 rounded-xl flex items-center justify-center text-3xl">
                    {effect.icon}
                  </div>
                  
                  {selectedEffect === effect.id && (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {effect.name}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  {effect.description}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playPreview(effect.id);
                  }}
                  disabled={playingPreview === effect.id}
                  className={`w-full py-2 ${
                    effect.locked 
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-ember to-ember-light text-white hover:from-ember hover:to-ember-light'
                  } font-semibold rounded-lg transition-all flex items-center justify-center space-x-2`}
                >
                  {playingPreview === effect.id ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Playing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Preview</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className={`mt-12 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8`}>
          <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="w-12 h-12 bg-ember/10 text-ember rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Choose Your Voice
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select from 8 amazing voice effects including male, female, robot, and more
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 text-ember rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Make Calls
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your voice is automatically transformed in real-time during all calls
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-ember/10 text-ember-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Have Fun!
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Perfect for privacy, pranks, or just having fun with friends
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChangerPage;
