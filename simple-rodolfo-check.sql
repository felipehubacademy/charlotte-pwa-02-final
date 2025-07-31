-- SIMPLES: Verificar Rodolfo
-- Execute no Supabase SQL Editor

-- 1. Buscar Rodolfo
SELECT 
  id, 
  entra_id,
  name,
  preferred_reminder_time,
  reminder_frequency
FROM users 
WHERE name ILIKE '%rodolfo%';

-- 2. Suas subscriptions iPhone (se achou o ID acima)
SELECT 
  platform,
  LEFT(endpoint, 60) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id = '9ede0b8b-a6dd-4301-8791-9d832f1ac4e4'  -- ID do Rodolfo dos logs anteriores
  AND platform = 'ios'  -- Filtrar apenas iOS
ORDER BY created_at DESC;

-- 3. Notification preferences
SELECT 
  practice_reminders,
  marketing,
  created_at
FROM notification_preferences 
WHERE user_id = '9ede0b8b-a6dd-4301-8791-9d832f1ac4e4';