-- VOLTAR RODOLFO PARA 12:05:00

UPDATE users 
SET preferred_reminder_time = '12:05:00'
WHERE entra_id = '102a317e-1613-4c93-a60b-2ae17bd1005d';

-- Verificar mudança
SELECT name, preferred_reminder_time 
FROM users 
WHERE entra_id = '102a317e-1613-4c93-a60b-2ae17bd1005d';