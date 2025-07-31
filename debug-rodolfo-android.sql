-- VERIFICAR: Rodolfo Android não recebendo
-- Execute no Supabase SQL Editor

-- 1. Buscar Rodolfo no users
SELECT 
  id, 
  entra_id,
  name,
  preferred_reminder_time,
  reminder_frequency
FROM users 
WHERE name ILIKE '%rodolfo%' OR name ILIKE '%hott%';

-- 2. Verificar push_subscriptions do Rodolfo
SELECT 
  platform,
  subscription_type,
  LEFT(endpoint, 60) as endpoint_preview,
  is_active,
  created_at,
  updated_at
FROM push_subscriptions 
WHERE user_id IN (
  SELECT id::uuid FROM users WHERE name ILIKE '%rodolfo%'
)
ORDER BY created_at DESC;

-- 3. Verificar notification_preferences do Rodolfo
SELECT 
  users.name,
  notification_preferences.practice_reminders,
  notification_preferences.marketing,
  notification_preferences.created_at,
  notification_preferences.updated_at
FROM users 
LEFT JOIN notification_preferences ON users.id::uuid = notification_preferences.user_id
WHERE users.name ILIKE '%rodolfo%';

-- 4. SIMULAR: Rodolfo seria encontrado pelo scheduler?
SELECT 
  'SCHEDULER_TEST' as test,
  users.id,
  users.entra_id,
  users.name,
  users.preferred_reminder_time,
  users.reminder_frequency
FROM users 
WHERE users.reminder_frequency != 'disabled'
  AND users.preferred_reminder_time = '12:05:00'
  AND users.name ILIKE '%rodolfo%';