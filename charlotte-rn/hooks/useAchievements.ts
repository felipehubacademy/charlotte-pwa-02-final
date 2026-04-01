/**
 * useAchievements
 *
 * Subscribes to Supabase Realtime on charlotte.user_achievements.
 * - On mount: loads existing achievement IDs so we never re-show them.
 * - On INSERT: maps new rows to Achievement objects and queues them for display.
 * - Returns pendingAchievements + dismissAchievement for use with AchievementNotification.
 */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Achievement } from '@/lib/types/achievement';

export function useAchievements(userId: string | undefined) {
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const knownIdsRef    = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    // Load existing achievement IDs so mount doesn't re-show them
    supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) data.forEach(row => knownIdsRef.current.add(row.id));
        initializedRef.current = true;
      });

    // Subscribe to new rows via Realtime
    const channel = supabase
      .channel(`achievements:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'charlotte',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!initializedRef.current) return;
          const row = payload.new as Record<string, any>;
          if (knownIdsRef.current.has(row.id)) return;
          knownIdsRef.current.add(row.id);

          const achievement: Achievement = {
            id:          row.id,
            type:        row.achievement_type ?? 'general',
            title:       row.achievement_name ?? 'Achievement Unlocked',
            description: row.achievement_description ?? '',
            xpBonus:     row.xp_bonus ?? 0,
            rarity:      (row.rarity as Achievement['rarity']) ?? 'common',
            icon:        row.badge_icon ?? '🏆',
            earnedAt:    new Date(row.earned_at),
          };

          setPendingAchievements(prev => [...prev, achievement]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const dismissAchievement = (id: string) => {
    setPendingAchievements(prev => prev.filter(a => a.id !== id));
  };

  return { pendingAchievements, dismissAchievement };
}
