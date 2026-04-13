# Phase 1 — Thêm Composite Indexes vào Supabase

> **Rủi ro**: ✅ Bằng 0  
> **Thời gian ước tính**: 5–10 phút  
> **Yêu cầu**: Chạy SQL trong Supabase Dashboard → SQL Editor  
> **Ảnh hưởng ứng dụng**: Không có — indexes chỉ tăng tốc query, không thay đổi logic

---

## Tại Sao Làm Trước?

Database indexes là **purely additive**:
- Không thay đổi bất kỳ dòng code nào
- Không thay đổi kết quả trả về của bất kỳ query nào
- Không thể làm hỏng ứng dụng
- Có thể rollback bằng `DROP INDEX` bất kỳ lúc nào

---

## Các Index Cần Thêm

### 1. `clients` table

```sql
-- Trang /clients thường filter theo branch + status cùng lúc
CREATE INDEX IF NOT EXISTS idx_clients_branch_status 
    ON public.clients(branch_id, status);

-- Staff view filter theo branch + assigned_pt
CREATE INDEX IF NOT EXISTS idx_clients_branch_assigned_pt 
    ON public.clients(branch_id, assigned_pt);

-- Filter theo branch + created_by_email (staff tạo)
CREATE INDEX IF NOT EXISTS idx_clients_branch_created_by 
    ON public.clients(branch_id, created_by_email);
```

### 2. `contracts` table

```sql
-- Trang /contracts filter theo branch + status
CREATE INDEX IF NOT EXISTS idx_contracts_branch_status 
    ON public.contracts(branch_id, status);

-- Filter theo branch + assigned_pt (staff view)
CREATE INDEX IF NOT EXISTS idx_contracts_branch_assigned_pt 
    ON public.contracts(branch_id, assigned_pt);
```

### 3. `revenue` table

```sql
-- Dashboard filter theo ngày + branch
CREATE INDEX IF NOT EXISTS idx_revenue_recorded_at_branch 
    ON public.revenue(recorded_at, branch_id);
```

### 4. `expense` table

```sql
-- Dashboard filter theo ngày + branch
CREATE INDEX IF NOT EXISTS idx_expense_recorded_at_branch 
    ON public.expense(recorded_at, branch_id);
```

### 5. `weight_tracking` table

```sql
-- Dashboard filter theo client + ngày đo
CREATE INDEX IF NOT EXISTS idx_weight_client_date 
    ON public.weight_tracking(client_id, measurement_date);
```

---

## Cách Thực Hiện

1. Vào **Supabase Dashboard** → chọn project
2. Vào tab **SQL Editor**
3. Copy toàn bộ SQL dưới đây và chạy:

```sql
-- ===== PHASE 1: COMPOSITE INDEXES =====
-- Chạy toàn bộ block này cùng lúc

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_branch_status 
    ON public.clients(branch_id, status);

CREATE INDEX IF NOT EXISTS idx_clients_branch_assigned_pt 
    ON public.clients(branch_id, assigned_pt);

CREATE INDEX IF NOT EXISTS idx_clients_branch_created_by 
    ON public.clients(branch_id, created_by_email);

-- contracts
CREATE INDEX IF NOT EXISTS idx_contracts_branch_status 
    ON public.contracts(branch_id, status);

CREATE INDEX IF NOT EXISTS idx_contracts_branch_assigned_pt 
    ON public.contracts(branch_id, assigned_pt);

-- revenue
CREATE INDEX IF NOT EXISTS idx_revenue_recorded_at_branch 
    ON public.revenue(recorded_at, branch_id);

-- expense
CREATE INDEX IF NOT EXISTS idx_expense_recorded_at_branch 
    ON public.expense(recorded_at, branch_id);

-- weight_tracking
CREATE INDEX IF NOT EXISTS idx_weight_client_date 
    ON public.weight_tracking(client_id, measurement_date);
```

---

## Kiểm Tra Sau Khi Chạy

```sql
-- Xem tất cả indexes vừa tạo
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

Kết quả mong đợi: Tất cả 8 index xuất hiện trong danh sách.

---

## Rollback (Nếu Cần)

```sql
DROP INDEX IF EXISTS idx_clients_branch_status;
DROP INDEX IF EXISTS idx_clients_branch_assigned_pt;
DROP INDEX IF EXISTS idx_clients_branch_created_by;
DROP INDEX IF EXISTS idx_contracts_branch_status;
DROP INDEX IF EXISTS idx_contracts_branch_assigned_pt;
DROP INDEX IF EXISTS idx_revenue_recorded_at_branch;
DROP INDEX IF EXISTS idx_expense_recorded_at_branch;
DROP INDEX IF EXISTS idx_weight_client_date;
```

---

## Kết Quả Kỳ Vọng

| Query | Trước | Sau |
|-------|-------|-----|
| Load trang `/clients` (filter branch+status) | Seq scan toàn bảng | Index scan trực tiếp |
| Dashboard revenue theo tháng + branch | Seq scan | Index scan |
| Load weight tracking theo client | Seq scan | Index scan |

> **Lưu ý**: Index có hiệu quả rõ rệt khi bảng có **>1.000 rows**. Với bảng nhỏ, PostgreSQL có thể vẫn chọn seq scan (đây là hành vi bình thường).
