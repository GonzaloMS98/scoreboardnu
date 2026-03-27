-- Roles enum
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('base', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  role public.user_role NOT NULL DEFAULT 'base',
  base_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scores table
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  points INT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_base_created ON public.scores(base_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_team_created ON public.scores(team_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.my_base_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT p.base_id FROM public.profiles p WHERE p.id = auth.uid();
$$;

-- Scores policies
DROP POLICY IF EXISTS "scores_select_own_or_admin" ON public.scores;
CREATE POLICY "scores_select_own_or_admin" ON public.scores FOR SELECT USING (
  public.is_admin() OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "scores_insert_own_base_or_admin" ON public.scores;
CREATE POLICY "scores_insert_own_base_or_admin" ON public.scores FOR INSERT WITH CHECK (
  public.is_admin() OR (created_by = auth.uid() AND base_id = public.my_base_id())
);

DROP POLICY IF EXISTS "scores_delete_admin" ON public.scores;
CREATE POLICY "scores_delete_admin" ON public.scores FOR DELETE USING (
  public.is_admin()
);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, base_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'base'),
    NEW.raw_user_meta_data ->> 'base_id'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
