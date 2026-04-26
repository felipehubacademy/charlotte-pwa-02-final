-- Fix: drop existing public.user_vocabulary table (base table, not view)
-- before creating the charlotte schema table + public view.

DROP TABLE IF EXISTS public.user_vocabulary CASCADE;
DROP TABLE IF EXISTS public.sr_items CASCADE;
