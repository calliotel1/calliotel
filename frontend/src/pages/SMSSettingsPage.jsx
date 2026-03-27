import React, { useState, useEffect } from 'react';
import { Phone, Bell, BellOff, Crown, Check, X, Smartphone, MessageSquare, Trophy, TrendingUp, Users, Mail, Megaphone, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL;

const SMSSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [smsSettings, setSmsSettings] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSMSSettings();
  }, []);

  const fetchSMSSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/profile/sms-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSmsSettings(response.data);
      setPhoneNumber(response.data.phone_number || '');
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SMS settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePhoneNumber = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number',
        variant: 'destructive'
      });
      return;
    }

    // Basic E.164 validation
    if (!phoneNumber.startsWith('+') || phoneNumber.length < 10) {
      toast({
        title: 'Invalid Format',
        description: 'Phone number must be in E.164 format (e.g., +27123456789)',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/api/profile/sms-settings/phone`,
        { phone_number: phoneNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: 'Success',
        description: 'Phone number updated! Welcome SMS sent.',
      });
      
      setIsEditingPhone(false);
      fetchSMSSettings();
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update phone number',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const removePhoneNumber = async () => {
    if (!window.confirm('Remove your phone number? You will stop receiving SMS notifications.')) {
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/profile/sms-settings/phone`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: 'Removed',
        description: 'Phone number removed from your account',
      });
      
      setPhoneNumber('');
      fetchSMSSettings();
    } catch (error) {
      console.error('Error removing phone number:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove phone number',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = async (preferenceKey, currentValue) => {
    // Check if feature is locked
    if (isFeatureLocked()) {
      toast({
        title: 'Premium Feature',
        description: `Upgrade to Gold tier or higher to enable SMS notifications`,
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/api/profile/sms-settings/preferences`,
        { [preferenceKey]: !currentValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchSMSSettings();
      
      toast({
        title: 'Updated',
        description: `SMS ${!currentValue ? 'enabled' : 'disabled'} for this notification`,
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preference',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const isFeatureLocked = () => {
    if (!smsSettings) return true;
    const quota = smsSettings.sms_quota?.monthly_limit;
    return quota === 0;
  };

  const getQuotaInfo = () => {
    if (!smsSettings) return { color: 'gray', text: 'Loading...' };
    
    const quota = smsSettings.sms_quota;
    const limit = quota?.monthly_limit;
    const used = quota?.used_this_month || 0;
    const remaining = quota?.remaining;

    if (limit === 'unlimited' || limit === -1) {
      return {
        color: 'purple',
        text: 'Unlimited',
        percentage: 100,
        showBar: false
      };
    }

    if (limit === 0) {
      return {
        color: 'gray',
        text: 'Not Available',
        percentage: 0,
        showBar: false,
        locked: true
      };
    }

    const percentage = (used / limit) * 100;
    let color = 'green';
    if (percentage > 80) color = 'red';
    else if (percentage > 50) color = 'yellow';

    return {
      color,
      text: `${used} / ${limit} used`,
      percentage,
      showBar: true,
      remaining: limit - used
    };
  };

  const notificationTypes = [
    {
      key: 'duel_challenges',
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Duel Challenges',
      description: 'Get notified when someone challenges you to a duel'
    },
    {
      key: 'duel_results',
      icon: <Trophy className="w-5 h-5" />,
      title: 'Duel Results',
      description: 'Receive your victory or defeat notifications'
    },
    {
      key: 'achievements',
      icon: <Trophy className="w-5 h-5" />,
      title: 'Achievements',
      description: 'Celebrate when you unlock new achievements'
    },
    {
      key: 'tier_upgrades',
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Tier Upgrades',
      description: 'Get alerted when you reach a new tier'
    },
    {
      key: 'global_square_mentions',
      icon: <Users className="w-5 h-5" />,
      title: 'Global Square Mentions',
      description: 'Know when someone mentions you'
    },
    {
      key: 'direct_messages',
      icon: <Mail className="w-5 h-5" />,
      title: 'Direct Messages',
      description: 'Get notified of new private messages'
    },
    {
      key: 'admin_broadcasts',
      icon: <Megaphone className="w-5 h-5" />,
      title: 'Admin Broadcasts',
      description: 'Important announcements from the Colosseum'
    }
  ];

  const quotaInfo = getQuotaInfo();
  const isLocked = isFeatureLocked();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-olive-dark to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ember animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-olive-dark to-slate-900 pb-24">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-ember/20 p-6">
        <div className="flex items-center gap-3">
          <Smartphone className="w-8 h-8 text-ember" />
          <div>
            <h1 className="text-2xl font-bold text-white">SMS Notifications</h1>
            <p className="text-sm text-gray-400">Manage your mobile alerts</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Premium Feature Banner (if locked) */}
        {isLocked && (
          <div className="bg-gradient-to-r from-amber-900/30 to-ember-900/30 border border-amber-500/30 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Crown className="w-8 h-8 text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Premium Feature</h3>
                <p className="text-gray-300 mb-4">
                  SMS notifications are available for <span className="text-amber-400 font-semibold">Gold</span> tier and above.
                  Upgrade your account to receive real-time battle alerts on your phone!
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300"><span className="font-semibold text-amber-400">Gold:</span> 20 SMS per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300"><span className="font-semibold text-ember">Platinum+:</span> Unlimited SMS</span>
                  </div>
                </div>
                <button className="mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-lg font-semibold transition-all">
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phone Number Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-ember/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-ember" />
            Phone Number
          </h2>

          {smsSettings?.phone_number && !isEditingPhone ? (
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Current Number</p>
                  <p className="text-white font-mono text-lg">{smsSettings.phone_number}</p>
                  {smsSettings.phone_verified ? (
                    <div className="flex items-center gap-1 text-green-400 text-sm mt-1">
                      <Check className="w-4 h-4" />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-400 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Unverified</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="bg-ember hover:bg-ember-light text-white px-4 py-2 rounded-lg text-sm transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={removePhoneNumber}
                    disabled={saving}
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Phone Number (E.164 format)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.value)}
                  placeholder="+27123456789"
                  className="w-full bg-slate-700/50 border border-ember/20 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-ember"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Include country code (e.g., +1 for USA, +27 for South Africa, +961 for Lebanon)
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={updatePhoneNumber}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-ember to-ember-dark hover:from-ember-light hover:to-olive text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Phone Number'
                  )}
                </button>
                {isEditingPhone && (
                  <button
                    onClick={() => {
                      setIsEditingPhone(false);
                      setPhoneNumber(smsSettings?.phone_number || '');
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SMS Quota */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-ember/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">SMS Quota</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Current Tier</p>
                <p className="text-white font-semibold text-lg">{smsSettings?.sms_quota?.tier || 'Bronze'}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Monthly Allowance</p>
                <p className={`font-bold text-lg ${
                  quotaInfo.color === 'purple' ? 'text-ember' :
                  quotaInfo.color === 'green' ? 'text-green-400' :
                  quotaInfo.color === 'yellow' ? 'text-yellow-400' :
                  quotaInfo.color === 'red' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {quotaInfo.text}
                </p>
              </div>
            </div>

            {quotaInfo.showBar && (
              <div>
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      quotaInfo.color === 'green' ? 'bg-green-500' :
                      quotaInfo.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${quotaInfo.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2 text-center">
                  {quotaInfo.remaining} SMS remaining this month
                </p>
              </div>
            )}

            {isLocked && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-400" />
                <p className="text-sm text-gray-300">
                  Upgrade to <span className="text-amber-400 font-semibold">Gold</span> or higher to unlock SMS notifications
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-ember/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-ember" />
            Notification Preferences
          </h2>

          <div className="space-y-3">
            {notificationTypes.map((type) => {
              const isEnabled = smsSettings?.sms_preferences?.[type.key] || false;
              
              return (
                <div
                  key={type.key}
                  className={`bg-slate-700/30 rounded-lg p-4 transition-all ${
                    isLocked ? 'opacity-50' : 'hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`${
                        isEnabled && !isLocked ? 'text-ember' : 'text-gray-500'
                      }`}>
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{type.title}</h3>
                          {isLocked && (
                            <Crown className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{type.description}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => togglePreference(type.key, isEnabled)}
                      disabled={saving || isLocked}
                      className={`relative w-14 h-7 rounded-full transition-all ${
                        isEnabled && !isLocked
                          ? 'bg-gradient-to-r from-ember to-ember-dark'
                          : 'bg-slate-600'
                      } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          isEnabled && !isLocked ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-ember/30 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300 space-y-2">
              <p className="font-semibold text-white">SMS Notification Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>SMS notifications are sent only when enabled and you have quota</li>
                <li>Standard SMS rates may apply from your carrier</li>
                <li>Gold tier: 20 SMS per month, Platinum+: Unlimited</li>
                <li>Your quota resets on the 1st of each month</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SMSSettingsPage;
