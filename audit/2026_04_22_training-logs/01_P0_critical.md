# P0 — Critical: Vấn Đề Nghiêm Trọng Cần Sửa Ngay

> **Nguồn:** `app/actions/training-logs.ts`  
> **Ưu tiên:** 🔴 P0 — Sửa trước khi deploy thêm tính năng mới

---

## Issue #1: `fetchTotalTrainingStats` — Nạp Toàn Bộ Rows Về JavaScript Để Đếm

### Vị trí
`app/actions/training-logs.ts` — Lines 175–184

### Mô tả vấn đề
Hàm `fetchTotalTrainingStats` không dùng DB aggregation. Thay vào đó, nó tải **toàn bộ training_logs** trong date range về server JavaScript rồi dùng `.filter().length` để đếm từng loại status.

### Code hiện tại (lỗi)
```typescript
const { data, error } = await query
// Không có .limit() hoặc COUNT(*) — TOÀN BỘ rows được stream về JS

const stats = {
    total: data?.length || 0,                              // ❌ đếm ở JS
    y: data?.filter(l => l.status === 'Y').length || 0,    // ❌ đếm ở JS
    n: data?.filter(l => l.status === 'N').length || 0,    // ❌ đếm ở JS
    td: data?.filter(l => l.status === 'TĐ').length || 0  // ❌ đếm ở JS
}
```

### Tác động thực tế
- 500 hội viên × 30 ngày = **~15,000 rows** được trả về chỉ để đếm số
- Nếu chọn "Tháng 3 tháng" = **~45,000 rows** streaming
- Database hoàn toàn có thể trả về con số này trong **1 row** duy nhất

### Fix đề xuất — Tạo Postgres RPC Function

**Bước 1:** Tạo function trong Supabase SQL Editor:
```sql
CREATE OR REPLACE FUNCTION get_training_stats(
    p_start_date  DATE,
    p_end_date    DATE,
    p_branch_id   UUID    DEFAULT NULL,
    p_pt_name     TEXT    DEFAULT NULL,
    p_client_name TEXT    DEFAULT NULL,
    p_allowed_branch_ids UUID[] DEFAULT NULL
)
RETURNS TABLE(
    total    BIGINT,
    y_count  BIGINT,
    n_count  BIGINT,
    td_count BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT
        COUNT(*)                                          AS total,
        COUNT(*) FILTER (WHERE tl.status = 'Y')          AS y_count,
        COUNT(*) FILTER (WHERE tl.status = 'N')          AS n_count,
        COUNT(*) FILTER (WHERE tl.status = 'TĐ')         AS td_count
    FROM training_logs tl
    JOIN clients c ON c.id = tl.client_id
    WHERE tl.date BETWEEN p_start_date AND p_end_date
    AND (p_branch_id IS NULL OR c.branch_id = p_branch_id)
    AND (p_pt_name IS NULL OR c.pt_name ILIKE '%' || p_pt_name || '%')
    AND (p_client_name IS NULL OR c.member_name ILIKE '%' || p_client_name || '%')
    AND (p_allowed_branch_ids IS NULL OR c.branch_id = ANY(p_allowed_branch_ids));
$$;
```

**Bước 2:** Cập nhật server action:
```typescript
export async function fetchTotalTrainingStats({ startDate, endDate, branchId, ptName, clientSearch }) {
    const accessInfo = await getAccessFilter()
    if (!accessInfo) return { success: false, error: 'Unauthorized' }

    const adminClient = await createAdminClient()

    // Fallback date nếu không có
    const effectiveStart = startDate || format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const effectiveEnd   = endDate   || format(endOfMonth(new Date()), 'yyyy-MM-dd')

    const allowedBranchIds = !accessInfo.access.canViewAllBranches
        ? accessInfo.access.allowedBranchIds
        : null

    const { data, error } = await adminClient.rpc('get_training_stats', {
        p_start_date:          effectiveStart,
        p_end_date:            effectiveEnd,
        p_branch_id:           branchId ?? null,
        p_pt_name:             ptName   ?? null,
        p_client_name:         clientSearch ?? null,
        p_allowed_branch_ids:  allowedBranchIds ?? null
    })

    if (error) throw error

    const row = data?.[0]
    return {
        success: true,
        stats: {
            total: Number(row?.total  || 0),
            y:     Number(row?.y_count  || 0),
            n:     Number(row?.n_count  || 0),
            td:    Number(row?.td_count || 0)
        }
    }
}
```

**Kết quả:** Từ ~15,000 rows streaming → **1 row response** từ DB.

---

## Issue #2: RBAC Filter Lỗi Với PostgREST Nested Resource

### Vị trí
`app/actions/training-logs.ts` — Lines 155–172

### Mô tả vấn đề
Supabase `postgrest-js` có hành vi đặc thù với filter trên nested relation: `.filter('client.branch_id', 'eq', value)` **không tương đương** với `WHERE client.branch_id = value`. Với `!inner` join, các row của bảng chính (`training_logs`) vẫn có thể được trả về ngay cả khi filter trên nested resource không khớp.

### Code hiện tại (lỗi)
```typescript
// CẢNH BÁO: filter trên nested resource có thể không hoạt động đúng
if (branchId && branchId !== 'all') {
    query = query.filter('client.branch_id', 'eq', branchId) // ⚠️ Không đáng tin cậy
}

// RBAC — cú pháp manual string formatting — nguy hiểm!
query = query.filter('client.branch_id', 'in', `(${allowedIds.join(',')})`)
//                                               ↑ SQL injection risk nếu allowedIds không được validate
```

### Tác động
- Staff chỉ được xem chi nhánh A có thể nhìn thấy dữ liệu chi nhánh B
- Stats card hiển thị con số tổng sai (bao gồm dữ liệu ngoài phạm vi phân quyền)

### Fix đề xuất
Chuyển sang dùng RPC function (như Issue #1) hoặc subquery-based approach:
```typescript
// Lấy danh sách client_id hợp lệ trước, rồi filter training_logs theo đó
const clientIds = await getFilteredClientIds({ branchId, ptName, clientSearch, allowedBranchIds })

let query = adminClient
    .from('training_logs')
    .select('status')
    .in('client_id', clientIds)  // ✅ Filter trực tiếp trên FK column
```

---

## Issue #3: Hàm Legacy `fetchTrainingLogsReport` Với `pageSize: 1000`

### Vị trí
`app/actions/training-logs.ts` — Lines 219–223

### Code hiện tại
```typescript
export async function fetchTrainingLogsReport(params: any) {
    // Legacy support: fetch everything (might be slow but functionally correct)
    return fetchTrainingLogsSummary({ ...params, pageSize: 1000 }) // ❌ 1000 rows!
}
```

### Tác động
- Nếu còn component nào gọi hàm này, sẽ fetch **1000 clients cùng log của họ** mỗi render
- Comment "might be slow" là dấu hiệu rõ ràng đây là technical debt mức nguy hiểm

### Fix đề xuất

**Bước 1:** Kiểm tra xem có component nào còn import hàm này không:
```bash
# Tìm kiếm trong codebase
grep -r "fetchTrainingLogsReport" --include="*.ts" --include="*.tsx"
```

**Bước 2:** Nếu không còn consumer → xóa hàm này hoàn toàn.  
**Bước 3:** Nếu còn consumer → migrate sang `fetchTrainingLogsSummary` với pagination đúng, rồi xóa `fetchTrainingLogsReport`.
