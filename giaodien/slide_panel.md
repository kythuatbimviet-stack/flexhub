# Quy chuẩn Giao diện Slide Panel (GymnERP)

Tài liệu này quy định các tiêu chuẩn về thiết kế, bố cục và Typography dành cho các slide panel (Sheet) trong hệ thống GymnERP để đảm bảo tính nhất quán và trải nghiệm người dùng cao cấp (Premium UI).

## 1. Nguyên tắc chung (Core Principles)
- **Cấu trúc Card-based**: Thông tin được phân nhóm rõ ràng trong các khối trắng (Cards) trên nền xám nhạt (`slate-50`).
- **Sticky Layout**: Header và Footer luôn cố định (trên Desktop) để người dùng dễ dàng thao tác mà không cần cuộn trang.
- **Trải nghiệm Mobile-First**: Tối ưu hóa padding, kích thước nút nhấn và bố cục lưới. Các hành động chính phải luôn dễ tiếp cận (Header).

## 2. Màu sắc & Typography
- **Font chữ**: Sử dụng `Inter` làm font chữ chủ đạo (`font-inter`).
- **Màu sắc chủ đạo (Primary)**: `Blue-600` (#2563eb) cho các hành động chính, tiêu đề phần và icon.
- **Màu sắc trạng thái**: 
  - Thành công: `Emerald-500/600`.
  - Cảnh báo/Xóa: `Red-500/600`.
- **Phân cấp Typography**:
  - **Tiêu đề Card**: `text-[12px] font-bold uppercase tracking-widest`.
  - **Nhãn (Labels)**: `text-[10px] font-semibold text-slate-400 uppercase tracking-wider`.
  - **Giá trị (Values)**: `text-[15px] font-medium text-slate-700`.

## 3. Cấu trúc Layout (Structural Layout)

### A. Sticky Header (`shrink-0`)
- **Background**: `white/80` hoặc `gray-950/80` (Darkmode) kèm `backdrop-blur-md`.
- **Thành phần**: 
    - Trái: Ảnh đại diện (Avatar) hoặc Icon nghiệp vụ, Tên đối tượng/Hành động.
    - **Ưu tiên Mobile**: 
        - Chuyển các nút hành động chính (**Hủy**, **Lưu/Ghi nhận**) lên Header để tránh bị che bởi bàn phím hoặc toolbar trình duyệt.
        - Sử dụng `Button` size `sm`, font `bold`, text `[12px]`.
        - Nút "Hủy" dạng `ghost`, nút "Lưu" dạng `primary` (có màu sắc theo nghiệp vụ).
    - **Desktop**: Nút Đóng (X) ở góc phải.

### B. Nội dung chính (`flex-1 overflow-y-auto`)
- **Padding**: `px-4 py-5` (Mobile) / `px-5 py-5` (Desktop).
- **Phân tách**: Các phần cách nhau `space-y-4`.

### C. Sticky Footer (`shrink-0`)
- **Shadow**: `shadow-[0_-4px_12px_rgba(0,0,0,0.03)]`.
- **Thành phần**: Nút "Hủy" bên trái, nhóm thao tác chính (Xóa, Sửa/Lưu) bên phải.
- **Hiển thị**: Ẩn trên Mobile (`hidden sm:flex`) nếu các nút hành động đã được đưa lên Header. Luôn hiển thị trên Desktop.

## 4. Thành phần chuẩn hóa (Standard Components)

### CardSection
- `bg-white`, `rounded-2xl`, `border-slate-100`, `shadow-sm`.
- `Header`: Icon nằm trong box `bg-blue-50`, tiêu đề `text-blue-600`.

### InfoRow
- Nhãn nằm trên, giá trị nằm dưới.
- Khoảng cách `space-y-1`.
- Khi ở chế độ chỉnh sửa: Sử dụng `Input` hoặc `Textarea` với `rounded-xl`.

### Nút hành động (Buttons)
- **Primary**: `bg-blue-600`, `rounded-xl`, `h-11`, `shadow-lg shadow-blue-100`.
- **Secondary/Outline**: `border-2`, `rounded-2xl`, `h-14` cho các nút tạo mới nhanh.

## 5. Tương thích thiết bị (Responsiveness)
- **Chiều cao**: Sử dụng `h-[100dvh]` trên Mobile để đảm bảo panel luôn khớp với chiều cao màn hình trình duyệt (tránh lỗi thanh công cụ động).
- **Desktop**: Max width `480px`.
- **Mobile**: Full width (`w-full`), các thao tác chính nằm tại Header để tối ưu vùng tương tác.