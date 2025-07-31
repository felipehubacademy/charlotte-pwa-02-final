-- OPCIONAL: Remover policy duplicada
-- Execute no Supabase SQL Editor

-- Remover a policy antiga/duplicada
DROP POLICY IF EXISTS "Allow service to insert notification_logs" ON notification_logs;

-- Verificar resultado final
SELECT policyname, cmd, with_check FROM pg_policies 
WHERE tablename = 'notification_logs' 
ORDER BY cmd;