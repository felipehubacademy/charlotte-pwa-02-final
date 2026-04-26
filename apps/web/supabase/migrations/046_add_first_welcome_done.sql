-- Add first_welcome_done to charlotte.users (underlying table)
-- and recreate the charlotte_users view to expose it.
--
-- false (default) = show first-access welcome audio (new dedicated greeting)
-- true            = show random greeting from returning pool on each login

ALTER TABLE charlotte.users
  ADD COLUMN IF NOT EXISTS first_welcome_done boolean NOT NULL DEFAULT false;

DROP VIEW IF EXISTS public.charlotte_users;
CREATE VIEW public.charlotte_users AS
  SELECT
    users.id,
    users.email,
    users.name,
    users.charlotte_level,
    users.placement_test_done,
    users.first_welcome_done,
    users.is_institutional,
    users.is_active,
    users.subscription_status,
    users.trial_ends_at,
    users.must_change_password,
    users.expo_push_token,
    users.created_at,
    users.updated_at,
    users.live_voice_seconds_used,
    users.live_voice_reset_date,
    users.avatar_url
  FROM charlotte.users;
