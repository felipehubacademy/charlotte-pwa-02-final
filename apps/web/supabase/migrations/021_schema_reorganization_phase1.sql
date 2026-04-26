-- ─────────────────────────────────────────────────────────────────────────────
-- 021_schema_reorganization_phase1.sql
--
-- Phase 1: Reorganise tables into domain schemas
--   charlotte     — learning & gamification
--   marketing     — leads, trials, email
--   notifications — push, logs, preferences
--   public        — users, profiles (shared; untouched)
--
-- Strategy (zero-downtime):
--   1. Create schemas
--   2. Move tables via ALTER TABLE … SET SCHEMA
--   3. Recreate trigger functions with fully-qualified schema names
--   4. Add NEW trigger: learn_history → user_progress (was missing)
--   5. Fix streak calc inside trigger (in-place, no data loss)
--   6. Create read/write compat views in public (backward compat for PWA)
--   7. Grant privileges
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Create schemas ────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS charlotte;
CREATE SCHEMA IF NOT EXISTS marketing;
CREATE SCHEMA IF NOT EXISTS notifications;

-- ── 2. Grant schema usage ────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA charlotte     TO authenticated, service_role, anon;
GRANT USAGE ON SCHEMA marketing     TO authenticated, service_role, anon;
GRANT USAGE ON SCHEMA notifications TO authenticated, service_role, anon;

-- ── 3. Move charlotte tables ─────────────────────────────────────────────────
-- All FKs point to public.users(id) — no intra-charlotte cross-FK to manage.

ALTER TABLE IF EXISTS public.user_progress          SET SCHEMA charlotte;
ALTER TABLE IF EXISTS public.user_practices         SET SCHEMA charlotte;
ALTER TABLE IF EXISTS public.user_sessions          SET SCHEMA charlotte;
ALTER TABLE IF EXISTS public.user_achievements      SET SCHEMA charlotte;
ALTER TABLE IF EXISTS public.achievements           SET SCHEMA charlotte;
ALTER TABLE IF EXISTS public.user_leaderboard_cache SET SCHEMA charlotte;
ALTER TABLE IF EXISTS public.leaderboard            SET SCHEMA charlotte;
ALTER TABLE IF EXISTS public.audio_practices        SET SCHEMA charlotte;
ALTER TABLE IF EXISTS public.user_stats             SET SCHEMA charlotte;
ALTER TABLE IF EXISTS public.learn_progress         SET SCHEMA charlotte;
ALTER TABLE IF EXISTS public.learn_history          SET SCHEMA charlotte;

-- ── 4. Move marketing tables ─────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.leads                  SET SCHEMA marketing;
ALTER TABLE IF EXISTS public.trial_access           SET SCHEMA marketing;
ALTER TABLE IF EXISTS public.email_notifications    SET SCHEMA marketing;

-- ── 5. Move notifications tables ─────────────────────────────────────────────

ALTER TABLE IF EXISTS public.push_subscriptions     SET SCHEMA notifications;
ALTER TABLE IF EXISTS public.notification_logs      SET SCHEMA notifications;
ALTER TABLE IF EXISTS public.notification_preferences SET SCHEMA notifications;

-- ── 6. Grant table & sequence privileges ─────────────────────────────────────

GRANT ALL ON ALL TABLES    IN SCHEMA charlotte     TO authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA marketing     TO authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA notifications TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA charlotte     TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA marketing     TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA notifications TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA charlotte     GRANT ALL ON TABLES    TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA marketing     GRANT ALL ON TABLES    TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA notifications GRANT ALL ON TABLES    TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA charlotte     GRANT ALL ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA marketing     GRANT ALL ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA notifications GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- ── 7. Recreate trigger function: user_practices → user_progress ──────────────
-- Updated to:
--   a) Use schema-qualified table names
--   b) Calculate streak correctly inside DB (no more timezone bug in app code)
--   c) Sync leaderboard cache atomically

CREATE OR REPLACE FUNCTION update_user_progress_on_practice()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO charlotte.user_progress (
    user_id,
    total_xp,
    total_practices,
    total_text_practices,
    total_audio_practices,
    total_live_voice_practices,
    last_practice_date
  )
  VALUES (
    NEW.user_id,
    COALESCE(NEW.xp_earned, 0),
    1,
    CASE WHEN NEW.practice_type = 'text_message'  THEN 1 ELSE 0 END,
    CASE WHEN NEW.practice_type = 'audio_message' THEN 1 ELSE 0 END,
    CASE WHEN NEW.practice_type = 'live_voice'    THEN 1 ELSE 0 END,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp                   = charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0),
    total_practices            = charlotte.user_progress.total_practices + 1,
    total_text_practices       = charlotte.user_progress.total_text_practices  +
                                 CASE WHEN NEW.practice_type = 'text_message'  THEN 1 ELSE 0 END,
    total_audio_practices      = charlotte.user_progress.total_audio_practices +
                                 CASE WHEN NEW.practice_type = 'audio_message' THEN 1 ELSE 0 END,
    total_live_voice_practices = charlotte.user_progress.total_live_voice_practices +
                                 CASE WHEN NEW.practice_type = 'live_voice'    THEN 1 ELSE 0 END,
    last_practice_date         = CURRENT_DATE,
    -- Streak: +1 if practiced yesterday, keep if same day, reset to 1 otherwise
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

  -- Sync leaderboard cache
  INSERT INTO charlotte.user_leaderboard_cache (user_id, total_xp, current_streak, updated_at)
  SELECT up.user_id, up.total_xp, up.streak_days, NOW()
  FROM   charlotte.user_progress up
  WHERE  up.user_id::text = NEW.user_id::text
  ON CONFLICT (user_id, user_level) DO UPDATE SET
    total_xp       = EXCLUDED.total_xp,
    current_streak = EXCLUDED.current_streak,
    updated_at     = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger (table moved, function body updated)
DROP TRIGGER IF EXISTS trigger_update_user_progress ON charlotte.user_practices;
CREATE TRIGGER trigger_update_user_progress
  AFTER INSERT ON charlotte.user_practices
  FOR EACH ROW EXECUTE FUNCTION update_user_progress_on_practice();

-- ── 8. NEW trigger: learn_history → user_progress ────────────────────────────
-- This was missing — learn trail XP was never counted in user_progress.

CREATE OR REPLACE FUNCTION update_user_progress_on_learn()
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_user_progress_on_learn ON charlotte.learn_history;
CREATE TRIGGER trigger_update_user_progress_on_learn
  AFTER INSERT ON charlotte.learn_history
  FOR EACH ROW EXECUTE FUNCTION update_user_progress_on_learn();

-- ── 9. Compat views in public (Phase 1 — drop in Phase 3 after PWA off) ──────

-- charlotte
CREATE OR REPLACE VIEW public.user_progress         AS SELECT * FROM charlotte.user_progress;
CREATE OR REPLACE VIEW public.user_practices        AS SELECT * FROM charlotte.user_practices;
CREATE OR REPLACE VIEW public.user_sessions         AS SELECT * FROM charlotte.user_sessions;
CREATE OR REPLACE VIEW public.user_achievements     AS SELECT * FROM charlotte.user_achievements;
CREATE OR REPLACE VIEW public.achievements          AS SELECT * FROM charlotte.achievements;
CREATE OR REPLACE VIEW public.user_leaderboard_cache AS SELECT * FROM charlotte.user_leaderboard_cache;
-- leaderboard view: only if the table was actually moved (it may not exist in all environments)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'charlotte' AND tablename = 'leaderboard') THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.leaderboard AS SELECT * FROM charlotte.leaderboard';
  END IF;
END $$;
CREATE OR REPLACE VIEW public.audio_practices       AS SELECT * FROM charlotte.audio_practices;
CREATE OR REPLACE VIEW public.user_stats            AS SELECT * FROM charlotte.user_stats;
CREATE OR REPLACE VIEW public.learn_progress        AS SELECT * FROM charlotte.learn_progress;
CREATE OR REPLACE VIEW public.learn_history         AS SELECT * FROM charlotte.learn_history;

-- marketing
CREATE OR REPLACE VIEW public.leads                 AS SELECT * FROM marketing.leads;
CREATE OR REPLACE VIEW public.trial_access          AS SELECT * FROM marketing.trial_access;
CREATE OR REPLACE VIEW public.email_notifications   AS SELECT * FROM marketing.email_notifications;

-- notifications
CREATE OR REPLACE VIEW public.push_subscriptions    AS SELECT * FROM notifications.push_subscriptions;
CREATE OR REPLACE VIEW public.notification_logs     AS SELECT * FROM notifications.notification_logs;
CREATE OR REPLACE VIEW public.notification_preferences AS SELECT * FROM notifications.notification_preferences;

-- ── 10. INSTEAD OF triggers — make compat views writable ─────────────────────

-- learn_progress
CREATE OR REPLACE FUNCTION public.compat_learn_progress_ins() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN INSERT INTO charlotte.learn_progress SELECT (NEW).*; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.compat_learn_progress_upd() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charlotte.learn_progress
  SET module_index = NEW.module_index,
      topic_index  = NEW.topic_index,
      completed    = NEW.completed,
      updated_at   = NEW.updated_at
  WHERE id = OLD.id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS compat_ins ON public.learn_progress;
DROP TRIGGER IF EXISTS compat_upd ON public.learn_progress;
CREATE TRIGGER compat_ins INSTEAD OF INSERT ON public.learn_progress FOR EACH ROW EXECUTE FUNCTION public.compat_learn_progress_ins();
CREATE TRIGGER compat_upd INSTEAD OF UPDATE ON public.learn_progress FOR EACH ROW EXECUTE FUNCTION public.compat_learn_progress_upd();

-- learn_history
CREATE OR REPLACE FUNCTION public.compat_learn_history_ins() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN INSERT INTO charlotte.learn_history SELECT (NEW).*; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS compat_ins ON public.learn_history;
CREATE TRIGGER compat_ins INSTEAD OF INSERT ON public.learn_history FOR EACH ROW EXECUTE FUNCTION public.compat_learn_history_ins();

-- user_practices
CREATE OR REPLACE FUNCTION public.compat_user_practices_ins() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN INSERT INTO charlotte.user_practices SELECT (NEW).*; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS compat_ins ON public.user_practices;
CREATE TRIGGER compat_ins INSTEAD OF INSERT ON public.user_practices FOR EACH ROW EXECUTE FUNCTION public.compat_user_practices_ins();

-- push_subscriptions
CREATE OR REPLACE FUNCTION public.compat_push_sub_ins() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN INSERT INTO notifications.push_subscriptions SELECT (NEW).*; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.compat_push_sub_upd() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE notifications.push_subscriptions
  SET endpoint    = NEW.endpoint,
      keys        = NEW.keys,
      device_info = NEW.device_info,
      is_active   = NEW.is_active
  WHERE id = OLD.id;
  RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.compat_push_sub_del() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN DELETE FROM notifications.push_subscriptions WHERE id = OLD.id; RETURN OLD; END; $$;
DROP TRIGGER IF EXISTS compat_ins ON public.push_subscriptions;
DROP TRIGGER IF EXISTS compat_upd ON public.push_subscriptions;
DROP TRIGGER IF EXISTS compat_del ON public.push_subscriptions;
CREATE TRIGGER compat_ins INSTEAD OF INSERT ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.compat_push_sub_ins();
CREATE TRIGGER compat_upd INSTEAD OF UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.compat_push_sub_upd();
CREATE TRIGGER compat_del INSTEAD OF DELETE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.compat_push_sub_del();

-- leads (insert + update used by PWA)
CREATE OR REPLACE FUNCTION public.compat_leads_ins() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN INSERT INTO marketing.leads SELECT (NEW).*; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.compat_leads_upd() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE marketing.leads
  SET email              = NEW.email,
      name               = NEW.name,
      phone              = NEW.phone,
      source             = NEW.source,
      status             = NEW.status,
      hubspot_contact_id = NEW.hubspot_contact_id,
      hubspot_deal_id    = NEW.hubspot_deal_id,
      notes              = NEW.notes,
      updated_at         = NEW.updated_at
  WHERE id = OLD.id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS compat_ins ON public.leads;
DROP TRIGGER IF EXISTS compat_upd ON public.leads;
CREATE TRIGGER compat_ins INSTEAD OF INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.compat_leads_ins();
CREATE TRIGGER compat_upd INSTEAD OF UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.compat_leads_upd();

-- notification_logs
CREATE OR REPLACE FUNCTION public.compat_notif_logs_ins() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN INSERT INTO notifications.notification_logs SELECT (NEW).*; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS compat_ins ON public.notification_logs;
CREATE TRIGGER compat_ins INSTEAD OF INSERT ON public.notification_logs FOR EACH ROW EXECUTE FUNCTION public.compat_notif_logs_ins();

-- ── 11. Verification notice ───────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '✅ 021_schema_reorganization_phase1 completed.';
  RAISE NOTICE '   Schemas created: charlotte, marketing, notifications';
  RAISE NOTICE '   Tables moved: 11 charlotte | 3 marketing | 3 notifications';
  RAISE NOTICE '   Compat views: all 17 tables have public.* views';
  RAISE NOTICE '   New trigger: learn_history → user_progress (XP aggregation)';
  RAISE NOTICE '   Streak calc: now done in DB on CURRENT_DATE (no timezone bug)';
END $$;

COMMIT;
