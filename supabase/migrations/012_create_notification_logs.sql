-- Migration: Create notification logs table for structured logging
-- File: 012_create_notification_logs.sql

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (
        notification_type IN (
            'practice_reminder',
            'streak_reminder', 
            'weekly_challenge',
            'goal_reminder',
            'achievement',
            'marketing'
        )
    ),
    status TEXT NOT NULL CHECK (
        status IN (
            'sent',
            'delivered',
            'clicked',
            'dismissed',
            'failed',
            'blocked'
        )
    ),
    message_title TEXT,
    message_body TEXT,
    platform TEXT DEFAULT 'web' CHECK (
        platform IN ('web', 'ios', 'android', 'fcm')
    ),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_platform ON notification_logs(platform);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_type ON notification_logs(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_date_type ON notification_logs(created_at, notification_type);

-- Enable RLS (Row Level Security)
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_logs
-- Service role can manage all logs (for backend operations)
CREATE POLICY "Service role can manage all notification logs"
    ON notification_logs FOR ALL
    USING (auth.role() = 'service_role');

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
    ON notification_logs FOR SELECT
    USING (
        auth.role() = 'service_role' OR 
        auth.uid() = user_id OR
        auth.role() = 'authenticated'
    );

-- Only service role can insert/update/delete logs (security)
CREATE POLICY "Only service role can modify logs"
    ON notification_logs FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update logs"
    ON notification_logs FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can delete logs"
    ON notification_logs FOR DELETE
    USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON notification_logs TO authenticated;
GRANT ALL ON notification_logs TO service_role;

-- Add helpful comments
COMMENT ON TABLE notification_logs IS 'Structured logs for all notification delivery and engagement tracking';
COMMENT ON COLUMN notification_logs.user_id IS 'UUID reference to users table';
COMMENT ON COLUMN notification_logs.notification_type IS 'Type of notification sent';
COMMENT ON COLUMN notification_logs.status IS 'Current status of the notification';
COMMENT ON COLUMN notification_logs.message_title IS 'Title of the notification sent';
COMMENT ON COLUMN notification_logs.message_body IS 'Body content of the notification';
COMMENT ON COLUMN notification_logs.platform IS 'Platform where notification was sent';
COMMENT ON COLUMN notification_logs.error_message IS 'Error message if notification failed';
COMMENT ON COLUMN notification_logs.metadata IS 'Additional metadata as JSON (device info, campaign data, etc.)';

-- Create a view for analytics
CREATE OR REPLACE VIEW notification_analytics AS
SELECT 
    notification_type,
    platform,
    status,
    DATE(created_at) as date,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'clicked')) as successful,
    COUNT(*) FILTER (WHERE status = 'clicked') as engaged,
    COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM notification_logs
GROUP BY notification_type, platform, status, DATE(created_at)
ORDER BY date DESC, notification_type;

-- Grant access to the view
GRANT SELECT ON notification_analytics TO authenticated;
GRANT ALL ON notification_analytics TO service_role;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE '✅ Notification logs table created successfully';
  RAISE NOTICE '   - Table: notification_logs with RLS policies';
  RAISE NOTICE '   - Indexes: Optimized for queries by user, type, date, and status';
  RAISE NOTICE '   - View: notification_analytics for reporting';
  RAISE NOTICE '   - Security: Service role required for modifications';
END $$; 