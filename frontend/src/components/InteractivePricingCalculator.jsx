import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingDown, ShoppingCart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const InteractivePricingCalculator = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(10);

  // Pricing tiers with bulk discounts
  const getPricePerNumber = (qty) => {
    if (qty >= 31) return 1.49; // 50% off
    if (qty >= 16) return 1.99; // 33% off
    if (qty >= 6) return 2.49;  // 17% off
    return 2.99; // Regular price
  };

  const regularPrice = 2.99;
  const pricePerNumber = getPricePerNumber(quantity);
  const totalCost = (pricePerNumber * quantity).toFixed(2);
  const totalSavings = ((regularPrice - pricePerNumber) * quantity).toFixed(2);
  const discountPercentage = Math.round(((regularPrice - pricePerNumber) / regularPrice) * 100);

  const pricingTiers = [
    { min: 1, max: 5, price: 2.99, discount: 0, label: 'Starter' },
    { min: 6, max: 15, price: 2.49, discount: 17, label: 'Growth' },
    { min: 16, max: 30, price: 1.99, discount: 33, label: 'Business' },
    { min: 31, max: 50, price: 1.49, discount: 50, label: 'Enterprise' }
  ];

  const getCurrentTier = () => {
    return pricingTiers.find(tier => quantity >= tier.min && quantity <= tier.max);
  };

  const currentTier = getCurrentTier();

  return (
    <div className={`py-24 relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                darkMode
                  ? 'bg-gradient-to-r from-ember/20 to-orange-500/20 text-ember'
                  : 'bg-gradient-to-r from-ember/10 to-orange-100 text-ember-700'
              }`}
            >
              💰 VOLUME DISCOUNTS
            </span>
          </div>
          <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Save More With Bulk Pricing
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            The more numbers you need, the less you pay. Calculate your savings instantly.
          </p>
        </div>

        {/* Calculator Card */}
        <div
          className={`max-w-4xl mx-auto p-8 md:p-12 rounded-3xl border-2 ${
            darkMode
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/80 border-gray-200'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Current Tier Badge */}
          {currentTier && (
            <div className="flex justify-center mb-8">
              <div className={`px-6 py-3 rounded-full bg-gradient-to-r from-ember to-orange-500 text-white font-bold text-lg shadow-lg`}>
                <Sparkles className="inline w-5 h-5 mr-2" />
                {currentTier.label} Tier
                {currentTier.discount > 0 && <span className="ml-2">• {currentTier.discount}% OFF</span>}
              </div>
            </div>
          )}

          {/* Quantity Display */}
          <div className="text-center mb-8">
            <div className={`text-7xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {quantity}
            </div>
            <div className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Virtual Numbers
            </div>
          </div>

          {/* Slider */}
          <div className="mb-12">
            <input
              type="range"
              min="1"
              max="50"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #A855F7 0%, #F97316 ${(quantity / 50) * 100}%, ${darkMode ? '#374151' : '#E5E7EB'} ${(quantity / 50) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-2">
              <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>1</span>
              <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>50+</span>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Price Per Number */}
            <div className="text-center">
              <div className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Price Per Number
              </div>
              <div className="flex items-center justify-center space-x-2">
                {discountPercentage > 0 && (
                  <span className={`text-2xl line-through ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    ${regularPrice}
                  </span>
                )}
                <span className={`text-4xl font-black bg-gradient-to-r from-ember to-orange-500 bg-clip-text text-transparent`}>
                  ${pricePerNumber}
                </span>
              </div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                per month
              </div>
            </div>

            {/* Total Cost */}
            <div className="text-center">
              <div className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Monthly Cost
              </div>
              <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ${totalCost}
              </div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                billed monthly
              </div>
            </div>

            {/* Savings */}
            <div className="text-center">
              <div className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                You Save
              </div>
              <div className="flex items-center justify-center space-x-2">
                <TrendingDown className="w-6 h-6 text-green-500" />
                <span className="text-4xl font-black text-green-500">
                  ${totalSavings}
                </span>
              </div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                per month
              </div>
            </div>
          </div>

          {/* Pricing Tiers Table */}
          <div className={`p-6 rounded-2xl mb-8 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`text-center p-4 rounded-xl transition-all ${
                    quantity >= tier.min && quantity <= tier.max
                      ? 'bg-gradient-to-br from-ember to-orange-500 text-white scale-105'
                      : darkMode
                      ? 'bg-gray-800/50 text-gray-400'
                      : 'bg-white text-gray-600'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{tier.label}</div>
                  <div className="text-xs mb-2">{tier.min}-{tier.max} numbers</div>
                  <div className="text-lg font-black">${tier.price}</div>
                  {tier.discount > 0 && (
                    <div className="text-xs mt-1">{tier.discount}% OFF</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/browse-numbers')}
            className="w-full py-4 px-8 bg-gradient-to-r from-ember to-orange-600 text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-6 h-6" />
            <span>Get Started with {quantity} Numbers</span>
          </button>

          {/* Trust Indicators */}
          <div className={`text-center mt-6 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            ✓ Instant activation • ✓ No setup fees • ✓ Cancel anytime
          </div>
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-12">
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            🏢 Need 50+ numbers? <span className="text-ember font-semibold cursor-pointer hover:underline" onClick={() => navigate('/help')}>Contact us</span> for enterprise pricing
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractivePricingCalculator;
