import React from 'react';
import { motion } from 'framer-motion';

/**
 * PlantAnimation Component
 * Shows growing plant based on streak count
 * seed → sprout → young plant → growing plant → small tree → big tree → mighty tree → legendary
 */

const PlantAnimation = ({ streakCount, size = 'large' }) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-32 h-32',
    xlarge: 'w-48 h-48'
  };

  const plantStages = {
    seed: { emoji: '🌰', color: 'from-amber-900 to-amber-700', name: 'Seed' },
    sprout: { emoji: '🌱', color: 'from-green-400 to-green-600', name: 'Sprout' },
    seedling: { emoji: '🪴', color: 'from-green-500 to-green-700', name: 'Young Plant' },
    plant: { emoji: '🌿', color: 'from-green-600 to-emerald-600', name: 'Growing Plant' },
    bush: { emoji: '🌳', color: 'from-green-700 to-emerald-700', name: 'Small Tree' },
    tree: { emoji: '🌲', color: 'from-emerald-700 to-teal-700', name: 'Big Tree' },
    mighty_tree: { emoji: '🎄', color: 'from-teal-700 to-cyan-700', name: 'Mighty Tree' },
    legendary: { emoji: '🌴', color: 'from-yellow-500 via-orange-500 to-ember-light/50', name: 'Legendary Tree' }
  };

  const getStage = () => {
    if (streakCount === 0) return 'seed';
    if (streakCount <= 3) return 'sprout';
    if (streakCount <= 7) return 'seedling';
    if (streakCount <= 14) return 'plant';
    if (streakCount <= 30) return 'bush';
    if (streakCount <= 99) return 'tree';
    if (streakCount <= 364) return 'mighty_tree';
    return 'legendary';
  };

  const stage = getStage();
  const plant = plantStages[stage];

  return (
    <div className="flex flex-col items-center">
      {/* Plant Container */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          duration: 0.8
        }}
        className="relative"
      >
        {/* Glow Effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gradient-to-br ${plant.color} opacity-20 blur-xl animate-pulse`}></div>
        
        {/* Plant Circle Background */}
        <div className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br ${plant.color} flex items-center justify-center shadow-2xl overflow-hidden`}>
          {/* Sparkles for legendary */}
          {stage === 'legendary' && (
            <>
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2
                }}
                className="absolute top-2 right-2 text-yellow-300 text-xl"
              >
                ✨
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: 1
                }}
                className="absolute bottom-2 left-2 text-yellow-300 text-xl"
              >
                ✨
              </motion.div>
            </>
          )}
          
          {/* Plant Emoji */}
          <motion.span
            animate={{
              y: [0, -5, 0],
              rotate: [-2, 2, -2]
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut'
            }}
            className={`${
              size === 'small' ? 'text-3xl' :
              size === 'medium' ? 'text-5xl' :
              size === 'large' ? 'text-7xl' :
              'text-8xl'
            }`}
          >
            {plant.emoji}
          </motion.span>
        </div>
      </motion.div>

      {/* Plant Name & Streak Count */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center"
      >
        <p className="text-sm font-semibold text-gray-700">{plant.name}</p>
        <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-ember-light bg-clip-text text-transparent">
          {streakCount} {streakCount === 1 ? 'Day' : 'Days'}
        </p>
      </motion.div>
    </div>
  );
};

export default PlantAnimation;
