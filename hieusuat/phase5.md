# Phase 5 — Tối Ưu Middleware & Các Cải Thiện Còn Lại

> **Rủi ro**: ⚠️ Trung bình — thay đổi auth flow, cần test kỹ  
> **Thời gian ước tính**: 45–60 phút  
> **Làm sau khi Phase 1–4 đã ổn định**  
> **Files liên quan**:
> - [SỬA] `middleware.ts`
> - [SỬA] `app/actions/users.ts` — `fetchUsers()`
> - [SỬA] `app/actions/clients.ts` — kiểm tra caller của `fetchClients()`
> - [SỬA] `app/actions/dashboard.ts` — fix serial subquery

---

## [5A] Tối Ưu Middleware

**Rủi ro**: ⚠️ Cao nhất trong phase này  
**Lý do hoãn**: Middleware ảnh hưởng toàn bộ routing, sai sẽ gây logout/redirect loop

### Hiện Trạng

```ts
// middleware.ts
const { data: { user } } = await supabase.auth.getUser()
// ↑ Network call tới Supabase Auth server mỗi request
```

`getUser()` verify JWT với server → round-trip. Với kết nối chậm: **+100–500ms mỗi navigation**.

### Giải Pháp: Dùng `getSession()` trong Middleware

```ts
// middleware.ts — SAU KHI SỬA
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request: { headers: request.headers } })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { /* ...giữ nguyên */ } }
    )

    // Dùng getSession() thay vì getUser() cho middleware
    // getSession() đọc từ cookie — không cần network call
    // ⚠️ KHÔNG dùng session này để authorize data — chỉ dùng để redirect
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    if (!user && request.nextUrl.pathname !== '/login' && ...) {
        return NextResponse.redirect(...)
    }

    // ...giữ nguyên phần còn lại
}
```

> **Quan trọng**: `getSession()` tin tưởng cookie không verify với Auth server — OK cho redirect logic, nhưng các server actions **vẫn phải dùng `getUser()`** để authorize data access.

### Tối Ưu Thêm: Thu Hẹp Matcher

```ts
export const config = {
    matcher: [
        // Hiện tại: match hầu hết mọi path (quá rộng)
        // Đề xuất: bỏ thêm các path không cần auth check
        '/((?!_next/static|_next/image|favicon.ico|api/webhook|api/zalo|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
```

### Test Bắt Buộc Sau Khi Sửa Middleware

| Scenario | Kết quả mong đợi |
|----------|-----------------|
| Truy cập `/` khi chưa login | Redirect về `/login` |
| Truy cập `/login` khi đã login | Redirect về `/` |
| Điều hướng giữa các trang | Không bị redirect lạ |
| Session hết hạn | Redirect về `/login` |
| Refresh page | Giữ nguyên session |

---

## [5B] `fetchUsers()` → Admin Client

**Rủi ro**: ✅ Thấp

### Hiện Trạng

```ts
// users.ts — dòng 22
export async function fetchUsers() {
    const supabase = await createClient()  // anon key, RLS active
```

### Sau

```ts
export async function fetchUsers() {
    const supabase = await createAdminClient()  // bypass RLS — RBAC handled in code
    try {
        // Auth check thủ công (vì bypass RLS)
        const { data: { user: authUser } } = await (await createClient()).auth.getUser()
        if (!authUser?.email) return { success: false, error: 'Unauthorized' }
        
        // ... giữ nguyên phần còn lại
```

**Lưu ý**: Sau Phase 3, nên dùng `getAccessFilter()` shared thay vì tự gọi lại.

---

## [5C] Kiểm Tra Caller của `fetchClients()` (Không Phân Trang)

**Rủi ro**: ✅ Thấp — chỉ refactor, không thay đổi data

### Mục Tiêu

Tìm tất cả chỗ gọi `fetchClients()` (hàm không phân trang, lấy toàn bộ) và đánh giá:

```ts
// Tìm trong codebase:
grep -r "fetchClients()" --include="*.ts" --include="*.tsx"
```

Nếu component nào chỉ cần hiển thị danh sách có filter+sort → dùng `fetchClientsPage()` thay thế.  
Nếu cần export Excel toàn bộ → OK giữ `fetchClients()` nhưng thêm `select()` chỉ các field cần.

---

## [5D] Fix Dashboard Serial Subquery

**Rủi ro**: ✅ Thấp  
**File**: `dashboard.ts` — dòng 56–59

### Hiện Trạng (Vấn Đề)

```ts
// Đoạn này chạy TRƯỚC Promise.all → block toàn bộ
if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
    // Extra serial query
    const { data: allowedClientIds } = await supabase
        .from('clients').select('id').in('branch_id', branchIds)
    
    weightQuery = weightQuery.in('client_id', allowedClientIds.map(c => c.id))
}

// Promise.all chỉ chạy SAU khi serial query trên xong
const [...] = await Promise.all([...weightQuery...])
```

### Giải Pháp: Filter Weight Sau Khi Fetch

Đơn giản nhất — sau khi fetch weight data, filter trong JS theo branchId thông qua client data đã có:

```ts
// Không cần pre-fetch clientIds nữa
// Weight data sẽ được filter theo clientIds sau khi fetch clients
const [...] = await Promise.all([
    clientsQuery,    // fetch clients (đã có branch filter)
    revenueQuery,
    expenseQuery,
    debtsQuery,
    contractsQuery,
    branchesQuery,
    weightQuery,     // fetch tất cả weight (filter sẽ làm sau)
])

// Sau khi có clients data, filter weight theo client IDs đã allowed
const allowedClientIdSet = new Set(safeClients.map(c => c.id))
const filteredWeights = safeWeights.filter(w => allowedClientIdSet.has(w.client_id))
// Dùng filteredWeights thay vì safeWeights trong các tính toán sau
```

---

## Thứ Tự Thực Hiện Phase 5

```
5D (fix dashboard serial)  ← Làm trước, rủi ro thấp
5B (fetchUsers admin client)
5C (kiểm tra fetchClients callers)
5A (middleware)            ← Làm cuối, rủi ro cao nhất
```

---

## Checklist Tổng

- [ ] 5D: Fix dashboard serial subquery
- [ ] 5B: `fetchUsers()` → admin client
- [ ] 5C: Kiểm tra và replace `fetchClients()` callers
- [ ] 5A: Sửa middleware dùng `getSession()`
- [ ] Test đầy đủ các scenario (xem bảng ở mục 5A)
- [ ] Deploy và monitor error logs 24h

---

## Kết Quả Kỳ Vọng Sau Toàn Bộ Phase 1–5

| Metric | Trước | Sau |
|--------|-------|-----|
| Queries/request load `/clients` | 8–10 | 3 |
| `auth.getUser()` calls/request | 3–4 | 1 |
| Middleware latency | +100–500ms | ~0ms (cookie-based) |
| Dashboard parallel queries | 7 + 1 serial | 7 |
| DB index usage | Single-column | Composite (faster) |
