-- CRITICAL: iPhone tem 6 subscriptions ativas! 
-- Manter apenas a mais recente (14:22 hoje)

-- 1. Desativar 5 subscriptions antigas do iPhone
UPDATE push_subscriptions 
SET is_active = false
WHERE user_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
  AND platform = 'ios'
  AND created_at != '2025-07-31 14:22:51.948+00';

-- 2. Verificar resultado - deve sobrar apenas 1 iOS
SELECT 
  'AFTER_CLEANUP' as status,
  platform,
  LEFT(endpoint, 60) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
  AND is_active = true
ORDER BY created_at DESC;