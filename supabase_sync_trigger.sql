-- 1. Function to handle new user registration from Supabase Auth
-- This function will automatically create a record in public.users when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    avatar_url, 
    status,
    permissions,
    position,
    branch_id,
    branch_name
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', substring(new.email from '(.*)@')), 
    new.raw_user_meta_data->>'avatar_url',
    'Activated',
    -- Custom logic for demo accounts synchronization
    CASE 
      WHEN new.email = 'admin@evafit.com' THEN 'Admin'
      ELSE NULL
    END,
    CASE 
      WHEN new.email = 'admin@evafit.com' THEN 'CEO'
      WHEN new.email = 'demo1@evafit.com' THEN 'Nhân viên'
      WHEN new.email = 'demo2@evafit.com' THEN 'Quản lý chi nhánh'
      ELSE 'Nhân viên'
    END,
    CASE
      WHEN new.email IN ('demo1@evafit.com', 'demo2@evafit.com', 'admin@evafit.com') THEN 'CN005'
      ELSE NULL
    END,
    CASE
      WHEN new.email IN ('demo1@evafit.com', 'demo2@evafit.com', 'admin@evafit.com') THEN 'Hạ Long - Quảng Ninh'
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on auth.users (Supabase handled)
-- You may need to run this manually in the Supabase SQL Editor
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Update existing records if they were created before the trigger
-- (Optional, since we already seeded but good for future-proofing)
INSERT INTO public.users (id, email, name, status, permissions, position, branch_id, branch_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', substring(email from '(.*)@')),
  'Activated',
  CASE WHEN email = 'admin@evafit.com' THEN 'Admin' ELSE NULL END,
  CASE 
    WHEN email = 'admin@evafit.com' THEN 'CEO'
    WHEN email = 'demo1@evafit.com' THEN 'Nhân viên'
    WHEN email = 'demo2@evafit.com' THEN 'Quản lý chi nhánh'
    ELSE 'Nhân viên'
  END,
  CASE WHEN email IN ('demo1@evafit.com', 'demo2@evafit.com', 'admin@evafit.com') THEN 'CN005' ELSE NULL END,
  CASE WHEN email IN ('demo1@evafit.com', 'demo2@evafit.com', 'admin@evafit.com') THEN 'Hạ Long - Quảng Ninh' ELSE NULL END
FROM auth.users
WHERE email IN ('admin@evafit.com', 'demo1@evafit.com', 'demo2@evafit.com')
ON CONFLICT (id) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  position = EXCLUDED.position,
  branch_id = EXCLUDED.branch_id,
  branch_name = EXCLUDED.branch_name;
