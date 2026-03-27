import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Zap } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';

const API = process.env.REACT_APP_BACKEND_URL;

const EnhancedLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('overall'); // overall, duel, speed_dialer, phish_finder
  const [selectedPlayer, setSelectedPlayer] = useState(null); // For Mini-Combat Card
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
  }, [activeFilter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoint = activeFilter === 'overall'
        ? `${API}/api/leaderboard/overall`
        : `${API}/api/leaderboard/game/${activeFilter}`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leaderboard',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierBorderStyle = (tier) => {
    if (tier.name === "The Architect") {
      return {
        border: '3px solid transparent',
        backgroundImage: 'linear-gradient(#0a0a0f, #0a0a0f), linear-gradient(45deg, #667eea, #764ba2, #f093fb)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: '0 0 30px rgba(102, 126, 234, 0.6), 0 0 60px rgba(118, 75, 162, 0.3)'
      };
    }
    
    return {
      border: `3px solid ${tier.color}`,
      boxShadow: `0 0 20px ${tier.color}60, 0 0 40px ${tier.color}30`
    };
  };

  const getTrendIndicator = (rankChange) => {
    if (rankChange === 'NEW') {
      return <span className="text-xs text-ember font-bold">NEW</span>;
    }
    if (rankChange === 'STABLE' || rankChange === 'N/A') {
      return <Minus size={14} className="text-gray-500" />;
    }
    
    const change = parseInt(rankChange);
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-400 font-bold text-sm">
          <TrendingUp size={14} />
          <span>{change}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-red-500 font-bold text-sm">
          <TrendingDown size={14} />
          <span>{Math.abs(change)}</span>
        </div>
      );
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
          👑
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
          2
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
          3
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-sm">
          {rank}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Hall of Legends...</p>
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-obsidian/40 to-transparent border-b border-ember/20/30 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="text-yellow-500" size={32} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-ember to-ember-light/50 bg-clip-text text-transparent">
              HALL OF LEGENDS
            </h1>
            <Trophy className="text-yellow-500" size={32} />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 justify-center flex-wrap">
            {[
              { id: 'overall', label: '🏆 Overall' },
              { id: 'duel', label: '⚔️ The Duel' },
              { id: 'speed_dialer', label: '📱 Speed Dialer' },
              { id: 'phish_finder', label: '🧠 Phish-Finder' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeFilter === filter.id
                    ? 'bg-ember text-white shadow-lg shadow-purple-500/50'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* THE HERO HEADER - Top 3 Podium */}
        {top3.length > 0 && (
          <div className="mb-12">
            <div className="relative flex items-end justify-center gap-8 mb-8">
              {/* #2 - Left Flanker */}
              {top3[1] && (
                <div className="flex flex-col items-center" style={{ transform: 'translateY(20px)' }}>
                  <div
                    className="relative mb-3 rounded-full p-1 transition-transform hover:scale-110 cursor-pointer"
                    style={getTierBorderStyle(top3[1].tier)}
                    onClick={() => setSelectedPlayer(top3[1])}
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{
                        background: top3[1].tier.name === "The Architect"
                          ? 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
                          : `linear-gradient(135deg, ${top3[1].tier.color}40, ${top3[1].tier.color}60)`
                      }}
                    >
                      {top3[1].profile_picture ? (
                        <img
                          src={`${API}${top3[1].profile_picture}`}
                          alt={top3[1].full_name || top3[1].email}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        top3[1].email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      {getRankBadge(2)}
                    </div>
                  </div>
                  <p className="text-white font-bold text-sm text-center max-w-[120px] truncate">
                    {top3[1].full_name || top3[1].email.split('@')[0]}
                  </p>
                  <p className="text-gray-400 text-xs">{top3[1].total_xp} XP</p>
                </div>
              )}

              {/* #1 - THE ALPHA PEDESTAL */}
              {top3[0] && (
                <div className="flex flex-col items-center">
                  <div
                    className="relative mb-3 rounded-full p-1 transition-transform hover:scale-110 cursor-pointer animate-pulse-slow"
                    style={{
                      ...getTierBorderStyle(top3[0].tier),
                      animation: top3[0].tier.name === "The Architect" 
                        ? 'architect-shimmer 3s linear infinite' 
                        : 'none'
                    }}
                    onClick={() => setSelectedPlayer(top3[0])}
                  >
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
                      style={{
                        background: top3[0].tier.name === "The Architect"
                          ? 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
                          : `linear-gradient(135deg, ${top3[0].tier.color}40, ${top3[0].tier.color}60)`
                      }}
                    >
                      {top3[0].profile_picture ? (
                        <img
                          src={`${API}${top3[0].profile_picture}`}
                          alt={top3[0].full_name || top3[0].email}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        top3[0].email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      {getRankBadge(1)}
                    </div>
                  </div>
                  <p className="text-white font-bold text-lg text-center max-w-[150px] truncate">
                    {top3[0].full_name || top3[0].email.split('@')[0]}
                  </p>
                  <p className="text-ember text-sm font-bold">{top3[0].total_xp} XP</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs" style={{ color: top3[0].tier.color }}>
                      {top3[0].tier.emoji} {top3[0].tier.name}
                    </span>
                  </div>
                </div>
              )}

              {/* #3 - Right Flanker */}
              {top3[2] && (
                <div className="flex flex-col items-center" style={{ transform: 'translateY(20px)' }}>
                  <div
                    className="relative mb-3 rounded-full p-1 transition-transform hover:scale-110 cursor-pointer"
                    style={getTierBorderStyle(top3[2].tier)}
                    onClick={() => setSelectedPlayer(top3[2])}
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{
                        background: top3[2].tier.name === "The Architect"
                          ? 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
                          : `linear-gradient(135deg, ${top3[2].tier.color}40, ${top3[2].tier.color}60)`
                      }}
                    >
                      {top3[2].profile_picture ? (
                        <img
                          src={`${API}${top3[2].profile_picture}`}
                          alt={top3[2].full_name || top3[2].email}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        top3[2].email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      {getRankBadge(3)}
                    </div>
                  </div>
                  <p className="text-white font-bold text-sm text-center max-w-[120px] truncate">
                    {top3[2].full_name || top3[2].email.split('@')[0]}
                  </p>
                  <p className="text-gray-400 text-xs">{top3[2].total_xp} XP</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* THE CONTENDER LIST (4-100) */}
        {rest.length > 0 && (
          <div className="space-y-2">
            {rest.map((player) => (
              <div
                key={player.user_id}
                onClick={() => setSelectedPlayer(player)}
                className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg p-4 hover:bg-gray-800/40 transition-all cursor-pointer"
                style={{
                  borderColor: `${player.tier.color}40`,
                  boxShadow: `0 0 10px ${player.tier.color}20`
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    {getRankBadge(player.rank)}
                  </div>

                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{
                      background: player.tier.name === "The Architect"
                        ? 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
                        : `linear-gradient(135deg, ${player.tier.color}40, ${player.tier.color}60)`,
                      border: `2px solid ${player.tier.color}`,
                      boxShadow: `0 0 10px ${player.tier.color}60`
                    }}
                  >
                    {player.profile_picture ? (
                      <img
                        src={`${API}${player.profile_picture}`}
                        alt={player.full_name || player.email}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      player.email.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">
                      {player.full_name || player.email.split('@')[0]}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {player.total_xp} XP • {player.tier.emoji} {player.tier.name}
                    </p>
                  </div>

                  {/* Trend Indicator */}
                  <div className="flex-shrink-0">
                    {getTrendIndicator(player.rank_change_24h)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No warriors on the leaderboard yet</p>
            <p className="text-gray-500 text-sm mt-2">Be the first to claim your throne!</p>
          </div>
        )}
      </div>

      {/* Mini-Combat Card Overlay */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border-2 animate-slide-in-right"
            style={{
              borderColor: selectedPlayer.tier.color,
              boxShadow: `0 0 40px ${selectedPlayer.tier.color}60`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Combat Card Content */}
            <div className="text-center mb-6">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
                style={{
                  background: selectedPlayer.tier.name === "The Architect"
                    ? 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
                    : `linear-gradient(135deg, ${selectedPlayer.tier.color}40, ${selectedPlayer.tier.color}60)`,
                  border: `3px solid ${selectedPlayer.tier.color}`,
                  boxShadow: `0 0 20px ${selectedPlayer.tier.color}80`
                }}
              >
                {selectedPlayer.profile_picture ? (
                  <img
                    src={`${API}${selectedPlayer.profile_picture}`}
                    alt={selectedPlayer.full_name || selectedPlayer.email}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  selectedPlayer.email.charAt(0).toUpperCase()
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedPlayer.full_name || selectedPlayer.email.split('@')[0]}
              </h2>

              <div
                className="inline-block px-4 py-2 rounded-lg font-bold text-sm mb-4"
                style={{
                  background: selectedPlayer.tier.name === "The Architect"
                    ? 'linear-gradient(45deg, #667eea, #764ba2)'
                    : selectedPlayer.tier.color,
                  color: 'white'
                }}
              >
                {selectedPlayer.tier.emoji} {selectedPlayer.tier.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-gray-400 text-xs mb-1">Rank</div>
                <div className="text-white font-bold text-xl">#{selectedPlayer.rank}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-gray-400 text-xs mb-1">Total XP</div>
                <div className="text-ember font-bold text-xl">{selectedPlayer.total_xp}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-gray-400 text-xs mb-1">Level</div>
                <div className="text-white font-bold text-xl">{selectedPlayer.level}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-gray-400 text-xs mb-1">24h Change</div>
                <div className="text-white font-bold text-xl">
                  {getTrendIndicator(selectedPlayer.rank_change_24h)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlayer(null)}
              className="w-full py-3 bg-ember hover:bg-ember-light rounded-lg font-bold text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx>{`
        @keyframes architect-shimmer {
          0% {
            filter: hue-rotate(0deg);
          }
          100% {
            filter: hue-rotate(360deg);
          }
        }

        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EnhancedLeaderboard;
