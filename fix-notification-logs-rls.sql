-- CORRIGIR: RLS policy para notification_logs
-- Execute no Supabase SQL Editor

-- Ver policy atual
SELECT * FROM pg_policies WHERE tablename = 'notification_logs';

-- Desabilitar RLS temporariamente para teste
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;

-- Ou criar policy permissiva para service role
CREATE POLICY "Allow service to insert notification_logs" ON notification_logs
FOR INSERT 
WITH CHECK (true);

-- Reabilitar RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;