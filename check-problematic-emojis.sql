-- 🔍 VERIFICAR QUAIS ACHIEVEMENTS USAM EMOJIS PROBLEMÁTICOS

-- 1. ACHIEVEMENTS COM "" (9 usos)
SELECT 
  name,
  description,
  category,
  requirement_type,
  requirement_value
FROM achievements 
WHERE badge_icon = ''
ORDER BY category, name;

-- 2. ACHIEVEMENTS COM "️" (4 usos)
SELECT 
  name,
  description,
  category,
  requirement_type,
  requirement_value
FROM achievements 
WHERE badge_icon = '️'
ORDER BY category, name;

-- 3. ACHIEVEMENTS COM "‍♂️" (1 uso)
SELECT 
  name,
  description,
  category,
  requirement_type,
  requirement_value
FROM achievements 
WHERE badge_icon = '‍♂️'
ORDER BY category, name; 