# Cấu trúc và Quy tắc Cài đặt hệ thống (datasetup)

Tập tin này mô tả cách thức hoạt động của module Cài đặt (Thiết lập Thông số) dựa trên bảng `datasetup` trong cơ sở dữ liệu.

## 1. Cấu trúc Bảng Dữ liệu (`datasetup`)

Bảng `datasetup` lưu trữ toàn bộ các thông số cấu hình của hệ thống, từ danh mục phân loại đến các hằng số tính toán.

```sql
create table public.datasetup (
  id text not null,          -- Mã định danh duy nhất (Ví dụ: CAIDAT001)
  data_name text null,       -- Tên Module/Tab chính (Ví dụ: "Khách hàng", "Hệ thống")
  categories text null,      -- Phân loại/Card tiêu đề (Ví dụ: "Nguồn", "Trạng thái")
  nam text null,             -- Tên hiển thị của thông số
  value bigint null,         -- Giá trị số của thông số
  "default" bigint null,     -- Giá trị mặc định hoặc cờ (1: Mặc định, null/0: Không)
  constraint datasetup_pkey primary key (id)
);
```

## 2. Ánh xạ Giao diện Sidebar & Tabs

Giao diện cài đặt tại `/settings` được tổ chức theo cấu trúc phân cấp dựa trên các trường trong bảng `datasetup`:

### Cấp 1: Tabs Chính (`data_name`)
Mỗi giá trị duy nhất trong trường `data_name` sẽ tạo ra một Tab ở thanh điều hướng ngang trên cùng của trang Cài đặt.
*Ví dụ: Nếu `data_name` là "Khách hàng", nó sẽ xuất hiện như một Tab để người dùng chọn.*

### Cấp 2: Nhóm Thông số (`categories`)
Trong mỗi Tab (`data_name`), các thông số được gom nhóm lại theo trường `categories`. Mỗi nhóm này được hiển thị dưới dạng một **Card** (Thẻ).
*Ví dụ: Trong Tab "Khách hàng", có thể có các Card "Nguồn khách hàng", "Trạng thái khách hàng" dựa trên trường `categories`.*

### Cấp 3: Chi tiết Thông số (`nam`, `value`)
Bên trong mỗi Card (`categories`) là một bảng danh sách các mục:
*   **Tên**: Hiển thị từ trường `nam`.
*   **Giá trị**: Hiển thị từ trường `value`.
*   **Mặc định**: Nếu trường `default` có giá trị là `1`, mục đó sẽ được đánh dấu là "Mặc định".

## 3. Quy tắc ID (`id`)

Khi tạo mới một thông số qua giao diện, hệ thống tự động sinh ID theo định dạng:
`CAIDAT` + `Số thứ tự (3 chữ số)`
*Ví dụ: CAIDAT001, CAIDAT002, ...*

## 4. Cách sử dụng trong Sidebar Hệ thống

Sidebar chính của ứng dụng có mục **Cài đặt** dẫn đến trang cấu hình tập trung này. Việc thêm mới một `data_name` mới trong Database sẽ tự động tạo thêm một Tab mới trong trang Cài đặt mà không cần sửa đổi mã nguồn UI.
