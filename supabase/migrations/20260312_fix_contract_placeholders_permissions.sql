-- ============================================================
-- FIX: contract_placeholders - Permission Denied
-- Áp dụng script này trong Supabase SQL Editor
-- ============================================================

-- 1. Cấp quyền truy cập bảng cho các role Supabase
GRANT ALL ON TABLE public.contract_placeholders TO postgres;
GRANT ALL ON TABLE public.contract_placeholders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contract_placeholders TO authenticated;
GRANT SELECT ON TABLE public.contract_placeholders TO anon;

-- 2. Kích hoạt RLS (nếu chưa có)
ALTER TABLE public.contract_placeholders ENABLE ROW LEVEL SECURITY;

-- 3. Xóa policy cũ (nếu có) và tạo mới
DROP POLICY IF EXISTS "Allow service_role full access" ON public.contract_placeholders;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.contract_placeholders;
DROP POLICY IF EXISTS "Allow authenticated write" ON public.contract_placeholders;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.contract_placeholders;

-- Policy: authenticated users can read all placeholders
CREATE POLICY "Allow authenticated read"
    ON public.contract_placeholders
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: authenticated users can insert placeholders
CREATE POLICY "Allow authenticated insert"
    ON public.contract_placeholders
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: authenticated users can update placeholders
CREATE POLICY "Allow authenticated update"
    ON public.contract_placeholders
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: authenticated users can delete placeholders
CREATE POLICY "Allow authenticated delete"
    ON public.contract_placeholders
    FOR DELETE
    TO authenticated
    USING (true);

-- Policy: anon can read active placeholders
CREATE POLICY "Allow anon read active"
    ON public.contract_placeholders
    FOR SELECT
    TO anon
    USING (is_active = true);

-- 4. Xác nhận đã có dữ liệu (optional - kiểm tra seed data)
-- SELECT COUNT(*) FROM public.contract_placeholders;
