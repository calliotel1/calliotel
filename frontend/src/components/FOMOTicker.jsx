import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Zap, Crown, Target, Swords } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const FOMOTicker = () => {
  const [events, setEvents] = useState([]);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    fetchEvents();
    
    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetchEvents();
      setAnimationKey(prev => prev + 1); // Restart animation
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      // Fetch recent duels
      const duelsRes = await axios.get(`${API}/api/game/duel/feed?status=completed&limit=5`);
      const pendingDuelsRes = await axios.get(`${API}/api/game/duel/feed?status=pending&limit=5`);
      
      const newEvents = [];
      
      // Add recent victories
      duelsRes.data.duels.forEach(duel => {
        const pot = duel.wager_amount * 2;
        newEvents.push({
          id: `duel-${duel.id}`,
          icon: Trophy,
          color: 'text-yellow-500',
          text: `🔥 ${duel.winner_email?.split('@')[0]} just won ${pot} XP in a duel!`
        });
      });
      
      // Add new high-stakes challenges
      pendingDuelsRes.data.duels
        .filter(d => d.wager_amount >= 100)
        .forEach(duel => {
          newEvents.push({
            id: `challenge-${duel.id}`,
            icon: Swords,
            color: 'text-red-500',
            text: `⚔️ NEW HIGH-STAKES CHALLENGE: ${duel.wager_amount} XP (${duel.difficulty}) - Who dares?`
          });
        });
      
      // Add motivational messages if events are sparse
      if (newEvents.length < 3) {
        const motivational = [
          { icon: Flame, color: 'text-orange-500', text: '🎮 Jump into the Arena and prove your speed!' },
          { icon: Crown, color: 'text-ember', text: '👑 Top players earn exclusive achievements!' },
          { icon: Zap, color: 'text-ember', text: '⚡ Chaos Mode doubles your XP rewards!' },
          { icon: Target, color: 'text-green-500', text: '🎯 Master all 3 difficulties to become a legend!' }
        ];
        
        const randomMsg = motivational[Math.floor(Math.random() * motivational.length)];
        newEvents.push({
          id: `motivational-${Date.now()}`,
          ...randomMsg
        });
      }
      
      setEvents(newEvents);
      
    } catch (error) {
      console.error('Error fetching ticker events:', error);
    }
  };

  if (events.length === 0) {
    return (
      <div className="bg-gradient-to-r from-ember-dark/50 to-ember-dark/50 py-2 px-4 overflow-hidden">
        <div className="text-center text-gray-400 text-sm">
          🎮 Welcome to the Arena! Be the first to create a duel challenge!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-ember-dark/50 to-ember-dark/50 py-2 px-4 overflow-hidden relative">
      <div 
        key={animationKey}
        className="ticker-container flex items-center gap-8 animate-ticker"
      >
        {/* Duplicate events for seamless loop */}
        {[...events, ...events, ...events].map((event, index) => (
          <div 
            key={`${event.id}-${index}`}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <event.icon className={event.color} size={16} />
            <span className="text-white text-sm font-medium">
              {event.text}
            </span>
            <span className="text-gray-500">•</span>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .ticker-container {
          display: flex;
          width: max-content;
        }
        
        .animate-ticker {
          animation: scroll-left 60s linear infinite;
        }
        
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  );
};

export default FOMOTicker;
