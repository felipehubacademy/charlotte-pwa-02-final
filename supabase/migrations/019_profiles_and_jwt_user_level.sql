-- 019_profiles_and_jwt_user_level.sql
-- Cria tabela profiles e injeta user_level no JWT via app_metadata

-- ============================================================
-- 1. TABELA profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  user_level TEXT NOT NULL DEFAULT 'Novice'
    CHECK (user_level IN ('Novice', 'Inter', 'Advanced')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  trial_expires_at TIMESTAMPTZ,
  -- campos legacy mantidos para compatibilidade
  entra_id TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  preferred_reminder_time TEXT DEFAULT '20:00:00',
  reminder_frequency TEXT DEFAULT 'normal'
    CHECK (reminder_frequency IN ('disabled', 'light', 'normal', 'frequent')),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_level ON profiles(user_level);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- ============================================================
-- 2. RLS para profiles
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê e edita apenas o próprio profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role pode tudo (backend com supabase admin)
CREATE POLICY "profiles_service_role_all" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Qualquer usuário autenticado pode criar o próprio profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- 3. Trigger updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================================
-- 4. Função que injeta user_level no JWT via app_metadata
--    Chamada como "custom claims" hook no Supabase Auth
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  v_user_level TEXT;
  v_user_id UUID;
BEGIN
  claims := event -> 'claims';
  v_user_id := (event ->> 'user_id')::UUID;

  -- Buscar user_level do profile
  SELECT user_level INTO v_user_level
  FROM public.profiles
  WHERE id = v_user_id;

  -- Injetar no claim se encontrado
  IF v_user_level IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_level}', to_jsonb(v_user_level));
    -- Também colocar em app_metadata para acesso no backend
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      COALESCE(claims -> 'app_metadata', '{}'::jsonb) || jsonb_build_object('user_level', v_user_level)
    );
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Dar permissão de execução ao role de auth
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;

-- ============================================================
-- 5. Trigger: propagar user_level para app_metadata no Auth
--    quando profiles.user_level é atualizado
-- ============================================================

CREATE OR REPLACE FUNCTION sync_user_level_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar app_metadata do usuário no Supabase Auth
  -- (requer service_role; este trigger roda como SECURITY DEFINER)
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('user_level', NEW.user_level)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS trigger_sync_user_level ON profiles;
CREATE TRIGGER trigger_sync_user_level
  AFTER UPDATE OF user_level ON profiles
  FOR EACH ROW
  WHEN (OLD.user_level IS DISTINCT FROM NEW.user_level)
  EXECUTE FUNCTION sync_user_level_to_auth();

-- ============================================================
-- 6. Criar profiles para usuários já existentes no auth.users
--    (migração de dados existentes)
-- ============================================================

INSERT INTO profiles (id, email, name, user_level, entra_id)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data ->> 'name',
    au.raw_user_meta_data ->> 'nome',
    split_part(au.email, '@', 1)
  ),
  COALESCE(
    au.raw_app_meta_data ->> 'user_level',
    au.raw_user_meta_data ->> 'user_level',
    'Novice'
  ),
  au.id::TEXT  -- entra_id = supabase uuid para novos usuários
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Migration 019: profiles table and JWT hooks created';
END $$;
