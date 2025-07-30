-- 🔍 VERIFICAR TABELAS REAIS - Execute no SQL Editor do Supabase Dashboard

-- 1. LISTAR TODAS AS TABELAS
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. VERIFICAR TABELAS DE NOTIFICAÇÕES
SELECT 
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%notification%'
ORDER BY table_name;

-- 3. VERIFICAR TABELAS DE TOKENS
SELECT 
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%token%'
ORDER BY table_name;

-- 4. VERIFICAR TABELAS DE PUSH
SELECT 
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%push%'
ORDER BY table_name;

-- 5. VERIFICAR TABELAS DE FCM
SELECT 
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%fcm%'
ORDER BY table_name; 