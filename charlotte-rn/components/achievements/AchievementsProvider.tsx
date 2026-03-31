/**
 * AchievementsProvider
 *
 * Sits above all app screens (inside AppLayout) and renders the
 * AchievementNotification overlay whenever a new achievement is earned.
 *
 * Internally uses useAchievements() which subscribes to Supabase Realtime
 * on the user_achievements table. New rows trigger animated toast notifications
 * in the top-right corner.
 */
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAchievements } from '@/hooks/useAchievements';
import AchievementNotification from './AchievementNotification';

interface AchievementsProviderProps {
  children: React.ReactNode;
}

export function AchievementsProvider({ children }: AchievementsProviderProps) {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { pendingAchievements, dismissAchievement } = useAchievements(userId);

  return (
    <>
      {children}
      <AchievementNotification
        achievements={pendingAchievements}
        onDismiss={dismissAchievement}
      />
    </>
  );
}
