-- Create health_profiles table for clinical and biometric data
CREATE TABLE IF NOT EXISTS public.health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id TEXT REFERENCES public.contracts(id) ON DELETE CASCADE,
    
    -- Biometrics
    gender TEXT,
    height DECIMAL,
    weight DECIMAL,
    age INTEGER,
    body_fat DECIMAL,
    
    -- Habits
    experience BOOLEAN DEFAULT FALSE,
    wake_time TIME,
    sleep_time TIME,
    train_time TIME,
    allergies TEXT,
    favorite_foods TEXT,
    weight_strategy TEXT,
    daily_activity TEXT,

    -- Measurements
    measurement_shoulder DECIMAL,
    measurement_chest DECIMAL,
    measurement_bicep_left DECIMAL,
    measurement_bicep_right DECIMAL,
    measurement_waist DECIMAL,
    measurement_hip DECIMAL,
    measurement_thigh_left DECIMAL,
    measurement_thigh_right DECIMAL,
    measurement_calf_left DECIMAL,
    measurement_calf_right DECIMAL,

    -- Medical Conditions
    medical_cardiovascular TEXT,
    medical_blood_pressure TEXT,
    medical_diabetes TEXT,
    medical_asthma TEXT,
    medical_vestibular TEXT,
    medical_back_issue TEXT,
    medical_stomach TEXT,
    medical_nerves TEXT,
    medical_neck_shoulder_pain TEXT,
    sleep_hours DECIMAL,
    medical_sciatica TEXT,
    medical_joints TEXT,
    is_smoker BOOLEAN DEFAULT FALSE,
    is_alcoholic BOOLEAN DEFAULT FALSE,
    medical_hernia TEXT,
    medical_surgery TEXT,
    medical_insomnia TEXT,
    medical_hip_alignment TEXT,
    
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;

-- Simple policy for all authenticated users to manage health profiles
CREATE POLICY "Enable all access for authenticated users" ON public.health_profiles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
