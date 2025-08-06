-- 🔧 CORRIGIR TODOS OS EMOJIS PROBLEMÁTICOS

-- 1. VERIFICAR TODOS OS ACHIEVEMENTS COM EMOJIS PROBLEMÁTICOS
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
WHERE badge_icon IN ('', '️', '‍♂️', '', '')
ORDER BY category, name;

-- 2. CORRIGIR TODOS OS EMOJIS PROBLEMÁTICOS
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

-- Substituir "" por "📚" (livros)
UPDATE achievements 
SET badge_icon = '📚'
WHERE badge_icon = '';

-- Substituir "" por "🌍" (mundo)
UPDATE achievements 
SET badge_icon = '🌍'
WHERE badge_icon = '';

-- 3. VERIFICAR SE FOI CORRIGIDO
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
WHERE badge_icon IN ('', '️', '‍♂️', '', '')
ORDER BY category, name; 