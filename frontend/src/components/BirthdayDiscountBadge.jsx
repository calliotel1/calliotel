import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Gift, Sparkles } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BirthdayDiscountBadge = ({ className = '' }) => {
  const { user } = useAuth();
  const [birthdayStatus, setBirthdayStatus] = useState(null);

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

  if (!birthdayStatus?.is_birthday || !birthdayStatus?.has_discount) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Animated Discount Badge */}
      <div className="bg-gradient-to-r from-ember/50 via-ember to-orange-500 text-white rounded-xl p-4 shadow-lg animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <div className="flex-1">
            <p className="text-sm opacity-90">🎂 Birthday Special!</p>
            <p className="text-2xl font-bold">
              {birthdayStatus.discount_percentage}% OFF
            </p>
            <p className="text-xs opacity-80">Applied automatically today</p>
          </div>
          <Sparkles className="w-8 h-8 animate-spin-slow" />
        </div>
      </div>

      {/* Confetti effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-float"></div>
        <div className="absolute top-0 left-3/4 w-2 h-2 bg-ember-300 rounded-full animate-float delay-100"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-olive-300 rounded-full animate-float delay-200"></div>
      </div>
    </div>
  );
};

export default BirthdayDiscountBadge;
