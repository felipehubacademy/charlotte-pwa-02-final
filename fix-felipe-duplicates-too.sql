-- CORRIGIR: Felipe iPhone TAMBÉM tem duplicatas!

-- Felipe tem 3 subscriptions iOS ativas - manter apenas a mais recente
UPDATE push_subscriptions 
SET is_active = false
WHERE user_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
  AND platform = 'ios'
  AND created_at != '2025-07-31 16:21:05.095+00';

-- Verificar resultado
SELECT 
  'Felipe após limpeza' as status,
  platform,
  LEFT(endpoint, 80) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
  AND platform = 'ios'
ORDER BY created_at DESC;