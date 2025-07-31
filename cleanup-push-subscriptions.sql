-- CLEANUP: Analisar e limpar push_subscriptions
-- Execute no Supabase SQL Editor

-- 1. Ver TODOS os registros atuais para entender a bagunça
SELECT 
  u.name,
  ps.platform,
  ps.subscription_type,
  CASE 
    WHEN ps.endpoint LIKE '%web.push.apple.com%' THEN 'Apple Web Push (iOS/Mac)'
    WHEN ps.endpoint LIKE '%fcm.googleapis.com%' THEN 'Google FCM'
    WHEN ps.endpoint LIKE '%mozilla%' THEN 'Mozilla/Firefox'
    WHEN LENGTH(ps.endpoint) < 100 THEN 'FCM Token'
    ELSE 'Unknown'
  END as endpoint_type,
  ps.fcm_token IS NOT NULL as has_fcm_token,
  ps.is_active,
  ps.created_at
FROM push_subscriptions ps
JOIN users u ON ps.user_id::text = u.id::text
WHERE u.name ILIKE '%felipe%'
ORDER BY ps.created_at DESC;

-- 2. Contar tipos de subscription por usuário
SELECT 
  u.name,
  ps.platform,
  ps.subscription_type,
  COUNT(*) as total_subscriptions
FROM push_subscriptions ps
JOIN users u ON ps.user_id::text = u.id::text
WHERE u.name ILIKE '%felipe%'
GROUP BY u.name, ps.platform, ps.subscription_type
ORDER BY u.name, ps.platform;

-- 3. Ver duplicatas e registros órfãos
SELECT 
  'Duplicates by endpoint' as issue_type,
  COUNT(*) as count
FROM push_subscriptions ps
JOIN users u ON ps.user_id::text = u.id::text
WHERE u.name ILIKE '%felipe%'
GROUP BY ps.endpoint
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'FCM tokens in endpoint column' as issue_type,
  COUNT(*) as count
FROM push_subscriptions ps
JOIN users u ON ps.user_id::text = u.id::text
WHERE u.name ILIKE '%felipe%'
  AND ps.subscription_type = 'web_push'
  AND LENGTH(ps.endpoint) < 100; -- FCM tokens são curtos