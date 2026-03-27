-- Backfill existing Supabase Auth users into public.profiles.
-- Run this after users already exist in auth.users.

INSERT INTO public.profiles (id, email, role, base_id)
SELECT
  users.id,
  users.email,
  CASE
    WHEN users.raw_user_meta_data ->> 'role' = 'admin' THEN 'admin'::public.user_role
    ELSE 'base'::public.user_role
  END,
  users.raw_user_meta_data ->> 'base_id'
FROM auth.users AS users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  base_id = EXCLUDED.base_id;
