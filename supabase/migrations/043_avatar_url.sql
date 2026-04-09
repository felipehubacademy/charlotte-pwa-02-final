-- ─────────────────────────────────────────────────────────────────────────────
-- 043_avatar_url.sql
-- Adds avatar_url to charlotte.users, updates compat view + trigger,
-- creates the 'avatars' storage bucket and its RLS policies.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Add avatar_url column to charlotte.users
ALTER TABLE charlotte.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Recreate the compat view to include the new column
CREATE OR REPLACE VIEW public.charlotte_users AS SELECT * FROM charlotte.users;

-- 3. Update the INSTEAD OF UPDATE trigger function to sync avatar_url
CREATE OR REPLACE FUNCTION public.compat_charlotte_users_upd()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charlotte.users
  SET name                 = NEW.name,
      charlotte_level      = NEW.charlotte_level,
      placement_test_done  = NEW.placement_test_done,
      must_change_password = NEW.must_change_password,
      avatar_url           = NEW.avatar_url,
      updated_at           = now()
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;

-- 4. Storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS policies (drop-then-create for idempotency)
DO $$
BEGIN
  DROP POLICY IF EXISTS "avatar_select" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_insert" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_delete" ON storage.objects;
END $$;

CREATE POLICY "avatar_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatar_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatar_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatar_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

COMMIT;
