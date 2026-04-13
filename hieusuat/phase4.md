# Phase 4 — Thay N+1 Status Count Queries Bằng 1 RPC Aggregate

> **Rủi ro**: ⚠️ Thấp-Trung — cần verify số count khớp sau khi sửa  
> **Thời gian ước tính**: 30–45 phút  
> **Files liên quan**:
> - [SQL] Tạo function trong Supabase
> - [SỬA] `app/actions/clients.ts` — hàm `fetchClientsPage`
> **Ảnh hưởng ứng dụng**: Chỉ thay đổi cách đếm status tabs, không ảnh hưởng data chính

---

## Vấn Đề Hiện Tại

Mỗi lần load trang `/clients`, hàm `fetchClientsPage` tạo **N+1 queries riêng biệt** để đếm số lượng theo từng status:

```
Query 1: Fetch data chính (có phân trang)
Query 2: Fetch config status names
Query 3: COUNT(*) tổng
Query 4: COUNT(*) WHERE status = 'Đang tập'
Query 5: COUNT(*) WHERE status = 'Chốt đăng kí'
Query 6: COUNT(*) WHERE status = 'Tạm dừng'
Query 7: COUNT(*) WHERE status = 'Đã nghỉ'
Query 8: COUNT(*) WHERE status = 'Tiềm năng'
... (tùy số status trong config)
```

→ **8–10 Supabase queries** mỗi lần load trang clients.

---

## Giải Pháp

### Bước 1: Tạo SQL Function trong Supabase

Chạy trong **Supabase → SQL Editor**:

```sql
CREATE OR REPLACE FUNCTION get_client_status_counts(
    p_branch_ids    text[]   DEFAULT NULL,
    p_email         text     DEFAULT NULL,
    p_pt_name       text     DEFAULT NULL,
    p_is_staff_only boolean  DEFAULT false,
    p_search        text     DEFAULT NULL,
    p_source        text     DEFAULT NULL,
    p_reg_type      text     DEFAULT NULL
)
RETURNS TABLE(status text, cnt bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(c.status, 'Không xác định')::text AS status,
        COUNT(*)::bigint AS cnt
    FROM public.clients c
    WHERE
        -- Branch filter
        (p_branch_ids IS NULL OR c.branch_id = ANY(p_branch_ids))
        
        -- Staff-only filter: must be owner or assigned
        AND (
            NOT p_is_staff_only
            OR c.created_by_email = p_email
            OR c.assigned_pt = p_email
            OR (p_pt_name IS NOT NULL AND c.pt_name ILIKE '%' || p_pt_name || '%')
        )
        
        -- Search filter
        AND (
            p_search IS NULL
            OR p_search = ''
            OR c.member_name ILIKE '%' || p_search || '%'
            OR c.phone ILIKE '%' || p_search || '%'
            OR c.email ILIKE '%' || p_search || '%'
            OR c.id ILIKE '%' || p_search || '%'
        )
        
        -- Source filter
        AND (p_source IS NULL OR p_source = '' OR c.source = p_source)
        
        -- Registration type filter
        AND (p_reg_type IS NULL OR p_reg_type = '' OR c.registration_type = p_reg_type)
        
    GROUP BY c.status;
END;
$$;

-- Grant quyền gọi function
GRANT EXECUTE ON FUNCTION get_client_status_counts TO anon, authenticated, service_role;
```

---

### Bước 2: Sửa `fetchClientsPage` trong `clients.ts`

**Tìm đoạn code hiện tại (khoảng dòng 170–197)**:

```ts
// CODE CŨ — xóa đoạn này
// 2. Fetch status config + main data in PARALLEL
const [mainResult, statusConfigResult] = await Promise.all([
    dataQuery,
    adminClient.from('config_client_status').select('nam')
])
const statusNames = statusConfigResult.data?.map((s: any) => s.nam) || []

// 3. Count per status in PARALLEL
const totalCountPromise = applyBaseFilters(adminClient.from('clients').select('*', { count: 'exact', head: true }))
const countPromises = statusNames.map((s: string) => {
    return applyBaseFilters(adminClient.from('clients').select('*', { count: 'exact', head: true })).eq('status', s)
})
const countResults = await Promise.all([totalCountPromise, ...countPromises])

const { data, error, count } = mainResult

if (error) {
    console.error('Fetch Clients Page Error:', error)
    return { success: false, error: error.message }
}

// Process status counts
const statusCounts: Record<string, number> = {}
const totalOverallCount = countResults[0].count || 0
statusCounts['total'] = totalOverallCount
statusNames.forEach((s: string, i: number) => {
    statusCounts[s] = countResults[i + 1].count || 0
})
```

**Thay bằng code mới**:

```ts
// CODE MỚI — dùng RPC aggregate
// 2. Fetch data chính + RPC status counts SONG SONG
const [mainResult, statusCountResult] = await Promise.all([
    dataQuery,
    adminClient.rpc('get_client_status_counts', {
        p_branch_ids: accessInfo.access.allowedBranchIds?.length
            ? accessInfo.access.allowedBranchIds
            : null,
        p_email: accessInfo.user.email,
        p_pt_name: accessInfo.user.name,
        p_is_staff_only: accessInfo.access.isStaffOnly,
        p_search: search || null,
        p_source: source || null,
        p_reg_type: regType || null,
    })
])

const { data, error, count } = mainResult

if (error) {
    console.error('Fetch Clients Page Error:', error)
    return { success: false, error: error.message }
}

// Build statusCounts từ RPC result
const statusCounts: Record<string, number> = { total: 0 }
if (statusCountResult.data) {
    statusCountResult.data.forEach((row: { status: string; cnt: number }) => {
        statusCounts[row.status] = Number(row.cnt)
        statusCounts['total'] = (statusCounts['total'] || 0) + Number(row.cnt)
    })
}
```

---

## So Sánh Số Queries

| | Trước | Sau |
|--|-------|-----|
| Queries mỗi load `/clients` | 8–10 queries | **3 queries** |
| Query 1 | Fetch data (phân trang) | Fetch data (phân trang) |
| Query 2 | Fetch config status | RPC `get_client_status_counts` |
| Query 3–N | N queries COUNT theo từng status | *(không còn)* |

---

## Checklist Thực Hiện

- [ ] Chạy SQL tạo function `get_client_status_counts` trong Supabase
- [ ] Verify function hoạt động: `SELECT * FROM get_client_status_counts()` → thấy kết quả
- [ ] Sửa `fetchClientsPage` trong `clients.ts`
- [ ] Chạy `npm run build` — không có lỗi TypeScript
- [ ] Test trang `/clients` — tabs status count hiển thị đúng số

---

## Verify Kết Quả

Sau khi sửa, vào trang `/clients` và kiểm tra:

1. **Tabs status** (Đang tập, Chốt đăng kí...) hiển thị đúng số khách hàng
2. **Tổng số** (badge "total") khớp với tổng cộng các status
3. **Filter branch** hoạt động — chỉ đếm đúng branch đang filter
4. **Staff account** chỉ đếm client của mình, không thấy của người khác

---

## Rollback (Nếu Cần)

1. Khôi phục lại đoạn code cũ trong `fetchClientsPage` (từ git)
2. Function SQL `get_client_status_counts` có thể giữ lại hoặc xóa:
   ```sql
   DROP FUNCTION IF EXISTS get_client_status_counts;
   ```

---

## Kết Quả Kỳ Vọng

- Trang `/clients` load nhanh hơn đáng kể (giảm 5–7 round-trips tới Supabase)
- Đặc biệt rõ rệt khi có nhiều user cùng dùng đồng thời
