-- Script para verificar políticas RLS da tabela user_achievements

-- 1. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_achievements';

-- 2. Verificar políticas existentes
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
WHERE tablename = 'user_achievements';

-- 3. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_achievements'
ORDER BY ordinal_position;

-- 4. Testar inserção manual (substitua pelo seu user_id real)
-- INSERT INTO user_achievements (
--     user_id, 
--     achievement_name, 
--     achievement_description, 
--     achievement_type,
--     category,
--     badge_icon,
--     badge_color,
--     xp_bonus,
--     rarity,
--     earned_at
-- ) VALUES (
--     'a211b07f-b7b9-4314-a986-184e47fe964f',
--     'Test Achievement',
--     'Test Description',
--     'general',
--     'general',
--     '🏆',
--     '#A3FF3C',
--     10,
--     'common',
--     NOW()
-- ); 