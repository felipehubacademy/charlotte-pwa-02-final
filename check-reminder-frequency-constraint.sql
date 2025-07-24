-- Verificar constraint da coluna reminder_frequency
-- Execute no Supabase Dashboard para ver quais valores são permitidos

-- 1. Verificar todas as constraints da tabela users
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.constraint_column_usage 
WHERE table_name = 'users'
AND column_name = 'reminder_frequency';

-- 2. Verificar detalhes da constraint de check
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users'
AND tc.constraint_type = 'CHECK'
AND cc.check_clause LIKE '%reminder_frequency%';

-- 3. Verificar valores únicos existentes na coluna
SELECT DISTINCT reminder_frequency, COUNT(*) as count
FROM users 
WHERE reminder_frequency IS NOT NULL
GROUP BY reminder_frequency
ORDER BY count DESC;

-- 4. Ver definição completa da coluna
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'reminder_frequency'; 