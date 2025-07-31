-- COMPARAR: Por que Rodolfo não recebe mas Felipe/Arthur sim?

-- 1. Ver subscription do Rodolfo vs suas
SELECT 
  'Rodolfo' as user_name,
  platform,
  LEFT(endpoint, 80) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id = '102a317e-1613-4c93-a60b-2ae17bd1005d'
  AND is_active = true

UNION ALL

SELECT 
  'Felipe iPhone' as user_name,
  platform,
  LEFT(endpoint, 80) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
  AND platform = 'ios'
  AND is_active = true

ORDER BY user_name, created_at DESC;