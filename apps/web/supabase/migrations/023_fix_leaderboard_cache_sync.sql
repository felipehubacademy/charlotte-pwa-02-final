-- ─────────────────────────────────────────────────────────────────────────────
-- 023_fix_leaderboard_cache_sync.sql
--
-- Problem: update_user_progress_on_practice() inserts into user_leaderboard_cache
-- without user_level, so it defaults to 'Intermediate' regardless of the user's
-- actual level. Users appear in the wrong leaderboard bucket.
--
-- Fix:
--   1. Update trigger to JOIN public.users for correct user_level + display_name
--   2. One-time data fix: correct existing cache rows with wrong user_level
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Fix trigger function ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_progress_on_practice()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO charlotte.user_progress (
    user_id, total_xp, total_practices, last_practice_date
  )
  VALUES (
    NEW.user_id,
    COALESCE(NEW.xp_earned, 0),
    1,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp           = charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0),
    total_practices    = charlotte.user_progress.total_practices + 1,
    last_practice_date = CURRENT_DATE,
    streak_days = CASE
      WHEN charlotte.user_progress.last_practice_date = CURRENT_DATE - INTERVAL '1 day'
        THEN charlotte.user_progress.streak_days + 1
      WHEN charlotte.user_progress.last_practice_date = CURRENT_DATE
        THEN charlotte.user_progress.streak_days
      ELSE 1
    END,
    longest_streak = GREATEST(
      charlotte.user_progress.longest_streak,
      CASE
        WHEN charlotte.user_progress.last_practice_date = CURRENT_DATE - INTERVAL '1 day'
          THEN charlotte.user_progress.streak_days + 1
        WHEN charlotte.user_progress.last_practice_date = CURRENT_DATE
          THEN charlotte.user_progress.streak_days
        ELSE 1
      END
    ),
    current_level = CASE
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 10000 THEN 10
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 5000  THEN 9
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 2500  THEN 8
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 1500  THEN 7
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 1000  THEN 6
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 600   THEN 5
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 350   THEN 4
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 200   THEN 3
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 100   THEN 2
      ELSE 1
    END,
    updated_at = NOW();

  -- Sync leaderboard cache with correct user_level and display_name from public.users
  INSERT INTO charlotte.user_leaderboard_cache (user_id, user_level, display_name, total_xp, current_streak, updated_at)
  SELECT
    up.user_id,
    COALESCE(u.user_level, 'Inter'),
    COALESCE(u.name, 'Anonymous'),
    up.total_xp,
    up.streak_days,
    NOW()
  FROM charlotte.user_progress up
  JOIN public.users u ON u.id = up.user_id
  WHERE up.user_id = NEW.user_id
  ON CONFLICT (user_id, user_level) DO UPDATE SET
    total_xp       = EXCLUDED.total_xp,
    current_streak = EXCLUDED.current_streak,
    display_name   = EXCLUDED.display_name,
    updated_at     = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. One-time data fix: update existing cache rows with correct level/name ──
UPDATE charlotte.user_leaderboard_cache lc
SET
  user_level   = COALESCE(u.user_level, 'Inter'),
  display_name = COALESCE(u.name, lc.display_name),
  updated_at   = NOW()
FROM public.users u
WHERE u.id::text = lc.user_id::text
  AND (lc.user_level = 'Intermediate' OR lc.display_name = 'Anonymous');

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ 023 completed: leaderboard cache now syncs correct user_level and display_name'; END $$;
