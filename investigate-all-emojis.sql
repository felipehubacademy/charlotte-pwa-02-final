-- 🔍 INVESTIGAR TODOS OS EMOJIS DOS ACHIEVEMENTS

-- 1. TODOS OS EMOJIS ÚNICOS (com códigos hex)
SELECT 
  badge_icon,
  LENGTH(badge_icon) as char_length,
  COUNT(*) as usage_count
FROM achievements 
GROUP BY badge_icon
ORDER BY usage_count DESC;

-- 2. ACHIEVEMENTS COM EMOJIS SUSPEITOS (baseado no comprimento)
SELECT 
  name,
  description,
  badge_icon,
  LENGTH(badge_icon) as char_length
FROM achievements 
WHERE LENGTH(badge_icon) > 2 OR LENGTH(badge_icon) = 0
ORDER BY name;

-- 3. ACHIEVEMENTS SEM EMOJI
SELECT 
  name,
  description,
  badge_icon
FROM achievements 
WHERE badge_icon IS NULL OR badge_icon = ''
ORDER BY name;

-- 4. PRIMEIROS 10 ACHIEVEMENTS PARA VERIFICAR
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
ORDER BY name
LIMIT 10; 