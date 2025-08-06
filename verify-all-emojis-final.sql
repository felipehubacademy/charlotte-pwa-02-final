-- 🔍 VERIFICAÇÃO FINAL DE TODOS OS EMOJIS

-- 1. TODOS OS EMOJIS ÚNICOS (com contagem)
SELECT 
  badge_icon,
  COUNT(*) as usage_count
FROM achievements 
GROUP BY badge_icon
ORDER BY usage_count DESC;

-- 2. TODOS OS ACHIEVEMENTS COM SEUS EMOJIS
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
ORDER BY category, name;

-- 3. VERIFICAR SE HÁ ACHIEVEMENTS SEM EMOJI
SELECT 
  name,
  description,
  badge_icon
FROM achievements 
WHERE badge_icon IS NULL OR badge_icon = ''
ORDER BY name; 