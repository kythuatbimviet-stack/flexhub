# P2 — Medium: Cải Thiện Dài Hạn

> **Nguồn:** Nhiều file — xem chi tiết từng issue  
> **Ưu tiên:** 🟢 P2 — Cải thiện tốt nếu có thời gian, không khẩn cấp

---

## Issue #6: `SELECT *` Không Cần Thiết Trên Bảng `clients`

### Vị trí
`app/actions/training-logs.ts` — Line 33

### Mô tả vấn đề
Query đầu tiên trong `fetchTrainingLogsSummary` tải toàn bộ cột của bảng `clients` mặc dù chỉ cần 4 trường:

```typescript
// Code hiện tại — tải toàn bộ columns
let clientQuery = adminClient
    .from('clients')
    .select('*', { count: 'exact' })  // ❌ SELECT * — có thể 20-30 columns
```

Bảng `clients` thường có nhiều cột như `phone`, `address`, `email`, `notes`, `created_at`, ảnh đại diện URL, etc. — tất cả đều được stream về mặc dù không dùng đến.

### Fix đề xuất
```typescript
// Chỉ chọn đúng 4 cột cần thiết
let clientQuery = adminClient
    .from('clients')
    .select('id, member_name, branch_id, pt_name', { count: 'exact' })
```

**Lợi ích:** Giảm payload mạng, giảm thời gian serialize/deserialize ở cả DB và server.

---

## Issue #7: Thiếu Database Indexes

### Mô tả vấn đề
Dựa trên pattern query được phân tích, các query thường xuyên filter/join theo các cột sau:

| Bảng | Cột được filter | Tình trạng index |
|------|----------------|-----------------|
| `training_logs` | `client_id` | Chưa xác nhận |
| `training_logs` | `date` | Chưa xác nhận |
| `training_logs` | `client_id + date` (composite) | Chưa xác nhận |
| `clients` | `branch_id` | Chưa xác nhận |
| `clients` | `pt_name` | Chưa xác nhận |
| `clients` | `member_name` | Chưa xác nhận (ILIKE cần GIN index) |

### Tác động nếu thiếu index
- `fetchTrainingLogsSummary` step 2: `WHERE client_id IN (id1..id20) AND date BETWEEN x AND y` → Sequential scan nếu không có index
- `fetchTotalTrainingStats` (cả sau khi fix P0): JOIN `clients ON clients.id = tl.client_id` → Slow nếu không có index trên FK

### Fix đề xuất
Chạy trong **Supabase SQL Editor**:
```sql
-- Indexes cho training_logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_logs_client_id 
    ON training_logs(client_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_logs_date 
    ON training_logs(date);

-- Composite index — tối ưu nhất cho pattern query hiện tại
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_logs_client_date 
    ON training_logs(client_id, date);

-- Indexes cho clients
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_branch_id 
    ON clients(branch_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_pt_name 
    ON clients(pt_name);

-- GIN index cho ILIKE search trên member_name (full-text style)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_member_name_gin 
    ON clients USING gin(member_name gin_trgm_ops);
-- Lưu ý: Cần enable extension trước: CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Lưu ý:** Dùng `CONCURRENTLY` để không lock bảng khi tạo index trên production.

---

## Issue #8: UX Filter — Option "Tất Cả Thời Gian" Không Rõ Hành Vi

### Vị trí
`components/training-logs/training-log-filters.tsx` — Lines 29–35

### Mô tả vấn đề
Option đầu tiên trong quick-date selector là "Tất cả thời gian", nhưng sau khi fix P1 Issue #4 (thêm date fallback), option này sẽ luôn bị override về "tháng hiện tại". Điều này tạo ra **sự không nhất quán UX**: user chọn "Tất cả thời gian" nhưng data load là "Tháng này".

```typescript
const QUICK_DATE_OPTIONS = [
    { value: 'all', label: 'Tất cả thời gian' }, // ← Label không chính xác sau khi fix P1
    { value: 'this-week', label: 'Tuần này' },
    { value: 'last-week', label: 'Tuần trước' },
    { value: 'this-month', label: 'Tháng này' },
    { value: 'last-month', label: 'Tháng trước' }
]
```

### Fix đề xuất (2 phương án)

**Phương án A — Đơn giản hơn:** Đổi label thành "Tháng này" và map `'all'` → tháng hiện tại:
```typescript
const QUICK_DATE_OPTIONS = [
    { value: 'this-month', label: 'Tháng này' },   // Default
    { value: 'this-week',  label: 'Tuần này' },
    { value: 'last-week',  label: 'Tuần trước' },
    { value: 'last-month', label: 'Tháng trước' },
    { value: 'last-3-months', label: '3 tháng gần đây' },
]
```

**Phương án B — Giữ "Tất cả thời gian" nhưng thêm cảnh báo:**
```typescript
// Khi user chọn 'all', hiển thị dialog/tooltip cảnh báo:
// "Tải dữ liệu toàn bộ có thể chậm. Bạn có chắc không?"
```
