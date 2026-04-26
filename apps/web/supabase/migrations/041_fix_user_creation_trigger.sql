-- ─────────────────────────────────────────────────────────────────────────────
-- 041_fix_user_creation_trigger.sql
--
-- Corrige dois problemas no trigger de criação de usuário:
--
-- 1. is_institutional: agora lê raw_user_meta_data->>'is_institutional'.
--    Quando o admin cria um usuário pelo dashboard do Supabase e define
--    User Metadata = {"is_institutional": true}, o campo é setado automaticamente.
--    Sem esse metadata, continua false (usuário comum).
--
-- 2. name: para de usar email como fallback de nome.
--    Agora usa: raw_user_meta_data->>'name'  (ou 'full_name' como alternativa).
--    Se nenhum estiver presente, grava NULL.
--    O app já trata NULL com fallback: profile?.name ?? email.split('@')[0].
--
-- Como criar usuário institucional pelo Supabase Dashboard:
--   Authentication → Users → Add User
--   Email: usuario@empresa.com
--   Password: senha
--   User Metadata: {"is_institutional": true, "name": "Nome Completo"}
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_charlotte_user_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_name            text;
  v_is_institutional boolean;
BEGIN
  -- Nome: prioridade para 'name', depois 'full_name', depois NULL
  v_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULL
  );

  -- is_institutional: lê metadata; padrão false se ausente
  v_is_institutional := COALESCE(
    (NEW.raw_user_meta_data->>'is_institutional')::boolean,
    false
  );

  INSERT INTO charlotte_users (id, email, name, is_institutional)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_is_institutional
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger já existe; recria função é suficiente (trigger aponta para a função por nome).
-- Se precisar recriar o trigger explicitamente:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION create_charlotte_user_on_signup();
