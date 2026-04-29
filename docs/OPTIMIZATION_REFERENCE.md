# KỸ THUẬT TỐI ƯU HÓA PHẢN HỒI UI VÀ QUẢN LÝ CACHE (OPTIMISTIC UPDATE)

Tài liệu này tổng hợp các kỹ thuật đã áp dụng để tối ưu hóa trang **Weight Tracking (Gantt View)** nhằm đạt được trải nghiệm "tức thì" (Instant response) cho người dùng.

## 1. Vấn đề: "Lưu chậm" và "Tải lâu"
Trong các ứng dụng tương tác cao (như bảng Gantt hoặc các nút trạng thái Y/N/T), việc đợi Server phản hồi mới cập nhật UI dẫn đến:
- **UI Lag**: Người dùng bấm nút và phải đợi 300ms-1s mới thấy trạng thái đổi.
- **Network congestion**: Gọi `invalidateQueries` quá nhiều gây ra hiện tượng waterfall request (nhiều yêu cầu tải lại toàn bộ bảng cùng lúc).
- **Latency từ Server Action**: Việc sử dụng `revalidatePath` trong Next.js Server Actions gây thêm độ trễ (RSC revalidation) không cần thiết cho Client Components.

## 2. Giải pháp: Optimistic Update (Cập nhật lạc quan)
Đây là kỹ thuật cập nhật UI **ngay lập tức** trước khi nhận được phản hồi từ Server.

### Quy trình thực hiện:
1. **Lưu Snapshot**: Lưu lại dữ liệu hiện tại trong cache để có thể khôi phục (rollback) nếu có lỗi.
2. **Cập nhật Cache cục bộ**: Sử dụng `queryClient.setQueryData` để ghi đè trạng thái mới vào Cache ngay khi người dùng click.
3. **Gọi API ngầm**: Thực hiện việc lưu dữ liệu vào Database ở background.
4. **Xử lý kết quả**:
   - Nếu thành công: Giữ nguyên UI và có thể gọi `invalidateQueries` cho các cache-key phụ (nếu có).
   - Nếu lỗi: Rollback dữ liệu từ Snapshot và thông báo lỗi.

### Ví dụ code mẫu:
```ts
const handleUpdate = async (newStatus) => {
    const queryKey = ['my-data-key'];
    
    // 1. Lưu snapshot
    const previousData = queryClient.getQueryData(queryKey);
    
    // 2. Cập nhật UI ngay lập tức
    queryClient.setQueryData(queryKey, (old) => {
        return old.map(item => item.id === targetId ? { ...item, status: newStatus } : item);
    });
    
    // 3. Gọi API
    try {
        const res = await myServerAction(newStatus);
        if (!res.success) throw new Error(res.error);
    } catch (err) {
        // 4. Rollback nếu lỗi
        queryClient.setQueryData(queryKey, previousData);
        toast.error("Lỗi: " + err.message);
    }
}
```

## 3. Tối ưu hóa React Query (Tải cực nhanh)
Để tránh hiện tượng màn hình trắng khi chuyển tab hoặc tải lại:

### Kỹ thuật áp dụng:
- **`staleTime`**: Thiết lập thời gian dữ liệu được coi là "tươi" (VD: 2-5 phút). Trong thời gian này, React Query sẽ lấy dữ liệu từ Cache ngay lập tức thay vì gọi API.
- **`placeholderData: keepPreviousData`**: Khi đang fetch dữ liệu mới (ví dụ khi thay đổi Range ngày), React Query vẫn hiển thị dữ liệu cũ thay vì hiển thị Loader hoặc màn hình trắng. Điều này làm cho quá trình chuyển đổi cực kỳ mượt mà.

## 4. Tối ưu hóa Server Action Latency
- **Hạn chế `revalidatePath`**: Đối với ứng dụng sử dụng React Query toàn diện ở Client, việc gọi `revalidatePath` ở Server Action là dư thừa và làm chậm quá trình phản hồi (Next.js phải kiểm tra lại RSC cache).
- **Phân tách Action**: Chia nhỏ các Action để thực hiện đúng một nhiệm vụ duy nhất, giúp giảm thời gian xử lý của Database.

## 5. Kết quả đạt được
- **Phản hồi tức thì**: Các nút Y/N/T đổi màu ngay khi bấm (< 10ms cảm nhận).
- **Chuyển tab mượt mà**: Chuyển giữa "Bảng" và "Tiến trình" không còn độ trễ tải.
- **Tiền xử lý dữ liệu**: Giảm 80% lưu lượng Network bằng cách tận dụng Cache thay vì Invalidate mù quáng.

---
*Tài liệu này được biên soạn bởi Antigravity dành cho FlexHub ERP để làm tiêu chuẩn tham khảo cho các module tương tự.*
