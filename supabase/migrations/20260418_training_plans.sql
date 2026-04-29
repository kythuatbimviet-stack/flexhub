-- Migration: Training Plans (Giáo án tập luyện)
-- Created: 2026-04-18

-- 1. Exercise Library
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_vi TEXT,
    category TEXT, -- e.g., 'Resistance', 'Cardio', 'Stretch'
    muscle_groups TEXT[], -- Array of strings e.g., ['Chest', 'Triceps']
    equipment TEXT, -- e.g., 'Dumbbell', 'Barbell', 'Body Weight'
    description TEXT,
    demo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Training Programs (Templates and Instances)
CREATE TABLE IF NOT EXISTS public.training_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    goal TEXT,
    level TEXT, -- e.g., 'Beginner', 'Intermediate', 'Advance'
    duration_weeks INTEGER,
    is_template BOOLEAN DEFAULT true, -- true for PT library, false for assigned to client
    is_public BOOLEAN DEFAULT false,  -- shared across organization
    created_by TEXT,                 -- PT Name or Profile ID
    client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE, -- Only for instances
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Training Sessions (Days/Workouts within a Program)
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.training_programs(id) ON DELETE CASCADE,
    day_label TEXT NOT NULL, -- e.g., 'Ngày 1', 'Buổi A', 'Leg Day'
    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Session Exercises (Details of exercises within a session)
CREATE TABLE IF NOT EXISTS public.training_session_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE RESTRICT,
    sets TEXT, -- e.g., '3', '3-4'
    reps TEXT, -- e.g., '12', '10-12', 'Max'
    rest_seconds INTEGER,
    intensity TEXT, -- e.g., '70% 1RM', '8-10 RPE'
    tempo TEXT,      -- e.g., '3-0-1'
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Client Training Assignments (Tracks currently active program)
CREATE TABLE IF NOT EXISTS public.client_training_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
    program_id UUID REFERENCES public.training_programs(id) ON DELETE CASCADE, -- Links to the INSTANCE (is_template = false)
    pt_id TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT DEFAULT 'Active', -- 'Active', 'Completed', 'Paused'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_training_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated for exercises" ON public.exercises FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated for programs" ON public.training_programs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated for sessions" ON public.training_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated for session_exercises" ON public.training_session_exercises FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated for assignments" ON public.client_training_assignments FOR ALL USING (auth.role() = 'authenticated');

-- Seed Data: Exercise Library
INSERT INTO public.exercises (name, name_vi, category, muscle_groups, equipment, description) VALUES
('Barbell Back Squat', 'Gánh tạ đòn', 'Resistance', '{"Quads", "Glutes"}', 'Barbell', 'Keep back straight, hips back.'),
('Deadlift', 'Kéo tạ', 'Resistance', '{"Hamstrings", "Back", "Glutes"}', 'Barbell', 'Hinge at the hips.'),
('Bench Press', 'Đẩy ngực ngang', 'Resistance', '{"Chest", "Triceps", "Shoulders"}', 'Barbell', 'Lower bar to mid-chest.'),
('Overhead Press', 'Đẩy vai đứng', 'Resistance', '{"Shoulders", "Triceps"}', 'Barbell', 'Press overhead without excessive arching.'),
('Pull Up', 'Hít xà đơn', 'Resistance', '{"Lats", "Biceps"}', 'Body Weight', 'Pull chin over bar.'),
('Dumbbell Row', 'Chèo tạ đơn', 'Resistance', '{"Lats", "Rear Delts"}', 'Dumbbell', 'Drive elbow towards hip.'),
('Standard Push Up', 'Chống đẩy', 'Resistance', '{"Chest", "Triceps"}', 'Body Weight', 'Keep core tight.'),
('Plank', 'Tấm ván', 'Core', '{"Abs", "Core"}', 'Body Weight', 'Hold static position.'),
('Bulgarian Split Squat', 'Ngồi xổm phân tách', 'Resistance', '{"Quads", "Glutes"}', 'Dumbbell', 'One foot elevated behind.'),
('Lat Pulldown', 'Kéo xà máy', 'Resistance', '{"Lats"}', 'Machine', 'Pull bar to collarbone.'),
('Leg Press', 'Đạp đùi máy', 'Resistance', '{"Quads"}', 'Machine', 'Push platform with control.'),
('Bicep Curl', 'Cuốn tạ tay', 'Resistance', '{"Biceps"}', 'Dumbbell', 'Full range of motion.'),
('Tricep Extension', 'Duỗi tay sau', 'Resistance', '{"Triceps"}', 'Cable', 'Lock elbows at sides.'),
('Lunges', 'Chùng chân', 'Resistance', '{"Quads", "Glutes"}', 'Body Weight', 'Step forward and lower hips.'),
('Russian Twist', 'Vặn người Nga', 'Core', '{"Obliques"}', 'Body Weight', 'Rotate torso side to side.'),
('Burpees', 'Burpees', 'HIIT', '{"Full Body"}', 'Body Weight', 'Explosive movement.'),
('Face Pulls', 'Kéo mặt', 'Resistance', '{"Rear Delts", "Upper Back"}', 'Cable', 'Pull towards face, spreading handles.'),
('Calf Raise', 'Nhón gót', 'Resistance', '{"Calves"}', 'Dumbbell', 'Maximize range of motion.'),
('Glute Bridge', 'Cầu mông', 'Resistance', '{"Glutes"}', 'Body Weight', 'Squeeze glutes at top.'),
('Crunches', 'Gập bụng', 'Core', '{"Abs"}', 'Body Weight', 'Controlled contraction.');
