import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Search, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  HelpCircle,
  TrendingUp,
  Globe,
  Code,
  Shield,
  Zap,
  ArrowRight,
  Command
} from 'lucide-react';

const CommandPalette = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // All available commands/actions
  const allCommands = [
    // Quick Actions
    { 
      id: 'browse-numbers', 
      title: 'Browse Numbers', 
      subtitle: 'Find your perfect virtual number',
      icon: Phone, 
      action: () => navigate('/browse-numbers'),
      keywords: ['number', 'phone', 'buy', 'purchase', 'uk', 'usa', 'whatsapp', 'telegram'],
      category: 'Quick Actions',
      gradient: 'from-ember to-cyan-500'
    },
    { 
      id: 'my-numbers', 
      title: 'My Numbers', 
      subtitle: 'View and manage your numbers',
      icon: Phone, 
      action: () => navigate('/my-numbers'),
      keywords: ['numbers', 'manage', 'my'],
      category: 'Quick Actions',
      gradient: 'from-ember to-ember-light/50'
    },
    { 
      id: 'sms', 
      title: 'Messages', 
      subtitle: 'Send and receive SMS',
      icon: MessageSquare, 
      action: () => navigate('/sms'),
      keywords: ['sms', 'message', 'text', 'chat'],
      category: 'Quick Actions',
      gradient: 'from-green-500 to-teal-500'
    },
    { 
      id: 'wallet', 
      title: 'Wallet', 
      subtitle: 'Add credits and view balance',
      icon: CreditCard, 
      action: () => navigate('/wallet'),
      keywords: ['wallet', 'credit', 'payment', 'balance', 'topup'],
      category: 'Quick Actions',
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      id: 'pricing', 
      title: 'Pricing', 
      subtitle: 'View plans and pricing',
      icon: TrendingUp, 
      action: () => navigate('/pricing'),
      keywords: ['pricing', 'plans', 'cost', 'price'],
      category: 'Quick Actions',
      gradient: 'from-yellow-500 to-orange-500'
    },
    
    // Features
    { 
      id: 'api-docs', 
      title: 'API Documentation', 
      subtitle: 'Developer resources and SDK',
      icon: Code, 
      action: () => window.scrollTo({ top: document.querySelector('.sdk-section')?.offsetTop || 6000, behavior: 'smooth' }),
      keywords: ['api', 'sdk', 'developer', 'code', 'integration', 'docs'],
      category: 'Features',
      gradient: 'from-ember to-ember-light'
    },
    { 
      id: 'compliance', 
      title: 'Compliance Checker', 
      subtitle: 'Check your website compliance',
      icon: Shield, 
      action: () => window.scrollTo({ top: document.body.scrollHeight - 1400, behavior: 'smooth' }),
      keywords: ['compliance', '10dlc', 'legal', 'gdpr', 'verification'],
      category: 'Features',
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      id: 'network-map', 
      title: 'Global Coverage', 
      subtitle: 'View our worldwide network',
      icon: Globe, 
      action: () => navigate('/coverage'),
      keywords: ['coverage', 'global', 'network', 'countries', 'international'],
      category: 'Features',
      gradient: 'from-ember to-ember-light'
    },
    
    // Settings & Help
    { 
      id: 'settings', 
      title: 'Account Settings', 
      subtitle: 'Manage your account',
      icon: Settings, 
      action: () => navigate('/account'),
      keywords: ['settings', 'account', 'profile', 'preferences'],
      category: 'Settings',
      gradient: 'from-gray-500 to-gray-600'
    },
    { 
      id: 'help', 
      title: 'Help & Support', 
      subtitle: 'Get help with Calliotel',
      icon: HelpCircle, 
      action: () => navigate('/help'),
      keywords: ['help', 'support', 'faq', 'contact'],
      category: 'Settings',
      gradient: 'from-ember to-indigo-500'
    },
    
    // Special Filters
    { 
      id: 'uk-whatsapp', 
      title: 'UK WhatsApp Numbers', 
      subtitle: 'Browse UK numbers verified for WhatsApp',
      icon: Phone, 
      action: () => navigate('/browse-numbers?country=GB&use=whatsapp'),
      keywords: ['uk', 'united kingdom', 'whatsapp', 'britain'],
      category: 'Quick Filters',
      gradient: 'from-red-500 to-ember-light'
    },
    { 
      id: 'usa-bulk', 
      title: 'USA Bulk Numbers', 
      subtitle: 'Get multiple USA numbers at once',
      icon: Phone, 
      action: () => navigate('/browse-numbers?country=US&bulk=true'),
      keywords: ['usa', 'united states', 'america', 'bulk', 'multiple'],
      category: 'Quick Filters',
      gradient: 'from-ember to-red-500'
    },
    { 
      id: 'telegram-numbers', 
      title: 'Telegram Verified', 
      subtitle: 'Numbers verified for Telegram',
      icon: Zap, 
      action: () => navigate('/browse-numbers?use=telegram'),
      keywords: ['telegram', 'messenger', 'verified'],
      category: 'Quick Filters',
      gradient: 'from-ember to-ember-light'
    }
  ];

  // Filter commands based on search query
  const filteredCommands = searchQuery.trim() === ''
    ? allCommands
    : allCommands.filter(cmd => 
        cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K to open
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(0);
      }

      // Arrow navigation
      if (isOpen && filteredCommands.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        }

        // Enter to execute
        if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
          e.preventDefault();
          executeCommand(filteredCommands[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const executeCommand = (command) => {
    command.action();
    setIsOpen(false);
    setSearchQuery('');
    setSelectedIndex(0);
  };

  if (!isOpen) {
    return (
      // Floating hint button (bottom right)
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 z-40 px-4 py-3 rounded-xl font-semibold shadow-2xl transition-all hover:scale-105 flex items-center space-x-2 ${
          darkMode
            ? 'bg-gray-800 text-gray-300 border-2 border-gray-700 hover:border-gray-600'
            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
        }`}
      >
        <Search className="w-5 h-5" />
        <span>Quick Search</span>
        <kbd className={`px-2 py-1 rounded text-xs font-mono ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-start justify-center pt-20 px-4 animate-slideDown">
        <div 
          className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${
            darkMode ? 'bg-gray-900 border-2 border-gray-700' : 'bg-white border-2 border-gray-200'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Search Input */}
          <div className={`flex items-center px-6 py-4 border-b-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Search className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search anything... (UK WhatsApp, USA bulk, API docs)"
              className={`flex-1 ml-4 bg-transparent text-lg outline-none ${
                darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              }`}
            />
            <kbd className={`px-3 py-1 rounded text-sm font-mono ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className={`max-h-96 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center">
                <p className={`text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No results found
                </p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                  Try searching for "UK WhatsApp" or "API docs"
                </p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="py-2">
                  <div className={`px-6 py-2 text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {category}
                  </div>
                  {commands.map((cmd, idx) => {
                    const Icon = cmd.icon;
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        className={`w-full px-6 py-3 flex items-center space-x-4 transition-all ${
                          isSelected
                            ? darkMode
                              ? 'bg-gray-800'
                              : 'bg-gray-100'
                            : darkMode
                            ? 'hover:bg-gray-800/50'
                            : 'hover:bg-gray-100/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${cmd.gradient}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {cmd.title}
                          </div>
                          <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                            {cmd.subtitle}
                          </div>
                        </div>
                        {isSelected && (
                          <ArrowRight className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className={`px-6 py-3 border-t-2 flex items-center justify-between text-xs ${
            darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-600'
          }`}>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <kbd className={`px-2 py-1 rounded font-mono ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className={`px-2 py-1 rounded font-mono ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>↵</kbd>
                <span>Select</span>
              </span>
            </div>
            <span className="flex items-center space-x-2">
              <Command className="w-4 h-4" />
              <span>Powered by AI</span>
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
};

export default CommandPalette;
