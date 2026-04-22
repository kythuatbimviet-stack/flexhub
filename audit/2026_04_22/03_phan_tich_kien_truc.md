# 03 — Phân Tích Kiến Trúc: Supabase Client, Caching, RBAC & Data Flow

**Ngày:** 2026-04-22

---

## 1. Kiến Trúc Kết Nối Supabase

### 1.1 Hai Loại Client

Hệ thống sử dụng 2 loại Supabase client được định nghĩa trong `lib/supabase-server.ts`:

```
┌─────────────────────────────────────────────────────────────┐
│                    lib/supabase-server.ts                    │
│                                                              │
│  createClient()          createAdminClient()                 │
│  ├─ Dùng ANON_KEY        ├─ Dùng SERVICE_ROLE_KEY           │
│  ├─ SSR cookie auth      ├─ Bypass RLS                      │
│  └─ RLS enforced         └─ NEW instance mỗi lần gọi ⚠️     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Vấn Đề: createAdminClient() Không Singleton

```typescript
// lib/supabase-server.ts:40
export async function createAdminClient() {
    return createSupabaseClient(URL, KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
    // Tạo instance mới HOÀN TOÀN mỗi lần gọi
}
```

**Tác động:**
- Mỗi Server Action call → 1 `createAdminClient()` call → 1 Supabase client instance mới
- Với `Promise.all([8 queries])` trong dashboard, 8 hàm có thể tạo nhiều connections
- Supabase PostgreSQL có giới hạn connections (mặc định 60-100 connections cho free/pro tier)
- Không có connection pooling layer (PgBouncer chưa được cấu hình tường minh)

**Khuyến nghị:**  
Cân nhắc singleton pattern hoặc module-level cache:
```typescript
// Cải thiện: tái sử dụng client trong cùng module
let _adminClient: ReturnType<typeof createSupabaseClient> | null = null
export function getAdminClient() {
    if (!_adminClient) {
        _adminClient = createSupabaseClient(URL, SERVICE_ROLE_KEY, { auth: { ... } })
    }
    return _adminClient
}
```

---

## 2. Caching Strategy

### 2.1 `getAccessFilter` — React cache() ✅

```typescript
// lib/access-filter.ts
import { cache } from 'react'
export const getAccessFilter = cache(async () => { ... })
```

**Cách hoạt động:**
- `cache()` của React dedup function calls trong cùng một server render cycle
- Dù `dashboard.ts`, `contracts.ts`, `clients.ts` đều gọi `getAccessFilter()`, DB chỉ bị hit 1 lần
- **Scope:** Per-request (không persist giữa các requests)

```
Request 1:
  Server Action A → getAccessFilter() → DB Query users table ← Lần duy nhất
  Server Action B → getAccessFilter() → (cached, no DB call)
  Server Action C → getAccessFilter() → (cached, no DB call)

Request 2:
  Server Action A → getAccessFilter() → DB Query users table ← Lại fresh
```

### 2.2 Không Có HTTP-level Caching cho Data Queries

Không tìm thấy việc sử dụng:
- `unstable_cache()` (Next.js)
- `revalidateTag()` / `revalidatePath()` dùng để invalidate (chỉ dùng để trigger re-fetch, không cache data)
- Redis hoặc in-memory cache layer
- Next.js Route Segment Config (`export const revalidate = 60`)

**Tác động:**
Mỗi user navigates đến `/reports` hoặc load dashboard → full DB queries được thực thi lại từ đầu.

### 2.3 `AppDataInitializer` — Background Prefetch

Layout sử dụng `<AppDataInitializer />` để prefetch data nền:
```typescript
// app/(dashboard)/layout.tsx:91
<AppDataInitializer />
// Prefetch all critical data silently — no longer blocks the UI
```

Đây là pattern tốt (non-blocking UX), nhưng cần đảm bảo `AppDataInitializer` không tải quá nhiều data không cần thiết.

---

## 3. RBAC (Role-Based Access Control) Layer

### 3.1 Luồng RBAC

```
Request → Server Action → getAccessFilter() → getAccessControl(profile)
                                │
                                ├─ canViewAllBranches (Admin/CEO)
                                ├─ allowedBranchIds (Manager/BM)
                                └─ isStaffOnly (Staff) → filter by email/name
```

### 3.2 Nhận Xét: RBAC Đúng Nhưng Không Dùng RLS

Hầu hết các queries dùng `createAdminClient()` (bypass RLS) + RBAC filter thủ công trong code:

```typescript
// contracts.ts: RBAC filter thủ công
if (!accessInfo.access.canViewAllBranches) {
    const allowedIds = accessInfo.access.allowedBranchIds || []
    if (accessInfo.access.isStaffOnly) {
        query = query.or(`created_by_email.eq.${email},...`)
    } else {
        query = query.in('branch_id', allowedIds)
    }
}
```

**Ưu điểm:** Linh hoạt, dễ debug  
**Rủi ro:** Nếu developer quên thêm filter vào một action mới → data leak  
**Khuyến nghị:** Bổ sung unit test/integration test để verify RBAC filter được áp dụng đúng cho mọi hàm fetch

### 3.3 `ilike` Filter cho Staff

```typescript
query = query.or(`trainer_name.ilike.%${name}%`)
```

`ILIKE '%name%'` là **full table scan** — không dùng được B-tree index. Với bảng contracts lớn, query này rất chậm.

**Khuyến nghị:** Normalize `trainer_name` → foreign key `trainer_id` (uuid) thay vì search by text name.

---

## 4. Data Flow Architecture

### 4.1 Luồng Hiện Tại

```
Browser (Client Component)
    │
    │ Server Action call (RPC over HTTP/2)
    ▼
Next.js Server (Node.js)
    │
    ├─ getAccessFilter() → Supabase Auth + users table
    │
    ├─ Build Queries (with RBAC filters)
    │
    ├─ Promise.all([query1, query2, ...queryN])  
    │           ↓ (parallel HTTP requests)
    ├─ Supabase REST API (PostgREST)
    │           ↓
    └─ PostgreSQL Database
    │
    │ Return JSON (full dataset)
    ▼
Next.js Server (Node.js)
    │ JavaScript aggregation/transformation
    ▼
Browser (Client Component)
    │ React state, rendering
    ▼
User sees data
```

### 4.2 Bottlenecks Theo Luồng

| Stage | Bottleneck | Mức độ |
|-------|-----------|--------|
| DB → Server | Full table scans, no indexes on filter cols | 🔴 |
| Server (JS) | O(N²) loops trong dashboard aggregation | 🟠 |
| Server → Browser | Large JSON payloads (MB) | 🟠 |
| Browser | Rendering large lists non-virtualized | 🟡 |

---

## 5. Database Schema Observations

Từ các queries quan sát được:

### 5.1 Các Columns Có Rủi Ro Nếu Index Thiếu

| Bảng | Column | Dùng trong Query | Cần Index? |
|------|--------|-----------------|-----------|
| `clients` | `branch_id` | WHERE filter | ✅ Cần |
| `clients` | `status` | WHERE filter | ✅ Cần |
| `clients` | `created_at` | ORDER BY, date filter | ✅ Cần |
| `contracts` | `branch_id` | WHERE filter | ✅ Cần |
| `contracts` | `end_date` | WHERE filter (due page) | ✅ Cần |
| `contracts` | `status` | WHERE filter | ✅ Cần |
| `revenue` | `recorded_at` | ORDER BY, date filter | ✅ Cần |
| `revenue` | `branch_id` | WHERE filter | ✅ Cần |
| `weight_tracking` | `client_id` | WHERE filter | ✅ Cần |
| `weight_tracking` | `measurement_date` | ORDER BY, date filter | ✅ Cần |
| `training_logs` | `client_id` | WHERE filter | ✅ Cần |
| `training_logs` | `date` | WHERE filter | ✅ Cần |

> **Lưu ý:** Supabase tự động tạo index trên Primary Key. Nhưng các foreign keys và filter/sort columns cần được index thủ công thông qua Supabase Dashboard hoặc migrations.

### 5.2 Không Thấy Materialized View hoặc Summary Table

Dashboard cần các metrics được tổng hợp theo tháng, nhưng không có evidence của:
- Materialized Views (`CREATE MATERIALIZED VIEW monthly_revenue_summary AS ...`)
- Summary tables cập nhật bằng triggers
- Scheduled jobs để pre-compute metrics

---

## 6. Next.js App Router Configuration

### 6.1 Không Dùng Server Components cho Data Fetching Pages

Layout (`app/(dashboard)/layout.tsx`) là `'use client'`. Hầu hết các page là Client Components gọi Server Actions qua `useEffect` hoặc event handlers.

**Trade-off:**
- ✅ Flexibility cao, dễ làm interactive UI
- ❌ Mất cơ hội dùng Server Components để fetch data một lần, stream HTML, và cache ở CDN level

### 6.2 Không Có Route-Level Caching

```typescript
// Không tìm thấy trong các page files:
export const revalidate = 300  // Cache 5 phút
export const dynamic = 'force-static'
```

Tất cả data fetching đều dynamic (no-store) theo mặc định của Next.js App Router.
