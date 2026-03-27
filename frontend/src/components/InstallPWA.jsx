import React, { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import safeLocalStorage from '../utils/safeLocalStorage';

const InstallPWA = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    // Don't show if already installed
    if (isInStandaloneMode) {
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = safeLocalStorage.getItem('pwa-install-dismissed');
    const dismissedDate = safeLocalStorage.getItem('pwa-install-dismissed-date');
    
    // Show again after 7 days if dismissed
    if (dismissed && dismissedDate) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    if (isIOS) {
      setPlatform('ios');
      // Show iOS prompt after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    } else if (isAndroid) {
      setPlatform('android');
      
      // Handle Android install prompt
      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Show prompt after 3 seconds
        setTimeout(() => setShowPrompt(true), 3000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (platform === 'android' && deferredPrompt) {
      // Show Android install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    safeLocalStorage.setItem('pwa-install-dismissed', 'true');
    safeLocalStorage.setItem('pwa-install-dismissed-date', Date.now().toString());
  };

  if (!showPrompt || !platform) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-ember/20 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-ember to-orange-500 p-4 text-white relative">
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Install Calliotel</h3>
                  <p className="text-xs opacity-90">Quick access from home screen</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {platform === 'android' ? (
                // Android Instructions
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Add Calliotel to your home screen for quick access and a better experience!
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full px-4 py-3 bg-gradient-to-r from-ember to-ember-light text-white rounded-xl hover:from-ember hover:to-ember-light transition-all flex items-center justify-center space-x-2 font-semibold shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    <span>Add to Home Screen</span>
                  </button>
                </div>
              ) : (
                // iOS Instructions
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">
                    Install this app on your iPhone:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-ember font-bold text-sm">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          Tap the <Share className="w-4 h-4 inline text-ember" /> <strong>Share</strong> button in Safari
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-ember/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-ember font-bold text-sm">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          Scroll down and tap <Plus className="w-4 h-4 inline text-ember" /> <strong>"Add to Home Screen"</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-orange-600 font-bold text-sm">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          Tap <strong>"Add"</strong> to confirm
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Tip:</strong> Look for the share icon at the bottom of your screen (it looks like a square with an arrow pointing up)
                    </p>
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">
                  <strong>Benefits:</strong>
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✨ Faster launch from home screen</li>
                  <li>📱 Full-screen experience</li>
                  <li>🚀 Works offline</li>
                  <li>🔔 Get instant notifications</li>
                </ul>
              </div>

              {/* Dismiss */}
              <button
                onClick={handleDismiss}
                className="w-full mt-3 px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPWA;
