import React, { useState, useEffect, useRef } from 'react';
import { Mic, Sparkles, Lock, Crown, Play, Check, Loader, DollarSign, Upload, Trash2, X, Calendar } from 'lucide-react';
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
  const [pricingTiers, setPricingTiers] = useState([]);
  const [currentSettings, setCurrentSettings] = useState(null);
  const [customVoices, setCustomVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [playingPreview, setPlayingPreview] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPricingTiers();
    fetchVoiceEffects();
    fetchCurrentSettings();
    fetchCustomVoices();
  }, []);

  const fetchPricingTiers = async () => {
    try {
      const response = await axios.get(`${API}/voice-changer/pricing`);
      setPricingTiers(response.data.tiers);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

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

  const fetchCustomVoices = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/voice-changer/custom-voices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomVoices(response.data.voices || []);
    } catch (error) {
      console.error('Error fetching custom voices:', error);
    }
  };

  const handleSelectEffect = async (effectId) => {
    const effect = effects.find(e => e.id === effectId);
    
    if (effect.locked) {
      toast({
        title: 'Premium Required',
        description: 'Upgrade to unlock this voice effect',
        variant: 'destructive',
      });
      return;
    }

    setSelectedEffect(effectId);

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.put(
        `${API}/voice-changer/settings`,
        { effect: effectId, enabled: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Voice Changed!',
        description: `Now using ${effect.name}`,
      });

      fetchCurrentSettings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not update voice settings',
        variant: 'destructive',
      });
    }
  };

  const handleUpgradeTier = async (tier) => {
    setUpgrading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/voice-changer/upgrade-tier`,
        { tier },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: '🎉 Upgrade Successful!',
        description: response.data.message,
      });

      fetchVoiceEffects();
      fetchCurrentSettings();
      fetchCustomVoices();
    } catch (error) {
      toast({
        title: 'Upgrade Failed',
        description: error.response?.data?.detail || 'Could not upgrade',
        variant: 'destructive',
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: 'Invalid File',
          description: 'Please select an audio file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      if (!voiceName) {
        setVoiceName(file.name.split('.')[0]);
      }
    }
  };

  const handleUploadVoice = async () => {
    if (!selectedFile || !voiceName) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and enter a name',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', voiceName);
    formData.append('description', voiceDescription);

    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/voice-changer/custom-voices/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      toast({
        title: '🎉 Voice Uploaded!',
        description: response.data.message,
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      setVoiceName('');
      setVoiceDescription('');
      fetchCustomVoices();
      fetchVoiceEffects();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.detail || 'Could not upload voice',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteCustomVoice = async (voiceId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(
        `${API}/voice-changer/custom-voices/${voiceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Voice Deleted',
        description: 'Custom voice removed successfully',
      });

      fetchCustomVoices();
      fetchVoiceEffects();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not delete voice',
        variant: 'destructive',
      });
    }
  };

  const playPreview = (effectId) => {
    setPlayingPreview(effectId);
    setTimeout(() => setPlayingPreview(null), 2000);
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
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

  const userTier = currentSettings?.tier || 'none';
  const hasPremium = ['basic', 'pro', 'unlimited'].includes(userTier);

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
        
        {/* Pricing Tiers */}
        {!hasPremium && (
          <div className="mb-12">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 text-center`}>
              Choose Your Plan
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg ${
                    tier.popular ? 'ring-4 ring-purple-500 transform scale-105' : ''
                  } relative`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-ember to-ember-light/50 text-white px-4 py-1 rounded-full text-sm font-bold">
                        ⭐ POPULAR
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-ember">${tier.price}</span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} ml-2`}>/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.custom_voices > 0 && (
                    <div className={`mb-4 p-3 ${darkMode ? 'bg-olive/30' : 'bg-ember/5'} rounded-lg`}>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-ember' : 'text-ember-700'}`}>
                        🎙️ {tier.custom_voices === 999 ? 'Unlimited' : tier.custom_voices} Custom Voice{tier.custom_voices > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleUpgradeTier(tier.id)}
                    disabled={upgrading}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      tier.popular
                        ? 'bg-gradient-to-r from-ember to-ember-light/50 text-white hover:from-ember hover:to-ember-light'
                        : `${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`
                    } disabled:opacity-50`}
                  >
                    {upgrading ? 'Processing...' : 'Upgrade Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Tier Badge */}
        {hasPremium && (
          <div className="mb-6 bg-gradient-to-r from-ember to-ember-light/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-white" />
              <div>
                <p className="text-white font-bold text-lg">
                  {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Plan Active
                </p>
                <p className="text-white text-sm opacity-90">
                  {userTier === 'unlimited' ? 'Unlimited custom voices' : userTier === 'pro' ? '1 custom voice included' : '8 preset voices'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Custom Voices Section */}
        {(userTier === 'pro' || userTier === 'unlimited') && (
          <div className={`mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                My Custom Voices ({customVoices.length}/{userTier === 'unlimited' ? '∞' : '1'})
              </h3>
              <button
                onClick={() => setShowUploadModal(true)}
                disabled={userTier === 'pro' && customVoices.length >= 1}
                className="px-4 py-2 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Voice</span>
              </button>
            </div>

            {customVoices.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {customVoices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 flex items-center justify-between`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center text-2xl">
                        🎙️
                      </div>
                      <div>
                        <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{voice.name}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {voice.description || 'Custom voice'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCustomVoice(voice.voice_id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Upload className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No custom voices yet. Upload one to get started!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Current Voice Effect */}
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
            {effects.filter(e => !e.custom).map((effect) => (
              <div
                key={effect.id}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  selectedEffect === effect.id ? 'ring-2 ring-purple-500' : ''
                } ${effect.locked ? 'opacity-75' : ''}`}
                onClick={() => !effect.locked && handleSelectEffect(effect.id)}
              >
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
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Upload Custom Voice
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Voice Name *
                </label>
                <input
                  type="text"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="My Voice"
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={voiceDescription}
                  onChange={(e) => setVoiceDescription(e.target.value)}
                  placeholder="Clone of my own voice"
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Audio File * (MP3, WAV, etc.)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-3 border-2 border-dashed ${darkMode ? 'border-gray-600 text-gray-300 hover:border-ember' : 'border-gray-300 text-gray-700 hover:border-ember'} rounded-lg transition-colors flex items-center justify-center space-x-2`}
                >
                  <Upload className="w-5 h-5" />
                  <span>{selectedFile ? selectedFile.name : 'Choose Audio File'}</span>
                </button>
              </div>

              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-ember to-ember-light/50 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <button
                onClick={handleUploadVoice}
                disabled={uploading || !selectedFile || !voiceName}
                className="w-full py-3 bg-gradient-to-r from-ember to-ember-light/50 text-white font-bold rounded-lg hover:from-ember hover:to-ember-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Uploading... {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload Voice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChangerPage;
