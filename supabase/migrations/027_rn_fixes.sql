-- ─────────────────────────────────────────────────────────────────────────────
-- 027_rn_fixes.sql
-- 1. Fix RLS policies with explicit WITH CHECK for INSERT
-- 2. Add XP milestone achievements to rn_on_practice_insert trigger
-- 3. Enable Realtime on user_achievements (public schema)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Fix RLS: add explicit WITH CHECK so INSERTs are not blocked ────────────

DROP POLICY IF EXISTS "Users manage own rn_practices"   ON public.rn_user_practices;
DROP POLICY IF EXISTS "Users manage own rn_progress"    ON public.rn_user_progress;
DROP POLICY IF EXISTS "Users manage own rn_leaderboard entry" ON public.rn_leaderboard_cache;

CREATE POLICY "rn_practices_select"  ON public.rn_user_practices FOR SELECT USING      (auth.uid() = user_id);
CREATE POLICY "rn_practices_insert"  ON public.rn_user_practices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rn_practices_update"  ON public.rn_user_practices FOR UPDATE USING      (auth.uid() = user_id);
CREATE POLICY "rn_practices_delete"  ON public.rn_user_practices FOR DELETE USING      (auth.uid() = user_id);

CREATE POLICY "rn_progress_select"   ON public.rn_user_progress  FOR SELECT USING      (auth.uid() = user_id);
CREATE POLICY "rn_progress_insert"   ON public.rn_user_progress  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rn_progress_update"   ON public.rn_user_progress  FOR UPDATE USING      (auth.uid() = user_id);

CREATE POLICY "rn_leaderboard_own_insert" ON public.rn_leaderboard_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rn_leaderboard_own_update" ON public.rn_leaderboard_cache FOR UPDATE USING      (auth.uid() = user_id);

-- ── 2. Update trigger to insert XP milestone achievements ─────────────────────

CREATE OR REPLACE FUNCTION public.rn_on_practice_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today          DATE    := CURRENT_DATE;
  v_last_date      DATE;
  v_new_streak     INTEGER;
  v_old_xp         INTEGER := 0;
  v_new_xp         INTEGER;
  v_user_level     TEXT;
  v_display_name   TEXT;
  v_milestone      INTEGER;
  v_milestones     INTEGER[] := ARRAY[100, 250, 500, 1000, 2500, 5000, 10000];
BEGIN
  -- ── Streak calculation ───────────────────────────────────────────────────
  SELECT last_practice_date, streak_days, total_xp
    INTO v_last_date, v_new_streak, v_old_xp
    FROM public.rn_user_progress
   WHERE user_id = NEW.user_id;

  IF v_last_date IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last_date = v_today THEN
    -- same day, keep streak as-is
    NULL;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    v_new_streak := COALESCE(v_new_streak, 0) + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_old_xp := COALESCE(v_old_xp, 0);

  -- ── Upsert rn_user_progress ──────────────────────────────────────────────
  INSERT INTO public.rn_user_progress (user_id, total_xp, streak_days, last_practice_date, updated_at)
    VALUES (NEW.user_id, NEW.xp_earned, COALESCE(v_new_streak, 1), v_today, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp           = rn_user_progress.total_xp + EXCLUDED.total_xp,
        streak_days        = COALESCE(v_new_streak, rn_user_progress.streak_days),
        last_practice_date = v_today,
        updated_at         = now();

  v_new_xp := v_old_xp + NEW.xp_earned;

  -- ── XP milestone achievements ────────────────────────────────────────────
  FOREACH v_milestone IN ARRAY v_milestones LOOP
    IF v_old_xp < v_milestone AND v_new_xp >= v_milestone THEN
      INSERT INTO charlotte.user_achievements (
        user_id, achievement_id, achievement_type,
        title, description,
        achievement_name, achievement_description,
        xp_bonus, rarity, badge_icon, badge_color, category
      )
      VALUES (
        NEW.user_id::text,
        'rn_xp_' || v_milestone,
        'xp_milestone',
        CASE v_milestone
          WHEN 100   THEN 'Primeiros Passos'
          WHEN 250   THEN 'Em Progresso'
          WHEN 500   THEN 'Meio Caminho'
          WHEN 1000  THEN 'Dedicado'
          WHEN 2500  THEN 'Avançando'
          WHEN 5000  THEN 'Expert'
          WHEN 10000 THEN 'Mestre'
        END,
        CASE v_milestone
          WHEN 100   THEN 'Você ganhou seus primeiros 100 XP!'
          WHEN 250   THEN 'Chegou a 250 XP — continue assim!'
          WHEN 500   THEN '500 XP conquistados!'
          WHEN 1000  THEN '1.000 XP — você é dedicado!'
          WHEN 2500  THEN '2.500 XP — impressionante!'
          WHEN 5000  THEN '5.000 XP — nível expert!'
          WHEN 10000 THEN '10.000 XP — você é um mestre!'
        END,
        -- achievement_name mirrors title
        CASE v_milestone
          WHEN 100   THEN 'Primeiros Passos'
          WHEN 250   THEN 'Em Progresso'
          WHEN 500   THEN 'Meio Caminho'
          WHEN 1000  THEN 'Dedicado'
          WHEN 2500  THEN 'Avançando'
          WHEN 5000  THEN 'Expert'
          WHEN 10000 THEN 'Mestre'
        END,
        CASE v_milestone
          WHEN 100   THEN 'Você ganhou seus primeiros 100 XP!'
          WHEN 250   THEN 'Chegou a 250 XP — continue assim!'
          WHEN 500   THEN '500 XP conquistados!'
          WHEN 1000  THEN '1.000 XP — você é dedicado!'
          WHEN 2500  THEN '2.500 XP — impressionante!'
          WHEN 5000  THEN '5.000 XP — nível expert!'
          WHEN 10000 THEN '10.000 XP — você é um mestre!'
        END,
        0,  -- xp_bonus
        CASE v_milestone
          WHEN 100   THEN 'common'
          WHEN 250   THEN 'common'
          WHEN 500   THEN 'rare'
          WHEN 1000  THEN 'rare'
          WHEN 2500  THEN 'epic'
          WHEN 5000  THEN 'epic'
          WHEN 10000 THEN 'legendary'
        END,
        CASE v_milestone
          WHEN 100   THEN '🌱'
          WHEN 250   THEN '⚡'
          WHEN 500   THEN '🔥'
          WHEN 1000  THEN '💎'
          WHEN 2500  THEN '🚀'
          WHEN 5000  THEN '👑'
          WHEN 10000 THEN '🏆'
        END,
        '#A3FF3C',
        'xp_milestone'
      )
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;

  -- ── Upsert rn_leaderboard_cache ──────────────────────────────────────────
  SELECT COALESCE(u.user_level, 'Novice'),
         COALESCE(
           CASE
             WHEN u.name IS NOT NULL AND u.name <> '' THEN
               CASE
                 WHEN position(' ' IN trim(u.name)) > 0 THEN
                   split_part(trim(u.name), ' ', 1) || ' ' ||
                   upper(left(trim(split_part(trim(u.name), ' ', 2)), 1)) || '.'
                 ELSE trim(u.name)
               END
             ELSE split_part(u.email, '@', 1)
           END, 'Anonymous')
    INTO v_user_level, v_display_name
    FROM public.users u WHERE u.id = NEW.user_id;

  INSERT INTO public.rn_leaderboard_cache (user_id, user_level, display_name, total_xp, updated_at)
    VALUES (NEW.user_id, COALESCE(v_user_level, 'Novice'), COALESCE(v_display_name, 'Anonymous'), NEW.xp_earned, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp     = rn_leaderboard_cache.total_xp + EXCLUDED.total_xp,
        user_level   = COALESCE(v_user_level, rn_leaderboard_cache.user_level),
        display_name = COALESCE(v_display_name, rn_leaderboard_cache.display_name),
        updated_at   = now();

  RETURN NEW;
END;
$$;

-- ── 3. Ensure Realtime is enabled for charlotte.user_achievements ────────────
-- public.user_achievements is a VIEW — Realtime must point to the real table
ALTER PUBLICATION supabase_realtime ADD TABLE charlotte.user_achievements;
