-- migrations/005_fix_achievements_description.sql
-- Corrigir achievements existentes que podem ter description NULL

-- Atualizar achievements que têm description NULL ou vazio
UPDATE user_achievements 
SET description = CONCAT('Achievement: ', title)
WHERE description IS NULL OR description = '';

-- Garantir que description nunca seja NULL no futuro
ALTER TABLE user_achievements 
ALTER COLUMN description SET NOT NULL;

-- Adicionar valor padrão para description
ALTER TABLE user_achievements 
ALTER COLUMN description SET DEFAULT 'Achievement earned!';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Fixed achievements with NULL descriptions';
  RAISE NOTICE 'Set description as NOT NULL with default value';
END $$; 