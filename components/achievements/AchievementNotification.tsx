import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '@/lib/improved-audio-xp-service';

interface AchievementNotificationProps {
  achievements: Achievement[];
  onDismiss: (achievementId: string) => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievements,
  onDismiss
}) => {
  const [visibleAchievements, setVisibleAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    // Mostrar achievements um por vez com delay
    achievements.forEach((achievement, index) => {
      setTimeout(() => {
        setVisibleAchievements(prev => [...prev, achievement]);
        
        // Auto-dismiss após 2.5s
        setTimeout(() => {
          setVisibleAchievements(prev => prev.filter(a => a.id !== achievement.id));
          onDismiss(achievement.id);
        }, 2500);
      }, index * 500); // 500ms delay entre achievements
    });
  }, [achievements, onDismiss]);

  const getRarityColors = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'from-green-400 to-green-600';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'legendary':
        return 'from-yellow-400 to-yellow-600';
      default:
        return 'from-green-400 to-green-600';
    }
  };

  const getRarityParticles = (rarity: Achievement['rarity']) => {
    return rarity === 'epic' || rarity === 'legendary';
  };

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2">
      <AnimatePresence>
        {visibleAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ x: 300, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 300, opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.5 
            }}
            className={`
              max-w-sm bg-gradient-to-r ${getRarityColors(achievement.rarity)}
              backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl
              relative overflow-hidden
            `}
          >
            {/* Partículas para epic/legendary */}
            {getRarityParticles(achievement.rarity) && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/60 rounded-full"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                    }}
                    animate={{
                      y: [-10, -20, -10],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="flex items-start space-x-3 relative z-10">
              {/* Icon */}
              <motion.div
                className="text-2xl flex-shrink-0"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 0.6,
                  repeat: achievement.rarity === 'legendary' ? Infinity : 0,
                  repeatDelay: 1
                }}
              >
                {achievement.icon}
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm leading-tight">
                  {achievement.title}
                </h3>
                <p className="text-white/90 text-xs mt-1 leading-tight">
                  {achievement.description}
                </p>
                
                {/* XP Bonus */}
                {achievement.xpBonus > 0 && (
                  <div className="flex items-center mt-2">
                    <span className="text-white/80 text-xs font-medium">
                      +{achievement.xpBonus} XP
                    </span>
                    <div className="ml-2 px-2 py-0.5 bg-white/20 rounded-full">
                      <span className="text-white text-xs font-bold capitalize">
                        {achievement.rarity}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Glow effect para legendary */}
            {achievement.rarity === 'legendary' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-2xl"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AchievementNotification; 