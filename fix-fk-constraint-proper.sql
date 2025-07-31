-- DEBUG: Foreign Key constraint (SQL correto)

-- 1. Ver FK constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='notification_logs';

-- 2. Verificar se os user IDs existem
SELECT 'Found in users table:' as status, id, name 
FROM users 
WHERE id IN (
  '9ede0b8b-a6dd-4301-8791-9d832f1ac4e4',
  'f77f6934-5468-461c-9dfe-1336cb37163a'
);

-- 3. Ver tipos das colunas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id'
UNION ALL
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_logs' AND column_name = 'user_id';