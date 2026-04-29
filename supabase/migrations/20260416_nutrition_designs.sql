-- ============================================================
-- nutrition_designs table
-- Quản lý tính toán dinh dưỡng (Macro) theo tinhtoan.csv
-- ============================================================

CREATE TABLE IF NOT EXISTS nutrition_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    contract_id TEXT REFERENCES contracts(id) ON DELETE SET NULL,
    
    -- Input Biometrics (Thông tin đầu vào)
    gender TEXT, -- 'Nam' | 'Nữ'
    height DECIMAL, -- Chiều cao (cm)
    weight DECIMAL, -- Cân nặng (kg)
    age INTEGER, -- Tuổi
    waist_circumference DECIMAL, -- Số đo vùng eo (ngang rốn) (cm)
    hip_circumference DECIMAL, -- Số đo vòng hông (mông) (cm)
    neck_circumference DECIMAL, -- Số đo vòng cổ (cm)
    
    -- Calculated Metrics (Chỉ số tính toán)
    bmi DECIMAL, -- BMI
    body_fat_percentage_bmi DECIMAL, -- %Bf theo BMI
    body_fat_percentage_navy DECIMAL, -- %Bf theo Navy formula
    body_fat_percentage_manual DECIMAL, -- %Bf tự xác định
    body_fat_method TEXT DEFAULT 'BMI', -- Lựa chọn PP tính % Bf
    body_fat_used DECIMAL, -- Tỷ lệ mỡ cơ thể sử dụng
    ffm DECIMAL, -- Fat Free Mass (FFM)
    bmr DECIMAL, -- Katch McArdle BMR
    
    -- Activity & Energy (Vận động & Năng lượng)
    activity_level TEXT, -- Mức độ vận động thể chất
    activity_coefficient DECIMAL, -- Hệ số vận động
    tef_percentage DECIMAL DEFAULT 15, -- Năng lượng tiêu hóa (TEF) %
    rest_energy_expenditure DECIMAL, -- Tổng năng lượng cần cho ngày nghỉ
    training_sessions_per_week INTEGER, -- Số buổi tập một tuần
    training_duration_per_session INTEGER, -- Thời gian tập một buổi (phút)
    rt_ee DECIMAL, -- RT EE (Năng lượng tập luyện)
    training_energy_expenditure DECIMAL, -- Tổng năng lượng cần cho ngày tập
    
    -- Goal & Targets (Mục tiêu & Macro)
    energy_delta_percentage DECIMAL, -- Mức thâm hụt, thặng dư năng lượng (%)
    daily_calorie_intake DECIMAL, -- Mức calo nạp vào hàng ngày
    protein_per_kg DECIMAL, -- Mức Protein (g/kg LBM hoặc g/kg)
    fat_percentage DECIMAL, -- Mức Fat (%)
    protein_grams DECIMAL, -- Protein (g)
    carb_grams DECIMAL, -- Carb (g)
    fat_grams DECIMAL, -- Fat (g)
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT -- Người tạo (email)
);

-- Index tìm kiếm
CREATE INDEX IF NOT EXISTS idx_nutrition_designs_client_id ON nutrition_designs(client_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_designs_contract_id ON nutrition_designs(contract_id);
