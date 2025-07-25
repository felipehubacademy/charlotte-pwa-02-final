import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '@/lib/improved-audio-xp-service';
import { PWABadgeService } from '@/lib/pwa-badge-service';

interface AchievementNotificationProps {
  achievements: Achievement[];
  onDismiss: (achievementId: string) => void;
}

// Componente individual para cada achievement
const SingleAchievement: React.FC<{
  achievement: Achievement;
  delay: number;
  onDismiss: (id: string) => void;
}> = ({ achievement, delay, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar após delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      // Incrementar badge quando achievement aparece
      PWABadgeService.incrementBadge();
    }, delay);

    // Esconder após 4s do show
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      // Decrementar badge quando achievement sai
      const currentBadge = PWABadgeService.getBadgeCount();
      if (currentBadge > 0) {
        PWABadgeService.setBadge(currentBadge - 1);
      }
      setTimeout(() => onDismiss(achievement.id), 300); // Aguardar animação
    }, delay + 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [achievement, delay, onDismiss]);

  const getRarityColors = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'from-green-400 to-green-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-yellow-600';
      default: return 'from-green-400 to-green-600';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={achievement.id}
          initial={{ x: 350, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 350, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className={`
            max-w-sm bg-gradient-to-r ${getRarityColors(achievement.rarity)}
            backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl
            relative overflow-hidden mb-3
          `}
        >
          <div className="flex items-start space-x-3 relative z-10">
            <div className="text-2xl flex-shrink-0">{achievement.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm leading-tight">
                {achievement.title}
              </h3>
              <p className="text-white/90 text-xs mt-1 leading-tight">
                {achievement.description}
              </p>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievements,
  onDismiss
}) => {
  // Usar Set para evitar re-renderização de achievements já processados
  const [processedAchievements, setProcessedAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    // Adicionar apenas achievements novos
    const existingIds = new Set(processedAchievements.map(a => a.id));
    const newAchievements = achievements.filter(a => !existingIds.has(a.id));
    
    if (newAchievements.length > 0) {
      setProcessedAchievements(prev => [...prev, ...newAchievements]);
    }
  }, [achievements, processedAchievements]);

  const handleDismiss = (achievementId: string) => {
    // Remover do processedAchievements quando sair
    setProcessedAchievements(prev => prev.filter(a => a.id !== achievementId));
    onDismiss(achievementId);
  };

  return (
    <div className="fixed right-4 top-20 z-[70]">
      {processedAchievements.map((achievement, index) => (
        <SingleAchievement
          key={`${achievement.id}-${achievement.title}`} // Key única para evitar re-render
          achievement={achievement}
          delay={800 + (index * 1000)}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
};

export default AchievementNotification; 