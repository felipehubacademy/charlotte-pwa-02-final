import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CURRICULUM, TrailLevel } from '@/data/curriculum';
import { useAchievementsContext } from '@/components/achievements/AchievementsProvider';

export interface CompletedKey { m: number; t: number }

export interface LearnProgressData {
  moduleIndex:      number;
  topicIndex:       number;
  completed:        CompletedKey[];
}

interface UseLearnProgressReturn {
  progress:         LearnProgressData | null;
  loading:          boolean;
  saveTopicComplete: (level: TrailLevel, moduleIndex: number, topicIndex: number) => Promise<void>;
  saveExercise:     (params: SaveExerciseParams) => Promise<void>;
  isTopicComplete:  (moduleIndex: number, topicIndex: number) => boolean;
  isCurrent:        (moduleIndex: number, topicIndex: number) => boolean;
  isLocked:         (moduleIndex: number, topicIndex: number) => boolean;
}

interface SaveExerciseParams {
  level:         TrailLevel;
  moduleIndex:   number;
  topicIndex:    number;
  exerciseType:  string;
  isCorrect:     boolean;
  xpEarned:      number;
}

export function useLearnProgress(userId: string | undefined, level: TrailLevel): UseLearnProgressReturn {
  const [progress, setProgress]   = useState<LearnProgressData | null>(null);
  const [loading,  setLoading]    = useState(true);
  const { checkForNewAchievements } = useAchievementsContext();

  // ── Fetch or initialise progress ────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('learn_progress')
        .select('module_index, topic_index, completed')
        .eq('user_id', userId)
        .eq('level', level)
        .maybeSingle();

      if (error) {
        console.error('[useLearnProgress] fetch error', error);
        setProgress({ moduleIndex: 0, topicIndex: 0, completed: [] });
      } else if (!data) {
        // First time on this level — create row
        await supabase.from('learn_progress').insert({
          user_id:      userId,
          level,
          module_index: 0,
          topic_index:  0,
          completed:    [],
        });
        setProgress({ moduleIndex: 0, topicIndex: 0, completed: [] });
      } else {
        setProgress({
          moduleIndex: data.module_index,
          topicIndex:  data.topic_index,
          completed:   (data.completed as CompletedKey[]) ?? [],
        });
      }
      setLoading(false);
    };

    fetch();
  }, [userId, level]);

  // ── Mark topic complete & advance pointer ────────────────────────────────
  const saveTopicComplete = useCallback(async (
    lvl: TrailLevel, moduleIndex: number, topicIndex: number,
  ) => {
    if (!userId) return;

    const key: CompletedKey = { m: moduleIndex, t: topicIndex };
    const existing = progress?.completed ?? [];
    const alreadyDone = existing.some(k => k.m === moduleIndex && k.t === topicIndex);
    const newCompleted = alreadyDone ? existing : [...existing, key];

    // Advance to next topic
    const modules = CURRICULUM[lvl];
    let nextModule = moduleIndex;
    let nextTopic  = topicIndex + 1;

    if (nextTopic >= modules[moduleIndex].topics.length) {
      nextModule = moduleIndex + 1;
      nextTopic  = 0;
    }
    if (nextModule >= modules.length) {
      // Trail complete — stay at last position
      nextModule = moduleIndex;
      nextTopic  = topicIndex;
    }

    const { error } = await supabase
      .from('learn_progress')
      .update({
        module_index: nextModule,
        topic_index:  nextTopic,
        completed:    newCompleted,
        updated_at:   new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('level', lvl);

    if (error) {
      console.error('[useLearnProgress] update error', error);
    } else {
      setProgress({ moduleIndex: nextModule, topicIndex: nextTopic, completed: newCompleted });
    }
  }, [userId, progress]);

  // ── Save single exercise result ──────────────────────────────────────────
  const saveExercise = useCallback(async (params: SaveExerciseParams) => {
    if (!userId) return;
    // Save to learn_history (trail progress detail)
    const { error } = await supabase.from('learn_history').insert({
      user_id:       userId,
      level:         params.level,
      module_index:  params.moduleIndex,
      topic_index:   params.topicIndex,
      exercise_type: params.exerciseType,
      is_correct:    params.isCorrect,
      xp_earned:     params.xpEarned,
    });
    if (error) console.error('[useLearnProgress] history insert error', error);

    // Save to charlotte_practices so XP flows to charlotte_progress & charlotte_leaderboard_cache via trigger
    const { error: practiceError } = await supabase.from('charlotte_practices').insert({
      user_id:       userId,
      practice_type: 'learn_exercise',
      xp_earned:     params.xpEarned,
    });
    if (practiceError) console.error('[useLearnProgress] rn_practice insert error', practiceError);

    // Check for new achievements 1500ms after XP is saved (gives trigger time to run)
    setTimeout(() => { checkForNewAchievements(); }, 1500);
  }, [userId, checkForNewAchievements]);

  // ── Derived helpers ──────────────────────────────────────────────────────
  const isTopicComplete = useCallback((moduleIndex: number, topicIndex: number) => {
    return (progress?.completed ?? []).some(k => k.m === moduleIndex && k.t === topicIndex);
  }, [progress]);

  const isCurrent = useCallback((moduleIndex: number, topicIndex: number) => {
    return progress?.moduleIndex === moduleIndex && progress?.topicIndex === topicIndex;
  }, [progress]);

  const isLocked = useCallback((moduleIndex: number, topicIndex: number) => {
    if (isTopicComplete(moduleIndex, topicIndex)) return false;
    if (isCurrent(moduleIndex, topicIndex))       return false;
    return true;
  }, [isTopicComplete, isCurrent]);

  return { progress, loading, saveTopicComplete, saveExercise, isTopicComplete, isCurrent, isLocked };
}
