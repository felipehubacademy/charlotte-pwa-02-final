import { supabase } from './supabase';

// ── Curriculum totals (counted from curriculum.ts) ──────────────────────────
// Novice:   50 topics × 10 grammar × 10 XP = 5000 XP max
// Inter:    70 topics × (10 grammar × 10 XP + 5 pronun × 15 XP) = 12250 XP max
// Advanced: 40 topics × (5 grammar × 10 XP + 10 pronun × 15 XP) = 8000 XP max

export const TOTAL_TOPICS_PER_LEVEL: Record<string, number> = {
  Novice:   50,
  Inter:    70,
  Advanced: 40,
};

export const MAX_LEARN_XP_PER_LEVEL: Record<string, number> = {
  Novice:   5000,
  Inter:    12250,
  Advanced: 8000,
};

export const PROMOTION_XP_THRESHOLD: Record<string, number> = {
  Novice:   Math.round(5000   * 0.80),   // 4000
  Inter:    Math.round(12250  * 0.80),   // 9800
  Advanced: Math.round(8000   * 0.80),   // 6400 (no promotion from Advanced)
};

export const NEXT_LEVEL: Record<string, string | null> = {
  Novice:   'Inter',
  Inter:    'Advanced',
  Advanced: null,
};

export interface PromotionStatus {
  eligible: boolean;
  trailComplete: boolean;
  learnXP: number;
  learnXPThreshold: number;
  completedTopics: number;
  totalTopics: number;
  nextLevel: string | null;
}

/**
 * Checks if a user is eligible for level promotion.
 * Condition A: all topics in current level completed.
 * Condition B: XP earned from learn_exercises in this level >= 80% of max.
 */
export async function checkLevelPromotion(
  userId: string,
  currentLevel: string,
  completedTopicsCount: number,
): Promise<PromotionStatus> {
  const totalTopics    = TOTAL_TOPICS_PER_LEVEL[currentLevel] ?? 0;
  const xpThreshold    = PROMOTION_XP_THRESHOLD[currentLevel] ?? Infinity;
  const nextLevel      = NEXT_LEVEL[currentLevel] ?? null;

  // No promotion from Advanced
  if (!nextLevel) {
    return {
      eligible: false, trailComplete: false,
      learnXP: 0, learnXPThreshold: xpThreshold,
      completedTopics: completedTopicsCount, totalTopics, nextLevel,
    };
  }

  const trailComplete = completedTopicsCount >= totalTopics;

  // Query learn XP for this level
  const { data } = await supabase
    .from('charlotte_practices')
    .select('xp_earned')
    .eq('user_id', userId)
    .eq('practice_type', 'learn_exercise');

  const learnXP = (data ?? []).reduce((sum: number, r: any) => sum + (r.xp_earned ?? 0), 0);

  return {
    eligible: trailComplete && learnXP >= xpThreshold,
    trailComplete,
    learnXP,
    learnXPThreshold: xpThreshold,
    completedTopics: completedTopicsCount,
    totalTopics,
    nextLevel,
  };
}

/**
 * Promotes user to next level. Updates charlotte_users.charlotte_level.
 */
export async function promoteUserLevel(
  userId: string,
  nextLevel: string,
): Promise<void> {
  const { error } = await supabase
    .from('charlotte_users')
    .update({ charlotte_level: nextLevel })
    .eq('id', userId);
  if (error) throw error;
}
