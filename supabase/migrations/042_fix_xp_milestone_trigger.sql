-- ─────────────────────────────────────────────────────────────────────────────
-- 042_fix_xp_milestone_trigger.sql
--
-- Bug: rn_on_practice_insert (migration 036) inserts XP-milestone achievements
-- using:
--   INSERT INTO charlotte.user_achievements (user_id, achievement_id, ...)
--   VALUES (NEW.user_id::text, 'rn_xp_' || v_milestone, ...)
--   ON CONFLICT (user_id, achievement_id) DO NOTHING;
--
-- Two problems:
--   1. achievement_id is a UUID column; 'rn_xp_100' is not a valid UUID → type error.
--   2. Migration 0060 dropped the UNIQUE(user_id, achievement_id) constraint, so
--      ON CONFLICT (user_id, achievement_id) is invalid (no unique index) → error.
--
-- Both errors cause the trigger to throw an exception on EVERY practice INSERT
-- whose cumulative XP crosses a milestone (most commonly 100 XP). The exception
-- rolls back the entire transaction, including the charlotte.progress upsert and
-- the charlotte.practices INSERT itself.  Result: total_xp is permanently stuck
-- at 99 (or whatever value was "safe" just before hitting 100).
--
-- Fix: replace the broken INSERT with an existence check + INSERT without
-- achievement_id (matching the pattern used by migrations 029 and 030).
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

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
  v_ach_type       TEXT;
BEGIN
  -- ── Streak calculation ───────────────────────────────────────────────────
  SELECT last_practice_date, streak_days, total_xp
    INTO v_last_date, v_new_streak, v_old_xp
    FROM charlotte.progress
   WHERE user_id = NEW.user_id;

  IF v_last_date IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last_date = v_today THEN
    NULL; -- same day, keep streak
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    v_new_streak := COALESCE(v_new_streak, 0) + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_old_xp := COALESCE(v_old_xp, 0);

  -- ── Upsert charlotte.progress ────────────────────────────────────────────
  INSERT INTO charlotte.progress (user_id, total_xp, streak_days, last_practice_date, updated_at)
    VALUES (NEW.user_id, NEW.xp_earned, COALESCE(v_new_streak, 1), v_today, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp           = charlotte.progress.total_xp + EXCLUDED.total_xp,
        streak_days        = COALESCE(v_new_streak, charlotte.progress.streak_days),
        last_practice_date = v_today,
        updated_at         = now();

  v_new_xp := v_old_xp + NEW.xp_earned;

  -- ── XP milestone achievements ────────────────────────────────────────────
  -- Uses SELECT-based existence check (no achievement_id — it is a UUID column
  -- and these milestones use text keys).  Matches pattern in migrations 029/030.
  FOREACH v_milestone IN ARRAY v_milestones LOOP
    IF v_old_xp < v_milestone AND v_new_xp >= v_milestone THEN
      v_ach_type := 'rn_xp_' || v_milestone;
      IF NOT EXISTS (
        SELECT 1 FROM charlotte.user_achievements
         WHERE user_id = NEW.user_id::text
           AND achievement_type = v_ach_type
      ) THEN
        INSERT INTO charlotte.user_achievements (
          user_id, achievement_type,
          achievement_name, achievement_description,
          xp_bonus, rarity, badge_icon, badge_color, category
        )
        VALUES (
          NEW.user_id::text,
          v_ach_type,
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
          0,
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
        );
      END IF;
    END IF;
  END LOOP;

  -- ── Upsert charlotte.leaderboard_cache ───────────────────────────────────
  SELECT
    COALESCE(cu.charlotte_level, 'Novice'),
    COALESCE(
      CASE
        WHEN cu.name IS NOT NULL AND cu.name <> '' THEN
          CASE
            WHEN position(' ' IN trim(cu.name)) > 0 THEN
              split_part(trim(cu.name), ' ', 1) || ' ' ||
              upper(left(trim(split_part(trim(cu.name), ' ', 2)), 1)) || '.'
            ELSE trim(cu.name)
          END
        ELSE split_part(cu.email, '@', 1)
      END,
      'Anonymous'
    )
    INTO v_user_level, v_display_name
    FROM charlotte.users cu
   WHERE cu.id = NEW.user_id;

  INSERT INTO charlotte.leaderboard_cache (user_id, user_level, display_name, total_xp, updated_at)
    VALUES (NEW.user_id, COALESCE(v_user_level, 'Novice'), COALESCE(v_display_name, 'Anonymous'), NEW.xp_earned, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp     = charlotte.leaderboard_cache.total_xp + EXCLUDED.total_xp,
        user_level   = COALESCE(v_user_level, charlotte.leaderboard_cache.user_level),
        display_name = COALESCE(v_display_name, charlotte.leaderboard_cache.display_name),
        updated_at   = now();

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ 042_fix_xp_milestone_trigger completed.';
  RAISE NOTICE '   rn_on_practice_insert() now uses achievement_type existence check';
  RAISE NOTICE '   instead of broken ON CONFLICT (user_id, achievement_id).';
  RAISE NOTICE '   Practices that cross XP milestones (e.g. 100 XP) will now save';
  RAISE NOTICE '   correctly and total_xp will no longer be stuck at 99.';
END $$;

COMMIT;
