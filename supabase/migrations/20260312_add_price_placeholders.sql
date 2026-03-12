-- ============================================================
-- Thêm 4 placeholder giá mới vào contract_placeholders
-- Áp dụng trong Supabase SQL Editor
-- ============================================================

INSERT INTO public.contract_placeholders
  (key, label, description, category, sample_value, is_active, is_default, sort_order)
VALUES
  ('{{package_price}}',
   'Giá gói trước giảm',
   'Giá niêm yết gói tập trước khi giảm giá (VND) — từ trường package_price',
   'package',
   '15.000.000 ₫',
   true, true, 370),

  ('{{package_price_words}}',
   'Giá gói trước giảm (chữ)',
   'Giá niêm yết gói tập bằng chữ tiếng Việt — từ trường package_price_text hoặc tự tính',
   'package',
   'Mười lăm triệu',
   true, true, 380),

  ('{{discounted_price}}',
   'Giá gói trợ giá',
   'Giá gói tập sau khi áp dụng chương trình trợ giá — từ trường discounted_price',
   'package',
   '12.000.000 ₫',
   true, true, 390),

  ('{{discounted_price_words}}',
   'Giá gói trợ giá (chữ)',
   'Giá trợ giá bằng chữ tiếng Việt — tự tính từ discounted_price',
   'package',
   'Mười hai triệu',
   true, true, 400)

ON CONFLICT (key) DO NOTHING;
