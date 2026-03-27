import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { X, Gift, Sparkles, PartyPopper } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BirthdayCelebrationPopup = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [birthdayStatus, setBirthdayStatus] = useState(null);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const checkBirthday = async () => {
      // Check if already shown today
      const shownToday = sessionStorage.getItem('birthday_popup_shown');
      if (shownToday) {
        setHasShown(true);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/birthdays/my-birthday-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.is_birthday) {
          setBirthdayStatus(response.data);
          setTimeout(() => setShow(true), 1000); // Show after 1 second
          sessionStorage.setItem('birthday_popup_shown', 'true');
        }
      } catch (error) {
        console.error('Error checking birthday:', error);
      }
    };

    if (user && !hasShown) {
      checkBirthday();
    }
  }, [user, hasShown]);

  const handleClose = () => {
    setShow(false);
  };

  if (!show || !birthdayStatus?.is_birthday) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 animate-fadeIn">
      {/* Confetti Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: ['#ff6b9d', '#c44569', '#ffa502', '#ff6348', '#5f27cd', '#00d2d3'][Math.floor(Math.random() * 6)]
              }}
            />
          </div>
        ))}
      </div>

      {/* Main Modal */}
      <div className="relative bg-gradient-to-br from-ember/50 via-ember to-ember-light rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/30 transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Sparkles Decoration */}
        <div className="absolute top-0 left-0 right-0 flex justify-around p-4 pointer-events-none">
          <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
          <Sparkles className="w-10 h-10 text-ember-light animate-pulse delay-100" />
          <Sparkles className="w-8 h-8 text-ember animate-pulse delay-200" />
        </div>

        {/* Content */}
        <div className="relative p-8 md:p-12 text-center text-white">
          {/* Balloons */}
          <div className="text-8xl mb-6 animate-bounce">
            🎈🎂🎈
          </div>

          {/* Main Message */}
          <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-slideDown">
            Happy Birthday!
          </h1>

          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-yellow-300 animate-slideDown delay-100">
            {user?.full_name || 'Amazing Friend'}! 🎉
          </h2>

          {/* Age Badge */}
          <div className="inline-block bg-white/20 backdrop-blur-md rounded-full px-8 py-4 mb-6 animate-pulse">
            <p className="text-2xl font-bold">
              You're turning <span className="text-4xl text-yellow-300">{birthdayStatus.age}</span> today!
            </p>
          </div>

          {/* Birthday Wishes */}
          <div className="max-w-lg mx-auto mb-8">
            <p className="text-xl md:text-2xl leading-relaxed animate-fadeIn delay-200">
              ✨ May this special day bring you endless joy, wonderful surprises, and unforgettable memories! ✨
            </p>
          </div>

          {/* Discount Badge */}
          {birthdayStatus.has_discount && (
            <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 shadow-2xl mb-8 animate-scaleIn delay-300">
              <div className="absolute -top-3 -right-3">
                <div className="bg-red-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold animate-spin-slow">
                  🎁
                </div>
              </div>
              <Gift className="w-12 h-12 mx-auto mb-3 text-white animate-bounce" />
              <p className="text-3xl font-bold text-white mb-2">
                {birthdayStatus.discount_percentage}% OFF
              </p>
              <p className="text-lg text-white/90">
                Your birthday gift from us! 🎊
              </p>
              <p className="text-sm text-white/80 mt-2">
                Valid for 24 hours • Auto-applied to all purchases
              </p>
            </div>
          )}

          {/* Celebration Icons */}
          <div className="flex justify-center space-x-6 mb-8 text-6xl">
            <span className="animate-bounce delay-100">🎊</span>
            <span className="animate-bounce delay-200">🎉</span>
            <span className="animate-bounce delay-300">🎈</span>
            <span className="animate-bounce delay-400">🎁</span>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleClose}
            className="bg-white text-ember font-bold text-xl px-10 py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-pulse"
          >
            <PartyPopper className="w-6 h-6 inline mr-2" />
            Let's Celebrate! 🎉
          </button>

          {/* Footer Message */}
          <p className="mt-8 text-lg text-white/80">
            💜 With love from Team Calliotel & G & A Group 💜
          </p>
        </div>

        {/* Bottom Decoration */}
        <div className="bg-white/10 backdrop-blur-sm py-4 px-8">
          <div className="flex justify-center space-x-4 text-4xl animate-bounce">
            🎂 🍰 🧁 🎂
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            transform: scale(0.5);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-slideDown {
          animation: slideDown 0.6s ease-out;
        }
        
        .animate-confetti {
          animation: confetti linear infinite;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
};

export default BirthdayCelebrationPopup;
