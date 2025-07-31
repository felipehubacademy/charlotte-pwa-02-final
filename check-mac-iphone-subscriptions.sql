-- VERIFICAR: Subscriptions Mac/iPhone (recebendo 3x)
-- Execute no Supabase SQL Editor

-- Mac (Felipe)
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

-- iPhone (Felipe) 
SELECT 
  'IPHONE' as device,
  platform,
  LEFT(endpoint, 60) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
  AND is_active = true
ORDER BY created_at DESC;