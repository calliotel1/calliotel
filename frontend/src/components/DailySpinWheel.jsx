import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Gift, Zap, TrendingUp, X, Sparkles } from 'lucide-react';

const DailySpinWheel = () => {
  const location = useLocation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [canSpin, setCanSpin] = useState(true);
  const [timeUntilNextSpin, setTimeUntilNextSpin] = useState(null);

  // Prizes
  const prizes = [
    { id: 1, label: '$0.50\nCredit', value: 0.50, color: '#10B981', icon: '💵', type: 'credit' },
    { id: 2, label: '5% Off', value: 5, color: '#F59E0B', icon: '🎫', type: 'discount' },
    { id: 3, label: '2x XP', value: 2, color: '#8B5CF6', icon: '⚡', type: 'xp' },
    { id: 4, label: '$1.00\nCredit', value: 1.00, color: '#10B981', icon: '💰', type: 'credit' },
    { id: 5, label: '10% Off', value: 10, color: '#F59E0B', icon: '🏷️', type: 'discount' },
    { id: 6, label: 'Try\nAgain', value: 0, color: '#6B7280', icon: '🔄', type: 'none' }
  ];

  // Check if user can spin (once per 24h) - ONLY for verified users
  useEffect(() => {
    if (!user) return;
    
    // CRITICAL: Only show spin wheel to email-verified users
    if (!user.email_verified) return;

    // 🛡️ ROUTE GUARD: Disable spin wheel on Marketplace, Verification & Wallet pages (Buying Mode)
    const isMarketplacePage = location.pathname === '/virtual-numbers';
    const isVerificationPage = location.pathname === '/verification';
    const isWalletPage = location.pathname === '/wallet';
    if (isMarketplacePage || isVerificationPage || isWalletPage) return;

    const lastSpin = localStorage.getItem(`lastSpin_${user.id}`);
    if (lastSpin) {
      const lastSpinTime = new Date(lastSpin);
      const now = new Date();
      const timeDiff = now - lastSpinTime;
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        setCanSpin(false);
        const hoursRemaining = Math.ceil(24 - hoursDiff);
        setTimeUntilNextSpin(hoursRemaining);
      }
    }

    // Show modal for first-time or returning users (only if email verified)
    const hasSeenToday = sessionStorage.getItem(`seenSpinToday_${user.id}`);
    const today = new Date().toDateString();
    const lastSeenDate = localStorage.getItem(`lastSeenSpinDate_${user.id}`);
    
    // Only show once per day (resets at midnight)
    if (lastSeenDate !== today && !hasSeenToday && canSpin) {
      setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem(`seenSpinToday_${user.id}`, 'true');
        localStorage.setItem(`lastSeenSpinDate_${user.id}`, today);
      }, 3000); // Show after 3 seconds
    }
  }, [user, canSpin, location.pathname]);

  const spinWheel = () => {
    if (!canSpin || spinning) return;

    setSpinning(true);
    setResult(null);

    // Random prize selection (weighted)
    const weights = [25, 30, 25, 10, 5, 5]; // % chances
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedPrize = prizes[0];

    for (let i = 0; i < prizes.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedPrize = prizes[i];
        break;
      }
    }

    // Calculate rotation
    const prizeAngle = 360 / prizes.length;
    const prizeIndex = prizes.findIndex(p => p.id === selectedPrize.id);
    const targetRotation = 360 * 5 + prizeIndex * prizeAngle + Math.random() * (prizeAngle * 0.8);

    setRotation(targetRotation);

    // Show result after animation
    setTimeout(() => {
      setResult(selectedPrize);
      setSpinning(false);
      setCanSpin(false);
      
      // Save spin time
      if (user) {
        localStorage.setItem(`lastSpin_${user.id}`, new Date().toISOString());
      }

      // Award prize (would integrate with backend)
      awardPrize(selectedPrize);
    }, 4000);
  };

  const awardPrize = (prize) => {
    // This would call your backend API
    console.log('Awarding prize:', prize);
    
    // Mock implementation
    if (prize.type === 'credit') {
      // Add credit to user account
      alert(`🎉 You won $${prize.value} credit! Check your balance.`);
    } else if (prize.type === 'discount') {
      // Generate discount code
      alert(`🎉 You won ${prize.value}% off! Code: SPIN${prize.value}`);
    } else if (prize.type === 'xp') {
      // Double XP for next purchase
      alert(`🎉 You won ${prize.value}x XP multiplier for 24 hours!`);
    }
  };

  if (!user || !user.email_verified) return null; // Only show to verified users

  return (
    <>
      {/* Floating Button */}
      {!isOpen && canSpin && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-ember-light/50 text-white shadow-2xl hover:scale-110 transition-all flex items-center justify-center group"
        >
          <Gift className="w-8 h-8 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            1
          </div>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`relative max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden ${
              darkMode ? 'bg-gray-900' : 'bg-white'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${
                darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className={`text-center py-8 px-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-ember-light/50/20 mb-4">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-bold text-orange-500">DAILY REWARD</span>
              </div>
              <h2 className={`text-3xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Spin the Wheel!
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {canSpin ? 'Free spin available once every 24 hours' : `Next spin in ${timeUntilNextSpin} hours`}
              </p>
            </div>

            {/* Wheel Container */}
            <div className="p-8">
              <div className="relative mx-auto" style={{ width: '320px', height: '320px' }}>
                {/* Pointer Arrow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-red-500 drop-shadow-lg"></div>
                </div>

                {/* Wheel */}
                <div
                  className="relative w-full h-full rounded-full shadow-2xl"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                  }}
                >
                  {/* Wheel Segments */}
                  {prizes.map((prize, index) => {
                    const angle = (360 / prizes.length) * index;
                    return (
                      <div
                        key={prize.id}
                        className="absolute inset-0"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%)',
                          transformOrigin: 'center'
                        }}
                      >
                        <div
                          className="w-full h-full flex items-start justify-end p-8"
                          style={{
                            backgroundColor: prize.color,
                            transform: 'rotate(-30deg)',
                            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%)'
                          }}
                        >
                          <div className="text-center" style={{ transform: 'rotate(30deg)' }}>
                            <div className="text-3xl mb-1">{prize.icon}</div>
                            <div className="text-xs font-bold text-white whitespace-pre-line">
                              {prize.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Center Circle */}
                  <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-ember-light/50 shadow-xl flex items-center justify-center border-4 border-white">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Spin Button */}
              <div className="mt-8 text-center">
                {canSpin ? (
                  <button
                    onClick={spinWheel}
                    disabled={spinning}
                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-ember-light/50 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {spinning ? 'Spinning...' : 'Spin Now! 🎉'}
                  </button>
                ) : (
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Come back in {timeUntilNextSpin} hours for your next spin!
                  </div>
                )}
              </div>

              {/* Result Display */}
              {result && !spinning && (
                <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-orange-500/20 to-ember-light/50/20 border-2 border-orange-500/50 text-center animate-bounce-in">
                  <div className="text-4xl mb-2">{result.icon}</div>
                  <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    You Won!
                  </h3>
                  <p className={`text-lg font-bold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                    {result.label.replace('\n', ' ')}
                  </p>
                  {result.type !== 'none' && (
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your reward will be applied automatically
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`py-4 px-6 text-center text-xs border-t ${
              darkMode ? 'border-gray-800 bg-gray-800/50 text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}>
              ✓ No purchase required • ✓ One spin per 24 hours • ✓ All prizes awarded instantly
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DailySpinWheel;
