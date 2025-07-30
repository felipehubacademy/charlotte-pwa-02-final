-- 🔧 CRIAR PREFERENCES MANUALMENTE - Execute no SQL Editor do Supabase Dashboard
-- 1. INSERIR PREFERENCES PARA FELIPE XAVIER
INSERT INTO notification_preferences (
  user_id,
  practice_reminders,
  marketing,
  created_at,
  updated_at
) VALUES (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6'::uuid,  -- Felipe Xavier
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  practice_reminders = EXCLUDED.practice_reminders,
  marketing = EXCLUDED.marketing,
  updated_at = NOW();

-- 2. INSERIR PREFERENCES PARA FELIPE XAVIER - HUB ACADEMY
INSERT INTO notification_preferences (
  user_id,
  practice_reminders,
  marketing,
  created_at,
  updated_at
) VALUES (
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'::uuid,  -- Felipe Xavier - Hub Academy
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  practice_reminders = EXCLUDED.practice_reminders,
  marketing = EXCLUDED.marketing,
  updated_at = NOW();

-- 3. VERIFICAR SE FORAM CRIADAS
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