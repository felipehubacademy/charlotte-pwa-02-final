-- ─────────────────────────────────────────────────────────────────────────────
-- 049_move_pwa_tables_to_public.sql
--
-- Goal: keep charlotte schema clean — only RN app tables.
--       PWA legacy tables (user_practices, user_progress,
--       user_leaderboard_cache) move back to public schema where they
--       originally lived before migration 021.
--
-- Zero-downtime strategy:
--   1. DROP the compat views in public (they pointed to charlotte.user_*)
--   2. ALTER TABLE … SET SCHEMA public  (moves table + all indexes/triggers)
--
-- Result:
--   - public.user_practices        → real table (was charlotte.user_practices)
--   - public.user_progress         → real table (was charlotte.user_progress)
--   - public.user_leaderboard_cache→ real table (was charlotte.user_leaderboard_cache)
--   - charlotte schema             → only RN tables (practices, progress,
--                                    leaderboard_cache, users, achievements, …)
--
-- PWA code (supabase.from('user_practices') etc.) keeps working transparently.
-- The INSERT trigger on user_practices moves with the table — no recreation needed.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Drop compat views in public ──────────────────────────────────────────
-- CASCADE drops the INSTEAD OF triggers attached to them.

DROP VIEW IF EXISTS public.user_practices         CASCADE;
DROP VIEW IF EXISTS public.user_progress          CASCADE;
DROP VIEW IF EXISTS public.user_leaderboard_cache CASCADE;

-- ── 2. Move tables from charlotte → public ───────────────────────────────────
-- ALTER TABLE SET SCHEMA preserves all indexes, constraints, and triggers.
-- The INSERT trigger (trigger_update_user_progress) on user_practices
-- travels with the table and continues to call update_user_progress_on_practice().

ALTER TABLE charlotte.user_practices         SET SCHEMA public;
ALTER TABLE charlotte.user_progress          SET SCHEMA public;
ALTER TABLE charlotte.user_leaderboard_cache SET SCHEMA public;

COMMIT;
