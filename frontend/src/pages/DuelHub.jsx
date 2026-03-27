import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Swords, Plus, Flame, Shield, Users,
  Trophy, TrendingUp, Clock, X, Loader2, Target
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FOMOTicker from '../components/FOMOTicker';
import GlobalDuelFeed from '../components/GlobalDuelFeed';

const API = process.env.REACT_APP_BACKEND_URL;

const DuelHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [openChallenges, setOpenChallenges] = useState([]);
  const [myActiveDuels, setMyActiveDuels] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Create duel form
  const [wagerAmount, setWagerAmount] = useState(50);
  const [difficulty, setDifficulty] = useState('medium');
  const [chaosMode, setChaosMode] = useState(false);
  
  // User's available XP
  const [availableXP, setAvailableXP] = useState(0);

  // Fetch data on mount and poll
  useEffect(() => {
    fetchAllData();
    
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchAllData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [challengesRes, activeDuelsRes, statsRes, profileRes] = await Promise.all([
        axios.get(`${API}/api/game/duel/feed?status=pending&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/api/game/duel/active`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/api/game/duel/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/api/gamification/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setOpenChallenges(challengesRes.data.duels || []);
      setMyActiveDuels(activeDuelsRes.data.duels || []);
      setMyStats(statsRes.data);
      setAvailableXP(profileRes.data.total_points || 0);
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching duel data:', error);
      setLoading(false);
    }
  };

  const getRiskLevel = (wager) => {
    if (wager < 50) return { label: 'Skirmish', color: 'text-green-500', emoji: '🟢' };
    if (wager < 100) return { label: 'Battle', color: 'text-yellow-500', emoji: '🟡' };
    if (wager < 250) return { label: 'War', color: 'text-orange-500', emoji: '🟠' };
    return { label: 'Total War', color: 'text-red-500', emoji: '🔴' };
  };

  const createDuel = async () => {
    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API}/api/game/duel/create`,
        {
          wager_amount: wagerAmount,
          difficulty: difficulty,
          chaos_mode: chaosMode
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowCreateModal(false);
      setCreating(false);
      fetchAllData();
      
      alert('Duel created! Waiting for an opponent...');
      
    } catch (error) {
      console.error('Error creating duel:', error);
      alert(error.response?.data?.detail || 'Failed to create duel');
      setCreating(false);
    }
  };

  const acceptDuel = async (duelId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API}/api/game/duel/accept/${duelId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(response.data.message);
      
      // Navigate to race interface
      navigate(`/games/duel/race/${duelId}`);
      
    } catch (error) {
      console.error('Error accepting duel:', error);
      alert(error.response?.data?.detail || 'Failed to accept duel');
    }
  };

  const cancelDuel = async (duelId) => {
    if (!window.confirm('Cancel this duel and refund your XP?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API}/api/game/duel/cancel/${duelId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Duel cancelled and XP refunded');
      fetchAllData();
      
    } catch (error) {
      console.error('Error cancelling duel:', error);
      alert(error.response?.data?.detail || 'Failed to cancel duel');
    }
  };

  const continueDuel = (duelId) => {
    navigate(`/games/duel/race/${duelId}`);
  };

  const difficultyConfig = {
    easy: { name: 'Easy', color: 'text-green-500', emoji: '🎯' },
    medium: { name: 'Medium', color: 'text-yellow-500', emoji: '⚡' },
    hard: { name: 'Hard', color: 'text-red-500', emoji: '🔥' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white pb-20">
      {/* FOMO Ticker */}
      <FOMOTicker />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/gamification')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <Swords className="text-yellow-400" size={32} />
              <h1 className="text-3xl font-bold">The Duel Arena</h1>
            </div>
            <div className="w-10"></div>
          </div>

          {/* Stats Bar */}
          {myStats && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{availableXP}</div>
                  <div className="text-xs text-gray-300">Available XP</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{myStats.wins}</div>
                  <div className="text-xs text-gray-300">Wins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{myStats.losses}</div>
                  <div className="text-xs text-gray-300">Losses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{myStats.win_rate}%</div>
                  <div className="text-xs text-gray-300">Win Rate</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Open Challenges (Left - 2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* My Active Duels */}
            {myActiveDuels.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/50">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Flame className="text-yellow-500" />
                  Your Active Duels
                </h2>
                <div className="space-y-3">
                  {myActiveDuels.map((duel) => {
                    const risk = getRiskLevel(duel.wager_amount);
                    const config = difficultyConfig[duel.difficulty];
                    const isChallenger = duel.challenger_id === user?.email || duel.challenger_email === user?.email;
                    
                    return (
                      <div key={duel.id} className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{risk.emoji}</span>
                              <span className={`font-bold ${risk.color}`}>{risk.label}</span>
                              <span className="text-gray-400">•</span>
                              <span className={config.color}>{config.emoji} {config.name}</span>
                              {duel.chaos_mode && <span className="text-red-500">🔥 Chaos</span>}
                            </div>
                            <div className="text-sm text-gray-300">
                              {duel.status === 'pending' ? (
                                <span>Waiting for opponent...</span>
                              ) : (
                                <span>
                                  vs {isChallenger ? duel.opponent_email : duel.challenger_email}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-500">
                              {duel.wager_amount * 2} XP
                            </div>
                            <div className="text-xs text-gray-400">Total Pot</div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {duel.status === 'pending' && isChallenger && (
                            <button
                              onClick={() => cancelDuel(duel.id)}
                              className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded font-bold transition-all"
                            >
                              Cancel
                            </button>
                          )}
                          {duel.status === 'active' && (
                            <button
                              onClick={() => continueDuel(duel.id)}
                              className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded font-bold transition-all"
                            >
                              Continue Race →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Open Challenges */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="text-ember" />
                  Open Challenges
                </h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark rounded-lg font-bold transition-all"
                >
                  <Plus size={20} />
                  Create Duel
                </button>
              </div>

              {openChallenges.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No open challenges. Be the first to create one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {openChallenges.map((duel) => {
                    const risk = getRiskLevel(duel.wager_amount);
                    const config = difficultyConfig[duel.difficulty];
                    const canAfford = availableXP >= duel.wager_amount;
                    const isOwnDuel = duel.challenger_email === user?.email;
                    
                    return (
                      <div 
                        key={duel.id} 
                        className={`bg-gray-700/50 rounded-lg p-4 border-2 ${
                          canAfford && !isOwnDuel ? 'border-green-500/30' : 'border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{risk.emoji}</span>
                              <span className={`font-bold ${risk.color}`}>{risk.label}</span>
                              <span className="text-gray-400">•</span>
                              <span className={config.color}>{config.emoji} {config.name}</span>
                              {duel.chaos_mode && <span className="text-red-500">🔥 Chaos</span>}
                            </div>
                            <div className="text-sm text-gray-300">
                              Challenger: <span className="font-bold">{duel.challenger_email?.split('@')[0]}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-500">
                              {duel.wager_amount} XP
                            </div>
                            <div className="text-xs text-gray-400">Entry Fee</div>
                          </div>
                        </div>
                        {!isOwnDuel && (
                          <button
                            onClick={() => acceptDuel(duel.id)}
                            disabled={!canAfford}
                            className={`w-full mt-3 py-2 rounded font-bold transition-all ${
                              canAfford
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                          >
                            {canAfford ? '⚔️ Accept Duel' : '🔒 Insufficient XP'}
                          </button>
                        )}
                        {isOwnDuel && (
                          <div className="w-full mt-3 py-2 text-center bg-ember/20 rounded font-bold text-blue-400">
                            Your Challenge
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Right - 1 col) */}
          <div className="space-y-6">
            {/* Recent Duels Feed */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                Recent Duels
              </h3>
              <GlobalDuelFeed limit={5} />
            </div>
            
            {/* Quick Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="text-ember" />
                How It Works
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex gap-2">
                  <span className="text-yellow-500 font-bold">1.</span>
                  <span>Create a duel or accept an open challenge</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-yellow-500 font-bold">2.</span>
                  <span>Both players lock their XP wager</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-yellow-500 font-bold">3.</span>
                  <span>Race in Speed Dialer - fastest time wins!</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-yellow-500 font-bold">4.</span>
                  <span>Winner takes the entire pot (2x wager)</span>
                </div>
              </div>
            </div>

            {/* Risk Levels Guide */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Risk Levels</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>🟢 Skirmish</span>
                  <span className="text-gray-400">10-49 XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🟡 Battle</span>
                  <span className="text-gray-400">50-99 XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🟠 War</span>
                  <span className="text-gray-400">100-249 XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🔴 Total War</span>
                  <span className="text-gray-400">250+ XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Duel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border-2 border-ember">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create Duel</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Wager Amount */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Wager Amount (XP)</label>
              <input
                type="number"
                value={wagerAmount}
                onChange={(e) => setWagerAmount(parseInt(e.target.value))}
                min="10"
                max={availableXP}
                step="10"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white outline-none focus:border-ember"
              />
              <div className="text-xs text-gray-400 mt-1">
                Available: {availableXP} XP • Min: 10 XP • Max: 1000 XP
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(difficultyConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      difficulty === key
                        ? 'border-ember bg-ember/20'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{config.emoji}</div>
                    <div className={`text-sm font-bold ${config.color}`}>
                      {config.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chaos Mode */}
            <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-lg">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Flame className="text-red-500" size={24} />
                  <div>
                    <div className="font-bold text-red-500">Chaos Mode</div>
                    <div className="text-xs text-gray-400">Numbers flicker & move</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={chaosMode}
                  onChange={(e) => setChaosMode(e.target.checked)}
                  className="w-6 h-6 rounded accent-red-500"
                />
              </label>
            </div>

            {/* Create Button */}
            <button
              onClick={createDuel}
              disabled={creating || wagerAmount > availableXP}
              className="w-full py-3 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember-dark rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating...
                </>
              ) : (
                <>
                  <Swords size={20} />
                  Create Challenge
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuelHub;
