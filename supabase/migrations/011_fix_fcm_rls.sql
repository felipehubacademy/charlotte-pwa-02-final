-- Fix RLS policies for push_subscriptions to support FCM
-- Migration: 011_fix_fcm_rls.sql

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions; 
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;

-- Create new policies that work with service role and user authentication
CREATE POLICY "Service role can manage all push subscriptions"
    ON push_subscriptions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can manage own push subscriptions"
    ON push_subscriptions FOR ALL
    USING (auth.uid()::text = user_id);

-- Create specific policy for API access (our case)
CREATE POLICY "API can manage push subscriptions"
    ON push_subscriptions FOR ALL
    USING (
        auth.role() = 'service_role' OR 
        auth.uid()::text = user_id OR
        auth.role() = 'authenticated'
    );

-- Grant necessary permissions
GRANT ALL ON push_subscriptions TO service_role;
GRANT ALL ON push_subscriptions TO authenticated;

-- Ensure the subscription_type column exists and has proper default
ALTER TABLE push_subscriptions 
ALTER COLUMN subscription_type SET DEFAULT 'web_push';

-- Add constraint to ensure subscription_type is valid
ALTER TABLE push_subscriptions 
DROP CONSTRAINT IF EXISTS check_subscription_type;

ALTER TABLE push_subscriptions 
ADD CONSTRAINT check_subscription_type 
CHECK (subscription_type IN ('web_push', 'fcm'));

-- Update platform constraint to include fcm option  
ALTER TABLE push_subscriptions 
DROP CONSTRAINT IF EXISTS push_subscriptions_platform_check;

ALTER TABLE push_subscriptions 
ADD CONSTRAINT push_subscriptions_platform_check 
CHECK (platform IN ('ios', 'android', 'desktop', 'fcm', 'unknown'));

-- Add helpful comment
COMMENT ON COLUMN push_subscriptions.subscription_type IS 'Type of push subscription: web_push for browser push API, fcm for Firebase Cloud Messaging'; 