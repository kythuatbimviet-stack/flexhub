-- 1. Thêm các cột bộ đếm vào bảng branches
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS last_contract_seq bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_client_seq bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_counter_month text;

-- 2. Khởi tạo tháng hiện tại cho các chi nhánh (YYMM)
UPDATE branches SET last_counter_month = to_char(now(), 'YYMM') WHERE last_counter_month IS NULL;

-- 3. Khởi tạo giá trị bộ đếm từ dữ liệu cũ (chỉ tính các mã trong tháng hiện tại)
-- Cập nhật bộ đếm Hợp đồng
DO $$
DECLARE
    rec RECORD;
    v_max_seq int;
    v_now_yymm text := to_char(now(), 'YYMM');
BEGIN
    FOR rec IN SELECT id FROM branches LOOP
        SELECT MAX(CAST(substring(id FROM '\d{3}$') AS integer)) INTO v_max_seq
        FROM contracts
        WHERE branch_id = rec.id 
          AND id LIKE 'HD-%-' || v_now_yymm || '%';
        
        IF v_max_seq IS NOT NULL THEN
            UPDATE branches SET last_contract_seq = v_max_seq WHERE id = rec.id;
        END IF;
    END LOOP;
END $$;

-- Cập nhật bộ đếm Khách hàng
DO $$
DECLARE
    rec RECORD;
    v_max_seq int;
    v_now_yymm text := to_char(now(), 'YYMM');
BEGIN
    FOR rec IN SELECT id FROM branches LOOP
        SELECT MAX(CAST(substring(id FROM '\d{3}$') AS integer)) INTO v_max_seq
        FROM clients
        WHERE branch_id = rec.id 
          AND id LIKE 'EF-%-' || v_now_yymm || '%';
        
        IF v_max_seq IS NOT NULL THEN
            UPDATE branches SET last_client_seq = v_max_seq WHERE id = rec.id;
        END IF;
    END LOOP;
END $$;

-- 4. Tạo hàm RPC fn_generate_next_id để cấp phát mã nguyên tử
CREATE OR REPLACE FUNCTION fn_generate_next_id(
    p_branch_id text, 
    p_type text,   -- 'contract' hoặc 'client'
    p_prefix text  -- 'HD' hoặc 'EF'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Chạy với quyền của creator (bypass RLS)
AS $$
DECLARE
    v_now_yymm text;
    v_next_seq int;
    v_final_id text;
BEGIN
    v_now_yymm := to_char(now(), 'YYMM');
    
    -- Khóa bản ghi chi nhánh để đảm bảo không bị race condition
    IF p_type = 'contract' THEN
        UPDATE branches
        SET 
            last_contract_seq = CASE 
                WHEN last_counter_month = v_now_yymm THEN last_contract_seq + 1
                ELSE 1 
            END,
            last_counter_month = v_now_yymm
        WHERE id = p_branch_id
        RETURNING last_contract_seq INTO v_next_seq;
    ELSIF p_type = 'client' THEN
        UPDATE branches
        SET 
            last_client_seq = CASE 
                WHEN last_counter_month = v_now_yymm THEN last_client_seq + 1
                ELSE 1 
            END,
            last_counter_month = v_now_yymm
        WHERE id = p_branch_id
        RETURNING last_client_seq INTO v_next_seq;
    ELSE
        RAISE EXCEPTION 'Loại đối tượng không hợp lệ: %', p_type;
    END IF;

    IF v_next_seq IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy chi nhánh với ID: %', p_branch_id;
    END IF;

    -- Định dạng: PREFIX-MCN-YYMMNNN (Ví dụ: HD-CN1-2404001)
    v_final_id := p_prefix || '-' || UPPER(p_branch_id) || '-' || v_now_yymm || LPAD(v_next_seq::text, 3, '0');
    
    RETURN v_final_id;
END;
$$;
