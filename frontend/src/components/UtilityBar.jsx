import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, FileText, Headphones, Activity } from 'lucide-react';

const UtilityBar = () => {
  const navigate = useNavigate();

  const utilityLinks = [
    {
      id: 'status',
      icon: <Activity className="w-3.5 h-3.5" />,
      text: 'All Systems Operational',
      badge: true,
      badgeColor: 'bg-green-500',
      onClick: () => {
        // Could link to status page
        console.log('System Status clicked');
      }
    },
    {
      id: 'api',
      icon: <Code className="w-3.5 h-3.5" />,
      text: 'Developer API',
      onClick: () => navigate('/help')
    },
    {
      id: 'docs',
      icon: <FileText className="w-3.5 h-3.5" />,
      text: 'Documentation',
      onClick: () => navigate('/help'),
      hideMobile: true
    },
    {
      id: 'support',
      icon: <Headphones className="w-3.5 h-3.5" />,
      text: 'Support',
      onClick: () => navigate('/help')
    }
  ];

  return (
    <div className="bg-slate-800 border-b border-slate-700 fixed top-0 left-0 right-0 z-[60]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end h-9 space-x-6">
          {utilityLinks.map((link) => (
            <button
              key={link.id}
              onClick={link.onClick}
              className={`flex items-center space-x-1.5 text-gray-300 hover:text-white transition-colors text-xs font-medium group ${
                link.hideMobile ? 'hidden md:flex' : 'flex'
              }`}
            >
              {link.badge && (
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${link.badgeColor} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${link.badgeColor}`}></span>
                </span>
              )}
              <span className="group-hover:opacity-80 transition-opacity">
                {link.icon}
              </span>
              <span className="tracking-wide">{link.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UtilityBar;
