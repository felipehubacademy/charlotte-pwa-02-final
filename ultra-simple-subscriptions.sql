-- ULTRA SIMPLES: Só subscriptions ativas
-- Execute no Supabase SQL Editor

SELECT 
  LEFT(endpoint, 60) as endpoint_preview,
  platform,
  created_at,
  user_id
FROM push_subscriptions 
WHERE is_active = true
ORDER BY platform, created_at DESC;