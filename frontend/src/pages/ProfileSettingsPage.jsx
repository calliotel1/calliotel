import React, { useState, useEffect } from 'react';
import { Upload, Save, Trash2, Smartphone, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL;

const ProfileSettingsPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Auto-Taunt Settings
  const [autoTauntSettings, setAutoTauntSettings] = useState({
    auto_taunt_enabled: false,
    taunt_style: 'honorable',
    custom_taunt_message: '',
    can_use_custom: false,
    can_use_silence: false,
    current_tier: '',
    total_xp: 0
  });
  const [tauntSaving, setTauntSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchAutoTauntSettings();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setMood(response.data.mood_status || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoTauntSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/profile/auto-taunt-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAutoTauntSettings(response.data);
    } catch (error) {
      console.error('Error fetching auto-taunt settings:', error);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File too large. Max 5MB',
        variant: 'destructive'
      });
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Invalid file type. Use JPG, PNG, or WEBP',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/api/profile/upload-avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfile({ ...profile, profile_picture: response.data.avatar_url });
      toast({
        title: '✅ Avatar Updated!',
        description: 'Your profile picture has been uploaded',
        duration: 3000
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to upload avatar',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMood = async () => {
    if (mood.length > 100) {
      toast({
        title: 'Error',
        description: 'Mood status must be 100 characters or less',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/api/profile/mood`,
        { mood_status: mood },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfile({ ...profile, mood_status: mood });
      toast({
        title: '✅ Mood Updated!',
        description: 'Your status has been saved',
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving mood:', error);
      toast({
        title: 'Error',
        description: 'Failed to save mood',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAchievement = (achievementId) => {
    const currentFeatured = profile.featured_achievements || [];
    
    if (currentFeatured.includes(achievementId)) {
      // Unpin
      setProfile({
        ...profile,
        featured_achievements: currentFeatured.filter(id => id !== achievementId)
      });
    } else {
      // Pin (max 3)
      if (currentFeatured.length >= 3) {
        toast({
          title: 'Maximum Reached',
          description: 'You can only feature 3 achievements. Unpin one first.',
          variant: 'destructive'
        });
        return;
      }
      setProfile({
        ...profile,
        featured_achievements: [...currentFeatured, achievementId]
      });
    }
  };

  const handleSaveAchievements = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/api/profile/featured-achievements`,
        { achievement_ids: profile.featured_achievements || [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: '🏆 Achievements Updated!',
        description: 'Your featured badges have been saved',
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving achievements:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save achievements',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAutoTaunt = async () => {
    try {
      setTauntSaving(true);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API}/api/profile/auto-taunt-settings`,
        {
          auto_taunt_enabled: autoTauntSettings.auto_taunt_enabled,
          taunt_style: autoTauntSettings.taunt_style,
          custom_taunt_message: autoTauntSettings.custom_taunt_message
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: '⚔️ Auto-Taunt Updated!',
        description: 'Your psychological warfare settings have been saved',
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving auto-taunt:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setTauntSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
      </div>
    );
  }

  if (!profile) return null;

  const tier = profile.tier;
  const isArchitect = tier.name === "The Architect";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-ember to-ember-light text-white p-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-sm opacity-90 mt-1">Customize your Combat Card</p>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Quick Settings Links */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => navigate('/sms-settings')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-ember/10 p-2 rounded-lg">
                <Smartphone className="w-5 h-5 text-ember" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">SMS Notifications</p>
                <p className="text-sm text-gray-500">Manage mobile alerts & phone number</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Picture</h2>
          
          <div className="flex items-center gap-6">
            {/* Current Avatar */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white relative"
              style={{
                background: isArchitect
                  ? 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
                  : `linear-gradient(135deg, ${tier.color}20, ${tier.color}40)`,
                border: `3px solid ${tier.color}`,
                boxShadow: `0 0 20px ${tier.color}60`
              }}
            >
              {profile.profile_picture ? (
                <img
                  src={`${API}${profile.profile_picture}`}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                profile.email.charAt(0).toUpperCase()
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1">
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload New Avatar
                  </>
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, or WEBP • Max 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Tier Badge Display */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Tier</h2>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold"
            style={{
              background: isArchitect
                ? 'linear-gradient(45deg, #667eea, #764ba2)'
                : tier.color
            }}
          >
            <span className="text-2xl">{tier.emoji}</span>
            <span>{tier.name}</span>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Total XP: <span className="font-bold text-ember">{profile.total_xp}</span>
          </p>
        </div>

        {/* Mood Status Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Mood Status
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Set a custom status that appears in chat (100 characters max, emoji supported)
          </p>
          
          <div className="space-y-3">
            <textarea
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="e.g., ⚔️ Looking for 100 XP Duels"
              maxLength={100}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {mood.length}/100 characters
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setMood('')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={handleSaveMood}
                  disabled={saving}
                  className="px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Mood
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Taunt Settings Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                ⚔️ Auto-Taunt System
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Automate your victory flexing after winning duels
              </p>
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="mb-6 p-4 bg-ember/5 rounded-lg border-2 border-ember/20">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                data-testid="auto-taunt-enable-checkbox"
                checked={autoTauntSettings.auto_taunt_enabled}
                onChange={(e) => setAutoTauntSettings({
                  ...autoTauntSettings,
                  auto_taunt_enabled: e.target.checked
                })}
                className="w-5 h-5 text-ember rounded focus:ring-purple-500"
              />
              <div>
                <span className="font-semibold text-gray-900">
                  Enable Automated Psychological Warfare
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  Automatically send your victory message after winning duels
                </p>
              </div>
            </label>
          </div>

          {/* Taunt Style Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Taunt Style (Tier-Based Defaults)
            </label>
            <div className="space-y-3">
              {/* Honorable */}
              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="taunt_style"
                  value="honorable"
                  checked={autoTauntSettings.taunt_style === 'honorable'}
                  onChange={(e) => setAutoTauntSettings({
                    ...autoTauntSettings,
                    taunt_style: e.target.value
                  })}
                  className="mt-1 w-4 h-4 text-ember"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">🤝 Honorable</div>
                  <div className="text-xs text-gray-500 mt-1">
                    "Well fought. The victory is mine today."
                  </div>
                  <div className="text-xs text-ember mt-1">
                    Default for Bronze-Silver tiers
                  </div>
                </div>
              </label>

              {/* Ruthless */}
              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="taunt_style"
                  value="ruthless"
                  checked={autoTauntSettings.taunt_style === 'ruthless'}
                  onChange={(e) => setAutoTauntSettings({
                    ...autoTauntSettings,
                    taunt_style: e.target.value
                  })}
                  className="mt-1 w-4 h-4 text-ember"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">⚔️ Ruthless</div>
                  <div className="text-xs text-gray-500 mt-1">
                    "Your stats are a tragedy. Try a different game."
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    Default for Gold-Platinum tiers
                  </div>
                </div>
              </label>

              {/* Architect's Silence */}
              <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                autoTauntSettings.can_use_silence 
                  ? 'hover:bg-gray-50' 
                  : 'opacity-50 cursor-not-allowed bg-gray-100'
              }`}>
                <input
                  type="radio"
                  name="taunt_style"
                  value="silence"
                  checked={autoTauntSettings.taunt_style === 'silence'}
                  onChange={(e) => setAutoTauntSettings({
                    ...autoTauntSettings,
                    taunt_style: e.target.value
                  })}
                  disabled={!autoTauntSettings.can_use_silence}
                  className="mt-1 w-4 h-4 text-ember"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    👑 The Architect's Silence
                    {!autoTauntSettings.can_use_silence && (
                      <span className="text-xs bg-ember text-white px-2 py-1 rounded">
                        🔒 Divine+ Only
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    No text. Just a 3-second full-screen Combat Card with The Void Pulse animation.
                  </div>
                  <div className="text-xs text-ember mt-1">
                    Default for Divine-Architect tiers
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Taunt Message */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Custom Victory Message (Optional)
              {!autoTauntSettings.can_use_custom && (
                <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                  🔒 Unlocks at Gold Tier
                </span>
              )}
            </label>
            <textarea
              value={autoTauntSettings.custom_taunt_message}
              onChange={(e) => setAutoTauntSettings({
                ...autoTauntSettings,
                custom_taunt_message: e.target.value
              })}
              disabled={!autoTauntSettings.can_use_custom}
              placeholder={
                autoTauntSettings.can_use_custom
                  ? "Enter your signature lethal blow... (Max 200 chars)"
                  : "Unlock custom taunts at Gold tier (1000+ XP)"
              }
              maxLength={200}
              className={`w-full p-3 border-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                autoTauntSettings.can_use_custom 
                  ? 'border-gray-300' 
                  : 'bg-gray-100 cursor-not-allowed'
              }`}
              rows={3}
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Leave blank to use tier-based defaults</span>
              <span>{autoTauntSettings.custom_taunt_message.length}/200</span>
            </div>
          </div>

          {/* Current Tier Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Your Current Tier:</span>
              <span className="font-bold text-ember">
                {autoTauntSettings.current_tier} ({autoTauntSettings.total_xp} XP)
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              • Custom taunts unlock at Gold (1000 XP)
              <br />
              • The Architect's Silence unlocks at Divine (2500 XP)
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveAutoTaunt}
            disabled={tauntSaving}
            data-testid="save-auto-taunt-button"
            className="w-full py-3 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {tauntSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Auto-Taunt Settings
              </>
            )}
          </button>
        </div>

        {/* Achievement Showcase (Interactive Medal Case) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                🏆 Medal Case
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select up to 3 achievements to showcase on your Combat Card
              </p>
            </div>
            <div className="text-sm font-semibold text-ember dark:text-ember">
              {(profile.featured_achievements || []).length}/3 Selected
            </div>
          </div>
          
          {profile.all_achievements && profile.all_achievements.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {profile.all_achievements.map((achId) => {
                  const isSelected = (profile.featured_achievements || []).includes(achId);
                  const achName = achId.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  
                  return (
                    <button
                      key={achId}
                      onClick={() => handleToggleAchievement(achId)}
                      className={`relative p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                        isSelected
                          ? 'border-ember dark:border-ember bg-ember/5 dark:bg-olive/30 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 hover:border-ember-300 dark:hover:border-ember/30'
                      }`}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-ember dark:bg-ember rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Badge Content */}
                      <div className="text-center">
                        <div className="text-3xl mb-2">🏆</div>
                        <div className={`text-xs font-medium truncate ${
                          isSelected
                            ? 'text-ember-700 dark:text-ember'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {achName}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Save Button */}
              <button
                onClick={handleSaveAchievements}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Featured Achievements
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No achievements unlocked yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Play games and complete challenges to earn badges!
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfileSettingsPage;
