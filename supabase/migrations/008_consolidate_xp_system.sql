-- 008_consolidate_xp_system.sql
-- Consolidar sistema XP de forma profissional

-- =====================================================
-- 1. CRIAR TABELA user_progress (XP CONSOLIDADO)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_practices INTEGER DEFAULT 0,
  total_text_practices INTEGER DEFAULT 0,
  total_audio_practices INTEGER DEFAULT 0,
  total_live_voice_practices INTEGER DEFAULT 0,
  average_pronunciation_score DECIMAL(5,2),
  average_grammar_score DECIMAL(5,2),
  last_practice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CORRIGIR user_practices (ADICIONAR XP)
-- =====================================================

-- Adicionar coluna xp_earned se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_practices' AND column_name = 'xp_earned'
  ) THEN
    ALTER TABLE user_practices ADD COLUMN xp_earned INTEGER DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- 3. MIGRAR DADOS EXISTENTES
-- =====================================================

-- Migrar XP de user_sessions para user_progress
INSERT INTO user_progress (
  user_id, 
  total_xp, 
  total_practices,
  last_practice_date,
  created_at
)
SELECT 
  us.user_id,
  COALESCE(SUM(us.total_xp_earned), 0) as total_xp,
  COALESCE(SUM(us.practice_count), 0) as total_practices,
  MAX(us.session_date) as last_practice_date,
  MIN(us.created_at) as created_at
FROM user_sessions us
GROUP BY us.user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_xp = EXCLUDED.total_xp,
  total_practices = EXCLUDED.total_practices,
  last_practice_date = EXCLUDED.last_practice_date,
  updated_at = NOW();

-- Adicionar XP de achievements ao total consolidado
UPDATE user_progress 
SET total_xp = total_xp + (
  SELECT COALESCE(SUM(ua.xp_bonus), 0)
  FROM user_achievements ua
  WHERE ua.user_id = user_progress.user_id
),
updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_progress.user_id
);

-- Atualizar contadores por tipo de prática
UPDATE user_progress 
SET 
  total_text_practices = (
    SELECT COUNT(*) FROM user_practices up 
    WHERE up.user_id = user_progress.user_id 
    AND up.practice_type = 'text_message'
  ),
  total_audio_practices = (
    SELECT COUNT(*) FROM user_practices up 
    WHERE up.user_id = user_progress.user_id 
    AND up.practice_type = 'audio_message'
  ),
  total_live_voice_practices = (
    SELECT COUNT(*) FROM user_practices up 
    WHERE up.user_id = user_progress.user_id 
    AND up.practice_type = 'live_voice'
  ),
  updated_at = NOW();

-- Calcular níveis baseado no XP
UPDATE user_progress 
SET current_level = CASE 
  WHEN total_xp >= 10000 THEN 10
  WHEN total_xp >= 5000 THEN 9
  WHEN total_xp >= 2500 THEN 8
  WHEN total_xp >= 1500 THEN 7
  WHEN total_xp >= 1000 THEN 6
  WHEN total_xp >= 600 THEN 5
  WHEN total_xp >= 350 THEN 4
  WHEN total_xp >= 200 THEN 3
  WHEN total_xp >= 100 THEN 2
  ELSE 1
END,
updated_at = NOW();

-- =====================================================
-- 4. ATUALIZAR LEADERBOARD
-- =====================================================

-- Limpar leaderboard atual
DELETE FROM user_leaderboard_cache;

-- Popular leaderboard com dados consolidados
INSERT INTO user_leaderboard_cache (
  user_id, 
  user_level, 
  display_name, 
  avatar_color, 
  level_number, 
  total_xp, 
  current_streak, 
  position
)
SELECT 
  up.user_id,
  'Intermediate' as user_level, -- Default level
  CASE 
    WHEN u.name IS NOT NULL AND u.name != '' THEN split_part(u.name, ' ', 1)
    ELSE 'User ' || substr(up.user_id, 1, 8)
  END as display_name,
  '#10B981' as avatar_color, -- Verde padrão
  up.current_level as level_number,
  up.total_xp,
  up.streak_days as current_streak,
  ROW_NUMBER() OVER (ORDER BY up.total_xp DESC) as position
FROM user_progress up
LEFT JOIN users u ON u.id::text = up.user_id
WHERE up.total_xp > 0
ORDER BY up.total_xp DESC;

-- =====================================================
-- 5. CRIAR ÍNDICES E CONSTRAINTS
-- =====================================================

-- Índices para user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_total_xp ON user_progress(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(current_level);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_practice ON user_progress(last_practice_date DESC);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policy para user_progress
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
CREATE POLICY "Users can view own progress" ON user_progress
    FOR ALL USING (auth.uid()::text = user_id);

-- =====================================================
-- 6. FUNÇÕES DE MANUTENÇÃO
-- =====================================================

-- Função para atualizar user_progress quando houver nova prática
CREATE OR REPLACE FUNCTION update_user_progress_on_practice()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar progresso do usuário
  INSERT INTO user_progress (
    user_id, 
    total_xp, 
    total_practices,
    total_text_practices,
    total_audio_practices, 
    total_live_voice_practices,
    last_practice_date
  )
  VALUES (
    NEW.user_id,
    COALESCE(NEW.xp_earned, 0),
    1,
    CASE WHEN NEW.practice_type = 'text_message' THEN 1 ELSE 0 END,
    CASE WHEN NEW.practice_type = 'audio_message' THEN 1 ELSE 0 END,
    CASE WHEN NEW.practice_type = 'live_voice' THEN 1 ELSE 0 END,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_progress.total_xp + COALESCE(NEW.xp_earned, 0),
    total_practices = user_progress.total_practices + 1,
    total_text_practices = user_progress.total_text_practices + 
      CASE WHEN NEW.practice_type = 'text_message' THEN 1 ELSE 0 END,
    total_audio_practices = user_progress.total_audio_practices + 
      CASE WHEN NEW.practice_type = 'audio_message' THEN 1 ELSE 0 END,
    total_live_voice_practices = user_progress.total_live_voice_practices + 
      CASE WHEN NEW.practice_type = 'live_voice' THEN 1 ELSE 0 END,
    last_practice_date = CURRENT_DATE,
    -- Recalcular nível
    current_level = CASE 
      WHEN (user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 10000 THEN 10
      WHEN (user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 5000 THEN 9
      WHEN (user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 2500 THEN 8
      WHEN (user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 1500 THEN 7
      WHEN (user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 1000 THEN 6
      WHEN (user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 600 THEN 5
      WHEN (user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 350 THEN 4
      WHEN (user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 200 THEN 3
      WHEN (user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 100 THEN 2
      ELSE 1
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em user_practices
DROP TRIGGER IF EXISTS trigger_update_user_progress ON user_practices;
CREATE TRIGGER trigger_update_user_progress
  AFTER INSERT ON user_practices
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress_on_practice();

-- =====================================================
-- 7. LOGGING E VERIFICAÇÃO
-- =====================================================

-- Mostrar estatísticas finais
DO $$
DECLARE
  total_users INTEGER;
  total_xp INTEGER;
  total_practices INTEGER;
  leaderboard_count INTEGER;
BEGIN
  SELECT COUNT(*), SUM(total_xp), SUM(total_practices)
  INTO total_users, total_xp, total_practices
  FROM user_progress;
  
  SELECT COUNT(*) INTO leaderboard_count FROM user_leaderboard_cache;
  
  RAISE NOTICE '✅ XP CONSOLIDATION COMPLETED:';
  RAISE NOTICE '   - Users migrated: %', total_users;
  RAISE NOTICE '   - Total XP consolidated: %', total_xp;
  RAISE NOTICE '   - Total practices: %', total_practices;
  RAISE NOTICE '   - Leaderboard entries: %', leaderboard_count;
END $$; 