import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Award, Star, TrendingUp, Users, ArrowLeft, 
  Lock, CheckCircle, Loader2, Zap, Crown, Target
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GamificationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, achievements, leaderboard
  const [showCoOpModal, setShowCoOpModal] = useState(false);
  const [coOpAction, setCoOpAction] = useState('create'); // create or join
  const [roomCode, setRoomCode] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = safeLocalStorage.getItem('token');
      
      const [profileRes, achievementsRes, leaderboardRes] = await Promise.all([
        axios.get(`${API}/gamification/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/gamification/achievements`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/gamification/leaderboard?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Transform profile data to expected format
      if (profileRes.data && profileRes.data.total_points !== undefined) {
        const apiProfile = profileRes.data;
        // Calculate progress values
        const nextLevel = apiProfile.next_level;
        const currentXp = apiProfile.total_points;
        const minForCurrentLevel = getLevelMinPoints(apiProfile.level);
        const maxForCurrentLevel = nextLevel ? nextLevel.min_points - 1 : currentXp;
        const xpInCurrentLevel = currentXp - minForCurrentLevel;
        const xpNeededForLevel = (maxForCurrentLevel - minForCurrentLevel) || 1;
        
        setProfile({
          ...apiProfile,
          title: apiProfile.level_name,
          total_xp: apiProfile.total_points,
          achievements_unlocked: apiProfile.achievements || [],
          progress: {
            current_xp: currentXp,
            needed_xp: nextLevel ? nextLevel.min_points : currentXp,
            percentage: apiProfile.progress_to_next_level || 0
          },
          stats: {} // Stats not available from profile endpoint
        });
      }
      // Achievements returns {categories: {...}}
      if (achievementsRes.data && achievementsRes.data.categories) {
        // Flatten categories to array for display
        const allAchievements = [];
        Object.entries(achievementsRes.data.categories).forEach(([category, items]) => {
          items.forEach(item => {
            allAchievements.push({
              ...item,
              unlocked: item.earned,
              xp_reward: item.points
            });
          });
        });
        setAchievements(allAchievements);
      }
      // Leaderboard returns {leaderboard: [...]}
      if (leaderboardRes.data && leaderboardRes.data.leaderboard) {
        // Map to expected format
        setLeaderboard(leaderboardRes.data.leaderboard.map(entry => ({
          ...entry,
          total_xp: entry.points,
          title: entry.level_name
        })));
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gamification data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to get min points for a level
  const getLevelMinPoints = (level) => {
    const levels = {
      1: 0, 2: 50, 3: 100, 4: 200, 5: 400,
      6: 700, 7: 1000, 8: 1500, 9: 2500, 10: 5000
    };
    return levels[level] || 0;
  };

  const handleCoOpStackClick = () => {
    setShowCoOpModal(true);
  };

  const createCoOpRoom = async () => {
    try {
      setCreating(true);
      const token = safeLocalStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/coop/room/create`,
        {
          max_players: 4,
          level_id: 1,
          xp_pot: 100
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowCoOpModal(false);
      setCreating(false);
      
      // Navigate to lobby
      navigate(`/games/coop-stack/lobby/${response.data.room_id}`);
      
      toast({
        title: '✅ Room Created!',
        description: `Room code: ${response.data.room_id}`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error creating co-op room:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create room',
        variant: 'destructive'
      });
      setCreating(false);
    }
  };

  const joinCoOpRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a room code',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreating(true);
      const token = safeLocalStorage.getItem('token');
      
      await axios.post(
        `${API}/coop/room/join`,
        { room_id: roomCode.toUpperCase().trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowCoOpModal(false);
      setCreating(false);
      
      // Navigate to lobby
      navigate(`/games/coop-stack/lobby/${roomCode.toUpperCase().trim()}`);
      
      toast({
        title: '✅ Joined Room!',
        description: `Entering lobby...`,
        duration: 2000
      });
    } catch (error) {
      console.error('Error joining co-op room:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to join room',
        variant: 'destructive'
      });
      setCreating(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      messaging: 'from-ember to-ember-light',
      social: 'from-ember to-ember-light',
      content: 'from-orange-500 to-orange-600',
      features: 'from-green-500 to-green-600',
      engagement: 'from-red-500 to-red-600',
      special: 'from-yellow-500 to-yellow-600'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-ember dark:text-ember" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-ember to-ember-light text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Gamification</h1>
            <div className="w-10"></div>
          </div>

          {/* Profile Overview */}
          {profile && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user?.email?.split('@')[0]}</h2>
                    <p className="text-lg text-ember-100">{profile.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-ember-100">Level</p>
                  <p className="text-4xl font-bold">{profile.level}</p>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">XP Progress</span>
                  <span className="text-sm font-bold">{profile.progress.current_xp}/{profile.progress.needed_xp} XP</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${profile.progress.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-ember-100 mt-2">
                  {profile.progress.needed_xp - profile.progress.current_xp} XP until Level {profile.level + 1}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <Zap className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profile.total_xp || 0}</p>
                  <p className="text-xs text-ember-100">Total XP</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profile.achievements_count || 0}</p>
                  <p className="text-xs text-ember-100">Achievements</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <Target className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profile.daily_streak || 0}</p>
                  <p className="text-xs text-ember-100">Day Streak</p>
                </div>
              </div>
            </div>
          )}


              {/* View Rankings Button */}
              <button
                onClick={() => navigate('/leaderboard')}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Trophy size={20} />
                View Hall of Legends
              </button>

        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: Star },
              { id: 'achievements', label: 'Achievements', icon: Award },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-ember dark:text-ember border-b-2 border-ember dark:border-ember'
                    : 'text-gray-600 dark:text-gray-400 hover:text-ember dark:hover:text-ember'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && profile && (
          <div className="space-y-6">
            {/* Gaming Arcade Section */}
            <div className="bg-gradient-to-br from-ember to-ember-light rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Zap className="text-yellow-400" />
                🎮 Game Arcade
              </h3>
              <p className="text-ember-100 mb-4">
                Test your skills and earn XP through competitive games!
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Speed Dialer */}
                <button
                  onClick={() => navigate('/games/speed-dialer')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-all transform hover:scale-105"
                >
                  <div className="text-3xl mb-2">⚡</div>
                  <h4 className="font-bold text-lg mb-1">Speed Dialer</h4>
                  <p className="text-sm text-ember-100 mb-2">
                    Race against time to type phone numbers
                  </p>
                  <div className="text-xs bg-white/20 rounded px-2 py-1 inline-block">
                    10-50 XP per game
                  </div>
                </button>
                
                {/* Duel (LIVE!) */}
                <button
                  onClick={() => navigate('/games/duel')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-all transform hover:scale-105 border-2 border-red-500/50"
                >
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                    LIVE NOW
                  </div>
                  <div className="text-3xl mb-2">⚔️</div>
                  <h4 className="font-bold text-lg mb-1">The Duel</h4>
                  <p className="text-sm text-ember-100 mb-2">
                    Challenge players, wager XP, winner takes all
                  </p>
                  <div className="text-xs bg-white/20 rounded px-2 py-1 inline-block">
                    XP Wagering
                  </div>
                </button>
                
                {/* Phish-Finder (LIVE!) */}
                <button
                  onClick={() => navigate('/games/phish-finder')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-all transform hover:scale-105 border-2 border-ember/50"
                >
                  <div className="absolute top-2 right-2 bg-ember text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                    LIVE NOW
                  </div>
                  <div className="text-3xl mb-2">🧠</div>
                  <h4 className="font-bold text-lg mb-1">Phish-Finder</h4>
                  <p className="text-sm text-ember-100 mb-2">
                    Spot scams and phishing attacks
                  </p>
                  <div className="text-xs bg-white/20 rounded px-2 py-1 inline-block">
                    Security Training
                  </div>
                </button>
                
                {/* Co-Op Stack (NEW!) */}
                <button
                  onClick={() => handleCoOpStackClick()}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-all transform hover:scale-105 border-2 border-green-500/50 relative"
                >
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                    NEW!
                  </div>
                  <div className="text-3xl mb-2">🏗️</div>
                  <h4 className="font-bold text-lg mb-1">Co-Op Stack</h4>
                  <p className="text-sm text-ember-100 mb-2">
                    Team up to reach new heights together
                  </p>
                  <div className="text-xs bg-white/20 rounded px-2 py-1 inline-block">
                    2-4 Players
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Achievements</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {achievements.filter(a => a.unlocked).slice(0, 4).map((achievement) => (
                  <div key={achievement.id} className={`bg-gradient-to-r ${getCategoryColor(achievement.category)} rounded-lg p-4 text-white`}>
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold">{achievement.name}</h4>
                        <p className="text-sm text-white/80">{achievement.description}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm font-semibold">{achievement.xp_reward} XP</span>
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Stats</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-3xl font-bold text-ember dark:text-ember">{profile.total_xp || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total XP</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-3xl font-bold text-ember dark:text-ember">{profile.achievements_count || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Achievements Earned</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-3xl font-bold text-ember dark:text-ember">{profile.daily_streak || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`rounded-xl p-6 transition-all ${
                  achievement.unlocked
                    ? `bg-gradient-to-br ${getCategoryColor(achievement.category)} text-white shadow-lg`
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-5xl">{achievement.icon}</div>
                  {achievement.unlocked ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <Lock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                
                <h4 className={`font-bold text-lg mb-1 ${achievement.unlocked ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {achievement.name}
                </h4>
                <p className={`text-sm mb-3 ${achievement.unlocked ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                  {achievement.description}
                </p>

                {/* Progress Bar for Locked Achievements */}
                {!achievement.unlocked && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{achievement.current}/{achievement.required}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-ember to-ember-light transition-all"
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* XP Reward */}
                <div className={`flex items-center space-x-1 mt-3 ${achievement.unlocked ? 'text-white' : 'text-ember dark:text-ember'}`}>
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-semibold">{achievement.xp_reward} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total XP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaderboard.map((entry) => (
                    <tr key={entry.rank} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {entry.rank === 1 && <Crown className="w-5 h-5 text-yellow-500 mr-2" />}
                          {entry.rank === 2 && <Trophy className="w-5 h-5 text-gray-400 mr-2" />}
                          {entry.rank === 3 && <Trophy className="w-5 h-5 text-orange-500 mr-2" />}
                          <span className="text-sm font-bold text-gray-900 dark:text-white">#{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entry.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-ember/10 dark:bg-olive text-ember-dark dark:text-ember-light">
                          Level {entry.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {entry.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-ember dark:text-ember">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm font-bold">{entry.total_xp}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Co-Op Stack Modal */}
      {showCoOpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border-2 border-ember">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">🏗️ Co-Op Stack</h2>
              <button
                onClick={() => {
                  setShowCoOpModal(false);
                  setCoOpAction('create');
                  setRoomCode('');
                }}
                className="p-2 hover:bg-gray-700 rounded transition-colors text-white"
              >
                ✕
              </button>
            </div>

            {/* Action Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setCoOpAction('create')}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  coOpAction === 'create'
                    ? 'bg-ember text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => setCoOpAction('join')}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  coOpAction === 'join'
                    ? 'bg-ember text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Join Room
              </button>
            </div>

            {/* Create Room */}
            {coOpAction === 'create' && (
              <div>
                <p className="text-gray-400 mb-4 text-sm">
                  Create a new co-op room and share the room code with your squad. Work together to reach the key and escape!
                </p>
                <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Max Players:</span>
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Victory Pot:</span>
                    <span className="text-yellow-500 font-bold">100 XP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Level:</span>
                    <span className="text-ember font-bold">The Reach</span>
                  </div>
                </div>
                <button
                  onClick={createCoOpRoom}
                  disabled={creating}
                  className="w-full py-3 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark rounded-lg font-bold text-white transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating...' : '🚀 Create Room'}
                </button>
              </div>
            )}

            {/* Join Room */}
            {coOpAction === 'join' && (
              <div>
                <p className="text-gray-400 mb-4 text-sm">
                  Enter the room code shared by your squad leader to join their mission.
                </p>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Room Code</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character code"
                    maxLength={8}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl font-mono tracking-wider outline-none focus:border-ember uppercase"
                  />
                </div>
                <button
                  onClick={joinCoOpRoom}
                  disabled={creating || roomCode.trim().length === 0}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-white transition-all disabled:opacity-50"
                >
                  {creating ? 'Joining...' : '🚪 Join Room'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default GamificationPage;
