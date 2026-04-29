-- Create training_roadmaps table
CREATE TABLE IF NOT EXISTS public.training_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_id TEXT REFERENCES public.contracts(id) ON DELETE CASCADE,
    goal TEXT,                          -- Mục tiêu tổng quát
    duration_overall TEXT,               -- Thời gian (e.g., 6-12 Tháng)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT,                     -- Tên người tạo
    is_active BOOLEAN DEFAULT true
);

-- Create roadmap_phases table for detailed metrics of each phase
CREATE TABLE IF NOT EXISTS public.roadmap_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID REFERENCES public.training_roadmaps(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,       -- 1, 2, 3...
    phase_title TEXT,                    -- e.g., HUẤN LUYỆN NỀN TẢNG
    primary_goal TEXT,                   -- MỤC TIÊU CHÍNH
    supplementary_goal TEXT,             -- MỤC TIÊU BỔ SUNG
    methodology TEXT,                    -- PHƯƠNG PHÁP THỰC HIỆN
    expected_results TEXT,               -- KẾT QUẢ KỲ VỌNG
    total_time TEXT,                     -- TỔNG THỜI GIAN (e.g., 6 Tháng)
    total_sessions TEXT,                 -- SỐ BUỔI TẬP (e.g., 144ss)
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_phases ENABLE ROW LEVEL SECURITY;

-- Administrative Policies (Allow authenticated users to manage)
-- Note: Using simple authenticated policy for now, assuming adminClient will be used for execution
CREATE POLICY "Enable all access for authenticated" ON public.training_roadmaps
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated" ON public.roadmap_phases
    FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_roadmaps_client_id ON public.training_roadmaps(client_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_phases_roadmap_id ON public.roadmap_phases(roadmap_id);
