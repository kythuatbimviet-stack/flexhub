-- ============================================================
-- Migration: Thêm các trường đóng/kết thúc hợp đồng
-- Created: 2026-03-31
-- ============================================================

-- Thêm trường tình trạng đóng HĐ: 'Renew' | 'Tạm nghỉ' | 'Nghỉ hẳn'
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS closure_status TEXT;

-- Thêm lý do nghỉ (bắt buộc khi closure_status = 'Tạm nghỉ' hoặc 'Nghỉ hẳn')
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS closure_reason TEXT;

-- Thời điểm xử lý đóng HĐ
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Comment mô tả
COMMENT ON COLUMN contracts.closure_status IS 'Tình trạng sau khi HĐ kết thúc: Renew | Tạm nghỉ | Nghỉ hẳn';
COMMENT ON COLUMN contracts.closure_reason IS 'Lý do nghỉ (bắt buộc khi closure_status là Tạm nghỉ hoặc Nghỉ hẳn)';
COMMENT ON COLUMN contracts.closed_at IS 'Thời điểm nhân viên xử lý đóng hợp đồng';
