-- VERIFICAR: Todas subscriptions do Rodolfo (ativas + inativas)
-- Execute no Supabase SQL Editor

-- 1. TODAS subscriptions do Rodolfo (ativas + inativas)
SELECT 
  platform,
  subscription_type,
  LEFT(endpoint, 60) as endpoint_preview,
  is_active,
  created_at,
  updated_at
FROM push_subscriptions 
WHERE user_id = '9ede0b8b-a6dd-4301-8791-9d832f1ac4e4'  -- Rodolfo
ORDER BY created_at DESC;

-- 2. Contar por status
SELECT 
  platform,
  is_active,
  COUNT(*) as count
FROM push_subscriptions 
WHERE user_id = '9ede0b8b-a6dd-4301-8791-9d832f1ac4e4'
GROUP BY platform, is_active
ORDER BY platform, is_active;