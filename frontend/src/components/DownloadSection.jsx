import React, { useState, useEffect } from 'react';
import { Download, Plus, Send } from 'lucide-react';

const DownloadSection = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event (PWA install prompt)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAddToHome = async () => {
    if (!deferredPrompt) {
      // Fallback: Show manual instructions
      alert(
        'To add Calliotel to your home screen:\n\n' +
        'iOS: Tap the Share button and select "Add to Home Screen"\n' +
        'Android: Tap the menu (⋮) and select "Add to Home screen"'
      );
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <section className="py-20 bg-obsidian">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Get the Calliotel App
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Download now and start connecting globally with premium virtual numbers and affordable international calling.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Phone Mockup - Beautiful App Interface */}
          <div className="relative">
            {/* Phone Frame */}
            <div className="relative w-72 h-[600px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10"></div>
              
              {/* Screen Content - Matching Website Design */}
              <div className="w-full h-full bg-gradient-to-br from-ember via-ember to-ember-light/50 rounded-[2.5rem] overflow-hidden relative">
                {/* Animated Background Blobs */}
                <div className="absolute top-10 left-5 w-32 h-32 bg-ember/40 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute top-20 right-5 w-32 h-32 bg-ember/40 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                
                {/* Status Bar */}
                <div className="flex justify-between items-center px-6 pt-8 pb-4 text-white text-xs relative z-10">
                  <span className="font-semibold">9:41</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <div className="w-4 h-3 border border-white rounded-sm relative">
                      <div className="absolute inset-0.5 bg-white rounded-sm"></div>
                    </div>
                  </div>
                </div>

                {/* App Content */}
                <div className="px-6 space-y-6 relative z-10">
                  {/* Logo & Welcome */}
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-float">
                      <svg className="w-12 h-12 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <h3 className="text-white text-2xl font-bold mb-1">CALLIOTEL</h3>
                    <p className="text-ember-100 text-sm">Global Virtual Phone</p>
                  </div>

                  {/* Quick Stats Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/30 transition-all cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-white text-2xl font-bold">2</div>
                      <div className="text-ember-100 text-xs">Active Numbers</div>
                    </div>
                    
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/30 transition-all cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-white text-2xl font-bold">48</div>
                      <div className="text-ember-100 text-xs">Messages</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 animate-pulse-slow">
                    Get Started Now
                  </button>

                  {/* Feature Highlights */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-white text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">150+ Countries Available</span>
                    </div>
                    <div className="flex items-center gap-3 text-white text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">Instant Setup</span>
                    </div>
                    <div className="flex items-center gap-3 text-white text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">24/7 Support</span>
                    </div>
                    <div className="flex items-center gap-3 text-white text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">No Contracts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="space-y-4">
            {/* Add to Home Screen - iOS */}
            <button 
              onClick={handleAddToHome}
              className="flex items-center space-x-4 bg-ember hover:bg-ember-light text-white px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(199,78,30,0.4)] hover:shadow-[0_0_30px_rgba(199,78,30,0.6)] w-full md:w-auto"
            >
              <Plus className="w-8 h-8" />
              <div className="text-left">
                <p className="text-xs">Add to Home Screen</p>
                <p className="text-xl font-semibold">iOS & Android</p>
              </div>
            </button>

            {/* Add to Home Screen - Android (Alternative styling) */}
            <button 
              onClick={handleAddToHome}
              className="flex items-center space-x-4 bg-obsidian-light border-2 border-ember hover:bg-olive text-white px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg w-full md:w-auto"
            >
              <Download className="w-8 h-8 text-ember" />
              <div className="text-left">
                <p className="text-xs text-gray-400">Quick Access</p>
                <p className="text-xl font-semibold">Install Web App</p>
              </div>
            </button>

            {/* Telegram Channel Button */}
            <a 
              href="https://t.me/calliotel" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-4 bg-gradient-to-r from-[#0088cc] to-[#0077b5] hover:from-[#0077b5] hover:to-[#006699] text-white px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg w-full md:w-auto"
            >
              <Send className="w-8 h-8" />
              <div className="text-left">
                <p className="text-xs">Join our</p>
                <p className="text-xl font-semibold">Telegram Channel</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;