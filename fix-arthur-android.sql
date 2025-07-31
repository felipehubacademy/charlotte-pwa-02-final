-- LIMPAR: Arthur tem 2 Android subscriptions ativas
-- Execute no Supabase SQL Editor

-- 1. Desativar subscription Android ANTIGA (2025-07-30)
UPDATE push_subscriptions 
SET is_active = false
WHERE user_id = 'ade732ef-433b-4736-a73e-4e9376664ad2'
  AND platform = 'android'
  AND created_at = '2025-07-30 15:41:12.438+00';

-- 2. Verificar resultado - deve sobrar apenas 1 Android + 1 Windows
SELECT 
  platform,
  LEFT(endpoint, 60) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id = 'ade732ef-433b-4736-a73e-4e9376664ad2'
  AND is_active = true
ORDER BY platform, created_at DESC;