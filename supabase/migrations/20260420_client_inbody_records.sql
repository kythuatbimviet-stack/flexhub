-- Create client_inbody_records table for storing detailed body composition measurements
CREATE TABLE IF NOT EXISTS public.client_inbody_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Basic info at time of recording
    age INTEGER,
    height DECIMAL,
    gender TEXT,
    
    -- Body Composition Analysis
    body_water DECIMAL,         -- Nước cơ thể (L)
    protein DECIMAL,            -- Protein (kg)
    minerals DECIMAL,           -- Khoáng chất (kg)
    body_fat_mass DECIMAL,      -- Khối lượng mỡ cơ thể (kg)
    weight DECIMAL,             -- Cân nặng (kg)
    
    -- Muscle-Fat Analysis
    smm DECIMAL,                -- Skeletal Muscle Mass (kg)
    
    -- Obesity Analysis
    bmi DECIMAL,                -- Body Mass Index
    pbf DECIMAL,                -- Percent Body Fat (%)
    whr DECIMAL,                -- Waist-Hip Ratio
    
    -- Segmental Lean Analysis (kg)
    lean_arm_r DECIMAL,
    lean_arm_l DECIMAL,
    lean_trunk DECIMAL,
    lean_leg_r DECIMAL,
    lean_leg_l DECIMAL,
    
    -- Segmental Fat Analysis (kg)
    fat_arm_r DECIMAL,
    fat_arm_l DECIMAL,
    fat_trunk DECIMAL,
    fat_leg_r DECIMAL,
    fat_leg_l DECIMAL,
    
    -- Fitness & Control
    fitness_score INTEGER,      -- Điểm thể trạng
    bmr INTEGER,                -- Basal Metabolic Rate (kcal)
    
    -- Weight Control (kg)
    target_weight DECIMAL,
    weight_control DECIMAL,
    fat_control DECIMAL,
    muscle_control DECIMAL,
    
    -- Metadata
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.client_inbody_records ENABLE ROW LEVEL SECURITY;

-- Simple policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON public.client_inbody_records
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
