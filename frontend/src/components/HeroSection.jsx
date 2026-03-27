import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KineticHeading, KineticText } from './KineticTypography';

const HeroSection = () => {
  const navigate = useNavigate();
  const [showSlogan, setShowSlogan] = useState(true);

  useEffect(() => {
    // Hide slogan after animation completes (10 seconds)
    const timer = setTimeout(() => {
      setShowSlogan(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[500px] bg-obsidian overflow-hidden border-b border-ember/20">
      {/* Animated Falling Slogan - Confetti Style - RESPONSIVE FIX */}
      {showSlogan && (
        <div className="absolute inset-0 flex items-start justify-center pt-8 sm:pt-12 md:pt-16 z-50 pointer-events-none">
          <div className="falling-slogan text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center px-4 animate-fall-and-fade slogan-glow max-w-4xl">
            We don't follow the norm, we create it
          </div>
        </div>
      )}

      {/* Animated Background Elements - OBSIDIAN & EMBER */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-ember/10 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-ember/15 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-ember/20 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 z-10">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* Left Side - Anime GUY with Call (SWAPPED) - BACKGROUND REMOVED */}
          <div className="relative flex justify-center lg:justify-start">
            <div className="relative animate-float animation-delay-1000">
              <img 
                src="https://static.prod-images.emergentagent.com/jobs/5583c0f6-ff48-4551-ac03-c80f7e70e692/images/497d4ea7b4d7793efe6f92491d1398bb586d2a6c0980aae227f2558bdd370b22.png"
                alt="Guy making phone call"
                className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 h-auto drop-shadow-2xl mix-blend-normal"
                style={{ 
                  filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))',
                  imageRendering: '-webkit-optimize-contrast',
                  WebkitFilter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))'
                }}
              />
              {/* Call Bubble Animation */}
              <div className="absolute -top-8 -right-8 animate-bounce-slow animation-delay-500">
                <div className="bg-white rounded-2xl shadow-2xl p-4 relative call-pulse">
                  <div className="absolute -bottom-3 left-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white"></div>
                  <div className="text-ember font-semibold text-sm mb-1">📞 International Call</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-ember rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(199,78,30,0.4)]">
                      <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <div className="text-gray-700 text-xs font-medium">🇬🇧 London - $0.02/min</div>
                      <div className="text-gray-400 text-xs">Crystal clear quality</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Main Content */}
          <div className="text-center z-20">
            {/* Epic Fiery Logo - CSS-BASED SOLID LOGO - MAXIMUM VISIBILITY */}
            <div className="flex justify-center mb-6 relative">
              <div className="relative animate-float-logo">
                {/* EMBER GLOW HALO */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 140, 50, 0.4) 0%, rgba(199, 78, 30, 0.3) 50%, transparent 70%)',
                    transform: 'scale(1.8)',
                    zIndex: -1,
                    boxShadow: `
                      0 0 80px rgba(255, 140, 50, 0.7),
                      0 0 120px rgba(199, 78, 30, 0.5)
                    `,
                    animation: 'pulse-glow 2.5s ease-in-out infinite'
                  }}
                ></div>
                
                {/* SOLID EMBER CIRCLE LOGO with ICON */}
                <div 
                  className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FF8C32 0%, #C74E1E 50%, #A63F18 100%)',
                    boxShadow: `
                      0 0 40px rgba(255, 140, 50, 0.8),
                      0 0 60px rgba(199, 78, 30, 0.6),
                      inset 0 0 30px rgba(255, 200, 100, 0.3)
                    `,
                    border: '4px solid rgba(255, 255, 255, 0.2)',
                    zIndex: 2
                  }}
                >
                  {/* Phone Icon - GUARANTEED VISIBLE */}
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="white" 
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                    }}
                  >
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4 sm:space-y-6">
            <KineticHeading 
              size="hero" 
              className="font-extrabold text-white leading-tight px-2"
            >
              Virtual Phone Solutions
            </KineticHeading>
            </div>
            
            <KineticText variant="fade" as="p" className="text-sm sm:text-base md:text-lg text-ember-100 max-w-2xl mx-auto px-4 mt-4">
              Connect Worldwide with Premium Virtual Numbers for Business & Personal Use
            </KineticText>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Secure</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Instant Setup</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">150+ Countries</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button
                onClick={() => navigate('/signup')}
                className="group bg-ember hover:bg-ember-light text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_40px_rgba(199,78,30,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 animate-pulse-glow"
              >
                GET STARTED
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/30 transition-all duration-300"
              >
                VIEW PLANS
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 justify-center text-white/80 text-sm mt-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>No Contracts</span>
              </div>
            </div>
          </div>

          {/* Right Side - Anime GIRL with SMS (SWAPPED) - BACKGROUND REMOVED */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative animate-float">
              <img 
                src="https://static.prod-images.emergentagent.com/jobs/5583c0f6-ff48-4551-ac03-c80f7e70e692/images/9a9a79bb5c6774eb4923ee32ad2c94dbd4ceae11648b788ce3676e52c7914290.png"
                alt="Girl using SMS"
                className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 h-auto drop-shadow-2xl mix-blend-normal"
                style={{ 
                  filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))',
                  imageRendering: '-webkit-optimize-contrast',
                  WebkitFilter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))'
                }}
              />
              {/* SMS Bubble Animation */}
              <div className="absolute -top-8 -left-8 animate-bounce-slow">
                <div className="bg-white rounded-2xl shadow-2xl p-4 relative notification-ping">
                  <div className="absolute -bottom-3 right-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white"></div>
                  <div className="text-ember font-semibold text-sm mb-1">📱 New SMS</div>
                  <div className="text-gray-700 text-xs font-medium">Just got my perfect number! 🎉</div>
                  <div className="text-gray-400 text-xs mt-1">Just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-scroll"></div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
