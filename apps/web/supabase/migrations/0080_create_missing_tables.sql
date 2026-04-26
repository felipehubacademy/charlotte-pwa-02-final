-- 008_create_missing_tables.sql
-- Criar tabelas que o sistema espera mas não existem

-- =====================================================
-- 1. CRIAR TABELA USER_STATS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  total_practices INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  average_pronunciation_score DECIMAL(5,2),
  average_grammar_score DECIMAL(5,2),
  total_text_practices INTEGER DEFAULT 0,
  last_practice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CRIAR TABELA AUDIO_PRACTICES
-- =====================================================

CREATE TABLE IF NOT EXISTS audio_practices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  transcription TEXT NOT NULL,
  accuracy_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),
  pronunciation_score DECIMAL(5,2),
  feedback TEXT,
  xp_awarded INTEGER DEFAULT 0,
  practice_type TEXT DEFAULT 'audio_message',
  audio_duration INTEGER DEFAULT 0,
  -- Campos de gramática
  grammar_score DECIMAL(5,2),
  grammar_errors INTEGER,
  text_complexity TEXT,
  word_count INTEGER,
  -- Feedback técnico
  technical_feedback TEXT,
  -- Sistema XP melhorado
  achievement_ids TEXT[],
  surprise_bonus INTEGER DEFAULT 0,
  base_xp INTEGER DEFAULT 0,
  bonus_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para user_stats
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_xp ON user_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(current_level);

-- Índices para audio_practices
CREATE INDEX IF NOT EXISTS idx_audio_practices_user_id ON audio_practices(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_practices_created_at ON audio_practices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_practices_type ON audio_practices(practice_type);
CREATE INDEX IF NOT EXISTS idx_audio_practices_xp ON audio_practices(xp_awarded);

-- =====================================================
-- 4. CRIAR RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_practices ENABLE ROW LEVEL SECURITY;

-- Policies para user_stats
CREATE POLICY "Users can view own stats" ON user_stats
    FOR ALL USING (auth.uid()::text = user_id);

-- Policies para audio_practices
CREATE POLICY "Users can view own practices" ON audio_practices
    FOR ALL USING (auth.uid()::text = user_id);

-- =====================================================
-- 5. MIGRAR DADOS EXISTENTES (se aplicável)
-- =====================================================

-- Migrar dados de user_progress para user_stats se existir
INSERT INTO user_stats (
  user_id, total_xp, current_level, streak_days, 
  total_practices, longest_streak, average_pronunciation_score,
  average_grammar_score, total_text_practices, last_practice_date
)
SELECT 
  user_id, total_xp, current_level, streak_days,
  total_practices, longest_streak, average_pronunciation_score,
  average_grammar_score, total_text_practices, last_practice_date
FROM user_progress
WHERE NOT EXISTS (
  SELECT 1 FROM user_stats WHERE user_stats.user_id = user_progress.user_id
);

-- =====================================================
-- 6. ATUALIZAR CONFIGURAÇÕES
-- =====================================================

-- Função trigger para manter user_stats atualizado
CREATE OR REPLACE FUNCTION update_user_stats_on_practice()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar ou inserir stats do usuário
  INSERT INTO user_stats (user_id, total_xp, total_practices, last_practice_date)
  VALUES (NEW.user_id, NEW.xp_awarded, 1, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_xp = user_stats.total_xp + NEW.xp_awarded,
    total_practices = user_stats.total_practices + 1,
    last_practice_date = CURRENT_DATE,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para audio_practices
DROP TRIGGER IF EXISTS trigger_update_user_stats ON audio_practices;
CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT ON audio_practices
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_practice();

-- Comentário de finalização
COMMENT ON TABLE user_stats IS 'Estatísticas consolidadas dos usuários';
COMMENT ON TABLE audio_practices IS 'Histórico de práticas de áudio e texto dos usuários';

-- Logging
DO $$
BEGIN
  RAISE NOTICE 'Migration 008 completed: user_stats and audio_practices tables created successfully';
END $$; 