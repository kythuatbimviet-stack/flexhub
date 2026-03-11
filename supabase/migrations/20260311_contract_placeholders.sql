-- ============================================================
-- contract_placeholders table
-- Quản lý placeholder dùng trong template hợp đồng
-- ============================================================

CREATE TABLE IF NOT EXISTS contract_placeholders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL UNIQUE,          -- e.g. "{{member_name}}"
  label        text NOT NULL,                 -- e.g. "Họ và tên"
  description  text,                          -- mô tả thêm (tuỳ chọn)
  category     text NOT NULL DEFAULT 'general', -- 'member' | 'center' | 'contract' | 'package'
  sample_value text,                          -- dữ liệu mẫu để preview
  is_active    boolean NOT NULL DEFAULT true,
  is_default   boolean NOT NULL DEFAULT false, -- true = placeholder mặc định hệ thống
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Index tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_contract_placeholders_category ON contract_placeholders(category);
CREATE INDEX IF NOT EXISTS idx_contract_placeholders_active   ON contract_placeholders(is_active);

-- ============================================================
-- DEFAULT SEED DATA — 28 placeholder mặc định
-- ON CONFLICT: bỏ qua nếu key đã tồn tại (không ghi đè user edits)
-- Dùng INSERT ... ON CONFLICT DO NOTHING để an toàn
-- ============================================================

INSERT INTO contract_placeholders (key, label, description, category, sample_value, is_default, sort_order) VALUES

-- ── Hội viên (Bên B) ──────────────────────────────────────
('{{member_name}}',      'Họ và tên',            'Họ và tên đầy đủ của hội viên (in hoa)',        'member',   'NGUYỄN THỊ MAI',             true,  10),
('{{phone}}',            'Số điện thoại',         'SĐT hội viên',                                  'member',   '0912 345 678',               true,  20),
('{{email}}',            'Email',                 'Email hội viên',                                 'member',   'mai.nguyen@email.com',        true,  30),
('{{dob}}',              'Ngày sinh',             'Ngày sinh hội viên (dd/mm/yyyy)',                'member',   '15/03/1995',                  true,  40),
('{{address}}',          'Địa chỉ',              'Địa chỉ thường trú hội viên',                   'member',   '123 Đường Lê Lợi, Quận 1',   true,  50),
('{{id_number}}',        'CMND/CCCD',             'Số chứng minh nhân dân / căn cước',             'member',   '079195012345',                true,  60),
('{{initial_height}}',   'Chiều cao',             'Chiều cao ban đầu (cm)',                         'member',   '162',                         true,  70),
('{{initial_weight}}',   'Cân nặng',             'Cân nặng ban đầu (kg)',                          'member',   '55',                          true,  80),
('{{medical_condition}}','Bệnh lý',              'Tình trạng bệnh lý (mặc định: Không)',           'member',   'Không',                       true,  90),

-- ── Trung tâm (Bên A) ─────────────────────────────────────
('{{center_name}}',          'Tên trung tâm',          'Tên đầy đủ của trung tâm',                 'center',   'TRUNG TÂM LADY FIT',          true, 110),
('{{center_short_name}}',    'Tên viết tắt TT',        'Tên viết tắt trung tâm',                   'center',   'LADY FIT',                    true, 120),
('{{center_representative}}','Đại diện trung tâm',     'Người đại diện ký hợp đồng',               'center',   'Nguyễn Minh Trí',             true, 130),
('{{center_phone}}',         'SĐT trung tâm',          'Số điện thoại trung tâm (từ bảng branches)','center',  '028 1234 5678',               true, 140),
('{{center_address}}',       'Địa chỉ trung tâm',      'Địa chỉ trung tâm (từ bảng branches)',      'center',   '456 Nguyễn Trãi, Quận 5',    true, 150),
('{{legal_representative}}', 'Người đại diện PL',      'Người đại diện theo pháp luật của chi nhánh','center', 'NGUYỄN VĂN AN',              true, 160),
('{{representative_phone}}', 'SĐT đại diện PL',        'SĐT người đại diện pháp luật',             'center',   '0901 234 567',                true, 170),
('{{branch_name}}',          'Tên chi nhánh',          'Tên chi nhánh trực tiếp',                  'center',   'Chi nhánh Quận 1',            true, 180),
('{{account_number}}',       'Số tài khoản',          'Số tài khoản ngân hàng trung tâm',          'center',   '1234567890',                  true, 190),
('{{bank_name}}',            'Ngân hàng',             'Tên ngân hàng',                              'center',   'Vietcombank',                 true, 200),
('{{account_holder}}',       'Chủ tài khoản',         'Tên chủ tài khoản',                          'center',   'NGUYỄN VĂN AN',              true, 210),

-- ── Gói dịch vụ ───────────────────────────────────────────
('{{package_name}}',     'Tên gói tập',           'Tên gói dịch vụ đăng ký',                       'package',  'GÓI PT CAO CẤP 3 THÁNG',    true, 310),
('{{total_sessions}}',   'Số buổi',               'Tổng số buổi tập',                               'package',  '36',                          true, 320),
('{{start_date}}',       'Ngày bắt đầu',          'Ngày bắt đầu hợp đồng (dd/mm/yyyy)',            'package',  '01/04/2026',                  true, 330),
('{{end_date}}',         'Ngày kết thúc',         'Ngày kết thúc hợp đồng (dd/mm/yyyy)',           'package',  '30/06/2026',                  true, 340),
('{{trainer_name}}',     'Tên HLV',               'Huấn luyện viên phụ trách',                     'package',  'Trần Văn Hùng',               true, 350),
('{{trainer_type}}',     'Hình thức HL',          'Hình thức huấn luyện (trực tiếp / online)',      'package',  'Trực tiếp',                  true, 360),

-- ── Hợp đồng ──────────────────────────────────────────────
('{{contract_id}}',      'Mã hợp đồng',           'ID hợp đồng',                                   'contract', 'HĐ-2026-0001',               true, 410),
('{{signing_date}}',     'Ngày ký',               'Ngày ký hợp đồng (dd/mm/yyyy)',                 'contract', '01/04/2026',                  true, 420),
('{{total_amount}}',     'Tổng tiền',             'Giá trị hợp đồng (định dạng tiền VND)',         'contract', '12.000.000 ₫',               true, 430),
('{{total_amount_words}}','Tổng tiền (chữ)',      'Giá trị hợp đồng bằng chữ tiếng Việt',         'contract', 'Mười hai triệu',              true, 440),
('{{payment_method}}',   'Hình thức thanh toán',  'Phương thức thanh toán',                        'contract', 'Tiền mặt',                    true, 450)

ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Trigger cập nhật updated_at tự động
-- ============================================================
CREATE OR REPLACE FUNCTION update_contract_placeholders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_contract_placeholders_updated_at ON contract_placeholders;
CREATE TRIGGER tr_contract_placeholders_updated_at
  BEFORE UPDATE ON contract_placeholders
  FOR EACH ROW EXECUTE FUNCTION update_contract_placeholders_updated_at();
