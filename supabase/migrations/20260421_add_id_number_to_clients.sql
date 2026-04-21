-- ============================================================
-- Migration: Thêm trường id_number cho bảng clients
-- Created: 2026-04-21
-- ============================================================

-- Thêm trường id_number (CCCD/CMND) vào bảng clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS id_number TEXT;

-- Index tìm kiếm nhanh theo CCCD
CREATE INDEX IF NOT EXISTS idx_clients_id_number ON public.clients using btree (id_number);

-- Thêm comment mô tả
COMMENT ON COLUMN clients.id_number IS 'Số Chứng minh nhân dân hoặc Căn cước công dân của khách hàng';
