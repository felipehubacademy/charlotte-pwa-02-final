-- migrations/001_xp_system_improvements.sql
-- Sistema XP Otimizado + Achievements + Leaderboard

-- Tabela de achievements dos usuários
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_bonus INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common',
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Tabela de cache do leaderboard
CREATE TABLE IF NOT EXISTS user_leaderboard_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_level TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  level_number INTEGER NOT NULL,
  total_xp INTEGER NOT NULL,
  current_streak INTEGER NOT NULL,
  position INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, user_level)
);

-- Adicionar campos para o novo sistema XP (se não existirem)
DO $$ 
BEGIN
  -- Verificar se a coluna achievement_ids existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_practices' AND column_name = 'achievement_ids'
  ) THEN
    ALTER TABLE user_practices ADD COLUMN achievement_ids TEXT[];
  END IF;

  -- Verificar se a coluna surprise_bonus existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_practices' AND column_name = 'surprise_bonus'
  ) THEN
    ALTER TABLE user_practices ADD COLUMN surprise_bonus INTEGER DEFAULT 0;
  END IF;

  -- Verificar se a coluna base_xp existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_practices' AND column_name = 'base_xp'
  ) THEN
    ALTER TABLE user_practices ADD COLUMN base_xp INTEGER DEFAULT 0;
  END IF;

  -- Verificar se a coluna bonus_xp existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_practices' AND column_name = 'bonus_xp'
  ) THEN
    ALTER TABLE user_practices ADD COLUMN bonus_xp INTEGER DEFAULT 0;
  END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_earned ON user_achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_level_position ON user_leaderboard_cache(user_level, position);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON user_leaderboard_cache(user_id);

-- Índice GIN para achievement_ids (se a extensão estiver disponível)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gin') THEN
    CREATE INDEX IF NOT EXISTS idx_practices_achievements ON user_practices USING GIN(achievement_ids);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Se não conseguir criar o índice GIN, criar um índice normal
    NULL;
END $$;

-- Função para atualizar leaderboard automaticamente
CREATE OR REPLACE FUNCTION update_leaderboard_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar posição no leaderboard quando XP mudar
  INSERT INTO user_leaderboard_cache (
    user_id, user_level, display_name, avatar_color, 
    level_number, total_xp, current_streak, position
  )
  SELECT 
    up.user_id,
    COALESCE(up.user_level, 'Intermediate') as user_level,
    CASE 
      WHEN up.user_name IS NOT NULL AND up.user_name != '' THEN
        SPLIT_PART(up.user_name, ' ', 1) || ' ' || 
        CASE 
          WHEN SPLIT_PART(up.user_name, ' ', 2) != '' THEN
            LEFT(SPLIT_PART(up.user_name, ' ', 2), 1) || '.'
          ELSE ''
        END
      ELSE 'Anonymous'
    END as display_name,
    '#' || LPAD(TO_HEX((HASHTEXT(COALESCE(up.user_name, up.user_id)) & 16777215)), 6, '0') as avatar_color,
    FLOOR(SQRT(up.total_xp / 50)) + 1 as level_number,
    up.total_xp,
    COALESCE(up.streak_days, 0) as current_streak,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(up.user_level, 'Intermediate') 
      ORDER BY up.total_xp DESC, COALESCE(up.streak_days, 0) DESC
    ) as position
  FROM user_progress up
  WHERE up.user_id = NEW.user_id
  ON CONFLICT (user_id, user_level) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    level_number = EXCLUDED.level_number,
    total_xp = EXCLUDED.total_xp,
    current_streak = EXCLUDED.current_streak,
    position = EXCLUDED.position,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar leaderboard (apenas se a tabela user_progress existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_progress') THEN
    DROP TRIGGER IF EXISTS trigger_update_leaderboard ON user_progress;
    CREATE TRIGGER trigger_update_leaderboard
      AFTER UPDATE OF total_xp ON user_progress
      FOR EACH ROW
      EXECUTE FUNCTION update_leaderboard_cache();
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON TABLE user_achievements IS 'Armazena as conquistas (achievements) dos usuários';
COMMENT ON TABLE user_leaderboard_cache IS 'Cache do leaderboard separado por nível de usuário';
COMMENT ON FUNCTION update_leaderboard_cache() IS 'Atualiza automaticamente o cache do leaderboard quando o XP do usuário muda';

-- Inserir dados de exemplo para teste (opcional)
-- INSERT INTO user_achievements (user_id, achievement_id, achievement_type, title, description, xp_bonus, rarity)
-- VALUES 
--   ('test-user-1', 'perfect-practice-1', 'perfect-practice', 'Perfect Practice!', 'Achieved 95%+ accuracy', 10, 'rare'),
--   ('test-user-1', 'long-sentence-1', 'long-sentence', 'Eloquent Speaker', 'Spoke a long, detailed sentence', 5, 'common');

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'XP System Improvements migration completed successfully';
  RAISE NOTICE 'Created tables: user_achievements, user_leaderboard_cache';
  RAISE NOTICE 'Added columns to user_practices: achievement_ids, surprise_bonus, base_xp, bonus_xp';
  RAISE NOTICE 'Created indexes and triggers for performance';
END $$; 