-- Migration 019: Auth & subscription columns (Fase 8.7)
-- Executar no Supabase SQL Editor
-- Todas as operações são idempotentes (IF NOT EXISTS / DROP NOT NULL seguro)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. entra_id legacy — tornar opcional
--    Novos usuários Supabase Auth não têm Entra ID; campo era NOT NULL (herdado)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ALTER COLUMN entra_id DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. must_change_password — primeiro acesso de alunos institucionais
--    Admin cria usuário com senha temporária → flag força troca antes de entrar
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Assinatura / trial — para pagantes via app (RevenueCat)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'trial', 'active', 'expired', 'cancelled'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NULL;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_provider text NULL;
  -- valores esperados: 'revenuecat' | 'manual' | NULL

-- Índice para queries de acesso (paywall check no AuthProvider)
CREATE INDEX IF NOT EXISTS idx_users_subscription
  ON public.users (subscription_status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. preferred_reminder_time — horário do lembrete diário (push notification)
--    O app salva em SecureStore; esta coluna sincroniza com o servidor
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferred_reminder_time smallint NULL
    CHECK (preferred_reminder_time BETWEEN 0 AND 23);
  -- hora em formato 0-23, NULL = desativado

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Verificação: listar colunas relevantes da tabela users após migration
-- ─────────────────────────────────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN (
    'entra_id',
    'must_change_password',
    'subscription_status',
    'trial_ends_at',
    'subscription_provider',
    'preferred_reminder_time'
  )
ORDER BY column_name;
