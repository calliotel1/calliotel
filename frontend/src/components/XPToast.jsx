import React, { useEffect, useState } from 'react';
import { Zap, TrendingUp, Crown } from 'lucide-react';
import { gamificationEvents } from '../utils/gamificationEvents';

const XPToast = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = gamificationEvents.subscribe((event) => {
      if (event.type === 'xp_gain' || event.type === 'level_up') {
        const id = Date.now();
        const notification = { id, ...event };
        
        setNotifications(prev => [...prev, notification]);

        // Auto-remove after animation
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notif) => (
        <XPNotificationCard key={notif.id} notification={notif} />
      ))}
    </div>
  );
};

const XPNotificationCard = ({ notification }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
    
    // Start fade out
    setTimeout(() => setIsVisible(false), 3500);
  }, []);

  const isLevelUp = notification.levelUp || notification.type === 'level_up';

  return (
    <div
      className={`
        transform transition-all duration-500 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          pointer-events-auto
          rounded-lg shadow-lg p-4 min-w-[280px]
          border-2
          ${isLevelUp 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400' 
            : 'bg-gradient-to-r from-ember to-ember-light border-blue-400'
          }
          text-white
        `}
      >
        <div className="flex items-center gap-3">
          {isLevelUp ? (
            <Crown className="w-6 h-6 animate-bounce" />
          ) : (
            <Zap className="w-6 h-6 animate-pulse" />
          )}
          
          <div className="flex-1">
            {isLevelUp ? (
              <>
                <div className="font-bold text-lg flex items-center gap-2">
                  Level Up! 
                  <span className="text-2xl">{notification.levelInfo?.badge}</span>
                </div>
                <div className="text-sm opacity-90">
                  {notification.levelInfo?.name} - Level {notification.levelInfo?.level}
                </div>
              </>
            ) : (
              <>
                <div className="font-bold text-lg flex items-center gap-2">
                  +{notification.xp} XP
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-sm opacity-90">
                  {notification.reason}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPToast;
