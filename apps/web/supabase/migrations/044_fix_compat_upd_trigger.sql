-- 044_fix_compat_upd_trigger.sql
-- Restaura todos os campos no INSTEAD OF UPDATE trigger da view public.charlotte_users.
-- A migration 043_avatar_url.sql sobrescreveu o trigger omitindo subscription_status,
-- is_institutional, is_active, trial_ends_at e email.

CREATE OR REPLACE FUNCTION public.compat_charlotte_users_upd()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charlotte.users
  SET email                = NEW.email,
      name                 = NEW.name,
      charlotte_level      = NEW.charlotte_level,
      placement_test_done  = NEW.placement_test_done,
      is_institutional     = NEW.is_institutional,
      is_active            = NEW.is_active,
      subscription_status  = NEW.subscription_status,
      trial_ends_at        = NEW.trial_ends_at,
      must_change_password = NEW.must_change_password,
      expo_push_token      = NEW.expo_push_token,
      avatar_url           = NEW.avatar_url,
      updated_at           = now()
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;
