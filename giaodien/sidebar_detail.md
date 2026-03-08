# Layout Rules: Sidebar & Main Page Details

File này quy định các chuẩn về bố cục (margins, padding, responsive) cho các trang danh sách và chi tiết trong hệ thống Lady Fit.

## 1. Bố cục Tổng thể (Main Container)
- **Vertical Spacing**: Sử dụng `space-y-1.5` cho các phân đoạn chính.
- **Bottom Padding**: `pb-10` để tránh bị che khuất bởi thanh navigator mobile.
- **Horizontal Padding**:
  - Base (Mobile): `px-1`
  - Small Desktop (`sm`): `sm:px-1.5`

## 2. Thanh Tiêu đề & Hành động (Page Header)
- **Cấu trúc**: `flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1`.
- **Icon Tiêu đề**: Sử dụng Lucide icons, `w-8 h-8`, màu sắc tùy module (Khách hàng: `red-500`, Nhân sự: `blue-500`).
- **Nút hành động**:
  - Chiều cao chuẩn: `h-11`.
  - Border radius: `rounded-xl`.
  - Font: `font-medium`, `text-sm`.

## 3. Hệ thống Tabs (Trạng thái)
- **Giao diện**: Nằm ngang, hỗ trợ cuộn trên mobile (`overflow-x-auto no-scrollbar`).
- **Spacing**: `gap-1 px-1 mb-1`.
- **Badge số lượng**: `px-1.5 py-0.5 rounded-full text-[10px] font-bold`.
- **Trạng thái Active**: `data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600`.

## 4. Bố cục Tìm kiếm & Bộ lọc (Search & Filter Section)
Đây là quy tắc quan trọng nhất cho tính nhất quán:

### Cấu trúc Card
- **Bo góc**: `rounded-xl`.
- **Nền**: `gray-50/10` hoặc `gray-800/20`.
- **Padding nội dung**: `py-1 px-1 sm:px-1.5`.

### Thanh Search (Luôn hiển thị)
- **Height**: `h-9`.
- **Icon**: `Search` cố định bên trái (`absolute left-3`).
- **Hành động Mobile**: Một nút `Filter` (`lg:hidden h-9 w-9`) nằm cạnh ô search để đóng/mở các bộ lọc chi tiết.

### Bộ lọc Chi tiết (Responsive)
- **Desktop (`lg` >= 1024px)**: `lg:flex lg:flex-row lg:items-center gap-2`.
- **Mobile**:
  - Ẩn/Hiện bằng `AnimatePresence` và `motion.div` (với hiệu ứng trượt dọc `height: auto`).
  - Phân bổ theo lưới: `grid grid-cols-2 gap-2 pt-2`.
- **Thanh Select**: `h-9`, `rounded-lg`, `text-xs` hoặc `text-sm`.
- **Nút Làm mới (`RotateCcw`)**: `h-9`, màu `red-600`, căn giữa trên mobile (`w-full` / `justify-center`).

## 5. Bảng Dữ liệu (Table Layout)
- **Header**:
  - `h-10`: Chiều cao hàng tiêu đề.
  - `text-[11px] font-medium uppercase tracking-wider`: Kiểu chữ cho tiêu đề cột.
  - `text-gray-400`: Màu sắc tiêu đề cột.
- **Rows**:
  - `py-3`: Padding dọc cho các ô (`TableCell`).
  - `text-sm`: Kích thước chữ nội dung.
  - `cursor-pointer`: Luôn đi kèm hiệu ứng hover `bg-gray-50/50` để biểu thị hàng có thể bấm được.
- **Checkbox**: Cột đầu tiên luôn dành cho checkbox chọn hàng, căn giữa.

## 6. Typography & Font
- **Primary Font**: `font-inter`.
- **Label**: `text-gray-500` hoặc `text-slate-400`.
- **Value**: `text-gray-900` hoặc `text-slate-100`.
- **Weight**: `font-medium` (thông thường), `font-bold` (tiêu đề/badge).
