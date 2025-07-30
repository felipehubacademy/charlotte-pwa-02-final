-- 🔍 VERIFICAR NOTIFICATION_PREFERENCES - Execute no SQL Editor do Supabase Dashboard
-- 1. VERIFICAR SE MINHAS CONTAS TÊM PREFERENCES
SELECT
  u.name,
  u.entra_id,
  u.preferred_reminder_time,
  np.practice_reminders,
  np.marketing,
  np.created_at as pref_created
FROM users u
LEFT JOIN notification_preferences np ON u.entra_id::uuid = np.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
ORDER BY u.name;

-- 2. VERIFICAR TODOS OS USUÁRIOS COM 14:15 E SE TÊM PREFERENCES
SELECT
  u.name,
  u.entra_id,
  u.preferred_reminder_time,
  CASE WHEN np.user_id IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_preferences,
  np.practice_reminders,
  np.marketing
FROM users u
LEFT JOIN notification_preferences np ON u.entra_id::uuid = np.user_id
WHERE u.preferred_reminder_time = '14:15:00'
  AND u.reminder_frequency != 'disabled'
ORDER BY u.name;

-- 3. CONTAR QUANTOS USUÁRIOS TÊM PREFERENCES
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN np.user_id IS NOT NULL THEN 1 END) as com_preferences,
  COUNT(CASE WHEN np.user_id IS NULL THEN 1 END) as sem_preferences
FROM users u
LEFT JOIN notification_preferences np ON u.entra_id::uuid = np.user_id
WHERE u.preferred_reminder_time = '14:15:00'
  AND u.reminder_frequency != 'disabled'; 