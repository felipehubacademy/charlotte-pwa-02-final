-- VERIFICAR: Estado atual após sua atualização manual
-- Execute no Supabase SQL Editor

-- 1. Ver preferências atuais na tabela users
SELECT 
  name,
  entra_id,
  preferred_reminder_time,
  reminder_frequency
FROM users 
WHERE entra_id IN (
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4', -- iPhone
  '5ebb9b09-46f3-4499-b099-46a804da6fb6', -- Mac  
  'ade732ef-433b-4736-a73e-4e9376664ad2'  -- Arthur
);

-- 2. Ver horário atual Brasil vs UTC
SELECT 
  NOW() as utc_now,
  NOW() - INTERVAL '3 hours' as brazil_now,
  EXTRACT(hour FROM (NOW() - INTERVAL '3 hours')) as brazil_hour,
  EXTRACT(minute FROM (NOW() - INTERVAL '3 hours')) as brazil_minute;

-- 3. SIMULAR: Que usuários seriam encontrados agora
SELECT 
  name,
  entra_id,
  preferred_reminder_time
FROM users 
WHERE preferred_reminder_time IN ('12:05:00', '12:00:00', '12:15:00', '12:30:00')
  AND reminder_frequency != 'disabled';