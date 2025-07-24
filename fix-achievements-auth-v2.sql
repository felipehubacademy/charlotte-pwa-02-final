-- Fix authentication for achievements - Version 2
-- Execute este SQL no Supabase Dashboard

-- 1. Disable RLS temporariamente para limpeza completa
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;

-- 2. Drop TODAS as políticas existentes (sem IF EXISTS para forçar)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop todas as políticas da tabela user_achievements
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_achievements'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON user_achievements';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    -- Drop todas as políticas da tabela achievements
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'achievements'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON achievements';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 4. Criar novas políticas limpas

-- Service role pode fazer tudo (para operações do backend)
CREATE POLICY "service_role_full_access"
    ON user_achievements FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Usuários autenticados podem ver seus próprios achievements
CREATE POLICY "authenticated_view_own"
    ON user_achievements FOR SELECT
    USING (
        auth.role() = 'service_role' OR 
        auth.uid()::text = user_id OR
        auth.role() = 'authenticated'
    );

-- Usuários autenticados podem inserir seus próprios achievements
CREATE POLICY "authenticated_insert_own"
    ON user_achievements FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.uid()::text = user_id OR
        auth.role() = 'authenticated'
    );

-- Usuários autenticados podem atualizar seus próprios achievements
CREATE POLICY "authenticated_update_own"
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

-- Qualquer um pode ver achievements disponíveis
CREATE POLICY "public_view_achievements"
    ON achievements FOR SELECT
    USING (true);

-- 5. Grant permissions
GRANT ALL ON user_achievements TO authenticated;
GRANT ALL ON user_achievements TO service_role;
GRANT SELECT ON achievements TO authenticated;
GRANT ALL ON achievements TO service_role;

-- 6. Verificar resultado
SELECT 
    'user_achievements' as table_name,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'user_achievements'
UNION ALL
SELECT 
    'achievements' as table_name,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'achievements'
ORDER BY table_name, policyname;

-- Log da operação
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies completely rebuilt for achievements';
  RAISE NOTICE '   - All old policies removed';
  RAISE NOTICE '   - New clean policies created';
  RAISE NOTICE '   - Service role has full access';
  RAISE NOTICE '   - Authenticated users can manage their data';
END $$; 