-- 🔧 CORRIGIR EMOJI DO LIVE BEGINNER

-- 1. VERIFICAR LIVE BEGINNER
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
WHERE name = 'Live Beginner';

-- 2. CORRIGIR EMOJI DO LIVE BEGINNER
-- Live Beginner: ️ → 🎤 (microfone para conversas ao vivo)
UPDATE achievements 
SET badge_icon = '🎤'
WHERE name = 'Live Beginner';

-- 3. VERIFICAR SE FOI CORRIGIDO
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
WHERE name = 'Live Beginner'; 