-- 20260423_reengagement_types.sql
--
-- Extends notifications.notification_logs to allow every re-engagement type
-- emitted by sendEngagementPushes (lib/expo-notification-service.ts), and
-- adds a denormalised last_practice_at column on charlotte.users so the
-- dispatcher can compute days-since-practice without a GROUP BY every hour.

ALTER TABLE notifications.notification_logs
  DROP CONSTRAINT IF EXISTS notification_logs_notification_type_check;

ALTER TABLE notifications.notification_logs
  ADD CONSTRAINT notification_logs_notification_type_check
  CHECK (notification_type IN (
    -- Core daily pipeline
    'streak_reminder', 'daily_reminder', 'charlotte_message',
    'xp_milestone', 'goal_reminder', 'weekly_challenge',
    -- Prevention
    'streak_saver', 'streak_milestone_ahead', 'level_imminent',
    'micro_checkin', 'cadence_drop', 'weekly_recap', 'charlotte_checkin',
    -- Revenue
    'trial_ending_72h', 'trial_ending_24h', 'sub_expired_1d',
    -- Winback
    'streak_broken',
    'reengagement_3d', 'reengagement_7d', 'reengagement_14d', 'reengagement_30d',
    -- PWA legacy
    'practice_reminder', 'achievement', 'marketing',
    -- Bookkeeping
    'scheduler_lock'
  ));

-- Denormalised last practice timestamp — kept in sync by trigger below.
ALTER TABLE charlotte.users
  ADD COLUMN IF NOT EXISTS last_practice_at TIMESTAMPTZ;

-- Backfill for existing users.
UPDATE charlotte.users u
   SET last_practice_at = sub.last_practice
  FROM (
    SELECT user_id, MAX(created_at) AS last_practice
    FROM charlotte.practices
    GROUP BY user_id
  ) sub
 WHERE sub.user_id = u.id
   AND (u.last_practice_at IS NULL OR u.last_practice_at < sub.last_practice);

-- Trigger: every new practice bumps the user's last_practice_at.
CREATE OR REPLACE FUNCTION charlotte.bump_user_last_practice()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charlotte.users
     SET last_practice_at = NEW.created_at
   WHERE id = NEW.user_id
     AND (last_practice_at IS NULL OR last_practice_at < NEW.created_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_user_last_practice ON charlotte.practices;

CREATE TRIGGER trg_bump_user_last_practice
AFTER INSERT ON charlotte.practices
FOR EACH ROW EXECUTE FUNCTION charlotte.bump_user_last_practice();

-- Index to speed up the dispatcher's "which users are dormant" filter.
CREATE INDEX IF NOT EXISTS idx_charlotte_users_last_practice_at
  ON charlotte.users (last_practice_at);
