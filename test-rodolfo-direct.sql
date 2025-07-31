-- VOLTAR RODOLFO PARA 12:05 E TESTAR DIRETO

-- 1. Voltar horário do Rodolfo
UPDATE users 
SET preferred_reminder_time = '12:05:00'
WHERE entra_id = '102a317e-1613-4c93-a60b-2ae17bd1005d';

-- 2. Verificar subscription ativa do Rodolfo
SELECT 
  platform,
  LEFT(endpoint, 80) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id = '102a317e-1613-4c93-a60b-2ae17bd1005d'
  AND is_active = true
ORDER BY created_at DESC;