-- 🔍 VERIFICAR EMOJIS APÓS AS CORREÇÕES

-- 1. TODOS OS EMOJIS ÚNICOS (atualizados)
SELECT 
  badge_icon,
  COUNT(*) as usage_count
FROM achievements 
GROUP BY badge_icon
ORDER BY usage_count DESC;

-- 2. PRIMEIROS 20 ACHIEVEMENTS PARA VERIFICAR
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
ORDER BY name
LIMIT 20;

-- 3. ACHIEVEMENTS QUE ERAM PROBLEMÁTICOS (verificar se foram corrigidos)
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
WHERE name IN (
  'Live Beginner',
  'Audio Starter', 
  'Text Writer',
  'Primeiro Passo',
  'Colecionador',
  'Cultural Bridge',
  'Poliglota'
)
ORDER BY name; 