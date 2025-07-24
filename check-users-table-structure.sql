-- Verificar estrutura completa da tabela users
-- Execute no Supabase Dashboard para verificar quais colunas existem

-- 1. Verificar todas as colunas da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Verificar se as colunas específicas existem
SELECT 
    EXISTS(SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'preferred_reminder_time') as has_preferred_reminder_time,
    EXISTS(SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'reminder_frequency') as has_reminder_frequency;

-- 3. Verificar alguns registros da tabela users para ver a estrutura real
SELECT * FROM users LIMIT 3;

-- 4. Se as colunas não existirem, criar elas:
-- ALTER TABLE users 
-- ADD COLUMN IF NOT EXISTS preferred_reminder_time TIME DEFAULT '19:00:00',
-- ADD COLUMN IF NOT EXISTS reminder_frequency VARCHAR DEFAULT 'diaria';

-- 5. Verificar se a tabela notification_preferences existe
SELECT 
    table_name,
    EXISTS(SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'notification_preferences') as table_exists
FROM information_schema.tables 
WHERE table_name = 'notification_preferences';

-- 6. Se notification_preferences existe, verificar sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position; 