-- ============================================================
-- FIX: revenue - Permission Denied
-- Áp dụng script này trong Supabase SQL Editor
-- ============================================================

-- 1. Cấp quyền truy cập bảng cho các role Supabase
GRANT ALL ON TABLE public.revenue TO postgres;
GRANT ALL ON TABLE public.revenue TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.revenue TO authenticated;
GRANT SELECT ON TABLE public.revenue TO anon;

-- 2. Kích hoạt RLS (nếu chưa có)
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;

-- 3. Xóa policy cũ (nếu có) và tạo mới
DROP POLICY IF EXISTS "Allow authenticated read revenue" ON public.revenue;
DROP POLICY IF EXISTS "Allow authenticated manage revenue" ON public.revenue;
DROP POLICY IF EXISTS "Allow service_role full access revenue" ON public.revenue;

-- Policy: authenticated users can manage all revenue (as described in user's prompt)
CREATE POLICY "Allow authenticated manage revenue"
    ON public.revenue
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: anon can read revenue (if needed for public views)
CREATE POLICY "Allow anon read revenue"
    ON public.revenue
    FOR SELECT
    TO anon
    USING (true);

-- 4. Xác nhận quyền
-- SELECT * FROM pg_policies WHERE tablename = 'revenue';
