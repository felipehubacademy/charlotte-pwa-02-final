-- Script para verificar estrutura da tabela user_achievements
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar colunas da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_achievements' 
ORDER BY ordinal_position;

-- 2. Verificar constraints
SELECT 
  constraint_name, 
  constraint_type, 
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_achievements';

-- 3. Verificar dados existentes (sample)
SELECT * FROM user_achievements LIMIT 5;

-- 4. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_achievements'
) as table_exists; 