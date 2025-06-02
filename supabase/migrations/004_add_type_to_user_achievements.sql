-- migrations/004_add_type_to_user_achievements.sql
-- Adicionar coluna 'type' à tabela user_achievements para categorização

-- Adicionar a coluna type
ALTER TABLE user_achievements 
ADD COLUMN IF NOT EXISTS type TEXT;

-- Criar índice para melhor performance nas consultas por tipo
CREATE INDEX IF NOT EXISTS idx_user_achievements_type 
ON user_achievements(type);

-- Criar índice composto para consultas por usuário e tipo
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_type 
ON user_achievements(user_id, type);

-- Comentário explicativo
COMMENT ON COLUMN user_achievements.type IS 'Categoria do achievement (ex: audio, text, streak, milestone, etc.)';

-- Atualizar achievements existentes com tipo padrão se necessário
UPDATE user_achievements 
SET type = 'general' 
WHERE type IS NULL;

-- Opcional: Definir valor padrão para novos registros
ALTER TABLE user_achievements 
ALTER COLUMN type SET DEFAULT 'general'; 