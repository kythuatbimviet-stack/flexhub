-- ADDING MISSING COLUMN FOR PAYMENT RECEIPT MESSAGE
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS email_message TEXT;
COMMENT ON COLUMN contracts.email_message IS 'Nội dung email tùy chỉnh hoặc nội dung biên nhận thanh toán';
