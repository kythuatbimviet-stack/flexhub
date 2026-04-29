-- Create training_results table for periodic body measurements and progress tracking
CREATE TABLE IF NOT EXISTS public.training_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_id TEXT REFERENCES public.contracts(id) ON DELETE CASCADE,
    
    -- Phase and metadata
    phase TEXT,                        -- Giai đoạn
    measurement_num INTEGER,           -- Lần đo
    measurement_date DATE,             -- Ngày đo
    created_by TEXT,                   -- Người tạo (Email)
    
    -- Body Measurements (Mapped from KETQUATAPLUYEN.csv)
    measurement_chest DECIMAL,         -- Ngực
    measurement_bicep_left DECIMAL,    -- Bắp tay trái
    measurement_bicep_right DECIMAL,   -- Bắp tay phải
    measurement_waist DECIMAL,         -- Bụng
    measurement_hip DECIMAL,           -- Mông
    measurement_thigh_left DECIMAL,    -- Bắp đùi trái
    measurement_thigh_right DECIMAL,   -- Bắp đùi phải
    muscle_mass DECIMAL,               -- Lượng cơ
    body_fat DECIMAL,                  -- Bodyfat
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.training_results ENABLE ROW LEVEL SECURITY;

-- Simple policy for all authenticated users to manage training results
-- (In a real scenario, this would be restricted by branch/RBAC, 
-- but following the established pattern in this repo)
CREATE POLICY "Enable all access for authenticated users" ON public.training_results
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_training_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_training_results_updated_at_trigger
    BEFORE UPDATE ON public.training_results
    FOR EACH ROW
    EXECUTE FUNCTION update_training_results_updated_at();
