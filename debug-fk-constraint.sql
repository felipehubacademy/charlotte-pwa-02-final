-- DEBUG: Foreign Key constraint violation

-- 1. Ver estrutura das tabelas
\d+ users
\d+ notification_logs

-- 2. Ver FK constraint específica
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='notification_logs'
  AND tc.constraint_name = 'notification_logs_user_id_fkey';

-- 3. Ver os user_ids que estão falhando
SELECT 'Rodolfo ID:', '9ede0b8b-a6dd-4301-8791-9d832f1ac4e4'
UNION ALL
SELECT 'Humberto ID:', '573380b9-c117-4e4b-9f83-79a7a3de9667';

-- 4. Verificar se esses IDs existem na tabela users
SELECT id, name FROM users 
WHERE id IN (
  '9ede0b8b-a6dd-4301-8791-9d832f1ac4e4',
  '573380b9-c117-4e4b-9f83-79a7a3de9667'
);