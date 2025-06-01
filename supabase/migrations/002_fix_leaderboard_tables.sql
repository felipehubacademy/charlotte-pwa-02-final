-- migrations/002_fix_leaderboard_tables.sql
-- Correção e inicialização do sistema de leaderboard

-- Verificar e recriar tabela user_leaderboard_cache se necessário
DROP TABLE IF EXISTS user_leaderboard_cache CASCADE;

CREATE TABLE user_leaderboard_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_level TEXT NOT NULL DEFAULT 'Intermediate',
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  avatar_color TEXT NOT NULL DEFAULT '#A3FF3C',
  level_number INTEGER NOT NULL DEFAULT 1,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, user_level)
);

-- Índices para performance
CREATE INDEX idx_leaderboard_level_position ON user_leaderboard_cache(user_level, position);
CREATE INDEX idx_leaderboard_user ON user_leaderboard_cache(user_id);
CREATE INDEX idx_leaderboard_updated ON user_leaderboard_cache(updated_at DESC);

-- Função melhorada para popular leaderboard
CREATE OR REPLACE FUNCTION populate_leaderboard_cache()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  level_name TEXT;
  position_counter INTEGER;
  total_inserted INTEGER := 0;
BEGIN
  -- Limpar cache existente
  DELETE FROM user_leaderboard_cache;
  
  -- Popular para cada nível
  FOR level_name IN SELECT unnest(ARRAY['Novice', 'Intermediate', 'Advanced']) LOOP
    position_counter := 1;
    
    -- Buscar usuários deste nível ordenados por XP
    FOR user_record IN 
      SELECT 
        entra_id,
        COALESCE(user_level, 'Intermediate') as user_level,
        COALESCE(user_name, entra_id) as user_name,
        COALESCE(total_xp, 0) as total_xp,
        COALESCE(streak_days, 0) as streak_days
      FROM user_progress 
      WHERE COALESCE(user_level, 'Intermediate') = level_name
      ORDER BY COALESCE(total_xp, 0) DESC, COALESCE(streak_days, 0) DESC
    LOOP
      -- Inserir no cache
      INSERT INTO user_leaderboard_cache (
        user_id, 
        user_level, 
        display_name, 
        avatar_color,
        level_number, 
        total_xp, 
        current_streak, 
        position
      ) VALUES (
        user_record.entra_id,
        level_name,
        CASE 
          WHEN user_record.user_name IS NOT NULL AND user_record.user_name != '' THEN
            SPLIT_PART(user_record.user_name, ' ', 1) || 
            CASE 
              WHEN SPLIT_PART(user_record.user_name, ' ', 2) != '' THEN
                ' ' || LEFT(SPLIT_PART(user_record.user_name, ' ', 2), 1) || '.'
              ELSE ''
            END
          ELSE 'Anonymous'
        END,
        '#' || LPAD(TO_HEX((HASHTEXT(COALESCE(user_record.user_name, user_record.entra_id)) & 16777215)), 6, '0'),
        FLOOR(SQRT(user_record.total_xp / 50)) + 1,
        user_record.total_xp,
        user_record.streak_days,
        position_counter
      );
      
      position_counter := position_counter + 1;
      total_inserted := total_inserted + 1;
    END LOOP;
  END LOOP;
  
  RETURN total_inserted;
END;
$$ LANGUAGE plpgsql;

-- Popular o cache inicialmente
SELECT populate_leaderboard_cache();

-- Função para atualizar leaderboard automaticamente (melhorada)
CREATE OR REPLACE FUNCTION update_leaderboard_cache()
RETURNS TRIGGER AS $$
DECLARE
  user_level_val TEXT;
  new_position INTEGER;
BEGIN
  -- Determinar nível do usuário
  user_level_val := COALESCE(NEW.user_level, 'Intermediate');
  
  -- Calcular nova posição
  SELECT COUNT(*) + 1 INTO new_position
  FROM user_progress 
  WHERE COALESCE(user_level, 'Intermediate') = user_level_val 
    AND COALESCE(total_xp, 0) > COALESCE(NEW.total_xp, 0);
  
  -- Atualizar ou inserir no cache
  INSERT INTO user_leaderboard_cache (
    user_id, user_level, display_name, avatar_color, 
    level_number, total_xp, current_streak, position
  )
  VALUES (
    NEW.entra_id,
    user_level_val,
    CASE 
      WHEN NEW.user_name IS NOT NULL AND NEW.user_name != '' THEN
        SPLIT_PART(NEW.user_name, ' ', 1) || 
        CASE 
          WHEN SPLIT_PART(NEW.user_name, ' ', 2) != '' THEN
            ' ' || LEFT(SPLIT_PART(NEW.user_name, ' ', 2), 1) || '.'
          ELSE ''
        END
      ELSE 'Anonymous'
    END,
    '#' || LPAD(TO_HEX((HASHTEXT(COALESCE(NEW.user_name, NEW.entra_id)) & 16777215)), 6, '0'),
    FLOOR(SQRT(COALESCE(NEW.total_xp, 0) / 50)) + 1,
    COALESCE(NEW.total_xp, 0),
    COALESCE(NEW.streak_days, 0),
    new_position
  )
  ON CONFLICT (user_id, user_level) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    level_number = EXCLUDED.level_number,
    total_xp = EXCLUDED.total_xp,
    current_streak = EXCLUDED.current_streak,
    position = EXCLUDED.position,
    updated_at = NOW();
    
  -- Recalcular posições de todos os usuários deste nível
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_xp DESC, current_streak DESC) as new_pos
    FROM user_leaderboard_cache 
    WHERE user_level = user_level_val
  )
  UPDATE user_leaderboard_cache 
  SET position = ranked_users.new_pos,
      updated_at = NOW()
  FROM ranked_users 
  WHERE user_leaderboard_cache.user_id = ranked_users.user_id 
    AND user_leaderboard_cache.user_level = user_level_val;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON user_progress;
CREATE TRIGGER trigger_update_leaderboard
  AFTER INSERT OR UPDATE OF total_xp, streak_days ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_cache();

-- Comentários
COMMENT ON TABLE user_leaderboard_cache IS 'Cache do leaderboard separado por nível de usuário - CORRIGIDO';
COMMENT ON FUNCTION populate_leaderboard_cache() IS 'Popula o cache do leaderboard com todos os usuários';
COMMENT ON FUNCTION update_leaderboard_cache() IS 'Atualiza automaticamente o cache do leaderboard quando dados mudam';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Leaderboard tables fixed and populated successfully';
  RAISE NOTICE 'Total entries in cache: %', (SELECT COUNT(*) FROM user_leaderboard_cache);
END $$; 