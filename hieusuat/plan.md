# Kế Hoạch Tối Ưu Hiệu Suất Tải Dữ Liệu — GymERP

> Ngày phân tích: 2026-04-13
> Người phân tích: Antigravity AI

---

## Tổng Quan

Ứng dụng có kiến trúc tốt ở nhiều điểm (dùng `Promise.all`, `cache()`, admin client bypass RLS), nhưng vẫn còn một số bottleneck đáng kể. Tài liệu này ghi lại chi tiết từng vấn đề và phương án xử lý cụ thể.

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG

---

### [P1] Middleware gọi `auth.getUser()` trên MỌI request

**File**: `middleware.ts` — dòng 57  
**Mức độ ảnh hưởng**: ⭐⭐⭐⭐⭐ (xảy ra 100% requests)

#### Hiện trạng

```ts
// middleware.ts
export async function middleware(request: NextRequest) {
    const supabase = createServerClient(...)
    
    // ← Gọi network tới Supabase Auth server mỗi request
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && request.nextUrl.pathname !== '/login' ...) {
        return NextResponse.redirect(...)
    }
}

export const config = {
    matcher: [
        // Match hầu hết mọi path (quá rộng)
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
```

**Vấn đề**: Mỗi navigation page, API call từ client đều block `auth.getUser()` — một round-trip tới Supabase Auth server. Trên kết nối mobile/chậm: **+100–500ms delay mỗi navigation**.

#### Giải pháp đề xuất

```ts
// middleware.ts — SAU KHI SỬA

export const config = {
    matcher: [
        // Chỉ check auth trên page routes, bỏ qua API routes không cần auth
        '/((?!_next/static|_next/image|favicon.ico|api/webhook|api/zalo|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
```

Ngoài ra cân nhắc dùng `supabase.auth.getSession()` thay vì `getUser()` trong middleware (session đọc từ cookie, không cần network call), và chỉ dùng `getUser()` ở server actions (nơi cần verify thực sự).

> **Lưu ý bảo mật**: `getSession()` tin tưởng cookie mà không verify với server. Chỉ dùng trong middleware để redirect, KHÔNG dùng để authorize data access. Các server actions vẫn dùng `getUser()`.

---

### [P2] `getAccessFilter()` định nghĩa riêng ở từng file — không share cache

**Files**: `clients.ts`, `contracts.ts`, `dashboard.ts`, `financial.ts`  
**Mức độ ảnh hưởng**: ⭐⭐⭐⭐⭐ (xảy ra mỗi server action call)

#### Hiện trạng

Mỗi file action đều tự định nghĩa `getAccessFilter` với `cache()`:

```ts
// clients.ts
const getAccessFilter = cache(async () => {
    const supabase = await createSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser() // Query 1
    const { data: profile } = await supabase.from('users')             // Query 2
        .select('*').eq('email', authUser.email).maybeSingle()
    return { user: profile, access: getAccessControl(profile) }
})

// contracts.ts — ĐỊNH NGHĨA LẠI Y HỆT
const getAccessFilter = cache(async () => { ... }) // Cache riêng biệt!

// dashboard.ts — ĐỊNH NGHĨA LẠI LẦN NỮA
const getAccessFilter = cache(async () => { ... }) // Cache riêng biệt!
```

**Vấn đề**: `cache()` của React chỉ deduplicate trong scope của instance đó trong cùng 1 request. Các `cache()` ở file khác nhau **không share với nhau**. Nếu một page load trigger 3 server actions → **3 cặp `auth.getUser()` + `users table query`** chạy song song.

#### Giải pháp đề xuất

Tạo một shared module `lib/access-filter.ts`:

```ts
// lib/access-filter.ts — MỚI
import { cache } from 'react'
import { createClient } from './supabase-server'
import { getAccessControl, UserProfile } from './permissions'

// Singleton cache — toàn bộ app trong 1 request dùng chung
export const getAccessFilter = cache(async () => {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return null

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()

    if (!profile) return null
    return { 
        user: profile as UserProfile, 
        access: getAccessControl(profile as UserProfile),
        authId: authUser.id 
    }
})
```

Sau đó import dùng chung:

```ts
// clients.ts, contracts.ts, dashboard.ts, financial.ts
import { getAccessFilter } from '@/lib/access-filter' // ← Dùng chung

// Xóa bỏ định nghĩa const getAccessFilter = cache(...) ở đầu mỗi file
```

**Kết quả kỳ vọng**: Dù có 5 server actions chạy trong 1 request, `auth.getUser()` + `users query` chỉ thực thi **1 lần duy nhất**.

---

### [P3] `fetchClientsPage` tạo N+1 queries để đếm số lượng theo status

**File**: `clients.ts` — dòng 170–197  
**Mức độ ảnh hưởng**: ⭐⭐⭐⭐ (xảy ra mỗi lần load trang /clients)

#### Hiện trạng

```ts
// Bước 1: Fetch data + config status — 2 queries song song (TỐT)
const [mainResult, statusConfigResult] = await Promise.all([
    dataQuery,
    adminClient.from('config_client_status').select('nam')
])
const statusNames = statusConfigResult.data?.map(s => s.nam) || []
// Ví dụ: statusNames = ['Đang tập', 'Chốt đăng kí', 'Tạm dừng', 'Đã nghỉ', 'Tiềm năng', 'Khác']

// Bước 2: Đếm mỗi status — N+1 queries song song (KHÔNG TỐT)
const totalCountPromise = applyBaseFilters(
    adminClient.from('clients').select('*', { count: 'exact', head: true })
)
const countPromises = statusNames.map(s => {  // 6 status × 1 query = 6 queries
    return applyBaseFilters(
        adminClient.from('clients').select('*', { count: 'exact', head: true })
    ).eq('status', s)
})
const countResults = await Promise.all([totalCountPromise, ...countPromises])
// Tổng: 1 (data) + 1 (config) + 1 (total count) + 6 (status counts) = 9 QUERIES
```

**Vấn đề**: 6 status → **9 Supabase queries** mỗi lần load trang clients. Mỗi query là 1 round-trip network tới Supabase, kể cả khi toàn bộ chạy song song, vẫn tốn overhead connection + latency × số query.

#### Giải pháp đề xuất

Dùng 1 query RPC aggregate thay vì N queries count:

**Bước 1**: Tạo SQL function trong Supabase:

```sql
-- Chạy trong Supabase SQL Editor
CREATE OR REPLACE FUNCTION get_client_status_counts(
    p_branch_ids text[] DEFAULT NULL,
    p_created_by_email text DEFAULT NULL,
    p_assigned_pt text DEFAULT NULL,
    p_pt_name text DEFAULT NULL,
    p_is_staff_only boolean DEFAULT false
)
RETURNS TABLE(status text, count bigint)
LANGUAGE sql STABLE
AS $$
    SELECT 
        COALESCE(status, 'Không xác định') as status,
        COUNT(*) as count
    FROM clients
    WHERE
        (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
        AND (
            NOT p_is_staff_only 
            OR created_by_email = p_created_by_email
            OR assigned_pt = p_assigned_pt
            OR pt_name ILIKE '%' || p_pt_name || '%'
        )
    GROUP BY status
$$;
```

**Bước 2**: Gọi RPC thay vì N queries:

```ts
// Thay thế toàn bộ đoạn countPromises
const { data: statusCountsRaw } = await adminClient.rpc('get_client_status_counts', {
    p_branch_ids: accessInfo.access.allowedBranchIds || null,
    p_is_staff_only: accessInfo.access.isStaffOnly,
    p_created_by_email: accessInfo.user.email,
    p_assigned_pt: accessInfo.user.email,
    p_pt_name: accessInfo.user.name,
})

// Build object từ kết quả
const statusCounts: Record<string, number> = { total: 0 }
statusCountsRaw?.forEach((row: any) => {
    statusCounts[row.status] = Number(row.count)
    statusCounts['total'] = (statusCounts['total'] || 0) + Number(row.count)
})
```

**Kết quả**: Từ 9 queries → **3 queries** (data + config + 1 RPC aggregate).

---

## 🟡 VẤN ĐỀ TRUNG BÌNH

---

### [P4] `fetchClients()` không phân trang — lấy toàn bộ bảng

**File**: `clients.ts` — dòng 44–89  
**Mức độ ảnh hưởng**: ⭐⭐⭐ (tùy số lượng data)

#### Hiện trạng

```ts
export async function fetchClients() {
    // ...
    let query = adminClient.from('clients').select('*')  // Không có limit/range
    // Không có .range() hay .limit()
    const { data, error } = await query
    // → Trả về TẤT CẢ records
}
```

#### Giải pháp

- Kiểm tra tất cả nơi gọi `fetchClients()` (không phân trang) và thay bằng `fetchClientsPage()` với pageSize phù hợp.
- Nếu cần export toàn bộ, thêm param `{ forExport: true }` và chỉ `select()` các field cần thiết thay vì `select('*')`.

---

### [P5] Dashboard có serial subquery bottleneck ngoài `Promise.all`

**File**: `dashboard.ts` — dòng 56–59  
**Mức độ ảnh hưởng**: ⭐⭐⭐

#### Hiện trạng

```ts
// Xảy ra TRƯỚC Promise.all → block toàn bộ
if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
    const branchIds = accessInfo.access.allowedBranchIds
    
    // Extra query để lấy client IDs (serial, không parallel)
    const { data: allowedClientIds } = await supabase
        .from('clients').select('id').in('branch_id', branchIds)
    
    // Sau đó mới dùng để filter weightQuery
    weightQuery = weightQuery.in('client_id', allowedClientIds.map(c => c.id))
}

// Promise.all này chạy SAU khi serial query trên đã xong
const [...] = await Promise.all([clientsQuery, revenueQuery, ..., weightQuery])
```

#### Giải pháp

Join trực tiếp trong weight query thay vì pre-fetch IDs:

```ts
// Thay vì:
const { data: allowedClientIds } = await supabase.from('clients').select('id').in('branch_id', branchIds)
weightQuery = weightQuery.in('client_id', allowedClientIds.map(c => c.id))

// Dùng:
// Có thể thêm weight filter bằng cách join hoặc subquery trực tiếp trong Postgres function
// Hoặc đơn giản filter weight sau khi fetch (nếu data weight không quá lớn)
```

---

### [P6] `fetchCurrentUserProfile()` thiếu `cache()` → duplicate queries

**File**: `users.ts` — dòng 179  
**Mức độ ảnh hưởng**: ⭐⭐

#### Hiện trạng

```ts
// Không có cache() wrapping
export async function fetchCurrentUserProfile() {
    const supabase = await createClient()
    // ...query users table mỗi lần gọi
}
```

Nhiều component gọi `fetchCurrentUserProfile()` → nhiều query duplicate.

#### Giải pháp

```ts
// Wrap bằng cache() để deduplicate trong cùng 1 request
import { cache } from 'react'

export const fetchCurrentUserProfile = cache(async () => {
    const supabase = await createClient()
    // ...rest of function
})
```

---

### [P7] `fetchUsers()` dùng anon client (có RLS) thay vì admin client

**File**: `users.ts` — dòng 22  
**Mức độ ảnh hưởng**: ⭐⭐

#### Hiện trạng

```ts
export async function fetchUsers() {
    const supabase = await createClient()  // ← anon key, RLS active
    // ...
}
```

RLS phải evaluate policies mỗi query → overhead. Nếu bảng `users` có policy phức tạp có thể gây chậm.

#### Giải pháp

```ts
export async function fetchUsers() {
    // Dùng admin client, tự handle RBAC trong code
    const supabase = await createAdminClient()
    // ...giữ nguyên RBAC logic filter hiện có
}
```

---

## 🟢 CẢI THIỆN DATABASE (Cần chạy trong Supabase)

---

### [P8] Thêm Composite Index cho các filter thường dùng

```sql
-- Clients: filter theo branch + status (rất phổ biến)
CREATE INDEX IF NOT EXISTS idx_clients_branch_status 
    ON public.clients(branch_id, status);

-- Clients: filter theo branch + assigned_pt (cho staff view)
CREATE INDEX IF NOT EXISTS idx_clients_branch_assigned_pt 
    ON public.clients(branch_id, assigned_pt);

-- Contracts: filter theo branch + status
CREATE INDEX IF NOT EXISTS idx_contracts_branch_status 
    ON public.contracts(branch_id, status);

-- Revenue: filter theo thời gian + branch (dashboard)
CREATE INDEX IF NOT EXISTS idx_revenue_recorded_at_branch 
    ON public.revenue(recorded_at, branch_id);

-- Weight tracking: filter theo client + ngày
CREATE INDEX IF NOT EXISTS idx_weight_client_date 
    ON public.weight_tracking(client_id, measurement_date);
```

---

## 📊 Thứ Tự Ưu Tiên Triển Khai

| # | Vấn đề | Công sức | Impact | Độ ưu tiên |
|---|--------|----------|--------|------------|
| P2 | Shared `getAccessFilter` | Thấp | Cao | 🔴 Làm ngay |
| P3 | N+1 status count → 1 RPC | Trung bình | Cao | 🔴 Làm ngay |
| P1 | Tối ưu middleware matcher | Thấp | Trung bình | 🟡 Tuần này |
| P6 | Thêm `cache()` cho `fetchCurrentUserProfile` | Thấp | Thấp | 🟡 Tuần này |
| P8 | Thêm composite indexes | Thấp | Cao (khi data lớn) | 🟡 Tuần này |
| P4 | Kiểm tra và replace `fetchClients()` | Trung bình | Cao (khi data lớn) | 🟡 Tuần này |
| P7 | `fetchUsers()` → admin client | Thấp | Thấp-Trung | 🟢 Sprint sau |
| P5 | Fix dashboard serial subquery | Trung bình | Thấp-Trung | 🟢 Sprint sau |

---

## Những Điểm Đã Tốt (Giữ Nguyên)

| Pattern | Vị trí | Ghi chú |
|---------|--------|---------|
| `Promise.all()` parallel fetch | `dashboard.ts:101` | 7 queries song song |
| `cache()` intra-request | `clients.ts`, `contracts.ts` | Dedup trong 1 request |
| `createAdminClient()` bypass RLS | `clients.ts`, `contracts.ts` | Tránh RLS overhead |
| `fetchContractsLite()` | `contracts.ts:185` | Fetch nhẹ cho list view |
| `fetchClientsPage()` với phân trang | `clients.ts:91` | Có range/limit |
| `select('*', { count: 'exact' })` | `fetchClientsPage` | Count không load rows |
| RBAC trong app code | Toàn bộ | Không phụ thuộc RLS cho logic phức tạp |
