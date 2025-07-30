-- 🔍 VERIFICAR SE A TABELA EXISTE - Execute no SQL Editor do Supabase Dashboard
-- 1. VERIFICAR SE A TABELA EXISTE
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'notification_preferences'
  AND table_schema = 'public';

-- 2. SE EXISTIR, VERIFICAR ESTRUTURA
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. SE EXISTIR, VERIFICAR DADOS
SELECT 
  COUNT(*) as total_rows,
  MIN(created_at) as primeira_linha,
  MAX(created_at) as ultima_linha
FROM notification_preferences;

-- 4. VERIFICAR RLS POLICIES
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notification_preferences'; 