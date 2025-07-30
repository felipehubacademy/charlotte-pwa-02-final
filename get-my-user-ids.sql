-- 🔍 OBTER MEUS USER IDs - Execute no SQL Editor do Supabase Dashboard
-- 1. VERIFICAR MEUS DADOS COMPLETOS
SELECT
  id,
  entra_id,
  name,
  preferred_reminder_time,
  reminder_frequency
FROM users
WHERE entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
ORDER BY name;

-- 2. VERIFICAR SE JÁ EXISTEM PREFERENCES PARA MEUS IDs
SELECT
  u.name,
  u.id as user_id,
  u.entra_id,
  np.practice_reminders,
  np.marketing,
  np.created_at
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
ORDER BY u.name; 