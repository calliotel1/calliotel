import React, { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, DollarSign, Share2, Trophy, Twitter, Facebook, Mail } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReferralsPage = () => {
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState(null);
  const [referredUsers, setReferredUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch referral code
      const codeRes = await axios.get(`${API}/referrals/my-code`, { headers });
      setReferralCode(codeRes.data.referral_code);
      setReferralLink(codeRes.data.referral_link);

      // Fetch stats
      const statsRes = await axios.get(`${API}/referrals/stats`, { headers });
      setStats(statsRes.data);

      // Fetch referred users
      const usersRes = await axios.get(`${API}/referrals/referred-users`, { headers });
      setReferredUsers(usersRes.data.referred_users);

      // Fetch leaderboard
      const leaderRes = await axios.get(`${API}/referrals/leaderboard`);
      setLeaderboard(leaderRes.data.leaderboard);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load referral data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = (platform) => {
    const text = `Join Calliotel and get $10 bonus! Use my referral code: ${referralCode}`;
    const url = referralLink;
    
    let shareUrl = '';
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Join Calliotel&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
                <p className="text-sm text-gray-600">Earn rewards by inviting friends</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-ember" />
                  <span className="text-2xl font-bold text-ember">{stats?.total_referrals || 0}</span>
                </div>
                <h3 className="text-gray-600 text-sm">Total Referrals</h3>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">${stats?.total_earnings?.toFixed(2) || '0.00'}</span>
                </div>
                <h3 className="text-gray-600 text-sm">Total Earnings</h3>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <Trophy className="w-8 h-8 text-orange-600" />
                  <span className="text-2xl font-bold text-orange-600">{stats?.successful_referrals || 0}</span>
                </div>
                <h3 className="text-gray-600 text-sm">Successful Referrals</h3>
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">🎁 How It Works</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold">1</span>
                  </div>
                  <h3 className="font-bold mb-2">Share Your Link</h3>
                  <p className="text-green-100 text-sm">Send your unique referral link to friends</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold">2</span>
                  </div>
                  <h3 className="font-bold mb-2">They Get $10</h3>
                  <p className="text-green-100 text-sm">Your friend signs up and gets $10 bonus</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold">3</span>
                  </div>
                  <h3 className="font-bold mb-2">You Get $5</h3>
                  <p className="text-green-100 text-sm">When they make first purchase, you earn $5</p>
                </div>
              </div>
            </div>

            {/* Referral Link */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Referral Link</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Referral Code</span>
                  <button
                    onClick={() => copyToClipboard(referralCode)}
                    className="px-3 py-1 bg-ember text-white rounded-lg hover:bg-ember-light transition-all flex items-center space-x-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-2xl font-bold text-gray-900">{referralCode}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Referral Link</span>
                  <button
                    onClick={() => copyToClipboard(referralLink)}
                    className="px-3 py-1 bg-ember text-white rounded-lg hover:bg-ember-light transition-all flex items-center space-x-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-sm text-gray-700 break-all">{referralLink}</p>
              </div>

              {/* Share Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => shareVia('twitter')}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-blue-400 text-white rounded-lg hover:bg-ember transition-all flex items-center justify-center space-x-2"
                >
                  <Twitter className="w-5 h-5" />
                  <span>Twitter</span>
                </button>
                <button
                  onClick={() => shareVia('facebook')}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-ember text-white rounded-lg hover:bg-ember-light transition-all flex items-center justify-center space-x-2"
                >
                  <Facebook className="w-5 h-5" />
                  <span>Facebook</span>
                </button>
                <button
                  onClick={() => shareVia('whatsapp')}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => shareVia('email')}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center space-x-2"
                >
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* Referred Users */}
            {referredUsers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Referrals</h2>
                <div className="space-y-3">
                  {referredUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{user.email}</p>
                        <p className="text-sm text-gray-600">Joined: {new Date(user.joined_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {user.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                        </span>
                        {user.reward_earned > 0 && (
                          <p className="text-sm font-bold text-green-600 mt-1">+${user.reward_earned.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Referrers</h2>
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                          entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                          entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          #{entry.rank}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{entry.email}</p>
                          <p className="text-sm text-gray-600">{entry.total_referrals} referrals</p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600">${entry.total_earnings.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ReferralsPage;
