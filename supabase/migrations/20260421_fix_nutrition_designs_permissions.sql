-- FIX: Comprehensive Permissions for Nutrition Module
-- Tables: nutrition_foods, nutrition_designs, nutrition_meal_plans, nutrition_meals, nutrition_meal_items

-- 1. Enable RLS for all tables
ALTER TABLE public.nutrition_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meal_items ENABLE ROW LEVEL SECURITY;

-- 2. Create Global Policies for Authenticated Users
DO $$ 
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN SELECT UNNEST(ARRAY['nutrition_foods', 'nutrition_designs', 'nutrition_meal_plans', 'nutrition_meals', 'nutrition_meal_items'])
    LOOP
        -- Check if policy exists before creating to avoid errors
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = tbl_name AND policyname = 'Enable all for authenticated users'
        ) THEN
            EXECUTE format('CREATE POLICY "Enable all for authenticated users" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl_name);
        END IF;

        -- For nutrition_foods, we also need a public read policy if PTs/Users need to see the library without complex logic
        IF tbl_name = 'nutrition_foods' AND NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'nutrition_foods' AND policyname = 'Enable read access for all users'
        ) THEN
            CREATE POLICY "Enable read access for all users" ON public.nutrition_foods FOR SELECT USING (true);
        END IF;
    END LOOP;
END $$;

-- 3. Grant Explicit Permissions to Roles
-- This is crucial to avoid "permission denied for table" error code 42501
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nutrition_foods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nutrition_designs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nutrition_meal_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nutrition_meals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nutrition_meal_items TO authenticated;

-- Grant READ access to anonymous users for foods (Optional but prevents errors in public views)
GRANT SELECT ON TABLE public.nutrition_foods TO anon;
GRANT SELECT ON TABLE public.nutrition_designs TO anon;

-- 4. Enable Realtime consistently
DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN SELECT UNNEST(ARRAY['nutrition_foods', 'nutrition_designs', 'nutrition_meal_plans', 'nutrition_meals', 'nutrition_meal_items'])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl_name);
        END IF;
    END LOOP;
END $$;
