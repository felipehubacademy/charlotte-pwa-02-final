-- When a user is promoted to institutional, delete their rate limit record.
-- Institutional users bypass rate limiting entirely, so keeping the record
-- is misleading and wastes space.

CREATE OR REPLACE FUNCTION public.delete_rate_limit_on_institutional()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_institutional = true AND (OLD.is_institutional IS DISTINCT FROM true) THEN
    DELETE FROM public.charlotte_rate_limits WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_rate_limit_on_institutional ON charlotte.users;

CREATE TRIGGER trg_delete_rate_limit_on_institutional
AFTER UPDATE OF is_institutional ON charlotte.users
FOR EACH ROW
EXECUTE FUNCTION public.delete_rate_limit_on_institutional();
