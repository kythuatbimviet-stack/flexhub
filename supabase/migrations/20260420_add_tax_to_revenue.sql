-- 20260420_add_tax_to_revenue.sql

-- 1. Thêm các cột mới vào bảng revenue
ALTER TABLE public.revenue 
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_amount NUMERIC DEFAULT 0;

-- 2. Cập nhật dữ liệu cũ để đảm bảo tính nhất quán (doanh thu thực tế = tổng doanh thu cho các bản ghi cũ)
UPDATE public.revenue 
SET tax_rate = 0, 
    tax_amount = 0, 
    actual_amount = amount 
WHERE actual_amount = 0 OR actual_amount IS NULL;
