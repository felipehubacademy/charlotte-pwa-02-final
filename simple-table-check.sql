-- SQL simples para verificar estrutura das tabelas
-- Execute uma query de cada vez no Supabase

-- 1. Ver todas as colunas de user_achievements
\d user_achievements;

-- OU se não funcionar, use:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_achievements';

-- 2. Ver todas as colunas de achievements
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'achievements';

-- 3. Ver um registro completo de user_achievements
SELECT * FROM user_achievements LIMIT 1;

-- 4. Ver um registro completo de achievements  
SELECT * FROM achievements LIMIT 1; 