-- 20260423_extend_notification_logs_for_rn.sql
--
-- The RN push pipeline (lib/expo-notification-service.ts) sends types that the
-- original CHECK constraint on notifications.notification_logs does not list
-- (daily_reminder, charlotte_message, xp_milestone), and it also writes an
-- operational row called 'scheduler_lock'. Rather than shipping around the
-- check we broaden it once here so every scheduler run, send attempt and
-- template variant can be logged — giving the frequency-cap / variant-tracking
-- / novelty-decay quick wins a single source of truth.

ALTER TABLE notifications.notification_logs
  DROP CONSTRAINT IF EXISTS notification_logs_notification_type_check;

ALTER TABLE notifications.notification_logs
  ADD CONSTRAINT notification_logs_notification_type_check
  CHECK (notification_type IN (
    -- RN push types (lib/expo-notification-service.ts)
    'streak_reminder',
    'daily_reminder',
    'charlotte_message',
    'xp_milestone',
    'goal_reminder',
    'weekly_challenge',
    -- PWA legacy (kept while PWA is still alive)
    'practice_reminder',
    'achievement',
    'marketing',
    -- scheduler bookkeeping
    'scheduler_lock'
  ));

-- Helpful index for the "has user X received type Y in the last N hours"
-- query used by the frequency cap and novelty decay.
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_type_created
  ON notifications.notification_logs (user_id, notification_type, created_at DESC);
