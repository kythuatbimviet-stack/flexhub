# Issue 2 — `fetchRevenue()` / `fetchExpense()` dùng Anon Client (RLS Overhead)

> Mức độ: 🔴 QUAN TRỌNG  
> File: `app/actions/financial.ts` — dòng 27, 202  
> Impact: ⭐⭐⭐⭐ — Xảy ra mỗi lần mở trang Cash Flow / Dashboard

---

## Mô tả vấn đề

Cả `fetchRevenue()` và `fetchExpense()` đều dùng `createClient()` (anon key):

```ts
// financial.ts — dòng 27
export async function fetchRevenue() {
    const supabase = await createClient()   // ← anon key, RLS evaluate trên mọi query
    // ...
    const accessInfo = await getAccessFilter()
    // ... filter RBAC thủ công bằng .in('branch_id', ...)
}

// financial.ts — dòng 202  
export async function fetchExpense() {
    const supabase = await createClient()   // ← anon key, RLS evaluate trên mọi query
    // ...
}
```

### Hệ quả thực tế

- RLS (Row Level Security) trên bảng `revenue` và `expense` phải **evaluate policy** cho từng row trong mỗi query
- Code đã tự handle RBAC qua `getAccessFilter()` + `.in('branch_id', allowedBranchIds)` → **RLS là redundant**
- Tương tự như `clients.ts` và `contracts.ts` đã được fix trước đó

---

## So sánh với code đã được tối ưu

```ts
// clients.ts — đã đúng ✅
export async function fetchClients() {
    const adminClient = await createAdminClient()   // bypass RLS
    // RBAC filter thủ công bằng getAccessFilter()
}

// financial.ts — chưa đúng ❌
export async function fetchRevenue() {
    const supabase = await createClient()           // anon + RLS overhead
    // RBAC filter thủ công bằng getAccessFilter()  (bị double check)
}
```

---

## Giải pháp đề xuất

Thay `createClient()` bằng `createAdminClient()` trong 2 hàm read:

```ts
// fetchRevenue — chỉ đổi dòng khởi tạo client
export async function fetchRevenue() {
    const supabase = await createAdminClient()   // ← Bypass RLS, RBAC giữ nguyên
    // ... toàn bộ còn lại giữ nguyên
}

// fetchExpense — chỉ đổi dòng khởi tạo client
export async function fetchExpense() {
    const supabase = await createAdminClient()   // ← Bypass RLS, RBAC giữ nguyên
    // ... toàn bộ còn lại giữ nguyên
}
```

---

## Điều kiện KHÔNG thay đổi

- ✅ Giữ nguyên `getAccessFilter()` call
- ✅ Giữ nguyên filter `.in('branch_id', accessInfo.access.allowedBranchIds)`
- ✅ Giữ nguyên tất cả RBAC check trong các hàm write (createRevenue, deleteRevenue...)
- ✅ Các hàm write (createRevenue, createExpense, updateRevenue...) có thể giữ nguyên `createClient()` nếu muốn an toàn hơn
- ❌ KHÔNG sửa bất kỳ điều kiện phân quyền, rule check, hay guard nào

---

## Impact dự kiến

| Metric | Trước | Sau |
|--------|-------|-----|
| RLS policy evaluation | Có | Không (bypass) |
| RBAC filter | Thủ công (getAccessFilter) | Thủ công (giữ nguyên) |
| Query latency (ước tính) | ~300–600ms | ~150–300ms |

---

## Trạng thái

- [ ] Chờ approve
- [ ] Đang thực hiện
- [ ] Hoàn tất
