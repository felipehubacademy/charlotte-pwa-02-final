-- Debug: Android push subscriptions and tokens
-- Execute no Supabase SQL Editor

-- 1. Ver todas as subscriptions do usuário Felipe
SELECT 
  u.name,
  ps.platform,
  ps.subscription_type,
  ps.endpoint,
  ps.created_at,
  ps.is_active,
  CASE 
    WHEN ps.endpoint LIKE '%fcm.googleapis.com%' THEN 'FCM'
    WHEN ps.endpoint LIKE '%web.push.apple.com%' THEN 'Apple Web Push'
    WHEN ps.endpoint LIKE '%mozilla.com%' THEN 'Mozilla'
    WHEN ps.endpoint LIKE '%push.services.mozilla.com%' THEN 'Firefox'
    ELSE 'Other'
  END as push_service
FROM push_subscriptions ps
JOIN users u ON ps.user_id::text = u.id::text
WHERE u.name ILIKE '%felipe%'
ORDER BY ps.created_at DESC;

-- 2. Ver preferências dos usuários Felipe
SELECT 
  u.name,
  u.preferred_reminder_time,
  u.reminder_frequency,
  np.practice_reminders,
  np.marketing
FROM users u
LEFT JOIN notification_preferences np ON u.id::text = np.user_id::text
WHERE u.name ILIKE '%felipe%'
  AND (u.preferred_reminder_time = '10:30:00' OR u.preferred_reminder_time = '10:00:00');

-- 3. Ver FCM tokens específicos
SELECT 
  u.name,
  ps.fcm_token,
  ps.platform,
  ps.created_at
FROM push_subscriptions ps
JOIN users u ON ps.user_id::text = u.id::text
WHERE u.name ILIKE '%felipe%'
  AND ps.fcm_token IS NOT NULL
ORDER BY ps.created_at DESC;