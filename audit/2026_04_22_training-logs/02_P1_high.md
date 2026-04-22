# P1 — High: Vấn Đề Quan Trọng, Nên Sửa Sớm

> **Nguồn:** `app/actions/training-logs.ts`, `components/training-logs/client-log-details.tsx`  
> **Ưu tiên:** 🟡 P1 — Nên sửa trong sprint tiếp theo

---

## Issue #4: `fetchTrainingLogsSummary` — Thiếu Date Fallback Khi Không Có Ngày

### Vị trí
`app/actions/training-logs.ts` — Lines 7–110

### Mô tả vấn đề
`fetchTotalTrainingStats` (hàm stats) đã có fallback date khi không truyền startDate/endDate:
```typescript
// ✅ fetchTotalTrainingStats — CÓ fallback
if (!startDate && !endDate) {
    startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    endDate   = format(endOfMonth(new Date()), 'yyyy-MM-dd')
}
```

Tuy nhiên `fetchTrainingLogsSummary` (hàm chính cho bảng dữ liệu) **KHÔNG có fallback này**:
```typescript
// ❌ fetchTrainingLogsSummary — KHÔNG có fallback
// Nếu startDate = '' và endDate = '' → query không có điều kiện ngày
// → PostgREST sẽ quét TOÀN BỘ bảng training_logs
let logsQuery = adminClient
    .from('training_logs')
    .select('client_id, status')
    .in('client_id', clientIds)
// Không có .gte('date', ...) và không có .lte('date', ...)
```

### Kịch bản xảy ra lỗi
1. User chọn option **"Tất cả thời gian"** trong filter
2. `setStartDate('')` và `setEndDate('')` được gọi
3. Cả hai queries được trigger với `startDate = undefined`, `endDate = undefined`
4. `fetchTotalTrainingStats` → fallback về tháng này ✅
5. `fetchTrainingLogsSummary` → **không có điều kiện ngày** → scan toàn bộ logs của 20 clients trong mọi thời điểm ❌

### Fix đề xuất
```typescript
export async function fetchTrainingLogsSummary({ startDate, endDate, ... }) {
    // Thêm fallback date — nhất quán với fetchTotalTrainingStats
    if (!startDate && !endDate) {
        startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd')
        endDate   = format(endOfMonth(new Date()), 'yyyy-MM-dd')
    }
    
    // ... phần còn lại của hàm
}
```

---

## Issue #5: `ClientLogDetails` — Không Có `staleTime`, Refetch Mỗi Lần Expand

### Vị trí
`components/training-logs/client-log-details.tsx` — Lines 26–30

### Mô tả vấn đề
Component `ClientLogDetails` được render khi user click mở rộng một hội viên trong bảng. Query của nó không có `staleTime` nên React Query coi cache là "stale" ngay lập tức sau lần fetch đầu.

```typescript
// Code hiện tại
const { data: result, isLoading } = useQuery({
    queryKey: ['client-training-logs', clientId, startDate, endDate],
    queryFn: () => fetchClientLogsInRange(clientId, startDate, endDate),
    enabled: !!clientId
    // ❌ Không có staleTime → default là 0 → luôn stale
    // ❌ Không có gcTime → data bị garbage collect sau component unmount
    // ❌ Không có refetchOnWindowFocus: false
})
```

### Tác động thực tế
- User expand hội viên A → fetch lần 1
- User collapse rồi expand lại hội viên A → **fetch lần 2** (data đã cũ dù mới fetch xong)
- User chuyển tab rồi quay lại → **fetch lần 3** (do `refetchOnWindowFocus` mặc định = true)
- Với 20 rows trên trang, user thao tác nhiều = **hàng chục Supabase calls không cần thiết**

### Fix đề xuất
```typescript
const { data: result, isLoading } = useQuery({
    queryKey: ['client-training-logs', clientId, startDate, endDate],
    queryFn: () => fetchClientLogsInRange(clientId, startDate, endDate),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,       // ← Cache 5 phút, không refetch vô cớ
    gcTime: 10 * 60 * 1000,          // ← Giữ cache 10 phút sau unmount
    refetchOnWindowFocus: false,     // ← Không refetch khi focus tab
})
```

**Lưu ý:** `staleTime: 5 * 60 * 1000` nhất quán với config đang dùng ở `training-logs-summary` query trên `page.tsx`.
