-- Thêm cột discounted_price_text vào bảng contracts
-- Chạy trong Supabase SQL Editor

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS discounted_price_text text;
