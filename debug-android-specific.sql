-- DEBUG ANDROID: Ver exatamente o que aconteceu
-- Execute no Supabase SQL Editor

-- 1. Ver subscription do Android (Arthur) em detalhes
SELECT 
  u.name,
  u.entra_id,
  u.preferred_reminder_time,
  ps.platform,
  ps.subscription_type,
  ps.endpoint,
  ps.keys,
  ps.is_active,
  ps.created_at,
  CASE 
    WHEN ps.endpoint LIKE '%fcm.googleapis.com%' THEN '🤖 Google FCM - Should work'
    WHEN ps.endpoint LIKE '%web.push.apple.com%' THEN '🍎 Apple Web Push'
    ELSE '❓ Unknown endpoint type'
  END as endpoint_analysis
FROM push_subscriptions ps
JOIN users u ON ps.user_id = u.entra_id
WHERE u.entra_id = 'ade732ef-433b-4736-a73e-4e9376664ad2'  -- Arthur Android
ORDER BY ps.created_at DESC;

-- 2. Ver notification_preferences do Arthur
SELECT 
  u.name,
  u.entra_id,
  np.practice_reminders,
  np.marketing,
  np.updated_at
FROM users u
JOIN notification_preferences np ON u.id::text = np.user_id::text
WHERE u.entra_id = 'ade732ef-433b-4736-a73e-4e9376664ad2';

-- 3. Ver últimas tentativas de notificação (logs)
SELECT 
  nl.notification_type,
  nl.user_id,
  nl.status,
  nl.error_message,
  nl.created_at,
  u.name
FROM notification_logs nl
LEFT JOIN users u ON nl.user_id::text = u.entra_id
WHERE nl.created_at > NOW() - INTERVAL '2 hours'
  AND (nl.user_id = 'ade732ef-433b-4736-a73e-4e9376664ad2' 
       OR u.entra_id = 'ade732ef-433b-4736-a73e-4e9376664ad2')
ORDER BY nl.created_at DESC;