import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, Award, X } from 'lucide-react';
import { gamificationEvents } from '../utils/gamificationEvents';

const AchievementCelebration = () => {
  const [achievement, setAchievement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = gamificationEvents.subscribe((event) => {
      if (event.type === 'achievement') {
        setAchievement(event.achievement);
        setIsVisible(true);

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => setAchievement(null), 500);
        }, 5000);
      }
    });

    return unsubscribe;
  }, []);

  if (!achievement) return null;

  return (
    <>
      {/* Overlay with confetti effect */}
      <div
        className={`
          fixed inset-0 z-50 flex items-center justify-center
          transition-all duration-500
          ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      >
        {/* Confetti particles */}
        {isVisible && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                <Sparkles 
                  className="text-yellow-400" 
                  size={Math.random() * 20 + 10}
                />
              </div>
            ))}
          </div>
        )}

        {/* Achievement card */}
        <div
          className={`
            relative bg-gradient-to-br from-ember-dark via-olive to-blue-900
            rounded-2xl p-8 max-w-md mx-4
            border-4 border-yellow-400 shadow-2xl
            transform transition-all duration-500
            ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-12'}
          `}
        >
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Trophy icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="w-20 h-20 text-yellow-400 animate-bounce" />
              <div className="absolute inset-0 animate-ping">
                <Trophy className="w-20 h-20 text-yellow-400 opacity-40" />
              </div>
            </div>
          </div>

          {/* Achievement details */}
          <div className="text-center text-white">
            <div className="text-yellow-400 font-bold text-xl mb-2 uppercase tracking-wide">
              Achievement Unlocked!
            </div>

            {/* Achievement icon */}
            <div className="text-6xl my-4 animate-pulse">
              {achievement.icon}
            </div>

            {/* Achievement name */}
            <div className="text-2xl font-bold mb-2">
              {achievement.name}
            </div>

            {/* Achievement description */}
            <div className="text-ember-light mb-4">
              {achievement.description}
            </div>

            {/* Points earned */}
            <div className="flex items-center justify-center gap-2 bg-white/10 rounded-full px-6 py-2 mx-auto w-fit">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-lg">
                +{achievement.points} XP
              </span>
            </div>
          </div>

          {/* Sparkle decorations */}
          <Sparkles className="absolute top-4 left-4 text-yellow-300 animate-pulse" size={20} />
          <Sparkles className="absolute bottom-4 right-4 text-blue-300 animate-pulse" size={20} />
          <Sparkles className="absolute top-1/2 left-2 text-ember animate-pulse" size={16} />
          <Sparkles className="absolute top-1/2 right-2 text-ember-light animate-pulse" size={16} />
        </div>
      </div>

      {/* Add confetti animation styles */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </>
  );
};

export default AchievementCelebration;
