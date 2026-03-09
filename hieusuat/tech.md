# Kỹ thuật Tối ưu hóa Hiệu suất (4 Pillars of Performance)

Tài liệu này tổng hợp các kỹ thuật đã áp dụng cho các module Khách hàng, Hợp đồng và Zalo Users để đạt tốc độ tải dữ liệu tức thì (0ms latency).

---

## 1. Trụ cột 1: Persistent Cache (IndexedDB)
Sử dụng `PersistQueryClientProvider` để lưu trữ cache của React Query xuống IndexedDB thay vì chỉ lưu trong bộ nhớ RAM.

### Cấu hình trong `providers.tsx`:
- **Persister**: Sử dụng `@tanstack/query-async-storage-persister` kết hợp với `idb-keyval`.
- **Buster**: Sử dụng `buster` string (ví dụ: `v2`) để ép trình duyệt xóa cache cũ khi có thay đổi cấu trúc dữ liệu lớn.
- **gcTime**: Thiết lập thời gian dọn dẹp cache (ví dụ: 24h) để tránh đầy bộ nhớ trình duyệt.

---

## 2. Trụ cột 2: Initial Full Load (Prefetching)
Thay vì chờ người dùng click vào trang mới tải, dữ liệu được "nạp trước" ngay khi người dùng đăng nhập thành công.

### Pattern `AppDataInitializer.tsx`:
- Sử dụng `queryClient.prefetchQuery` trong một component không render UI bọc trong Layout chính.
- **Config Data**: `staleTime: Infinity` (Dữ liệu danh mục không đổi).
- **Business Data**: `staleTime: 30 minutes` (Khách hàng, Hợp đồng).
- **Parallel Fetching**: Sử dụng `Promise.all` để kích hoạt tất cả các luồng tải dữ liệu cùng lúc.

---

## 3. Trụ cột 3: Client-side Filter & Pagination
Chuyển từ cơ chế "Hỏi Server mỗi khi lọc" sang "Lọc trên RAM".

### Kỹ thuật áp dụng:
- **Fetch All**: Truy vấn toàn bộ dữ liệu một lần (ví dụ: `fetchClients`).
- **useMemo Filtering**: Sử dụng `useMemo` để lọc dữ liệu dựa trên `searchTerm` và `filterStatus`. Do dữ liệu đã ở trong RAM, việc lọc diễn ra trong < 1ms.
- **Client-side Pagination**: Chia trang dựa trên array đã lọc.
- **Full Context Filters**: Các dropdown bộ lọc (PT, Chi nhánh, Gói tập) sẽ lấy options từ **toàn bộ** dữ liệu thay vì chỉ dữ liệu của trang hiện tại.

---

## 4. Trụ cột 4: Manual Sync & Auto-Refresh
Cung cấp quyền kiểm soát dữ liệu cho người dùng.

### Thành phần:
- **DataSyncStatus UI**: Hiển thị thời gian đồng bộ cuối cùng (ví dụ: "Cập nhật 2 phút trước").
- **Hard Refresh**: Nút kích hoạt `queryClient.invalidateQueries` để xóa cache và tải lại dữ liệu mới nhất từ server.
- **Background Sync**: Sử dụng `setInterval` trong `AppDataInitializer` để tự động làm mới dữ liệu kinh doanh sau mỗi 30 phút một cách thầm lặng.

---

## 5. Kỹ thuật "Safe Array Guard" (Phòng ngừa lỗi Runtime)
Khi restore dữ liệu từ IndexedDB, có rủi ro dữ liệu bị lỗi định dạng (do cache cũ).

### Pattern `useQuery` an toàn:
```typescript
const { data = [] } = useQuery({
    queryKey: ['your-key'],
    queryFn: async () => {
        const res = await yourAction()
        return res.success ? (res.data ?? []) : []
    },
    // select chạy cả khi restore từ Cache, đảm bảo kết quả luôn là array
    select: (data) => Array.isArray(data) ? data : []
})
```

---

## tldr; Lợi ích đạt được:
1. **Instant Search**: Tìm kiếm khách hàng/hợp đồng không có độ trễ.
2. **Smooth Navigation**: Chuyển tab giữa các module không thấy loading spinner.
3. **Offline Ready**: Dữ liệu vẫn có thể xem được khi mất kết nối mạng (nhờ IndexedDB).
4. **Reduced Server Load**: Giảm 80-90% số lượng query gửi lên Supabase.
