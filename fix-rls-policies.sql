-- Script para corrigir políticas RLS da tabela user_achievements

-- 1. Remover políticas existentes (se houver problemas)
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Service role can manage all achievements" ON user_achievements;

-- 2. Criar políticas corretas

-- Política para SELECT (usuários podem ver seus próprios achievements)
CREATE POLICY "Users can view their own achievements" 
ON user_achievements FOR SELECT 
USING (auth.uid()::text = user_id);

-- Política para INSERT (usuários podem inserir seus próprios achievements)
CREATE POLICY "Users can insert their own achievements" 
ON user_achievements FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Política para UPDATE (usuários podem atualizar seus próprios achievements)
CREATE POLICY "Users can update their own achievements" 
ON user_achievements FOR UPDATE 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Política para service role (permite operações do backend)
CREATE POLICY "Service role can manage all achievements" 
ON user_achievements FOR ALL 
USING (auth.role() = 'service_role');

-- 3. Garantir que RLS está habilitado
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- 4. Verificar se as políticas foram criadas
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'user_achievements'; 