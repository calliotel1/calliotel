import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFire, FaTimes, FaArrowRight, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa';

const SMMGrandOpeningBanner = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('smm_banner_dismissed');
    const dismissedDate = localStorage.getItem('smm_banner_dismissed_date');
    const today = new Date().toDateString();

    // Show banner if not dismissed today
    if (!dismissed || dismissedDate !== today) {
      // Delay banner to ensure page is settled
      setTimeout(() => {
        setIsVisible(true);
      }, 2000); // 2 seconds delay
    }
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('smm_banner_dismissed', 'true');
      localStorage.setItem('smm_banner_dismissed_date', new Date().toDateString());
    }, 300);
  };

  const handleExplore = () => {
    navigate('/smm-marketplace');
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-24 left-0 right-0 z-[9999] px-4 transition-all duration-300 pointer-events-none ${
        isClosing ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="relative bg-gradient-to-r from-[#2a2a1f] via-black to-[#2a2a1f] border-2 border-[#C74E1E] rounded-xl p-6 shadow-2xl backdrop-blur-sm">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close banner"
          >
            <FaTimes className="text-xl" />
          </button>

          {/* Banner Content */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Announcement */}
            <div className="flex-1 text-center md:text-left">
              {/* "NEW" Badge */}
              <div className="inline-flex items-center gap-2 bg-[#C74E1E] text-white px-4 py-1 rounded-full text-xs font-bold mb-3 animate-pulse">
                <FaFire className="animate-bounce" />
                NEW EMPIRE FEATURE
              </div>

              {/* Headline */}
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                <span className="text-[#C74E1E]">Social Growth</span> Arsenal Unlocked
              </h2>

              {/* Subheadline */}
              <p className="text-gray-300 text-base md:text-lg mb-4">
                Boost your Instagram, TikTok & YouTube presence with <span className="text-[#C74E1E] font-bold">7,236 premium services</span>. 
                Same wallet, same dashboard, infinite growth.
              </p>

              {/* Value Props */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <FaInstagram className="text-pink-500" />
                  <span>Instagram</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaTiktok className="text-black bg-white rounded-full p-0.5" />
                  <span>TikTok</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaYoutube className="text-red-500" />
                  <span>YouTube</span>
                </div>
                <div className="text-[#C74E1E] font-bold">
                  + 4 More Platforms
                </div>
              </div>
            </div>

            {/* Right: CTA + Stats */}
            <div className="flex flex-col items-center gap-4">
              {/* Stats Box */}
              <div className="bg-black/50 border border-[#C74E1E]/30 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">Available Services</p>
                <p className="text-4xl font-bold text-[#C74E1E]">7,236</p>
                <p className="text-gray-400 text-xs mt-1">Instant Activation</p>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleExplore}
                className="group relative bg-gradient-to-r from-[#C74E1E] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#C74E1E] text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-[0_0_30px_rgba(199,78,30,0.8)] transition-all duration-300 flex items-center gap-3"
              >
                <FaFire className="text-2xl group-hover:animate-bounce" />
                <span className="text-lg">Explore Social Growth</span>
                <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>

              {/* Trust Badge */}
              <p className="text-xs text-gray-400">
                💎 <span className="text-[#C74E1E] font-semibold">Unified Wallet</span> · Instant Deployment
              </p>
            </div>
          </div>

          {/* Bottom Accent Line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C74E1E] to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default SMMGrandOpeningBanner;
