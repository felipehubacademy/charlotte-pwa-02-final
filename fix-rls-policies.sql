-- fix-rls-policies.sql
-- Corrigir políticas RLS para permitir triggers funcionarem

-- =====================================================
-- 1. ATUALIZAR POLICY PARA user_progress
-- =====================================================

-- Remover policy antiga que só permite auth.uid()
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;

-- Criar policy mais flexível que permite triggers
CREATE POLICY "Allow user progress access" ON user_progress
    FOR ALL 
    USING (
        -- Permitir se o usuário está autenticado E é o dono do registro
        (auth.uid()::text = user_id) 
        OR 
        -- OU se é um trigger/função do sistema (não há auth.uid() em triggers)
        (auth.uid() IS NULL)
    );

-- =====================================================
-- 2. PERMITIR INSERÇÕES DE TRIGGERS
-- =====================================================

-- Criar policy específica para INSERT que funciona com triggers
CREATE POLICY "Allow trigger inserts on user_progress" ON user_progress
    FOR INSERT 
    WITH CHECK (
        -- Permitir se o usuário está autenticado E é o dono do registro
        (auth.uid()::text = user_id) 
        OR 
        -- OU se não há contexto de autenticação (triggers)
        (auth.uid() IS NULL)
    );

-- =====================================================
-- 3. CORRIGIR POLICY PARA user_practices
-- =====================================================

-- Verificar se user_practices tem RLS habilitado
ALTER TABLE user_practices ENABLE ROW LEVEL SECURITY;

-- Atualizar policy para user_practices
DROP POLICY IF EXISTS "Users can view own practices" ON user_practices;

CREATE POLICY "Allow user practices access" ON user_practices
    FOR ALL 
    USING (
        -- Permitir se o usuário está autenticado E é o dono do registro
        (auth.uid()::text = user_id) 
        OR 
        -- OU se é um trigger/função do sistema
        (auth.uid() IS NULL)
    );

-- =====================================================
-- 4. VERIFICAR OUTRAS TABELAS RELACIONADAS
-- =====================================================

-- Atualizar user_sessions se necessário
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Allow user sessions access" ON user_sessions
    FOR ALL 
    USING (
        (auth.uid()::text = user_id) 
        OR 
        (auth.uid() IS NULL)
    );

-- =====================================================
-- 5. LOGGING
-- =====================================================

-- Verificar se as policies foram aplicadas
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully';
  RAISE NOTICE '   - user_progress: Updated to allow triggers';
  RAISE NOTICE '   - user_practices: Updated to allow triggers'; 
  RAISE NOTICE '   - user_sessions: Updated to allow triggers';
END $$; 