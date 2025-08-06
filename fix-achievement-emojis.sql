-- 🔧 CORRIGIR EMOJIS PROBLEMÁTICOS DOS ACHIEVEMENTS

-- 1. VERIFICAR ACHIEVEMENTS COM EMOJIS PROBLEMÁTICOS
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
WHERE badge_icon IN ('', '️', '‍♂️')
ORDER BY category, name;

-- 2. CORRIGIR EMOJIS PROBLEMÁTICOS
-- Substituir "" por "🏆" (troféu genérico)
UPDATE achievements 
SET badge_icon = '🏆'
WHERE badge_icon = '';

-- Substituir "️" por "⭐" (estrela)
UPDATE achievements 
SET badge_icon = '⭐'
WHERE badge_icon = '️';

-- Substituir "‍♂️" por "💪" (força)
UPDATE achievements 
SET badge_icon = '💪'
WHERE badge_icon = '‍♂️';

-- 3. VERIFICAR SE FOI CORRIGIDO
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
WHERE badge_icon IN ('', '️', '‍♂️')
ORDER BY category, name; 