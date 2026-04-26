-- ============================================================
-- Migration 035 — Charlotte schema
-- Renames rn_* tables to charlotte_* prefix (product-scoped,
-- not technology-scoped) and creates charlotte_users as
-- Charlotte's own user profile table, fully decoupled from LMS.
-- ============================================================

-- ── 1. Rename tables ─────────────────────────────────────────

ALTER TABLE rn_user_practices    RENAME TO charlotte_practices;
ALTER TABLE rn_user_progress     RENAME TO charlotte_progress;
ALTER TABLE rn_leaderboard_cache RENAME TO charlotte_leaderboard_cache;

-- ── 2. charlotte_users ───────────────────────────────────────
-- Charlotte's own user profile. No LMS fields (no lms_role,
-- no user_level from the shared users table).
-- is_institutional = true → placed by admin, skips paywall & placement test.

CREATE TABLE charlotte_users (
  id                    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 text        NOT NULL,
  name                  text,
  charlotte_level       text        NOT NULL DEFAULT 'Novice'
                                    CHECK (charlotte_level IN ('Novice', 'Inter', 'Advanced')),
  placement_test_done   boolean     NOT NULL DEFAULT false,
  is_institutional      boolean     NOT NULL DEFAULT false,  -- admin-managed, bypasses paywall
  is_active             boolean     NOT NULL DEFAULT true,
  subscription_status   text        NOT NULL DEFAULT 'none'
                                    CHECK (subscription_status IN ('none','trial','active','expired','cancelled')),
  trial_ends_at         timestamptz,
  must_change_password  boolean     NOT NULL DEFAULT false,
  expo_push_token       text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ── 3. Populate charlotte_users from existing users ──────────
-- Existing users who used Charlotte get migrated.
-- placement_test_done = true  → they already have a level, skip test.
-- is_institutional    = true  when lms_role IS NOT NULL (institutional origin).

INSERT INTO charlotte_users (
  id, email, name, charlotte_level, placement_test_done,
  is_institutional, is_active, subscription_status,
  trial_ends_at, must_change_password
)
SELECT
  u.id,
  u.email,
  COALESCE(u.name, split_part(u.email, '@', 1))        AS name,
  COALESCE(u.user_level, 'Novice')                      AS charlotte_level,
  true                                                   AS placement_test_done,
  (u.lms_role IS NOT NULL)                              AS is_institutional,
  u.is_active,
  u.subscription_status,
  u.trial_ends_at,
  u.must_change_password
FROM users u
ON CONFLICT (id) DO NOTHING;

-- ── 4. RLS on charlotte_users ────────────────────────────────

ALTER TABLE charlotte_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "charlotte_users: read own"
  ON charlotte_users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "charlotte_users: update own"
  ON charlotte_users FOR UPDATE
  USING (auth.uid() = id);

-- Service role (used by Next.js API + notifications) bypasses RLS automatically.

-- ── 5. updated_at trigger ────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER charlotte_users_updated_at
  BEFORE UPDATE ON charlotte_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 6. check_and_promote_level() ─────────────────────────────
-- Called from the app after each XP update.
-- Returns { leveled_up, previous_level, new_level, total_xp }.
--
-- Thresholds (can be tuned without app release):
--   Novice → Inter     : total_xp >= 500
--   Inter  → Advanced  : total_xp >= 2000

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
  FROM charlotte_users
  WHERE id = p_user_id;

  IF v_current_level IS NULL THEN
    RETURN jsonb_build_object('error', 'user not found');
  END IF;

  SELECT COALESCE(total_xp, 0) INTO v_total_xp
  FROM charlotte_progress
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
    UPDATE charlotte_users
    SET charlotte_level = v_new_level,
        updated_at      = now()
    WHERE id = p_user_id;

    -- Keep leaderboard cache in sync
    UPDATE charlotte_leaderboard_cache
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

-- ── 7. Helper: auto-create charlotte_users on new signup ─────
-- Fires when a new row is inserted in auth.users.
-- Ensures app subscribers always get a charlotte_users record.

CREATE OR REPLACE FUNCTION create_charlotte_user_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO charlotte_users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_charlotte_user_on_signup();

-- ── Notes for Supabase dashboard ─────────────────────────────
-- • Any existing DB triggers/functions that reference rn_user_practices,
--   rn_user_progress or rn_leaderboard_cache by name must be updated
--   to use the new charlotte_* names. Check:
--     SELECT tgname, tgrelid::regclass FROM pg_trigger;
-- • The service role key used in Next.js bypasses RLS — no changes needed there.
-- ─────────────────────────────────────────────────────────────
