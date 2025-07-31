-- DEBUG: Seus usuários reais e suas subscriptions
-- Execute no Supabase SQL Editor

-- 1. Ver TODAS as subscriptions dos seus usuários
SELECT 
  u.name,
  ps.platform,
  ps.subscription_type,
  LEFT(ps.endpoint, 60) as endpoint_preview,
  CASE 
    WHEN ps.endpoint LIKE '%web.push.apple.com%' THEN '🍎 Apple Web Push'
    WHEN ps.endpoint LIKE '%fcm.googleapis.com%' THEN '🤖 Google FCM'
    WHEN ps.endpoint LIKE '%mozilla%' THEN '🦊 Mozilla'
    ELSE '❓ Other'
  END as push_service_type,
  ps.fcm_token IS NOT NULL as has_fcm_token,
  ps.is_active,
  ps.created_at
FROM push_subscriptions ps
JOIN users u ON ps.user_id::text = u.id::text
WHERE u.id::text IN (
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84',  -- Felipe Xavier - Hub Academy
  '45842a23-6a3a-44fc-af02-156edc57451b',  -- Felipe Xavier  
  '9504226d-8777-4958-9ccb-4ba70ae3ed9e'   -- Arthur Ohtaguro
)
ORDER BY u.name, ps.created_at DESC;

-- 2. Contar subscriptions por usuário e plataforma
SELECT 
  u.name,
  ps.platform,
  ps.subscription_type,
  COUNT(*) as total_subscriptions
FROM push_subscriptions ps
JOIN users u ON ps.user_id::text = u.id::text
WHERE u.id::text IN (
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84',
  '45842a23-6a3a-44fc-af02-156edc57451b', 
  '9504226d-8777-4958-9ccb-4ba70ae3ed9e'
)
GROUP BY u.name, ps.platform, ps.subscription_type
ORDER BY u.name, ps.platform;

-- 3. Ver quais usuários TÊM subscriptions vs quais NÃO TÊM
SELECT 
  u.name,
  u.entra_id,
  CASE 
    WHEN COUNT(ps.id) > 0 THEN '✅ HAS SUBSCRIPTIONS'
    ELSE '❌ NO SUBSCRIPTIONS'
  END as subscription_status,
  COUNT(ps.id) as total_subscriptions,
  u.preferred_reminder_time
FROM users u
LEFT JOIN push_subscriptions ps ON u.id::text = ps.user_id::text
WHERE u.id::text IN (
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  '9504226d-8777-4958-9ccb-4ba70ae3ed9e'
)
GROUP BY u.name, u.entra_id, u.preferred_reminder_time
ORDER BY u.name;