-- CORRIGIR: Rodolfo duplicatas iOS
-- Execute no Supabase SQL Editor

-- Manter apenas a subscription iOS mais recente do Rodolfo
UPDATE push_subscriptions 
SET is_active = false
WHERE user_id = '102a317e-1613-4c93-a60b-2ae17bd1005d'
  AND platform = 'ios'
  AND created_at != '2025-07-31 15:56:43.637+00';

-- Verificar resultado
SELECT platform, LEFT(endpoint, 60), is_active, created_at
FROM push_subscriptions 
WHERE user_id = '102a317e-1613-4c93-a60b-2ae17bd1005d'
ORDER BY created_at DESC;