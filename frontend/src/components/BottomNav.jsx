import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, History, Grid3x3, Users, UserCircle, Hash, Sparkles, Trophy } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: Hash,
      label: 'Channels',
      path: '/channels',
      color: 'text-ember'
    },
    {
      icon: Sparkles,
      label: 'Feed',
      path: '/feed',
      color: 'text-ember-600'
    },
    {
      icon: MessageSquare,
      label: 'Chat',
      path: '/chat',
      color: 'text-ember'
    },
    {
      icon: Trophy,
      label: 'Rankings',
      path: '/leaderboard',
      color: 'text-yellow-600'
    },
    {
      icon: UserCircle,
      label: 'Account',
      path: '/account',
      color: 'text-orange-600'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center min-w-[60px] py-2 transition-all"
              >
                <div className={`
                  p-3 rounded-xl transition-all
                  ${active 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg scale-110' 
                    : 'bg-gray-100 hover:bg-gray-200'
                  }
                `}>
                  <Icon 
                    className={`w-6 h-6 ${active ? 'text-white' : item.color}`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </div>
                <span className={`
                  text-xs mt-1 font-medium
                  ${active ? 'text-orange-600' : 'text-gray-600'}
                `}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
