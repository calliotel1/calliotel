import React from 'react';
import { useTheme } from '../context/ThemeContext';

const BentoBox = ({ 
  size = 'medium', 
  children, 
  className = '',
  gradient = null,
  glow = false,
  onClick = null
}) => {
  const { darkMode } = useTheme();
  
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 row-span-1 md:col-span-2',
    large: 'col-span-1 row-span-2 md:col-span-2 md:row-span-2',
    wide: 'col-span-1 md:col-span-3'
  };

  return (
    <div
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        relative
        rounded-3xl
        border
        transition-all
        duration-300
        overflow-hidden
        ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
        ${darkMode 
          ? 'bg-gray-800/50 border-white/10 hover:border-white/20' 
          : 'bg-white/80 border-gray-200/60 hover:border-gray-300'
        }
        ${className}
      `}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: glow && gradient
          ? `0 8px 32px ${gradient}20, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          : 'none'
      }}
    >
      {/* Gradient Glow Effect */}
      {gradient && (
        <div
          className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${gradient})`,
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
      
      {/* Bottom Shine */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-50"
        style={{
          background: gradient
            ? `linear-gradient(90deg, transparent, ${gradient.split(',')[0]}, transparent)`
            : 'transparent'
        }}
      />
    </div>
  );
};

export default BentoBox;
