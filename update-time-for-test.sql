-- TESTE IMEDIATO: Mudar horários para 11:15 (agora são 11:14)
-- Execute no Supabase SQL Editor

-- Atualizar todos os seus usuários para 11:15:00
UPDATE users 
SET preferred_reminder_time = '11:15:00',
    updated_at = NOW()
WHERE entra_id IN (
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4',  -- iPhone
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Mac  
  'ade732ef-433b-4736-a73e-4e9376664ad2'   -- Android
);

-- Verificar se atualizou
SELECT 
  name,
  entra_id,
  preferred_reminder_time,
  updated_at
FROM users
WHERE entra_id IN (
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4',
  '5ebb9b09-46f3-4499-b099-46a804da6fb6', 
  'ade732ef-433b-4736-a73e-4e9376664ad2'
);