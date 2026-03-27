import React, { useEffect, useState } from 'react';
import { Trophy, Zap, Skull } from 'lucide-react';
import confetti from 'canvas-confetti';

const API = process.env.REACT_APP_BACKEND_URL;

const TauntModal = ({ taunt, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [winnerCard, setWinnerCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taunt) {
      fetchWinnerCard();
      
      // THE SHATTER: 0.2s snap to black
      setVisible(true);
      
      // For Architect's Silence: Hold in pure black for 1.5s before showing card
      const isArchitectSilence = taunt.taunt_style === 'silence';
      const cardDelay = isArchitectSilence ? 1500 : 0;
      
      // Auto-close after black hold + 2s card display
      const totalDuration = cardDelay + 2000;
      const timer = setTimeout(() => {
        handleClose();
      }, totalDuration);
      
      return () => clearTimeout(timer);
    }
  }, [taunt]);

  const fetchWinnerCard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/profile/combat-card/${taunt.winner_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setWinnerCard(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching winner card:', error);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  if (!taunt || !visible) return null;

  const isArchitectSilence = taunt.taunt_style === 'silence';
  const tier = winnerCard?.tier;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${
        isArchitectSilence
          ? 'bg-black transition-all duration-200'  // THE SHATTER - 0.2s snap to 0%
          : 'bg-black/80 backdrop-blur-sm transition-all duration-500'
      }`}
      style={{
        animation: isArchitectSilence 
          ? 'voidShatter 0.2s cubic-bezier(0.4, 0, 1, 1) forwards' 
          : 'fadeIn 0.5s ease-out forwards'
      }}
    >
      {/* Combat Card - Center Stage */}
      {loading ? (
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      ) : winnerCard ? (
        <div
          className={`relative max-w-md w-full mx-4 rounded-2xl p-8 transition-all duration-1000 ${
            isArchitectSilence ? 'animate-voidMaterialize' : 'animate-combatCardAppear'
          }`}
          style={{
            background: tier?.name === "The Architect"
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
              : `linear-gradient(135deg, rgba(${hexToRgb(tier?.color || '#CD7F32')}, 0.1) 0%, rgba(${hexToRgb(tier?.color || '#CD7F32')}, 0.3) 100%)`,
            border: tier?.name === "The Architect" 
              ? '4px solid transparent'
              : `4px solid ${tier?.color || '#CD7F32'}`,
            backgroundImage: tier?.name === "The Architect"
              ? 'linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
              : 'none',
            backgroundOrigin: 'border-box',
            backgroundClip: tier?.name === "The Architect" ? 'padding-box, border-box' : 'initial',
            boxShadow: isArchitectSilence
              ? `0 0 60px ${tier?.color || '#667eea'}80, 0 0 120px ${tier?.color || '#667eea'}40`
              : `0 0 40px ${tier?.color || '#CD7F32'}60, 0 0 80px ${tier?.color || '#CD7F32'}30`,
            animation: isArchitectSilence ? 'architectPulse 0.5s ease-in-out infinite alternate' : 'none'
          }}
        >
          {/* Skull Icon (top right) */}
          {!isArchitectSilence && (
            <div className="absolute top-4 right-4">
              <Skull className="text-red-500 w-8 h-8 animate-pulse" />
            </div>
          )}

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div
              className="relative w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold"
              style={{
                background: tier?.name === "The Architect"
                  ? 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)'
                  : `linear-gradient(135deg, ${tier?.color}40, ${tier?.color}60)`,
                border: `4px solid ${tier?.color || '#CD7F32'}`,
                boxShadow: `0 0 30px ${tier?.color || '#CD7F32'}80`
              }}
            >
              {winnerCard.profile_picture ? (
                <img
                  src={`${API}${winnerCard.profile_picture}`}
                  alt={winnerCard.full_name || winnerCard.email}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                winnerCard.email.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* Winner Info */}
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-white mb-2">
              {winnerCard.full_name || winnerCard.email.split('@')[0]}
            </h2>
            <div
              className="inline-block px-4 py-2 rounded-lg font-bold text-sm mb-4"
              style={{
                background: tier?.name === "The Architect"
                  ? 'linear-gradient(45deg, #667eea, #764ba2)'
                  : tier?.color,
                color: 'white'
              }}
            >
              {tier?.emoji} {tier?.name}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div>
              <div className="text-gray-400 text-xs mb-1">XP</div>
              <div className="text-white font-bold text-lg">{winnerCard.total_xp}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Level</div>
              <div className="text-white font-bold text-lg">{winnerCard.level}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Win Rate</div>
              <div className="text-white font-bold text-lg">{winnerCard.duel_stats.win_rate}%</div>
            </div>
          </div>

          {/* Taunt Message (if not silence) */}
          {!isArchitectSilence && taunt.taunt_text && (
            <div className="bg-black/40 rounded-lg p-4 text-center border border-gray-700">
              <p className="text-gray-300 italic text-lg">
                "{taunt.taunt_text}"
              </p>
            </div>
          )}

          {/* Architect's Silence - No Text */}
          {isArchitectSilence && (
            <div className="text-center">
              <Zap className="w-12 h-12 text-ember mx-auto animate-pulse" />
            </div>
          )}
        </div>
      ) : (
        <div className="text-white text-xl">Error loading Combat Card</div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes voidShatter {
          0% { 
            background-color: rgba(0, 0, 0, 0);
            opacity: 0;
          }
          100% { 
            background-color: rgba(0, 0, 0, 1);
            opacity: 1;
          }
        }

        @keyframes combatCardAppear {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes voidMaterialize {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes architectPulse {
          from {
            box-shadow: 0 0 60px ${tier?.color || '#667eea'}80, 0 0 120px ${tier?.color || '#667eea'}40;
          }
          to {
            box-shadow: 0 0 80px ${tier?.color || '#667eea'}ff, 0 0 150px ${tier?.color || '#667eea'}60;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to convert hex to RGB
const hexToRgb = (hex) => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle gradient strings (return default)
  if (hex.includes('linear')) return '205, 127, 50';
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
};

export default TauntModal;
