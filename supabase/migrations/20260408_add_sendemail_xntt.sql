-- BỔ SUNG CỘT TRIGGER RIÊNG CHO XÁC NHẬN THANH TOÁN
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS sendemail_xntt TEXT;
COMMENT ON COLUMN contracts.sendemail_xntt IS 'Trạng thái gửi email xác nhận thanh toán (Gửi email / done)';
