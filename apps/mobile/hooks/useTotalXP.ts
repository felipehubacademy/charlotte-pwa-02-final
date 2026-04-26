/**
 * useTotalXP
 *
 * Fetches the user's persisted total_xp from user_progress on mount.
 * Returns `baseTotalXP` so screens can display: baseTotalXP + sessionXP
 * for a consistent number that starts from the real DB total.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useTotalXP(userId: string | undefined): number {
  const [baseTotalXP, setBaseTotalXP] = useState(0);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('charlotte_progress')
      .select('total_xp')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.total_xp) setBaseTotalXP(data.total_xp);
      });
  }, [userId]);

  return baseTotalXP;
}
