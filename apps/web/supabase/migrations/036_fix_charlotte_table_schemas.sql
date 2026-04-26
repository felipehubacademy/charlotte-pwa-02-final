-- ─────────────────────────────────────────────────────────────────────────────
-- 036_fix_charlotte_table_schemas.sql
--
-- Correction: migration 035 created charlotte app tables in `public` instead
-- of the `charlotte` domain schema established in 021.
--
-- This migration follows the exact pattern of 021_schema_reorganization_phase1:
--   1. Move tables: public.charlotte_* → charlotte.*  (drop redundant prefix)
--   2. Grant privileges on new schema locations
--   3. Recreate trigger functions with schema-qualified names
--   4. Create compat views in public (public.charlotte_* → charlotte.*)
--   5. INSTEAD OF triggers to make compat views writable
--
-- After this migration:
--   Real tables : charlotte.practices, charlotte.progress,
--                 charlotte.leaderboard_cache, charlotte.users
--   App access  : public.charlotte_* (views — no app code changes needed)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Move tables to charlotte schema ──────────────────────────────────────
-- ALTER TABLE … SET SCHEMA preserves all indexes, triggers and RLS policies.

ALTER TABLE public.charlotte_practices         SET SCHEMA charlotte;
ALTER TABLE public.charlotte_progress          SET SCHEMA charlotte;
ALTER TABLE public.charlotte_leaderboard_cache SET SCHEMA charlotte;
ALTER TABLE public.charlotte_users             SET SCHEMA charlotte;

-- ── 2. Rename: drop the now-redundant charlotte_ prefix ─────────────────────
-- Schema already provides the namespace (charlotte.practices is unambiguous).
-- Existing tables in the schema keep their names (user_practices, user_progress
-- are legacy PWA tables — drop after PWA sunset).

ALTER TABLE charlotte.charlotte_practices         RENAME TO practices;
ALTER TABLE charlotte.charlotte_progress          RENAME TO progress;
ALTER TABLE charlotte.charlotte_leaderboard_cache RENAME TO leaderboard_cache;
ALTER TABLE charlotte.charlotte_users             RENAME TO users;

-- ── 3. Privileges (tables are new to the schema — default privs apply going
--        forward, but we grant explicitly for clarity) ─────────────────────────

GRANT ALL ON charlotte.practices         TO authenticated, service_role;
GRANT ALL ON charlotte.progress          TO authenticated, service_role;
GRANT ALL ON charlotte.leaderboard_cache TO authenticated, service_role;
GRANT ALL ON charlotte.users             TO authenticated, service_role;

-- ── 4. Recreate rn_on_practice_insert with schema-qualified names ─────────────
-- Also updates leaderboard display_name to read from charlotte.users
-- (charlotte_level) instead of public.users (user_level).

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
      )
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;

  -- ── Upsert charlotte.leaderboard_cache ───────────────────────────────────
  -- Read display name + level from charlotte.users (decoupled from public.users)
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

-- ── 5. Update check_and_promote_level() ──────────────────────────────────────

CREATE OR REPLACE FUNCTION check_and_promote_level(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_level text;
  v_total_xp      integer;
  v_new_level     text;
  v_leveled_up    boolean := false;
BEGIN
  SELECT charlotte_level INTO v_current_level
  FROM charlotte.users
  WHERE id = p_user_id;

  IF v_current_level IS NULL THEN
    RETURN jsonb_build_object('error', 'user not found');
  END IF;

  SELECT COALESCE(total_xp, 0) INTO v_total_xp
  FROM charlotte.progress
  WHERE user_id = p_user_id;

  v_new_level := v_current_level;

  IF v_current_level = 'Novice' AND v_total_xp >= 500 THEN
    v_new_level  := 'Inter';
    v_leveled_up := true;
  ELSIF v_current_level = 'Inter' AND v_total_xp >= 2000 THEN
    v_new_level  := 'Advanced';
    v_leveled_up := true;
  END IF;

  IF v_leveled_up THEN
    UPDATE charlotte.users
    SET charlotte_level = v_new_level,
        updated_at      = now()
    WHERE id = p_user_id;

    UPDATE charlotte.leaderboard_cache
    SET user_level = v_new_level
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'leveled_up',      v_leveled_up,
    'previous_level',  v_current_level,
    'new_level',       v_new_level,
    'total_xp',        v_total_xp
  );
END;
$$;

-- ── 6. Update create_charlotte_user_on_signup() ───────────────────────────────

CREATE OR REPLACE FUNCTION create_charlotte_user_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO charlotte.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── 7. Compat views in public ─────────────────────────────────────────────────
-- App code uses supabase.from('charlotte_*') — these views keep that working
-- without any changes to the React Native codebase.

CREATE OR REPLACE VIEW public.charlotte_practices
  AS SELECT * FROM charlotte.practices;

CREATE OR REPLACE VIEW public.charlotte_progress
  AS SELECT * FROM charlotte.progress;

CREATE OR REPLACE VIEW public.charlotte_leaderboard_cache
  AS SELECT * FROM charlotte.leaderboard_cache;

CREATE OR REPLACE VIEW public.charlotte_users
  AS SELECT * FROM charlotte.users;

-- ── 8. INSTEAD OF triggers — make compat views fully writable ─────────────────

-- charlotte_practices (INSERT only — reads go direct, trigger fires on base table)
CREATE OR REPLACE FUNCTION public.compat_charlotte_practices_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.practices SELECT (NEW).*;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS compat_ins ON public.charlotte_practices;
CREATE TRIGGER compat_ins
  INSTEAD OF INSERT ON public.charlotte_practices
  FOR EACH ROW EXECUTE FUNCTION public.compat_charlotte_practices_ins();

-- charlotte_progress (SELECT auto / INSERT+UPDATE needed for direct upserts)
CREATE OR REPLACE FUNCTION public.compat_charlotte_progress_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.progress SELECT (NEW).*
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp           = EXCLUDED.total_xp,
        streak_days        = EXCLUDED.streak_days,
        last_practice_date = EXCLUDED.last_practice_date,
        updated_at         = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.compat_charlotte_progress_upd()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charlotte.progress
  SET total_xp           = NEW.total_xp,
      streak_days        = NEW.streak_days,
      last_practice_date = NEW.last_practice_date,
      updated_at         = NEW.updated_at
  WHERE user_id = OLD.user_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS compat_ins ON public.charlotte_progress;
DROP TRIGGER IF EXISTS compat_upd ON public.charlotte_progress;
CREATE TRIGGER compat_ins
  INSTEAD OF INSERT ON public.charlotte_progress
  FOR EACH ROW EXECUTE FUNCTION public.compat_charlotte_progress_ins();
CREATE TRIGGER compat_upd
  INSTEAD OF UPDATE ON public.charlotte_progress
  FOR EACH ROW EXECUTE FUNCTION public.compat_charlotte_progress_upd();

-- charlotte_leaderboard_cache (SELECT + INSERT + UPDATE)
CREATE OR REPLACE FUNCTION public.compat_charlotte_leaderboard_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.leaderboard_cache SELECT (NEW).*
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp     = EXCLUDED.total_xp,
        user_level   = EXCLUDED.user_level,
        display_name = EXCLUDED.display_name,
        updated_at   = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.compat_charlotte_leaderboard_upd()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charlotte.leaderboard_cache
  SET total_xp     = NEW.total_xp,
      user_level   = NEW.user_level,
      display_name = NEW.display_name,
      updated_at   = NEW.updated_at
  WHERE user_id = OLD.user_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS compat_ins ON public.charlotte_leaderboard_cache;
DROP TRIGGER IF EXISTS compat_upd ON public.charlotte_leaderboard_cache;
CREATE TRIGGER compat_ins
  INSTEAD OF INSERT ON public.charlotte_leaderboard_cache
  FOR EACH ROW EXECUTE FUNCTION public.compat_charlotte_leaderboard_ins();
CREATE TRIGGER compat_upd
  INSTEAD OF UPDATE ON public.charlotte_leaderboard_cache
  FOR EACH ROW EXECUTE FUNCTION public.compat_charlotte_leaderboard_upd();

-- charlotte_users (SELECT + UPDATE + INSERT for signup trigger)
CREATE OR REPLACE FUNCTION public.compat_charlotte_users_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.users SELECT (NEW).*
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.compat_charlotte_users_upd()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charlotte.users
  SET email                = NEW.email,
      name                 = NEW.name,
      charlotte_level      = NEW.charlotte_level,
      placement_test_done  = NEW.placement_test_done,
      is_institutional     = NEW.is_institutional,
      is_active            = NEW.is_active,
      subscription_status  = NEW.subscription_status,
      trial_ends_at        = NEW.trial_ends_at,
      must_change_password = NEW.must_change_password,
      expo_push_token      = NEW.expo_push_token,
      updated_at           = NEW.updated_at
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS compat_ins ON public.charlotte_users;
DROP TRIGGER IF EXISTS compat_upd ON public.charlotte_users;
CREATE TRIGGER compat_ins
  INSTEAD OF INSERT ON public.charlotte_users
  FOR EACH ROW EXECUTE FUNCTION public.compat_charlotte_users_ins();
CREATE TRIGGER compat_upd
  INSTEAD OF UPDATE ON public.charlotte_users
  FOR EACH ROW EXECUTE FUNCTION public.compat_charlotte_users_upd();

-- ── 9. Verification ───────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '✅ 036_fix_charlotte_table_schemas completed.';
  RAISE NOTICE '   Tables moved to charlotte schema:';
  RAISE NOTICE '     charlotte.practices        (was public.charlotte_practices)';
  RAISE NOTICE '     charlotte.progress         (was public.charlotte_progress)';
  RAISE NOTICE '     charlotte.leaderboard_cache (was public.charlotte_leaderboard_cache)';
  RAISE NOTICE '     charlotte.users            (was public.charlotte_users)';
  RAISE NOTICE '   Compat views created: public.charlotte_* → charlotte.*';
  RAISE NOTICE '   Trigger functions updated to use schema-qualified names.';
  RAISE NOTICE '   App code requires NO changes (public.charlotte_* views transparent).';
END $$;

COMMIT;
