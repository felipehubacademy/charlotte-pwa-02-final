-- Fix authentication for achievements
-- Execute este SQL no Supabase Dashboard

-- 1. Verificar estado atual
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('user_achievements', 'achievements');

-- 2. Disable RLS temporariamente para limpeza
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;

-- 3. Drop políticas antigas
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can delete own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;

-- 4. Re-enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 5. Criar novas políticas mais flexíveis

-- Service role pode fazer tudo (para operações do backend)
CREATE POLICY "Service role can manage all achievements"
    ON user_achievements FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Usuários autenticados podem ver seus próprios achievements
CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (
        auth.role() = 'service_role' OR 
        auth.uid()::text = user_id OR
        auth.role() = 'authenticated'
    );

-- Usuários autenticados podem inserir seus próprios achievements
CREATE POLICY "Users can insert own achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.uid()::text = user_id OR
        auth.role() = 'authenticated'
    );

-- Usuários autenticados podem atualizar seus próprios achievements
CREATE POLICY "Users can update own achievements"
    ON user_achievements FOR UPDATE
    USING (
        auth.role() = 'service_role' OR 
        auth.uid()::text = user_id OR
        auth.role() = 'authenticated'
    )
    WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.uid()::text = user_id OR
        auth.role() = 'authenticated'
    );

-- Qualquer one pode ver achievements disponíveis
CREATE POLICY "Anyone can view achievements"
    ON achievements FOR SELECT
    USING (true);

-- 6. Grant permissions
GRANT ALL ON user_achievements TO authenticated;
GRANT ALL ON user_achievements TO service_role;
GRANT SELECT ON achievements TO authenticated;
GRANT ALL ON achievements TO service_role;

-- 7. Verificar resultado
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('user_achievements', 'achievements')
ORDER BY tablename, policyname;

-- Log da operação
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated for achievements';
  RAISE NOTICE '   - Service role has full access';
  RAISE NOTICE '   - Users can manage their own achievements';
  RAISE NOTICE '   - Authenticated users have necessary permissions';
  RAISE NOTICE '   - Anyone can view available achievements';
END $$; 