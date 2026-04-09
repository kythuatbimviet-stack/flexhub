-- BỔ SUNG CỘT LƯU EMAIL TẠM THỜI ĐỂ GỬI BIÊN NHẬN LINH HOẠT
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS temp_email TEXT;
COMMENT ON COLUMN contracts.temp_email IS 'Lưu địa chỉ email tạm thời từ hộp thoại để gửi biên nhận/hợp đồng';
