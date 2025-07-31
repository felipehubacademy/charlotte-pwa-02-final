-- SOLUÇÃO RÁPIDA: Desabilitar RLS para notification_logs
-- Execute no Supabase SQL Editor

-- Desabilitar RLS (logs não são críticos para segurança)
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, row_security 
FROM pg_tables 
WHERE tablename = 'notification_logs';