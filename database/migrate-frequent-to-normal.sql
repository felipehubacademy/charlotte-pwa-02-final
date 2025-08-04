-- Migração: Remover opção "frequent" (2x/dia) e converter para "normal" (1x/dia)
-- Data: 2025-01-01

-- 1. Verificar quantos usuários têm frequência "frequent"
SELECT 
  COUNT(*) as frequent_users,
  preferred_reminder_time,
  reminder_frequency
FROM users 
WHERE reminder_frequency = 'frequent'
GROUP BY preferred_reminder_time, reminder_frequency;

-- 2. Converter todos os usuários "frequent" para "normal"
UPDATE users 
SET 
  reminder_frequency = 'normal',
  updated_at = NOW()
WHERE reminder_frequency = 'frequent';

-- 3. Verificar se a migração foi bem-sucedida
SELECT 
  reminder_frequency,
  COUNT(*) as user_count
FROM users 
GROUP BY reminder_frequency;

-- 4. Verificar se não há mais usuários com "frequent"
SELECT COUNT(*) as remaining_frequent_users
FROM users 
WHERE reminder_frequency = 'frequent';

-- Resultado esperado: 0 usuários com "frequent" 