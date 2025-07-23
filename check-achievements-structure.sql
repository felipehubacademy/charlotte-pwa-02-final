-- Verificar estrutura completa das tabelas de achievements
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- =====================================================
-- 1. ESTRUTURA DA TABELA user_achievements
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_achievements'
ORDER BY ordinal_position;

-- =====================================================
-- 2. ESTRUTURA DA TABELA achievements  
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'achievements'
ORDER BY ordinal_position;

-- =====================================================
-- 3. CONSTRAINTS E INDICES de user_achievements
-- =====================================================
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'user_achievements';

-- =====================================================
-- 4. SAMPLE DATA de user_achievements (últimos 5)
-- =====================================================
SELECT * 
FROM user_achievements 
ORDER BY earned_at DESC 
LIMIT 5;

-- =====================================================
-- 5. SAMPLE DATA de achievements (primeiros 5)
-- =====================================================
SELECT * 
FROM achievements 
ORDER BY created_at ASC 
LIMIT 5;

-- =====================================================
-- 6. CONTAGEM GERAL
-- =====================================================
SELECT 
  'user_achievements' as table_name,
  COUNT(*) as record_count
FROM user_achievements
UNION ALL
SELECT 
  'achievements' as table_name,
  COUNT(*) as record_count
FROM achievements; 