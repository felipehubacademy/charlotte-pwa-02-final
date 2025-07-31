-- VERIFICAR: Mac subscriptions
-- Execute no Supabase SQL Editor

SELECT 
  'MAC' as device,
  platform,
  LEFT(endpoint, 60) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND is_active = true
ORDER BY created_at DESC;