-- Create nutrition_foods table
CREATE TABLE IF NOT EXISTS public.nutrition_foods (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    protein DECIMAL DEFAULT 0,
    carb DECIMAL DEFAULT 0,
    fat DECIMAL DEFAULT 0,
    fiber DECIMAL DEFAULT 0,
    unit TEXT,
    conversion_factor DECIMAL DEFAULT 1,
    image_data TEXT, -- Base64 encoded image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.nutrition_foods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.nutrition_foods
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role" ON public.nutrition_foods
    USING (true)
    WITH CHECK (true);

-- Add to real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.nutrition_foods;
