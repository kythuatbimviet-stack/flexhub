# 04 — Bảng Rủi Ro & Khuyến Nghị Cải Tiến Hiệu Năng

**Ngày:** 2026-04-22  
**Mức ưu tiên:** Dựa trên mức độ ảnh hưởng (Impact) × Khả năng xảy ra (Likelihood)

---

## 1. Bảng Rủi Ro Tổng Hợp

| ID | Vấn Đề | Module | Mức Độ | Ảnh Hưởng | Khả Năng |
|----|--------|--------|--------|-----------|---------|
| R01 | Dashboard full table scan — 8 bảng không LIMIT | dashboard.ts | 🔴 Critical | Timeout, OOM | Cao khi data > 5k |
| R02 | fetchContracts() SELECT * 80+ cols, không LIMIT | contracts.ts | 🔴 Critical | Slow list load, large payload | Cao với >1k contracts |
| R03 | fetchRevenue() JOIN clients(*) — SELECT * | financial.ts | 🟠 High | Slow finance page | Cao với >2k records |
| R04 | fetchWeightRecords() không filter không limit | weight-tracking.ts | 🟠 High | Slow weight page | Cao với >5k records |
| R05 | fetchClients() legacy không pagination | clients.ts | 🟠 High | Slow if called | Trung bình |
| R06 | createAdminClient() không singleton | supabase-server.ts | 🟠 High | DB connection pressure | Cao ở concurrent users |
| R07 | O(N×M) inner loop trong dashboard | dashboard.ts:224 | 🟡 Medium | CPU spike server | Trung bình |
| R08 | Không HTTP-level cache cho dashboard | - | 🟡 Medium | Repeated DB queries | Chắc chắn |
| R09 | ilike text search trainer_name | contracts.ts | 🟡 Medium | Slow RBAC filter | Trung bình |
| R10 | Training logs không date filter ở dashboard | dashboard.ts | 🟡 Medium | Bảng phình nhanh | Cao |
| R11 | Không thấy DB indexes trên filter columns | DB schema | 🟡 Medium | Slow queries at scale | Cao |
| R12 | deleteContract chuỗi 8 queries tuần tự | contracts.ts | 🟡 Medium | Slowness xóa | Thấp |

---

## 2. Khuyến Nghị Chi Tiết Theo Ưu Tiên

---

### 🔴 PRIORITY 1 — Thực Hiện Ngay (Quick Wins)

#### KN-01: Thêm LIMIT và Date Filter Mặc Định cho Dashboard

**File:** `app/actions/dashboard.ts`  
**Effort:** Thấp (30 phút)  
**Impact:** Ngăn timeout và OOM ngay lập tức

```typescript
// TRƯỚC:
let weightQuery = supabase.from('weight_tracking')
    .select('client_id, weight, measurement_date')
    .order('measurement_date', { ascending: true })

let trainingLogsQuery = supabase.from('training_logs')
    .select('date, status, client_id')

// SAU:
const twelveMonthsAgo = new Date()
twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
const defaultStart = twelveMonthsAgo.toISOString().split('T')[0]

let weightQuery = supabase.from('weight_tracking')
    .select('client_id, weight, measurement_date')
    .gte('measurement_date', filters?.startDate || defaultStart)
    .order('measurement_date', { ascending: true })
    .limit(5000)  // Hard cap

let trainingLogsQuery = supabase.from('training_logs')
    .select('date, status, client_id')
    .gte('date', filters?.startDate || defaultStart)
    .limit(10000) // Hard cap
```

---

#### KN-02: Xóa hoặc Deprecate `fetchContracts()` — Dùng `fetchContractsLite()`

**File:** `app/actions/contracts.ts`  
**Effort:** Thấp (tìm-và-thay thế)  
**Impact:** Giảm payload contracts 60-70%

Kiểm tra tất cả nơi gọi `fetchContracts()`:
```bash
# Tìm các nơi gọi fetchContracts (không phải fetchContractsLite)
grep -rn "fetchContracts()" app/ components/ --include="*.tsx" --include="*.ts"
```

Thay bằng `fetchContractsLite()` hoặc thêm server-side pagination tương tự `fetchClientsPage()`.

---

#### KN-03: Thêm LIMIT cho `fetchWeightRecords()`

**File:** `app/actions/weight-tracking.ts`  
**Effort:** Rất thấp (1 dòng)

```typescript
// TRƯỚC:
const { data, error } = await supabase
    .from('weight_tracking').select('*')
    .order('measurement_date', { ascending: false })

// SAU:
const { data, error } = await supabase
    .from('weight_tracking').select('*')
    .order('measurement_date', { ascending: false })
    .limit(2000)  // Giống fetchWeightRecordsRecent
```

Cân nhắc deprecate `fetchWeightRecords()` và dùng `fetchWeightRecordsRecent()` thay thế.

---

#### KN-04: Fix O(N×M) Loop trong Dashboard

**File:** `app/actions/dashboard.ts:224`  
**Effort:** Thấp (thay `.find()` bằng Map)

```typescript
// TRƯỚC: O(N×M)
safeRevenue.forEach(r => {
    const client = safeClients.find(c => c.id === r.customer_id)
    ...
})

// SAU: O(N) với Map
const clientById = new Map(safeClients.map(c => [c.id, c]))
safeRevenue.forEach(r => {
    const client = clientById.get(r.customer_id)
    ...
})
```

---

### 🟠 PRIORITY 2 — Thực Hiện Trong Tháng

#### KN-05: Client Singleton cho createAdminClient()

**File:** `lib/supabase-server.ts`  
**Effort:** Trung bình

```typescript
// Thêm module-level cache
import { cache } from 'react'

export const createAdminClient = cache(() => {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
})
```

> **Lưu ý:** `cache()` của React dedup trong cùng 1 request. Không phải true singleton giữa các requests nhưng đủ để tránh tạo nhiều instances trong 1 request.

---

#### KN-06: Pagination cho Revenue/Expense Pages

**File:** `app/actions/financial.ts`  
**Effort:** Trung bình (mô phỏng theo `fetchClientsPage()`)

```typescript
export async function fetchRevenuePage({
    page = 1, pageSize = 50,
    startDate, endDate, branchId
}: RevenuePageParams) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase.from('revenue')
        .select(`
            id, amount, actual_amount, recorded_at, branch_id,
            payment_method, description,
            branches(name),
            clients(member_name)  // Không dùng clients(*) nữa
        `, { count: 'exact' })
        .range(from, to)
        .order('recorded_at', { ascending: false })

    if (startDate) query = query.gte('recorded_at', startDate)
    if (endDate) query = query.lte('recorded_at', endDate)

    const { data, error, count } = await query
    return { data, count, error }
}
```

---

#### KN-07: Verify DB Indexes Tồn Tại

Chạy query sau trên Supabase Dashboard → SQL Editor để kiểm tra existing indexes:

```sql
-- Kiểm tra indexes hiện có
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'contracts', 'revenue', 'expense', 'weight_tracking', 'training_logs', 'debts')
ORDER BY tablename, indexname;
```

Nếu thiếu, thêm qua migration:
```sql
-- Indexes ưu tiên bổ sung
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_branch_status 
    ON contracts(branch_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_end_date 
    ON contracts(end_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_recorded_at 
    ON revenue(recorded_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_weight_tracking_client_date 
    ON weight_tracking(client_id, measurement_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_logs_client_date 
    ON training_logs(client_id, date DESC);
```

---

### 🟡 PRIORITY 3 — Thực Hiện Trong Quý

#### KN-08: Dashboard Aggregation bằng PostgreSQL RPC

Thay vì tải raw data về JS để tính, tạo RPC functions thực hiện aggregation tại DB:

```sql
-- Ví dụ: Tạo RPC cho monthly revenue summary
CREATE OR REPLACE FUNCTION get_monthly_revenue_summary(
    p_branch_ids uuid[] DEFAULT NULL,
    p_months integer DEFAULT 7
)
RETURNS TABLE (
    month_label text, 
    revenue numeric, 
    expense numeric,
    contract_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(gs, 'Mon') as month_label,
        COALESCE(SUM(r.amount), 0) as revenue,
        COALESCE(SUM(e.amount), 0) as expense,
        COUNT(DISTINCT c.id)::integer as contract_count
    FROM generate_series(
        date_trunc('month', now() - ((p_months-1)||' months')::interval),
        date_trunc('month', now()),
        '1 month'::interval
    ) gs
    LEFT JOIN revenue r ON date_trunc('month', r.recorded_at::timestamp) = gs
        AND (p_branch_ids IS NULL OR r.branch_id = ANY(p_branch_ids))
    LEFT JOIN expense e ON date_trunc('month', e.recorded_at::timestamp) = gs
        AND (p_branch_ids IS NULL OR e.branch_id = ANY(p_branch_ids))
    LEFT JOIN contracts c ON date_trunc('month', c.created_at::timestamp) = gs
        AND (p_branch_ids IS NULL OR c.branch_id = ANY(p_branch_ids))
    GROUP BY gs
    ORDER BY gs;
END;
$$ LANGUAGE plpgsql;
```

**Lợi ích:**
- Data transfer từ DB về server giảm 95%+
- DB execution plan tối ưu với indexes
- Server không cần xử lý JS aggregation

---

#### KN-09: Next.js unstable_cache cho Dashboard Data

```typescript
// app/actions/dashboard.ts
import { unstable_cache } from 'next/cache'

export const fetchDashboardMetrics = unstable_cache(
    async (filters?: DashboardFilters) => {
        // ... existing implementation
    },
    ['dashboard-metrics'],
    {
        revalidate: 300,  // Cache 5 phút
        tags: ['dashboard', 'revenue', 'clients', 'contracts']
    }
)

// Khi có data mới, invalidate cache:
revalidateTag('dashboard')
```

---

#### KN-10: Normalize trainer_name → trainer_id

Thay thế `ILIKE` search bằng foreign key lookup:

```sql
-- Migration phục vụ KN-10
ALTER TABLE contracts 
ADD COLUMN assigned_trainer_id uuid REFERENCES users(id);

CREATE INDEX idx_contracts_assigned_trainer ON contracts(assigned_trainer_id);
```

```typescript
// Sau migration, filter RBAC staff:
query = query.eq('assigned_trainer_id', accessInfo.user.id)  // O(log N) index scan
// Thay vì:
query = query.or(`trainer_name.ilike.%${name}%`)              // O(N) full scan
```

---

## 3. Roadmap Cải Tiến

```
Tuần 1 (Ngay):
  ✦ KN-01: Dashboard LIMIT + date filter defaults
  ✦ KN-03: fetchWeightRecords() LIMIT
  ✦ KN-04: Fix O(N²) loop → Map

Tháng 1:
  ✦ KN-02: Deprecate fetchContracts(), migrate sang Lite + pagination
  ✦ KN-05: createAdminClient() singleton
  ✦ KN-07: Audit & bổ sung DB indexes

Tháng 2–3:
  ✦ KN-06: Revenue/Expense pagination
  ✦ KN-08: Dashboard PostgreSQL RPC aggregation
  ✦ KN-09: Next.js cache layer

Quý tiếp theo:
  ✦ KN-10: Normalize trainer_name → trainer_id
  ✦ Cân nhắc Materialized Views cho dashboard summary
  ✦ Enable PgBouncer (Supabase Pro tier)
```

---

## 4. Tác Động Dự Kiến Sau Cải Tiến

| Metric | Hiện Tại (Ước Tính) | Sau Priority 1 | Sau Priority 2-3 |
|--------|---------------------|----------------|-----------------|
| Dashboard load time (5k records) | 3–8 giây | 1–2 giây | < 500ms |
| Contracts list load (1k records) | 2–4 giây | 500ms–1s | < 300ms |
| Revenue page load | 2–5 giây | 500ms–1s | < 300ms |
| DB connections per request | 8–12 | 8–10 | 3–5 |
| Payload size per request | 2–15 MB | 200KB–1MB | < 100KB |
| Time To Interactive (users) | 3–10 giây | 1–3 giây | < 1 giây |

> **Lưu ý:** Các con số trên là ước tính dựa trên phân tích code, không có benchmark thực tế.  
> Nên đo lường trước và sau cải tiến bằng Supabase Dashboard → Query Performance hoặc Next.js Profiler.

---

## 5. Công Cụ Đo Lường Đề Xuất

1. **Supabase Dashboard** → Performance → Slow Queries: Xem queries nào chạy lâu nhất
2. **Supabase Dashboard** → Logs: Theo dõi query execution time thực tế
3. **Next.js** `next build && next start` với `--profile` flag
4. **Chrome DevTools** → Network tab: Đo payload size và TTFB (Time To First Byte)
5. **Vercel Analytics** (nếu deploy trên Vercel): Real-user performance metrics
