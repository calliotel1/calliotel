import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Crown, Star, Award, Sparkles, ArrowLeft, Filter, TrendingUp } from 'lucide-react';
import axios from 'axios';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PremiumNumbersPage = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [premiumNumbers, setPremiumNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState(null);
  const [stats, setStats] = useState({ platinum: 0, gold: 0, silver: 0, total: 0 });

  useEffect(() => {
    fetchPremiumNumbers();
  }, [filterTier]);

  const fetchPremiumNumbers = async () => {
    try {
      setLoading(true);
      const params = filterTier ? `?tier=${filterTier}` : '';
      const response = await axios.get(`${API}/premium-numbers${params}`);
      
      setPremiumNumbers(response.data.numbers);
      setStats({
        platinum: response.data.platinum_count,
        gold: response.data.gold_count,
        silver: response.data.silver_count,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching premium numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserveNumber = async (phoneNumber, price) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!window.confirm(`Reserve this premium number for $${price}?`)) {
      return;
    }

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/premium-numbers/${encodeURIComponent(phoneNumber)}/reserve`,
        { user_id: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Premium number reserved successfully!');
      navigate('/numbers');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to reserve number');
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'platinum': return <Crown className="w-5 h-5" />;
      case 'gold': return <Star className="w-5 h-5" />;
      case 'silver': return <Award className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTierGradient = (tier) => {
    switch (tier) {
      case 'platinum': return 'from-ember to-ember-light';
      case 'gold': return 'from-yellow-500 to-orange-500';
      case 'silver': return 'from-gray-400 to-gray-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-black'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-black'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Premium Boutique
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    VIP Gold Numbers Collection
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner */}
        <div className="mb-8 p-8 rounded-2xl bg-gradient-to-r from-yellow-500 via-orange-500 to-ember-light/50 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-3">
              <Crown className="w-8 h-8" />
              <h2 className="text-3xl font-black">Exclusive Premium Numbers</h2>
            </div>
            <p className="text-lg text-white/90 mb-4">
              Easy-to-remember numbers for brands, businesses, and crypto professionals. High-value assets priced $25-$100.
            </p>
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-3xl font-black">{stats.total}</div>
                <div className="text-sm text-white/80">Premium Numbers</div>
              </div>
              <div>
                <div className="text-3xl font-black">{stats.platinum}</div>
                <div className="text-sm text-white/80">Platinum Tier</div>
              </div>
              <div>
                <div className="text-3xl font-black">{stats.gold}</div>
                <div className="text-sm text-white/80">Gold Tier</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center space-x-4">
          <Filter className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <button
            onClick={() => setFilterTier(null)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterTier === null
                ? 'bg-gradient-to-r from-orange-500 to-ember-light text-white'
                : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilterTier('platinum')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterTier === 'platinum'
                ? 'bg-gradient-to-r from-ember to-ember-light text-white'
                : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Crown className="w-4 h-4 inline mr-2" />
            Platinum ({stats.platinum})
          </button>
          <button
            onClick={() => setFilterTier('gold')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterTier === 'gold'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            Gold ({stats.gold})
          </button>
          <button
            onClick={() => setFilterTier('silver')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterTier === 'silver'
                ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Silver ({stats.silver})
          </button>
        </div>

        {/* Premium Numbers Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading premium numbers...
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumNumbers.map((number, index) => (
              <div
                key={index}
                className={`${darkMode ? 'bg-gray-800' : 'bg-gray-900'} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border-2 ${
                  number.tier === 'platinum' ? 'border-ember' :
                  number.tier === 'gold' ? 'border-yellow-500' :
                  'border-gray-700'
                }`}
              >
                {/* Tier Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${getTierGradient(number.tier)}`}>
                    {getTierIcon(number.tier)}
                    <span className="text-white text-xs font-bold uppercase">{number.tier}</span>
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {number.country}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="mb-4">
                  <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    {number.phone_number}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {number.patterns.map((pattern, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black bg-gradient-to-r from-orange-500 to-ember-light bg-clip-text text-transparent">
                      ${number.price}
                    </span>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      one-time
                    </span>
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    + ${number.monthly_cost}/mo service
                  </div>
                </div>

                {/* Reserve Button */}
                <button
                  onClick={() => handleReserveNumber(number.phone_number, number.price)}
                  className={`w-full py-3 rounded-xl font-bold transition-all bg-gradient-to-r ${getTierGradient(number.tier)} text-white hover:shadow-lg hover:scale-105`}
                >
                  Reserve Now
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && premiumNumbers.length === 0 && (
          <div className={`text-center py-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-900'} rounded-2xl`}>
            <Crown className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No premium numbers in this tier
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Try selecting a different tier or check back soon!
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PremiumNumbersPage;
