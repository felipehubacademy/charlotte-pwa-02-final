-- 🔍 VERIFICAR ERROS EM NOTIFICATION_PREFERENCES - Execute no SQL Editor do Supabase Dashboard
-- 1. VERIFICAR SE A TABELA EXISTE E TEM DADOS
SELECT 
  COUNT(*) as total_preferences,
  MIN(created_at) as primeira_preference,
  MAX(created_at) as ultima_preference
FROM notification_preferences;

-- 2. VERIFICAR ESTRUTURA DA TABELA
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE HÁ PREFERENCES PARA MINHAS CONTAS (mesmo que vazias)
SELECT
  u.name,
  u.entra_id,
  np.user_id as pref_user_id,
  np.practice_reminders,
  np.marketing,
  np.created_at as pref_created
FROM users u
LEFT JOIN notification_preferences np ON u.entra_id::uuid = np.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
ORDER BY u.name; 