-- 🔍 VERIFICAR TODAS AS NOTIFICATION_PREFERENCES - Execute no SQL Editor do Supabase Dashboard
-- 1. TODAS AS PREFERENCES
SELECT
  user_id,
  practice_reminders,
  marketing,
  created_at,
  updated_at
FROM notification_preferences
ORDER BY created_at DESC;

-- 2. CONTAR PREFERENCES
SELECT
  COUNT(*) as total_preferences,
  COUNT(CASE WHEN practice_reminders = true THEN 1 END) as practice_true,
  COUNT(CASE WHEN marketing = true THEN 1 END) as marketing_true,
  COUNT(CASE WHEN practice_reminders = false THEN 1 END) as practice_false,
  COUNT(CASE WHEN marketing = false THEN 1 END) as marketing_false
FROM notification_preferences;

-- 3. VERIFICAR MINHAS CONTAS ESPECIFICAMENTE
SELECT
  u.name,
  u.entra_id,
  np.practice_reminders,
  np.marketing,
  np.created_at
FROM users u
LEFT JOIN notification_preferences np ON u.entra_id::uuid = np.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
ORDER BY u.name; 