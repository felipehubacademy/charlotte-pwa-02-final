-- Script para executar manualmente no Supabase Dashboard
-- SQL Editor > New Query > Cole este código e execute

-- 1. Remover constraints que estão causando problemas
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_achievement_id_key;
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_achievement_id_fkey;

-- 2. Tornar achievement_id opcional
ALTER TABLE user_achievements ALTER COLUMN achievement_id DROP NOT NULL;

-- 3. Adicionar constraint única por user_id + title
ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_user_id_title_key UNIQUE (user_id, title);

-- 4. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_achievements' 
ORDER BY ordinal_position;

-- 5. Testar inserção
INSERT INTO user_achievements (
  user_id, 
  achievement_id, 
  title, 
  description, 
  xp_bonus, 
  rarity, 
  achievement_type, 
  type
) VALUES (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  NULL,
  'Test Achievement',
  'Test description',
  10,
  'common',
  'general',
  'general'
) ON CONFLICT (user_id, title) DO NOTHING;

-- 6. Verificar se funcionou
SELECT * FROM user_achievements WHERE title = 'Test Achievement';

-- 7. Limpar teste
DELETE FROM user_achievements WHERE title = 'Test Achievement'; 