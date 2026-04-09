-- DỌN DẸP VÀ CHUẨN HÓA THEO YÊU CẦU CỦA USER
ALTER TABLE contracts DROP COLUMN IF EXISTS temp_email;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS sendemail_xntt TEXT;
COMMENT ON COLUMN contracts.sendemail_xntt IS 'Trạng thái gửi xác nhận thanh toán (Gửi email / done)';
