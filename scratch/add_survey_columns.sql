-- Lệnh SQL bổ sung 5 cột khảo sát khách hàng vào bảng clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS survey_training_history text,
ADD COLUMN IF NOT EXISTS survey_injury_history text,
ADD COLUMN IF NOT EXISTS survey_work_stress text,
ADD COLUMN IF NOT EXISTS survey_pathology_details text,
ADD COLUMN IF NOT EXISTS survey_health_advice text;

-- Comment mô tả cho các cột
COMMENT ON COLUMN public.clients.survey_training_history IS 'Lịch sử tập luyện và kết quả đã đạt được';
COMMENT ON COLUMN public.clients.survey_injury_history IS 'Tiền sử phẫu thuật, chấn thương, gãy xương';
COMMENT ON COLUMN public.clients.survey_work_stress IS 'Tính chất công việc (ngồi nhiều/đi lại) và mức độ stress';
COMMENT ON COLUMN public.clients.survey_pathology_details IS 'Vấn đề bệnh lý cụ thể (đau lưng, vai gáy...)';
COMMENT ON COLUMN public.clients.survey_health_advice IS 'Khám sức khỏe định kỳ và lời khuyên của bác sĩ';
