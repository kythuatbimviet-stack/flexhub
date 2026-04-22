# Baseline: Điểm Tốt Đang Hoạt Động Đúng

> **Mục tiêu:** Ghi nhận các pattern đúng để duy trì khi sửa các issue P0/P1/P2.  
> **Nguyên tắc:** Không thay đổi hoặc "cải tiến" các phần này trừ khi có lý do rõ ràng.

---

## ✅ Danh Sách Điểm Tốt

### 1. Server-Side Pagination — 20 Records / Trang

**Vị trí:** `app/(dashboard)/training-logs/page.tsx` — Line 26, `app/actions/training-logs.ts` — Lines 56–61

```typescript
// page.tsx
const pageSize = 20

// training-logs.ts — server action
const from = (page - 1) * pageSize
const to = from + pageSize - 1
const { data: clients, count: totalClients } = await clientQuery
    .order('member_name', { ascending: true })
    .range(from, to)  // ✅ Database-level pagination
```

**Tại sao tốt:** Không bao giờ load hơn 20 client rows / request. Tổng số `count` được trả về từ DB mà không tải toàn bộ data.

---

### 2. Debounce Search 500ms

**Vị trí:** `app/(dashboard)/training-logs/page.tsx` — Lines 29–35

```typescript
React.useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedClientSearch(clientSearch)
        setPage(1)
    }, 500)  // ✅ 500ms debounce
    return () => clearTimeout(timer)
}, [clientSearch])
```

**Tại sao tốt:** Ngăn server action bị gọi liên tục khi user đang gõ. Mỗi keystroke không = 1 Supabase query.

---

### 3. `staleTime: 5 phút` — Summary Query

**Vị trí:** `app/(dashboard)/training-logs/page.tsx` — Lines 78–91

```typescript
const { data: summaryResult } = useQuery({
    queryKey: ['training-logs-summary', branchFilter, ptFilter, ...],
    staleTime: 5 * 60 * 1000,       // ✅ Cache 5 phút
    refetchOnWindowFocus: false,     // ✅ Không refetch khi focus tab
})
```

**Tại sao tốt:** Data không query lại không cần thiết khi user switch tab rồi quay lại. Kết hợp với pagination, giúp UX mượt.

---

### 4. `ClientLogDetails` — Lazy Load (Chỉ Fetch Khi Expand)

**Vị trí:** `components/training-logs/training-log-table.tsx` — Lines 163–180  
`components/training-logs/client-log-details.tsx` — Lines 26–30

```typescript
// Chỉ render ClientLogDetails khi user click expand
{isExpanded && (
    <ClientLogDetails clientId={group.clientId} ... />
)}

// ClientLogDetails chỉ fetch khi có clientId và được render
const { data } = useQuery({
    enabled: !!clientId  // ✅ Không fetch khi không có clientId
})
```

**Tại sao tốt:** 20 clients trên page → **0 query chi tiết** khi mới load trang. Chỉ fetch khi user thực sự muốn xem.

---

### 5. Page Reset Khi Filter Thay Đổi

**Vị trí:** `app/(dashboard)/training-logs/page.tsx` — Lines 38–40

```typescript
React.useEffect(() => {
    setPage(1)  // ✅ Reset về trang 1 khi filter thay đổi
}, [branchFilter, ptFilter, startDate, endDate])
```

**Tại sao tốt:** Tránh tình huống user đang ở trang 5, thay đổi filter nhưng vẫn nhảy sang trang 5 của kết quả mới (có thể out of range).

---

### 6. `getAccessFilter` Dùng React `cache()`

**Vị trí:** `lib/access-filter.ts` — Lines 1–39

```typescript
export const getAccessFilter = cache(async () => {
    // auth.getUser() + users table query
    // Chỉ chạy 1 lần trong cùng 1 server request dù gọi từ nhiều server actions
})
```

**Tại sao tốt:** Cả `fetchTotalTrainingStats` và `fetchTrainingLogsSummary` đều gọi `getAccessFilter()` trong cùng 1 request. Nhờ `cache()`, DB query auth chỉ chạy 1 lần — không 2 lần.

---

### 7. Batched `IN` Query Thay Vì N+1

**Vị trí:** `app/actions/training-logs.ts` — Lines 70–77

```typescript
// ✅ Batch query — 1 query cho toàn bộ 20 clients
const clientIds = clients.map(c => c.id)
let logsQuery = adminClient
    .from('training_logs')
    .select('client_id, status')
    .in('client_id', clientIds)  // IN (id1, id2, ..., id20)
```

**Tại sao tốt:** Thay vì 20 queries riêng lẻ (N+1 anti-pattern), chỉ có **1 query** cho toàn bộ page. Kết quả được group trong JavaScript.

---

### 8. Aggregation Client-Side Sau Batched Query

**Vị trí:** `app/actions/training-logs.ts` — Lines 83–99

```typescript
// ✅ Aggregate nhỏ trong JS — hợp lý vì chỉ xử lý logs của 20 clients
const clientSummaries = clients.map(client => {
    const clientLogs = (logs || []).filter(l => l.client_id === client.id)
    return {
        stats: {
            y:  clientLogs.filter(l => l.status === 'Y').length,
            n:  clientLogs.filter(l => l.status === 'N').length,
            td: clientLogs.filter(l => l.status === 'TĐ').length
        }
    }
})
```

**Tại sao tốt:** Aggregation này chỉ xử lý logs của **20 clients trong page hiện tại** (không phải toàn bộ DB) — hoàn toàn hợp lý để làm ở JS.

---

## 🔒 Nguyên Tắc Khi Sửa Issues P0/P1/P2

> Khi implement các fix, phải đảm bảo 8 điểm tốt trên **không bị thay đổi**.  
> Đặc biệt: Pagination, batched query, và `getAccessFilter` cache phải được giữ nguyên.
