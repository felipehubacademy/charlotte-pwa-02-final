-- ─────────────────────────────────────────────────────────────────────────────
-- 022_fix_compat_triggers_and_nullable.sql
--
-- Fixes:
--   1. Compat INSERT triggers passed id=NULL explicitly (SELECT (NEW).*)
--      → PostgreSQL defaults only fire when column is OMITTED, not when NULL
--      → Fix: explicit column list with COALESCE(NEW.id, gen_random_uuid())
--
--   2. user_practices.transcription was NOT NULL with no default
--      → savePractice() inserts without transcription (it's a general XP record)
--      → Fix: make nullable
--
--   3. learn_history compat trigger: answered_at must use COALESCE(NEW.answered_at, NOW())
--      because the app does not send that column
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Make user_practices.transcription nullable ────────────────────────────
ALTER TABLE charlotte.user_practices
  ALTER COLUMN transcription DROP NOT NULL;

-- ── 2. Fix compat_learn_history_ins ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compat_learn_history_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.learn_history
    (id, user_id, level, module_index, topic_index, exercise_type, is_correct, xp_earned, answered_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.level,
    COALESCE(NEW.module_index, 0),
    COALESCE(NEW.topic_index, 0),
    NEW.exercise_type,
    COALESCE(NEW.is_correct, false),
    COALESCE(NEW.xp_earned, 0),
    COALESCE(NEW.answered_at, NOW())
  );
  RETURN NEW;
END; $$;

-- ── 3. Fix compat_user_practices_ins ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compat_user_practices_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.user_practices
    (id, user_id, practice_type, xp_earned, created_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    COALESCE(NEW.practice_type, 'text_message'),
    COALESCE(NEW.xp_earned, 0),
    COALESCE(NEW.created_at, NOW())
  );
  RETURN NEW;
END; $$;

-- ── 4. Fix compat_learn_progress_ins ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compat_learn_progress_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.learn_progress
    (id, user_id, level, module_index, topic_index, completed, updated_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.level,
    COALESCE(NEW.module_index, 0),
    COALESCE(NEW.topic_index, 0),
    COALESCE(NEW.completed, '[]'::jsonb),
    COALESCE(NEW.updated_at, NOW())
  );
  RETURN NEW;
END; $$;

-- ── 5. Recreate triggers to pick up new function bodies ─────────────────────
DROP TRIGGER IF EXISTS compat_ins ON public.learn_history;
CREATE TRIGGER compat_ins
  INSTEAD OF INSERT ON public.learn_history
  FOR EACH ROW EXECUTE FUNCTION public.compat_learn_history_ins();

DROP TRIGGER IF EXISTS compat_ins ON public.user_practices;
CREATE TRIGGER compat_ins
  INSTEAD OF INSERT ON public.user_practices
  FOR EACH ROW EXECUTE FUNCTION public.compat_user_practices_ins();

DROP TRIGGER IF EXISTS compat_ins ON public.learn_progress;
CREATE TRIGGER compat_ins
  INSTEAD OF INSERT ON public.learn_progress
  FOR EACH ROW EXECUTE FUNCTION public.compat_learn_progress_ins();

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ 022 completed: compat triggers fixed, transcription nullable'; END $$;
