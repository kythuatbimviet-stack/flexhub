# Issue 3 — `cash-flow/page.tsx` Dùng Cache Key Sai → Cache Miss Mỗi Lần Vào Trang

> Mức độ: 🟡 TRUNG BÌNH  
> File: `app/(dashboard)/cash-flow/page.tsx` — dòng 43  
> Impact: ⭐⭐⭐ — Xảy ra mỗi lần user navigate vào trang Cash Flow

---

## Mô tả vấn đề

`AppDataInitializer` đã prefetch danh sách clients vào cache với key `['clients-all']`.  
Tuy nhiên trang `cash-flow` gọi lại với key khác:

```ts
// cash-flow/page.tsx
import { fetchClients } from '@/app/actions/clients'

const { data: allClients = [] } = useQuery({
    queryKey: ['clients-lite'],     // ← KEY KHÁC với 'clients-all' !
    queryFn: async () => {
        const res = await fetchClients()   // ← Fetch lại dù đã có trong cache
        return res.success ? (res.data ?? []) : []
    },
})
```

```ts
// app-data-initializer.tsx — đã prefetch sẵn
{ key: ['clients-all'], fn: fetchClients, stale: FIVE_MINUTES }   // ← KEY: 'clients-all'
```

---

## Hệ quả thực tế

- React Query tìm cache theo key → `['clients-lite']` không tìm thấy → **cache miss**
- Gọi lại `fetchClients()` → **fetch toàn bộ clients từ server** mỗi lần vào trang cash-flow
- Data `['clients-all']` đã có sẵn trong cache **nhưng không được dùng**
- Tốn **1 request thừa** mỗi lần vào trang

---

## Giải pháp đề xuất

Đổi queryKey thành `['clients-all']` để reuse data đã có trong cache:

```ts
// cash-flow/page.tsx — SAU KHI SỬA
const FIVE_MINUTES = 5 * 60 * 1000

const { data: allClients = [] } = useQuery({
    queryKey: ['clients-all'],       // ← Đúng key, reuse cache từ AppDataInitializer
    queryFn: async () => {
        const res = await fetchClients()
        return res.success ? (res.data ?? []) : []
    },
    staleTime: FIVE_MINUTES,         // ← Đồng nhất với AppDataInitializer
})
```

---

## Điều kiện KHÔNG thay đổi

- ✅ Giữ nguyên `fetchClients` làm `queryFn` (data format không đổi)
- ✅ Giữ nguyên toàn bộ logic filter client trong cash-flow
- ✅ Giữ nguyên cách dùng `allClients` bên dưới
- ❌ KHÔNG sửa bất kỳ phần nào khác của trang

---

## Trạng thái

- [ ] Chờ approve
- [ ] Đang thực hiện
- [ ] Hoàn tất
