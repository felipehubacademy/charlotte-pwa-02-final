-- Add FCM support to push_subscriptions table
-- Migration: 010_add_fcm_support.sql

-- Add subscription_type column if it doesn't exist
ALTER TABLE push_subscriptions 
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) DEFAULT 'web_push';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_type 
ON push_subscriptions(subscription_type);

-- Update existing records to have subscription_type
UPDATE push_subscriptions 
SET subscription_type = 'web_push' 
WHERE subscription_type IS NULL;

-- Add comment
COMMENT ON COLUMN push_subscriptions.subscription_type IS 'Type of subscription: web_push, fcm'; 