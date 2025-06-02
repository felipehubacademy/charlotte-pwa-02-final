-- 004_cleanup_database_structure.sql
-- Limpeza e padronização da estrutura do banco de dados

-- =====================================================
-- 1. CORRIGIR TABELA USERS - ADICIONAR EMAIL
-- =====================================================

-- Adicionar coluna email na tabela users (obrigatória)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT 'user@example.com';

-- Adicionar outras colunas úteis para users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS user_level TEXT DEFAULT 'Intermediate' CHECK (user_level IN ('Novice', 'Intermediate', 'Advanced')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 2. LIMPAR TABELA ACHIEVEMENTS - REMOVER DUPLICATAS
-- =====================================================

-- Primeiro verificar quais colunas existem e remover duplicatas
-- A tabela achievements tem: code, name, description, icon, xp_reward, etc.
-- Vamos remover apenas as colunas duplicadas que foram adicionadas

ALTER TABLE achievements 
DROP COLUMN IF EXISTS achievement_code,
DROP COLUMN IF EXISTS achievement_type,
DROP COLUMN IF EXISTS achievement_name,
DROP COLUMN IF EXISTS achievement_description;

-- Garantir que os campos principais têm valores padrão adequados
-- Usar os nomes corretos das colunas que existem
ALTER TABLE achievements 
ALTER COLUMN code SET NOT NULL,
ALTER COLUMN description SET DEFAULT 'Achievement unlocked!';

-- =====================================================
-- 3. LIMPAR TABELA USER_ACHIEVEMENTS - PADRONIZAR
-- =====================================================

-- Remover campos duplicados, manter apenas os necessários
ALTER TABLE user_achievements 
DROP COLUMN IF EXISTS achievement_code,
DROP COLUMN IF EXISTS achievement_name,
DROP COLUMN IF EXISTS achievement_description,
DROP COLUMN IF EXISTS type;

-- Padronizar campos restantes
ALTER TABLE user_achievements 
ALTER COLUMN achievement_type SET DEFAULT 'general',
ALTER COLUMN xp_bonus SET DEFAULT 0,
ALTER COLUMN rarity SET DEFAULT 'common';

-- =====================================================
-- 4. CORRIGIR FOREIGN KEYS E CONSTRAINTS
-- =====================================================

-- Adicionar constraint para user_id em user_achievements
-- (garantir que user_id existe na tabela users)
DO $$ 
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_achievements_user_id'
    ) THEN
        ALTER TABLE user_achievements 
        ADD CONSTRAINT fk_user_achievements_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Adicionar constraint para achievement_id (quando não for NULL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_achievements_achievement_id'
    ) THEN
        ALTER TABLE user_achievements 
        ADD CONSTRAINT fk_user_achievements_achievement_id 
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- 5. PADRONIZAR TABELA USER_PROGRESS
-- =====================================================

-- Garantir que todos os campos têm valores padrão adequados
ALTER TABLE user_progress 
ALTER COLUMN total_xp SET DEFAULT 0,
ALTER COLUMN current_level SET DEFAULT 1,
ALTER COLUMN streak_days SET DEFAULT 0,
ALTER COLUMN longest_streak SET DEFAULT 0,
ALTER COLUMN total_practices SET DEFAULT 0;

-- =====================================================
-- 6. OTIMIZAR TABELA USER_VOCABULARY
-- =====================================================

-- Corrigir tipo do user_id para ser consistente (TEXT como outras tabelas)
ALTER TABLE user_vocabulary 
ALTER COLUMN user_id TYPE TEXT;

-- =====================================================
-- 7. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);

-- Índices para user_practices
CREATE INDEX IF NOT EXISTS idx_user_practices_user_id ON user_practices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_practices_created_at ON user_practices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_practices_type ON user_practices(practice_type);

-- Índices para user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_total_xp ON user_progress(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(current_level);

-- Índices para user_vocabulary
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user_id ON user_vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_word ON user_vocabulary(word);

-- Índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_date ON user_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_user_sessions_date ON user_sessions(session_date DESC);

-- =====================================================
-- 8. ATUALIZAR RLS POLICIES
-- =====================================================

-- Política para users
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR ALL USING (auth.uid()::text = id);

-- Política para user_achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR ALL USING (auth.uid()::text = user_id);

-- Política para user_vocabulary
DROP POLICY IF EXISTS "Users can manage own vocabulary" ON user_vocabulary;
CREATE POLICY "Users can manage own vocabulary" ON user_vocabulary
    FOR ALL USING (auth.uid()::text = user_id);

-- =====================================================
-- 9. POPULAR DADOS PADRÃO SE NECESSÁRIO
-- =====================================================

-- Inserir achievements básicos se a tabela estiver vazia
INSERT INTO achievements (code, name, description, icon, xp_reward, category, rarity)
SELECT * FROM (VALUES
    ('first_practice', 'First Steps', 'Complete your first practice session', '🎯', 50, 'general', 'common'),
    ('streak_3', 'Getting Started', 'Practice for 3 days in a row', '🔥', 100, 'streak', 'common'),
    ('streak_7', 'Week Warrior', 'Practice for 7 days in a row', '⚡', 200, 'streak', 'rare'),
    ('perfect_audio', 'Perfect Pronunciation', 'Get 100% pronunciation score', '🎤', 150, 'audio', 'rare'),
    ('grammar_master', 'Grammar Master', 'Get perfect grammar score 5 times', '📖', 300, 'text', 'epic')
) AS new_achievements(code, name, description, icon, xp_reward, category, rarity)
WHERE NOT EXISTS (SELECT 1 FROM achievements LIMIT 1);

-- =====================================================
-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE users IS 'Tabela principal de usuários com dados do Entra ID';
COMMENT ON TABLE achievements IS 'Conquistas disponíveis no sistema (sem duplicatas)';
COMMENT ON TABLE user_achievements IS 'Conquistas conquistadas pelos usuários (limpa)';
COMMENT ON TABLE user_progress IS 'Progresso geral dos usuários';
COMMENT ON TABLE user_practices IS 'Histórico de práticas dos usuários';
COMMENT ON TABLE user_vocabulary IS 'Vocabulário descoberto pelos usuários';
COMMENT ON TABLE user_sessions IS 'Sessões diárias dos usuários';
COMMENT ON TABLE user_leaderboard_cache IS 'Cache do ranking por nível';

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

-- Atualizar estatísticas das tabelas
ANALYZE users;
ANALYZE achievements;
ANALYZE user_achievements;
ANALYZE user_progress;
ANALYZE user_practices;
ANALYZE user_vocabulary;
ANALYZE user_sessions;
ANALYZE user_leaderboard_cache; 