-- TESTE IMEDIATO RODOLFO (13:45 Brasil)

-- 1. Mudar para 13:45 para teste
UPDATE users 
SET preferred_reminder_time = '13:45:00'
WHERE entra_id = '102a317e-1613-4c93-a60b-2ae17bd1005d';

-- 2. Verificar mudança
SELECT name, preferred_reminder_time 
FROM users 
WHERE entra_id = '102a317e-1613-4c93-a60b-2ae17bd1005d';

-- 3. Depois do teste, voltar para 12:05
-- UPDATE users 
-- SET preferred_reminder_time = '12:05:00'
-- WHERE entra_id = '102a317e-1613-4c93-a60b-2ae17bd1005d';