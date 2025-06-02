-- migrations/006_make_achievement_id_optional.sql
-- Tornar achievement_id opcional para permitir achievements dinâmicos

-- Remover a constraint UNIQUE que inclui achievement_id
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_achievement_id_key;

-- Remover a foreign key constraint
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_achievement_id_fkey;

-- Tornar achievement_id opcional (permitir NULL)
ALTER TABLE user_achievements ALTER COLUMN achievement_id DROP NOT NULL;

-- Adicionar nova constraint UNIQUE apenas com user_id e title para evitar duplicatas
ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_user_id_title_key UNIQUE (user_id, title);

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Achievement_id is now optional in user_achievements';
  RAISE NOTICE 'Foreign key constraint removed';
  RAISE NOTICE 'New unique constraint: user_id + title';
END $$; 