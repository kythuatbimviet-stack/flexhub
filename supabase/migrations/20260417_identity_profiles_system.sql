-- Infrastructure for Profile-based Identity System

-- 1. Create Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Matches auth.users.id
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- 2. Trigger Function for auth.users sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    avatar_url
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', substring(new.email from '(.*)@')), 
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS & Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable update for own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 5. Data Migration: Seed profiles from existing users and clients
-- This ensures existing staff/clients have a profile record
INSERT INTO public.profiles (id, email, name, avatar_url)
SELECT id, email, name, avatar_url FROM public.users
ON CONFLICT (id) DO NOTHING;

-- For clients, we don't have their UUID from auth.users easily unless they already logged in.
-- But we can map them by email if they ever register.
-- The trigger will handle new registrations.

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
