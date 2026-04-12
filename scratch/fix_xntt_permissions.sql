-- 1. Cấp quyền truy cập cơ bản cho các vai trò
GRANT ALL ON TABLE public.xntt_history TO authenticated;
GRANT ALL ON TABLE public.xntt_history TO service_role;
GRANT ALL ON TABLE public.xntt_history TO postgres;

-- 2. Kích hoạt RLS và tạo chính sách cho phép nhân viên thao tác
ALTER TABLE public.xntt_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.xntt_history;
CREATE POLICY "Allow all for authenticated users" ON public.xntt_history
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
