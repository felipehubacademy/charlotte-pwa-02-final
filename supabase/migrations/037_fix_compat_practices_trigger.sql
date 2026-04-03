-- ─────────────────────────────────────────────────────────────────────────────
-- 037_fix_compat_practices_trigger.sql
--
-- Problem: compat_charlotte_practices_ins() used `INSERT INTO charlotte.practices
--          SELECT (NEW).*` which passes NULL for columns not supplied by the
--          caller (id, created_at) because views have no column defaults.
--          PostgreSQL ignores table-level DEFAULT values when a column is
--          explicitly provided as NULL, causing a NOT NULL constraint violation
--          (error code 23502) on every charlotte_practices INSERT from the app.
--
-- Fix: replace the trigger body with an explicit column list so the base-table
--      DEFAULTs (gen_random_uuid() for id, now() for created_at) are respected.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

CREATE OR REPLACE FUNCTION public.compat_charlotte_practices_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.practices (user_id, practice_type, xp_earned)
  VALUES (NEW.user_id, NEW.practice_type, COALESCE(NEW.xp_earned, 0));
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ 037_fix_compat_practices_trigger completed.';
  RAISE NOTICE '   compat_charlotte_practices_ins() now uses explicit column list.';
  RAISE NOTICE '   id and created_at will use charlotte.practices DEFAULT values.';
END $$;

COMMIT;
