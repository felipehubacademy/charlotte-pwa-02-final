-- migrations/003_fix_achievements_schema.sql
-- Correção do schema de achievements para unificar os sistemas

-- Verificar e adicionar colunas que podem estar faltando na tabela user_achievements
DO $$ 
BEGIN
  -- Verificar se a coluna achievement_code existe (sistema antigo)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_achievements' AND column_name = 'achievement_code'
  ) THEN
    ALTER TABLE user_achievements ADD COLUMN achievement_code TEXT;
    RAISE NOTICE 'Added achievement_code column';
  END IF;

  -- Verificar se a coluna achievement_name existe (sistema antigo)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_achievements' AND column_name = 'achievement_name'
  ) THEN
    ALTER TABLE user_achievements ADD COLUMN achievement_name TEXT;
    RAISE NOTICE 'Added achievement_name column';
  END IF;

  -- Verificar se a coluna achievement_description existe (sistema antigo)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_achievements' AND column_name = 'achievement_description'
  ) THEN
    ALTER TABLE user_achievements ADD COLUMN achievement_description TEXT;
    RAISE NOTICE 'Added achievement_description column';
  END IF;

  -- Verificar se a coluna category existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_achievements' AND column_name = 'category'
  ) THEN
    ALTER TABLE user_achievements ADD COLUMN category TEXT DEFAULT 'general';
    RAISE NOTICE 'Added category column';
  END IF;

  -- Verificar se a coluna badge_icon existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_achievements' AND column_name = 'badge_icon'
  ) THEN
    ALTER TABLE user_achievements ADD COLUMN badge_icon TEXT DEFAULT '🏆';
    RAISE NOTICE 'Added badge_icon column';
  END IF;

  -- Verificar se a coluna badge_color existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_achievements' AND column_name = 'badge_color'
  ) THEN
    ALTER TABLE user_achievements ADD COLUMN badge_color TEXT DEFAULT '#A3FF3C';
    RAISE NOTICE 'Added badge_color column';
  END IF;

  -- Garantir que as colunas principais não sejam NULL
  UPDATE user_achievements 
  SET 
    achievement_code = COALESCE(achievement_code, achievement_id::text),
    achievement_name = COALESCE(achievement_name, 'Achievement'),
    achievement_description = COALESCE(achievement_description, 'Achievement earned!')
  WHERE achievement_code IS NULL OR achievement_name IS NULL OR achievement_description IS NULL;

  RAISE NOTICE 'Achievement schema fix completed successfully';
END $$;

-- Criar índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_achievements_code ON user_achievements(achievement_code);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON user_achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON user_achievements(rarity);

-- Comentários para documentação
COMMENT ON COLUMN user_achievements.achievement_code IS 'Código único do achievement (sistema antigo)';
COMMENT ON COLUMN user_achievements.achievement_name IS 'Nome do achievement (sistema antigo)';
COMMENT ON COLUMN user_achievements.achievement_description IS 'Descrição do achievement (sistema antigo)';
COMMENT ON COLUMN user_achievements.category IS 'Categoria do achievement (milestone, streak, skill, etc.)';
COMMENT ON COLUMN user_achievements.badge_icon IS 'Ícone emoji do achievement';
COMMENT ON COLUMN user_achievements.badge_color IS 'Cor do badge do achievement';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Achievement schema migration completed successfully';
  RAISE NOTICE 'Added missing columns and unified achievement systems';
  RAISE NOTICE 'Created additional indexes for performance';
END $$; 