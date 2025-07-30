-- 🔧 ATUALIZAR PREFERENCES PARA 16:20 - Execute no SQL Editor do Supabase Dashboard
-- 1. ATUALIZAR MINHAS CONTAS PARA 16:20
UPDATE users
SET 
  preferred_reminder_time = '16:20:00',
  updated_at = NOW()
WHERE entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
);

-- 2. VERIFICAR SE FORAM ATUALIZADAS
SELECT
  name,
  entra_id,
  preferred_reminder_time,
  reminder_frequency
FROM users
WHERE entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
ORDER BY name; 