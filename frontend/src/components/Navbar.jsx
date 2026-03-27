import React, { useState } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-9 left-0 right-0 bg-black shadow-lg z-40 overflow-visible border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 py-2">
          {/* Logo - EPIC CIRCULAR GRADIENT ICON */}
          <div className="flex items-center space-x-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
            <div className="relative w-12 h-12 flex-shrink-0">
              {/* Ember Glow */}
              <div 
                className="absolute inset-0 rounded-full opacity-60"
                style={{
                  background: 'radial-gradient(circle, rgba(199, 78, 30, 0.4) 0%, transparent 70%)',
                  transform: 'scale(1.4)',
                  filter: 'blur(8px)'
                }}
              ></div>
              
              {/* Logo Circle */}
              <div 
                className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(199,78,30,0.5)]"
                style={{
                  background: 'linear-gradient(135deg, #FF8C32 0%, #C74E1E 50%, #A63F18 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
              </div>
            </div>
            <span className="text-2xl font-bold text-ember">CALLIOTEL</span>
          </div>

          {/* Desktop Navigation - CORE 4 FOCUS */}
          <div className="hidden lg:flex items-center space-x-3 flex-wrap justify-end gap-y-2">
            {/* CORE PILLAR 1: Virtual Numbers */}
            <button 
              onClick={() => navigate('/verification')} 
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-600 text-white font-bold rounded-lg hover:shadow-[0_4px_20px_rgba(255,165,0,0.5)] hover:scale-105 transition-all flex items-center space-x-1 text-xs whitespace-nowrap shadow-lg"
              title="Virtual Numbers - Verification & Rentals"
            >
              <span>📱</span>
              <span>Virtual Numbers</span>
            </button>
            
            {/* CORE PILLAR 2: SMM Growth */}
            <button 
              onClick={() => navigate('/smm-marketplace')} 
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-600 text-white font-bold rounded-lg hover:shadow-[0_4px_20px_rgba(255,165,0,0.5)] hover:scale-105 transition-all flex items-center space-x-1 text-xs whitespace-nowrap shadow-lg"
              title="SMM Marketplace - Social Growth"
            >
              <span>🔥</span>
              <span>SMM Growth</span>
            </button>
            
            {/* CORE PILLAR 3: Bulk SMS */}
            <button 
              onClick={() => navigate('/bulk-sms')} 
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-600 text-white font-bold rounded-lg hover:shadow-[0_4px_20px_rgba(255,165,0,0.5)] hover:scale-105 transition-all flex items-center space-x-1 text-xs whitespace-nowrap shadow-lg"
              title="Bulk SMS - Enterprise Messaging"
            >
              <span>📧</span>
              <span>Bulk SMS</span>
            </button>
            
            {/* CORE PILLAR 4: AI Features */}
            <button 
              onClick={() => navigate('/ai-hub')} 
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:shadow-[0_4px_20px_rgba(147,51,234,0.5)] hover:scale-105 transition-all flex items-center space-x-1 text-xs whitespace-nowrap shadow-lg"
              title="AI Assistant - Affordable AI Features"
            >
              <span>🤖</span>
              <span>AI Features</span>
            </button>
            
            {/* Pricing */}
            <button 
              onClick={() => navigate('/pricing')} 
              className="text-gray-300 hover:text-yellow-400 font-medium transition-colors text-sm"
            >
              Pricing
            </button>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all bg-gray-800 hover:bg-gray-700 text-yellow-400"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg shadow-lg hover:shadow-[0_4px_20px_rgba(255,140,0,0.6)] hover:scale-105 transition-all"
              >
                Dashboard
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="text-gray-300 hover:text-yellow-400 font-medium transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-bold rounded-lg shadow-lg hover:shadow-[0_4px_20px_rgba(255,140,0,0.6)] hover:scale-105 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Dark Mode Toggle for Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all bg-gray-800 text-yellow-400"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button
              className="p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - CORE 4 FOCUS */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 bg-black border-t border-gray-800">
            {/* CORE 4 PILLARS */}
            <button 
              onClick={() => {
                navigate('/verification');
                setIsMenuOpen(false);
              }} 
              className="block w-full text-left px-4 py-2 font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              📱 Virtual Numbers
            </button>
            <button 
              onClick={() => {
                navigate('/smm-marketplace');
                setIsMenuOpen(false);
              }} 
              className="block w-full text-left px-4 py-2 font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              🔥 SMM Growth
            </button>
            <button 
              onClick={() => {
                navigate('/bulk-sms');
                setIsMenuOpen(false);
              }} 
              className="block w-full text-left px-4 py-2 font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              📧 Bulk SMS
            </button>
            <button 
              onClick={() => {
                navigate('/ai-hub');
                setIsMenuOpen(false);
              }} 
              className="block w-full text-left px-4 py-2 font-bold bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition-all"
            >
              🤖 AI Features
            </button>
            
            <button 
              onClick={() => {
                navigate('/pricing');
                setIsMenuOpen(false);
              }} 
              className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-yellow-400 transition-colors"
            >
              Pricing
            </button>
            
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="block w-full text-left px-4 py-2 font-bold bg-gradient-to-r from-orange-500 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all">
                Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-yellow-400 transition-colors">
                  Login
                </button>
                <button onClick={() => navigate('/signup')} className="block w-full text-left px-4 py-2 font-bold bg-gradient-to-r from-orange-500 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all">
                  Sign Up
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
