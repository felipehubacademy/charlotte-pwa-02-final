-- 🔍 VERIFICAR EMOJIS ESPECÍFICOS QUE PODEM ESTAR PROBLEMÁTICOS

-- 1. VERIFICAR EMOJIS QUE PODEM ESTAR PROBLEMÁTICOS
SELECT 
  name,
  description,
  badge_icon,
  LENGTH(badge_icon) as char_length
FROM achievements 
WHERE name IN (
  'Live Beginner',
  'Live Master',
  'Intermediário',
  'Especialista',
  'Perfect Audio!',
  'Cultural Bridge',
  'Visual Learner',
  'Consistente',
  'Disciplinado',
  'Fenômeno',
  'Imparável',
  'Early Bird',
  'Colecionador',
  'Poliglota'
)
ORDER BY name;

-- 2. VERIFICAR TODOS OS EMOJIS ÚNICOS (com comprimento)
SELECT 
  badge_icon,
  LENGTH(badge_icon) as char_length,
  COUNT(*) as usage_count
FROM achievements 
GROUP BY badge_icon
ORDER BY usage_count DESC; 