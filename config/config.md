# Cấu hình hệ thống GymERP

## Thông tin liên hệ (Hotline)

```
HOTLINE=0832 646 686
```

## Logo

```
LOGO_URL=https://cdn-icons-png.flaticon.com/128/281/281764.png
```

## Ghi chú

- `HOTLINE`: Số hotline hiển thị ở footer mỗi trang hợp đồng PDF
- `LOGO_URL`: URL ảnh logo hiển thị ở header mỗi trang hợp đồng PDF
- Các giá trị này được đọc bởi `contract-print-template.tsx` khi render template `contracts.html`
- Để thay đổi, chỉ cần sửa giá trị trong file này, không cần chỉnh sửa template hoặc code nguồn
