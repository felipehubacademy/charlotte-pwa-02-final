-- 🔍 VERIFICAR ESTRUTURA DA TABELA USERS - Execute no SQL Editor do Supabase Dashboard
-- 1. ESTRUTURA DA TABELA USERS
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR MINHAS CONTAS ESPECIFICAMENTE
SELECT
  id,
  entra_id,
  name,
  preferred_reminder_time,
  reminder_frequency
FROM users
WHERE entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
ORDER BY name;

-- 3. VERIFICAR SE notification_preferences USA id OU entra_id
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR EXEMPLOS DE notification_preferences
SELECT
  user_id,
  practice_reminders,
  marketing,
  created_at
FROM notification_preferences
LIMIT 3; 