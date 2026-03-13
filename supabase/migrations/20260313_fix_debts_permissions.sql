-- ============================================================
-- FIX: debts - Permission Denied
-- Áp dụng script này trong Supabase SQL Editor
-- ============================================================

-- 1. Cấp quyền truy cập bảng cho các role Supabase
GRANT ALL ON TABLE public.debts TO postgres;
GRANT ALL ON TABLE public.debts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.debts TO authenticated;
GRANT SELECT ON TABLE public.debts TO anon;

-- 2. Kích hoạt RLS (nếu chưa có)
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- 3. Xóa policy cũ (nếu có) và tạo mới
DROP POLICY IF EXISTS "Allow authenticated manage debts" ON public.debts;

-- Policy: authenticated users can manage all debts
CREATE POLICY "Allow authenticated manage debts"
    ON public.debts
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: anon can read debts (if needed)
CREATE POLICY "Allow anon read debts"
    ON public.debts
    FOR SELECT
    TO anon
    USING (true);
