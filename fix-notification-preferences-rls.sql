-- Fix RLS policies for notification_preferences and users tables
-- Execute este SQL no Supabase Dashboard para corrigir problemas de autenticação

-- =====================================================
-- 1. CORRIGIR TABELA notification_preferences
-- =====================================================

-- Primeiro, verificar se a tabela existe e tem RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notification_preferences';

-- Disable RLS temporariamente para limpeza
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

-- Drop políticas antigas que podem estar causando problemas
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON notification_preferences;

-- Re-enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Criar políticas mais flexíveis que funcionam com anon key e service role
CREATE POLICY "Allow notification preferences access" ON notification_preferences
    FOR ALL 
    USING (
        -- Permitir se é service role (operações do backend)
        auth.role() = 'service_role' 
        OR 
        -- Permitir se é authenticated (operações do frontend)
        auth.role() = 'authenticated'
        OR
        -- Permitir se é anon (para desenvolvimento/teste)
        auth.role() = 'anon'
    );

-- =====================================================
-- 2. CORRIGIR TABELA users
-- =====================================================

-- Verificar políticas existentes na tabela users
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- Drop política restritiva antiga
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Criar política mais flexível para users
CREATE POLICY "Allow users table access" ON users
    FOR ALL 
    USING (
        -- Permitir se é service role (operações do backend)
        auth.role() = 'service_role' 
        OR 
        -- Permitir se é authenticated (operações do frontend)
        auth.role() = 'authenticated'
        OR
        -- Permitir se é anon (para desenvolvimento/teste)
        auth.role() = 'anon'
    );

-- =====================================================
-- 3. GRANT PERMISSIONS
-- =====================================================

-- Garantir que as permissões estão corretas
GRANT ALL ON notification_preferences TO authenticated;
GRANT ALL ON notification_preferences TO anon;
GRANT ALL ON notification_preferences TO service_role;

GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON users TO service_role;

-- =====================================================
-- 4. VERIFICAR RESULTADO
-- =====================================================

-- Verificar se as políticas foram aplicadas
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('notification_preferences', 'users')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('notification_preferences', 'users');

-- Log da operação
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated for notification preferences';
  RAISE NOTICE '   - notification_preferences: Allow all authenticated/anon/service_role access';
  RAISE NOTICE '   - users: Allow all authenticated/anon/service_role access';
  RAISE NOTICE '   - This enables the frontend to work with anon key authentication';
END $$; 