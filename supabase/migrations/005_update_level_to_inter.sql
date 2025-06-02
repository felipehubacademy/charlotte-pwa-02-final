-- migrations/005_update_level_to_inter.sql
-- Atualizar todas as referências de 'Intermediate' para 'Inter' para consistência com grupos do Entra ID

-- 1. Atualizar tabela users
UPDATE users 
SET user_level = 'Inter' 
WHERE user_level = 'Intermediate';

-- 2. Atualizar tabela user_leaderboard_cache
UPDATE user_leaderboard_cache 
SET user_level = 'Inter' 
WHERE user_level = 'Intermediate';

-- 3. Atualizar constraint da tabela users se existir
DO $$
BEGIN
  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'users' AND constraint_name LIKE '%user_level%'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_level_check;
  END IF;
  
  -- Adicionar nova constraint
  ALTER TABLE users ADD CONSTRAINT users_user_level_check 
    CHECK (user_level IN ('Novice', 'Inter', 'Advanced'));
END $$;

-- 4. Atualizar valor padrão da tabela user_leaderboard_cache
ALTER TABLE user_leaderboard_cache 
ALTER COLUMN user_level SET DEFAULT 'Inter';

-- 5. Atualizar função populate_leaderboard_cache para usar 'Inter'
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
  
  -- Popular para cada nível (usando 'Inter' em vez de 'Intermediate')
  FOR level_name IN SELECT unnest(ARRAY['Novice', 'Inter', 'Advanced']) LOOP
    position_counter := 1;
    
    -- Buscar usuários deste nível ordenados por XP
    FOR user_record IN 
      SELECT 
        user_id,
        'Inter' as user_level, -- Atualizado para 'Inter'
        user_id as user_name, -- Usar user_id como fallback
        COALESCE(total_xp, 0) as total_xp,
        COALESCE(streak_days, 0) as streak_days
      FROM user_progress 
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
        user_record.user_id,
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
        '#' || LPAD(TO_HEX((HASHTEXT(COALESCE(user_record.user_name, user_record.user_id)) & 16777215)), 6, '0'),
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

-- 6. Atualizar função update_leaderboard_cache para usar 'Inter'
CREATE OR REPLACE FUNCTION update_leaderboard_cache()
RETURNS TRIGGER AS $$
DECLARE
  user_level_val TEXT;
  new_position INTEGER;
BEGIN
  -- Determinar nível do usuário (usando 'Inter' como padrão)
  user_level_val := COALESCE(NEW.user_level, 'Inter');
  
  -- Calcular nova posição
  SELECT COUNT(*) + 1 INTO new_position
  FROM user_progress 
  WHERE COALESCE(total_xp, 0) > COALESCE(NEW.total_xp, 0);
  
  -- Atualizar ou inserir no cache
  INSERT INTO user_leaderboard_cache (
    user_id, user_level, display_name, avatar_color, 
    level_number, total_xp, current_streak, position
  )
  VALUES (
    NEW.user_id,
    user_level_val,
    CASE 
      WHEN NEW.user_id IS NOT NULL AND NEW.user_id != '' THEN
        'User ' || LEFT(NEW.user_id, 8)
      ELSE 'Anonymous'
    END,
    '#' || LPAD(TO_HEX((HASHTEXT(COALESCE(NEW.user_id, 'anonymous')) & 16777215)), 6, '0'),
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

-- 7. Repopular o cache com os novos dados
SELECT populate_leaderboard_cache();

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Successfully updated all level references from Intermediate to Inter';
  RAISE NOTICE 'Updated tables: users, user_leaderboard_cache';
  RAISE NOTICE 'Updated functions: populate_leaderboard_cache, update_leaderboard_cache';
  RAISE NOTICE 'Cache repopulated with new level structure';
END $$; 