import React from 'react';
import { X, Trophy, Swords, Target, Shield } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const CombatCard = ({ userId, onClose }) => {
  const [combatCard, setCombatCard] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchCombatCard();
  }, [userId]);

  const fetchCombatCard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/profile/combat-card/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setCombatCard(data);
    } catch (error) {
      console.error('Error fetching combat card:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember mx-auto"></div>
          <p className="text-white mt-4">Loading Combat Card...</p>
        </div>
      </div>
    );
  }

  if (!combatCard) {
    return null;
  }

  const tier = combatCard.tier;
  const isArchitect = tier.name === "The Architect";

  // Tier border colors
  const getBorderStyle = () => {
    if (isArchitect) {
      return {
        border: '3px solid transparent',
        backgroundImage: 'linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(45deg, #667eea, #764ba2, #f093fb)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: '0 0 40px rgba(102, 126, 234, 0.8), 0 0 80px rgba(118, 75, 162, 0.4)'
      };
    }
    
    // Enhanced glow for dark mode
    const glowIntensity = document.documentElement.classList.contains('dark') ? '0.6' : '0.4';
    
    return {
      borderColor: tier.color,
      borderWidth: '3px',
      boxShadow: `0 0 20px ${tier.color}${glowIntensity}, 0 0 40px ${tier.color}20`
    };
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-md w-full border-3 relative overflow-hidden"
        style={getBorderStyle()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          data-testid="combat-card-close"
          className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition-colors z-10"
        >
          <X className="text-gray-400" size={24} />
        </button>

        {/* Header with Avatar */}
        <div className="p-6 text-center">
          {/* Avatar */}
          <div className="relative inline-block">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4"
              style={{
                background: isArchitect 
                  ? 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
                  : `linear-gradient(135deg, ${tier.color}20, ${tier.color}40)`,
                border: `3px solid ${tier.color}`,
                boxShadow: `0 0 20px ${tier.color}60`
              }}
            >
              {combatCard.profile_picture ? (
                <img 
                  src={`${API}${combatCard.profile_picture}`} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                combatCard.email.charAt(0).toUpperCase()
              )}
            </div>
            {/* Tier Badge */}
            <div 
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ 
                background: isArchitect 
                  ? 'linear-gradient(45deg, #667eea, #764ba2)' 
                  : tier.color 
              }}
            >
              {tier.emoji} {tier.name}
            </div>
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-white mt-6">
            {combatCard.full_name || combatCard.email}
          </h2>
          <p className="text-gray-400 text-sm">{combatCard.client_id}</p>

          {/* Mood Status */}
          {combatCard.mood_status && (
            <p className="text-ember text-sm mt-2 italic">
              "{combatCard.mood_status}"
            </p>
          )}
        </div>

        {/* Stats Bar */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-4 bg-gray-700/50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {combatCard.total_xp}
              </div>
              <div className="text-xs text-gray-400">Total XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {combatCard.duel_stats.win_rate}%
              </div>
              <div className="text-xs text-gray-400">Duel Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-ember">
                {combatCard.phish_finder_stats.accuracy}%
              </div>
              <div className="text-xs text-gray-400">Phish Accuracy</div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="px-6 pb-4 space-y-3">
          {/* Duel Stats */}
          <div className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-3">
            <Swords className="text-red-500" size={24} />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">The Duel</div>
              <div className="text-xs text-gray-400">
                {combatCard.duel_stats.wins}W - {combatCard.duel_stats.losses}L 
                {combatCard.duel_stats.total_duels > 0 && ` (${combatCard.duel_stats.total_duels} total)`}
              </div>
            </div>
          </div>

          {/* Phish-Finder Stats */}
          <div className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-3">
            <Target className="text-ember" size={24} />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Phish-Finder</div>
              <div className="text-xs text-gray-400">
                {combatCard.phish_finder_stats.total_games} games played
              </div>
            </div>
          </div>

          {/* Level & Achievements */}
          <div className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-3">
            <Shield className="text-ember" size={24} />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Level {combatCard.level}</div>
              <div className="text-xs text-gray-400">
                {combatCard.total_achievements} achievements unlocked
              </div>
            </div>
          </div>
        </div>

        {/* Featured Achievements */}
        {combatCard.featured_achievements.length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={18} />
              Featured Achievements
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {combatCard.featured_achievements.map((ach) => (
                <div 
                  key={ach.id} 
                  className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3 text-center"
                >
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-xs text-white font-medium truncate">
                    {ach.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {combatCard.featured_achievements.length === 0 && (
          <div className="px-6 pb-6">
            <div className="bg-gray-700/30 rounded-lg p-4 text-center">
              <Trophy className="text-gray-500 mx-auto mb-2" size={32} />
              <p className="text-gray-400 text-sm">
                No featured achievements yet
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombatCard;
