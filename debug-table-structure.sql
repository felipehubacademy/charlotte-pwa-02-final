-- VERIFICAR: Onde está o preferred_reminder_time?
-- Execute no Supabase SQL Editor

-- 1. Verificar estrutura da tabela users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name LIKE '%reminder%';

-- 2. Verificar estrutura da tabela notification_preferences  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notification_preferences' AND column_name LIKE '%reminder%';

-- 3. Ver onde você atualizou
SELECT 
  users.name,
  users.entra_id,
  users.preferred_reminder_time as users_time,
  notification_preferences.preferred_reminder_time as prefs_time
FROM users 
LEFT JOIN notification_preferences ON users.id = notification_preferences.user_id
WHERE users.entra_id IN (
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4',
  '5ebb9b09-46f3-4499-b099-46a804da6fb6', 
  'ade732ef-433b-4736-a73e-4e9376664ad2'
);