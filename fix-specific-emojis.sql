-- 🔧 CORRIGIR EMOJIS ESPECÍFICOS QUE NÃO RENDERIZAM

-- 1. VERIFICAR ACHIEVEMENTS COM EMOJIS PROBLEMÁTICOS
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
WHERE name IN ('Colecionador', 'Cultural Bridge', 'Poliglota')
ORDER BY name;

-- 2. CORRIGIR EMOJIS ESPECÍFICOS
-- Colecionador: → 📚 (livros)
UPDATE achievements 
SET badge_icon = '📚'
WHERE name = 'Colecionador';

-- Cultural Bridge: 🇷 → 🇧🇷 (bandeira Brasil)
UPDATE achievements 
SET badge_icon = '🇧🇷'
WHERE name = 'Cultural Bridge';

-- Poliglota: → 🌍 (mundo)
UPDATE achievements 
SET badge_icon = '🌍'
WHERE name = 'Poliglota';

-- 3. VERIFICAR SE FOI CORRIGIDO
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
WHERE name IN ('Colecionador', 'Cultural Bridge', 'Poliglota')
ORDER BY name; 