-- CORRIGIR: RLS policies conflitantes para notification_logs
-- Execute no Supabase SQL Editor

-- 1. Remover policies duplicadas/conflitantes
DROP POLICY IF EXISTS "Only service role can modify logs" ON notification_logs;
DROP POLICY IF EXISTS "Service role can manage all notification logs" ON notification_logs;

-- 2. Criar policy permissiva para serverless functions (anon role)
CREATE POLICY "Allow serverless insert notification_logs" ON notification_logs
FOR INSERT 
WITH CHECK (true);  -- Permitir qualquer inserção de logs

-- 3. Manter policies restritivas para outros comandos
-- (UPDATE/DELETE mantém service_role only)

-- 4. Verificar resultado
SELECT policyname, cmd, with_check FROM pg_policies 
WHERE tablename = 'notification_logs' 
ORDER BY cmd;