import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Gift, Sparkles, X } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BirthdayBanner = () => {
  const { user } = useAuth();
  const [birthdayStatus, setBirthdayStatus] = useState(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const fetchBirthdayStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/birthdays/my-birthday-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBirthdayStatus(response.data);
      } catch (error) {
        console.error('Error fetching birthday status:', error);
      }
    };

    if (user) {
      fetchBirthdayStatus();
    }
  }, [user]);

  if (!birthdayStatus?.is_birthday || !show) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-ember/50 via-ember to-orange-500 text-white rounded-xl p-6 mb-6 shadow-2xl overflow-hidden">
      {/* Animated background sparkles */}
      <div className="absolute inset-0 opacity-20">
        <Sparkles className="absolute top-4 left-4 w-6 h-6 animate-pulse" />
        <Sparkles className="absolute top-8 right-12 w-4 h-4 animate-pulse delay-100" />
        <Sparkles className="absolute bottom-6 left-16 w-5 h-5 animate-pulse delay-200" />
        <Sparkles className="absolute bottom-4 right-8 w-6 h-6 animate-pulse delay-300" />
      </div>

      {/* Close button */}
      <button
        onClick={() => setShow(false)}
        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="relative z-10 flex items-center space-x-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
          <Gift className="w-12 h-12 text-white animate-bounce" />
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-2">
            🎉 Happy Birthday, {user?.full_name || 'Friend'}! 🎂
          </h2>
          <p className="text-lg opacity-90 mb-3">
            You're turning {birthdayStatus.age} today! Enjoy your special day! ✨
          </p>
          
          {birthdayStatus.has_discount && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 inline-block">
              <p className="font-bold text-xl flex items-center space-x-2">
                <Gift className="w-6 h-6" />
                <span>🎁 {birthdayStatus.discount_percentage}% OFF Today Only!</span>
              </p>
              <p className="text-sm opacity-90 mt-1">
                Your birthday discount is automatically applied to all purchases today
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-2 -right-2 text-white/10 text-9xl font-bold">
        🎂
      </div>
    </div>
  );
};

export default BirthdayBanner;
