-- Tables for Student Meal Plans & Nutrition Schedules

-- 1. nutrition_meal_plans (Header)
CREATE TABLE IF NOT EXISTS public.nutrition_meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id TEXT REFERENCES contracts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_kcal DECIMAL DEFAULT 0,
    total_protein DECIMAL DEFAULT 0,
    total_carb DECIMAL DEFAULT 0,
    total_fat DECIMAL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    external_id TEXT, -- For CSV mapping
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT -- Email
);

-- 2. nutrition_meals (Individual meals in a plan)
CREATE TABLE IF NOT EXISTS public.nutrition_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.nutrition_meal_plans(id) ON DELETE CASCADE,
    meal_order INTEGER NOT NULL, -- 1, 2, 3...
    name TEXT NOT NULL, -- e.g., "Bữa sáng"
    kcal DECIMAL DEFAULT 0,
    external_id TEXT, -- From thucdon.csv ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. nutrition_meal_items (Specific food items in a meal)
CREATE TABLE IF NOT EXISTS public.nutrition_meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID REFERENCES public.nutrition_meals(id) ON DELETE CASCADE,
    food_id TEXT REFERENCES public.nutrition_foods(id) ON DELETE SET NULL,
    quantity DECIMAL NOT NULL, -- Grams or Unit
    protein DECIMAL DEFAULT 0,
    carb DECIMAL DEFAULT 0,
    fat DECIMAL DEFAULT 0,
    fiber DECIMAL DEFAULT 0,
    kcal DECIMAL DEFAULT 0,
    external_id TEXT, -- From thucdon_detail.csv ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.nutrition_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meal_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all for authenticated users" ON public.nutrition_meal_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.nutrition_meals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.nutrition_meal_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.nutrition_meal_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nutrition_meals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nutrition_meal_items;
