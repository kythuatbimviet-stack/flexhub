-- FIX: Permissions for Contracts, Clients and Branches
-- Required for Nutrition Meal Plans and other dashboard modules

-- 1. Grant SELECT permissions on core tables to authenticated users
-- This avoids the "permission denied for table contracts" (42501) error
GRANT SELECT ON public.contracts TO authenticated;
GRANT SELECT ON public.clients TO authenticated;
GRANT SELECT ON public.branches TO authenticated;

-- 2. Ensure Row Level Security policies allow reading for authenticated users
-- Application-level RBAC is handled in Server Actions (getAccessFilter).
DO $$ 
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN SELECT UNNEST(ARRAY['contracts', 'clients', 'branches'])
    LOOP
        -- Enable RLS if not already enabled
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);

        -- Create "Enable read for authenticated users" policy if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = tbl_name AND policyname = 'Enable read for authenticated users'
        ) THEN
            EXECUTE format('CREATE POLICY "Enable read for authenticated users" ON public.%I FOR SELECT TO authenticated USING (true)', tbl_name);
        END IF;
    END LOOP;
END $$;
