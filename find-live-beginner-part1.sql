-- 🔍 PARTE 1: BUSCAR "LIVE BEGINNER" NA TABELA ACHIEVEMENTS

SELECT 
  name,
  description,
  requirement_type,
  requirement_value,
  category,
  xp_reward
FROM achievements 
WHERE name ILIKE '%live%'
ORDER BY name; 