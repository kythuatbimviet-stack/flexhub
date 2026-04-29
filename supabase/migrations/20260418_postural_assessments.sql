-- Create the postural_assessments table
CREATE TABLE IF NOT EXISTS public.postural_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    pt_id TEXT NOT NULL, -- PT email (consistent with other modules)
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Head & Neck
    forward_head BOOLEAN DEFAULT FALSE,
    head_tilt_rotation BOOLEAN DEFAULT FALSE,
    head_notes TEXT,
    head_image_url TEXT,

    -- Shoulders & Back
    uneven_shoulders BOOLEAN DEFAULT FALSE,
    rounded_shoulders BOOLEAN DEFAULT FALSE,
    kyphosis BOOLEAN DEFAULT FALSE,
    lordosis BOOLEAN DEFAULT FALSE,
    back_notes TEXT,
    back_image_url TEXT,

    -- Hips & Pelvis
    pelvic_tilt_anterior BOOLEAN DEFAULT FALSE,
    pelvic_tilt_posterior BOOLEAN DEFAULT FALSE,
    pelvic_notes TEXT,
    pelvic_image_url TEXT,

    -- Knees
    knee_valgus BOOLEAN DEFAULT FALSE,
    knee_varus BOOLEAN DEFAULT FALSE,
    knee_hyperextension BOOLEAN DEFAULT FALSE,
    knee_notes TEXT,
    knee_image_url TEXT,

    -- Feet
    pronation BOOLEAN DEFAULT FALSE,
    supination BOOLEAN DEFAULT FALSE,
    feet_notes TEXT,
    feet_image_url TEXT,

    -- Overall
    recommendations TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.postural_assessments ENABLE ROW LEVEL SECURITY;

-- Simple Authenticated Policy (Can be refined by branch but matching consistent simple pattern for now)
CREATE POLICY "Enable all for authenticated users" 
ON public.postural_assessments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.postural_assessments;
