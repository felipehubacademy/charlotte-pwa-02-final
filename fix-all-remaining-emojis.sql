-- 🔧 CORRIGIR TODOS OS EMOJIS PROBLEMÁTICOS RESTANTES

-- 1. CORRIGIR EMOJIS PROBLEMÁTICOS ESPECÍFICOS
-- Marathon Talker: ‍♂️ → 🗣️ (falando)
UPDATE achievements 
SET badge_icon = '🗣️'
WHERE name = 'Marathon Talker';

-- Essay Writer:  → 📝 (escrevendo)
UPDATE achievements 
SET badge_icon = '📝'
WHERE name = 'Essay Writer';

-- Grammar Guru:  → 📚 (livro)
UPDATE achievements 
SET badge_icon = '📚'
WHERE name = 'Grammar Guru';

-- Grammar Perfectionist:  → ✍️ (escrevendo)
UPDATE achievements 
SET badge_icon = '✍️'
WHERE name = 'Grammar Perfectionist';

-- Marathon Speaker:  → 🎤 (microfone)
UPDATE achievements 
SET badge_icon = '🎤'
WHERE name = 'Marathon Speaker';

-- Native-like:  → 🌟 (estrela)
UPDATE achievements 
SET badge_icon = '🌟'
WHERE name = 'Native-like';

-- Perfect Audio!:  → 🎵 (nota musical)
UPDATE achievements 
SET badge_icon = '🎵'
WHERE name = 'Perfect Audio!';

-- Perfect Grammar!:  → 📖 (livro)
UPDATE achievements 
SET badge_icon = '📖'
WHERE name = 'Perfect Grammar!';

-- Pronunciation Master:  → 🗣️ (falando)
UPDATE achievements 
SET badge_icon = '🗣️'
WHERE name = 'Pronunciation Master';

-- Visual Learner:  → 👁️ (olho)
UPDATE achievements 
SET badge_icon = '👁️'
WHERE name = 'Visual Learner';

-- Lunch Learner: ️ → 🍽️ (prato)
UPDATE achievements 
SET badge_icon = '🍽️'
WHERE name = 'Lunch Learner';

-- Weekend Warrior: ️ → ⚔️ (espada)
UPDATE achievements 
SET badge_icon = '⚔️'
WHERE name = 'Weekend Warrior';

-- Audio Enthusiast: ️ → 🎵 (nota musical)
UPDATE achievements 
SET badge_icon = '🎵'
WHERE name = 'Audio Enthusiast';

-- 2. VERIFICAR SE FOI CORRIGIDO
SELECT 
  name,
  description,
  badge_icon,
  category
FROM achievements 
WHERE name IN (
  'Marathon Talker',
  'Essay Writer',
  'Grammar Guru',
  'Grammar Perfectionist',
  'Marathon Speaker',
  'Native-like',
  'Perfect Audio!',
  'Perfect Grammar!',
  'Pronunciation Master',
  'Visual Learner',
  'Lunch Learner',
  'Weekend Warrior',
  'Audio Enthusiast'
)
ORDER BY name; 