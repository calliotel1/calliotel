import React, { useState } from 'react';
import Lottie from 'lottie-react';
import { useTheme } from '../context/ThemeContext';
import { ArrowRight } from 'lucide-react';

const GlassmorphismCard = ({ title, description, features, lottieData, gradient, badge, ctaText, onCTAClick }) => {
  const { darkMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden rounded-3xl transition-all duration-500 ${
        isHovered ? 'scale-[1.02] rotate-[0.5deg]' : 'scale-100 rotate-0'
      }`}
      style={{
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
      }}
    >
      {/* Gradient Background Glow */}
      <div
        className={`absolute inset-0 opacity-20 transition-opacity duration-500 ${
          isHovered ? 'opacity-30' : 'opacity-20'
        }`}
        style={{
          background: `linear-gradient(135deg, ${gradient})`,
          filter: 'blur(40px)',
        }}
      />

      {/* Glass Card */}
      <div
        className={`relative p-8 h-full border transition-all duration-500 ${
          darkMode
            ? 'bg-white/5 border-white/10 hover:border-white/20'
            : 'bg-white/40 border-white/60 hover:border-white/80'
        }`}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isHovered
            ? '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Badge */}
        {badge && (
          <div className="absolute top-4 right-4">
            <span
              className="px-3 py-1 text-xs font-bold rounded-full"
              style={{
                background: `linear-gradient(135deg, ${gradient})`,
                color: 'white',
              }}
            >
              {badge}
            </span>
          </div>
        )}

        {/* Lottie Animation */}
        <div className="mb-6 flex items-center justify-center">
          <div
            className={`w-24 h-24 flex items-center justify-center rounded-2xl transition-all duration-500 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
            style={{
              background: `linear-gradient(135deg, ${gradient})`,
              boxShadow: isHovered
                ? `0 10px 40px rgba(${gradient.split(',')[0].match(/\d+/g)?.join(',')}, 0.4)`
                : `0 5px 20px rgba(${gradient.split(',')[0].match(/\d+/g)?.join(',')}, 0.2)`,
            }}
          >
            {lottieData && (
              <Lottie
                animationData={lottieData}
                loop={true}
                style={{ width: 60, height: 60 }}
              />
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          className={`text-2xl font-black mb-3 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className={`text-base mb-6 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {description}
        </p>

        {/* Features List */}
        {features && features.length > 0 && (
          <ul className="space-y-2 mb-6">
            {features.map((feature, index) => (
              <li
                key={index}
                className={`flex items-start text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                <span
                  className="mr-2 mt-0.5 flex-shrink-0"
                  style={{
                    color: gradient.split(',')[0].includes('rgb')
                      ? gradient.split(',')[0].split('(')[1]
                      : '#f97316',
                  }}
                >
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* CTA Button */}
        {ctaText && (
          <button
            onClick={onCTAClick}
            className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center space-x-2 group-hover:shadow-lg ${
              isHovered ? 'scale-105' : 'scale-100'
            }`}
            style={{
              background: `linear-gradient(135deg, ${gradient})`,
            }}
          >
            <span>{ctaText}</span>
            <ArrowRight
              className={`w-5 h-5 transition-transform duration-300 ${
                isHovered ? 'translate-x-1' : 'translate-x-0'
              }`}
            />
          </button>
        )}
      </div>

      {/* Bottom Shine Effect */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `linear-gradient(90deg, transparent, ${gradient.split(',')[0]}, transparent)`,
        }}
      />
    </div>
  );
};

export default GlassmorphismCard;
