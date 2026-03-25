import React from 'react';
import { View, Animated } from 'react-native';
import { AppText } from '@/components/ui/Text';
import { Achievement } from '@/lib/types/achievement';

interface AchievementNotificationProps {
  achievements: Achievement[];
  onDismiss: (achievementId: string) => void;
}

const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common: '#4ade80',    // green-400
  rare: '#60a5fa',      // blue-400
  epic: '#a855f7',      // purple-500
  legendary: '#facc15', // yellow-400
};

const SingleAchievement: React.FC<{
  achievement: Achievement;
  delay: number;
  onDismiss: (id: string) => void;
}> = ({ achievement, delay, onDismiss }) => {
  const translateX = React.useRef(new Animated.Value(350)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const showTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          stiffness: 200,
          damping: 25,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    const hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 350,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => onDismiss(achievement.id), 50);
      });
    }, delay + 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const color = RARITY_COLORS[achievement.rarity];

  return (
    <Animated.View
      style={{
        transform: [{ translateX }],
        opacity,
        marginBottom: 12,
      }}
    >
      <View
        style={{ borderLeftWidth: 3, borderLeftColor: color }}
        className="bg-surface rounded-2xl p-4 shadow-lg border border-white/20 max-w-xs"
      >
        <View className="flex-row items-start space-x-3">
          <AppText className="text-2xl">{achievement.icon}</AppText>
          <View className="flex-1">
            <AppText className="text-white font-bold text-sm leading-tight">
              {achievement.title}
            </AppText>
            <AppText className="text-white/80 text-xs mt-1 leading-tight">
              {achievement.description}
            </AppText>
            {achievement.xpBonus > 0 && (
              <View className="flex-row items-center mt-2 space-x-2">
                <AppText className="text-white/80 text-xs font-medium">
                  +{achievement.xpBonus} XP
                </AppText>
                <View className="px-2 py-0.5 bg-white/20 rounded-full">
                  <AppText className="text-white text-xs font-bold capitalize">
                    {achievement.rarity}
                  </AppText>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievements,
  onDismiss,
}) => {
  const [processed, setProcessed] = React.useState<Achievement[]>([]);

  React.useEffect(() => {
    const existingIds = new Set(processed.map(a => a.id));
    const newOnes = achievements.filter(a => !existingIds.has(a.id));
    if (newOnes.length > 0) {
      setProcessed(prev => [...prev, ...newOnes]);
    }
  }, [achievements]);

  const handleDismiss = (id: string) => {
    setProcessed(prev => prev.filter(a => a.id !== id));
    onDismiss(id);
  };

  if (processed.length === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        right: 16,
        top: 80,
        zIndex: 70,
      }}
      pointerEvents="none"
    >
      {processed.map((achievement, index) => (
        <SingleAchievement
          key={`${achievement.id}-${achievement.title}`}
          achievement={achievement}
          delay={800 + index * 1000}
          onDismiss={handleDismiss}
        />
      ))}
    </View>
  );
};

export default AchievementNotification;
