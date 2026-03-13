-- ============================================================
-- FIX: Contract Deletion Cascade
-- Giải quyết lỗi: update or delete on table "contracts" violates foreign key constraint
-- Áp dụng script này trong Supabase SQL Editor
-- ============================================================

-- 1. Bảng weight_tracking (Theo dõi cân nặng)
-- Xóa ràng buộc cũ và tạo lại với hiệu ứng CASCADE
ALTER TABLE public.weight_tracking
DROP CONSTRAINT IF EXISTS weight_tracking_contract_id_fkey;

ALTER TABLE public.weight_tracking
ADD CONSTRAINT weight_tracking_contract_id_fkey
    FOREIGN KEY (contract_id)
    REFERENCES public.contracts(id)
    ON DELETE CASCADE;

-- 2. Bảng revenue (Doanh thu)
-- Liên kết các khoản thu trả trước với hợp đồng
ALTER TABLE public.revenue
DROP CONSTRAINT IF EXISTS revenue_contract_id_fkey;

ALTER TABLE public.revenue
ADD CONSTRAINT revenue_contract_id_fkey
    FOREIGN KEY (contract_id)
    REFERENCES public.contracts(id)
    ON DELETE CASCADE;

-- 3. Bảng debts (Công nợ)
-- Liên kết hồ sơ nợ với hợp đồng
ALTER TABLE public.debts
DROP CONSTRAINT IF EXISTS debts_contract_id_fkey;

ALTER TABLE public.debts
ADD CONSTRAINT debts_contract_id_fkey
    FOREIGN KEY (contract_id)
    REFERENCES public.contracts(id)
    ON DELETE CASCADE;

-- 4. Bảng debt_installments (Kỳ thanh toán nợ)
-- Đảm bảo khi xóa nợ (ở bước 3) thì các kỳ thanh toán cũng biến mất
ALTER TABLE public.debt_installments
DROP CONSTRAINT IF EXISTS debt_installments_debt_id_fkey;

ALTER TABLE public.debt_installments
ADD CONSTRAINT debt_installments_debt_id_fkey
    FOREIGN KEY (debt_id)
    REFERENCES public.debts(id)
    ON DELETE CASCADE;
