import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

/**
 * KineticText - Animated text component with scroll-based effects
 * 
 * @param {string} children - Text to animate
 * @param {string} variant - Animation type: 'weight' | 'scale' | 'fade' | 'slide'
 * @param {string} className - Additional CSS classes
 * @param {string} as - HTML element type (default: 'span')
 */
export const KineticText = ({ 
  children, 
  variant = 'weight',
  className = '',
  as = 'span'
}) => {
  const MotionComponent = motion[as];

  // Fade variant
  if (variant === 'fade') {
    return (
      <MotionComponent
        className={className}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </MotionComponent>
    );
  }

  // Scale variant
  if (variant === 'scale') {
    return (
      <MotionComponent
        className={className}
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </MotionComponent>
    );
  }

  // Slide variant
  if (variant === 'slide') {
    return (
      <MotionComponent
        className={className}
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </MotionComponent>
    );
  }

  // Weight variant (default) - subtle emphasis
  return (
    <MotionComponent
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </MotionComponent>
  );
};

/**
 * KineticWord - Animates text word by word
 * 
 * @param {string} text - Text to animate
 * @param {string} className - CSS classes
 * @param {number} stagger - Delay between words (default: 0.1s)
 */
export const KineticWord = ({ text, className = '', stagger = 0.1 }) => {
  const words = text.split(' ');

  return (
    <span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            delay: index * stagger,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          {word}
          {index < words.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </span>
  );
};

/**
 * KineticHeading - Advanced heading with multiple effects
 * 
 * @param {object} props - Component props
 * @param {string} props.children - Heading text
 * @param {string} props.gradient - Gradient text (will be highlighted)
 * @param {string} props.className - CSS classes
 * @param {string} props.size - Size preset: 'hero' | 'section' | 'subsection'
 */
export const KineticHeading = ({ 
  children,
  gradient = null,
  className = '',
  size = 'hero'
}) => {
  const { darkMode } = useTheme();

  const sizeClasses = {
    hero: 'text-4xl sm:text-5xl lg:text-6xl',
    section: 'text-3xl sm:text-4xl lg:text-5xl',
    subsection: 'text-2xl sm:text-3xl lg:text-4xl'
  };

  // If gradient text is specified, split the heading
  if (gradient) {
    const parts = children.split(gradient);
    
    return (
      <motion.h2
        className={`${sizeClasses[size]} font-black ${className} ${darkMode ? 'text-white' : 'text-gray-900'}`}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {parts[0]}
        <motion.span
          className="bg-gradient-to-r from-orange-500 via-ember to-cyan-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ 
            duration: 0.8,
            delay: 0.2,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          {gradient}
        </motion.span>
        {parts[1]}
      </motion.h2>
    );
  }

  // Standard animated heading
  return (
    <motion.h2
      className={`${sizeClasses[size]} font-black ${className} ${darkMode ? 'text-white' : 'text-gray-900'}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.h2>
  );
};

/**
 * KineticContainer - Animated container with stagger children
 * 
 * @param {object} props - Component props
 */
export const KineticContainer = ({ children, className = '', stagger = 0.1 }) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: stagger
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * KineticItem - Child item for KineticContainer
 */
export const KineticItem = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * KineticParallax - Scroll-based parallax effect
 * 
 * @param {object} props - Component props
 * @param {number} props.offset - Parallax intensity (default: 50)
 */
export const KineticParallax = ({ children, className = '', offset = 50 }) => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, offset]);

  return (
    <motion.div className={className} style={{ y }}>
      {children}
    </motion.div>
  );
};

/**
 * KineticButton - Animated button with hover effects
 */
export const KineticButton = ({ children, className = '', onClick, ...props }) => {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default {
  KineticText,
  KineticWord,
  KineticHeading,
  KineticContainer,
  KineticItem,
  KineticParallax,
  KineticButton
};
