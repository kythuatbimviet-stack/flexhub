# Báo cáo reAudit: Ổn định & Bảo mật Hệ thống GymERP
Ngày: 2026-04-14

## 1. Tổng quan
Sau khi thực hiện rà soát (Audit) toàn bộ các Server Actions, chúng tôi xác định được các vấn đề cốt lõi gây ra sự mất ổn định và rủi ro bảo mật khi triển khai các bước tối ưu hóa hiệu suất.

## 2. Các lỗ hổng Bảo mật Nghiêm trọng
Một số Action đang sử dụng `createAdminClient` (Bypass RLS) nhưng lại thiếu bước kiểm tra xác thực người dùng (Authentication Gate). Điều này cho phép người dùng trái phép hoặc không đăng nhập có thể thực hiện các thao tác nhạy cảm:

### A. Cấu hình Hệ thống (`config-params.ts`, `contract-placeholders.ts`, `contract-templates.ts`)
- **Vấn đề**: Các hàm tạo, sửa, xóa cấu hình và mẫu hợp đồng hoàn toàn không có `getAccessFilter()`.
- **Rủi ro**: Bất kỳ ai biết endpoint Action đều có thể sửa đổi cấu hình vận hành của hệ thống.

### B. Dữ liệu Khách hàng & Cân nặng (`customers.ts`, `weight-tracking.ts`)
- **Vấn đề**: Các hàm `importCustomers`, `bulkDeleteCustomers`, `createWeightRecord`, `updateWeightRecord` dùng Admin Client nhưng không có chốt chặn Auth hoặc dùng logic check cũ không đồng nhất.
- **Rủi ro**: Sai lệch dữ liệu khách hàng hoặc rò rỉ thông tin cá nhân.

## 3. Các vấn đề về Ổn định & Hiệu suất
- **Inconsistent Auth Pattern**: Tồn tại nhiều cách kiểm tra quyền khác nhau (`checkAdmin`, `getAuthUser`, `getAccessFilter`). Việc không dùng chung `getAccessFilter` (đã được cache) dẫn đến lãng phí request và khó bảo trì.
- **Reference Errors**: Phát hiện trường hợp thiếu Import (`createAdminClient`) dẫn đến treo trang (đã fix trong `financial.ts`).
- **Heavy Queries**: Nhiều truy vấn vẫn dùng `select('*')` trên các bảng lớn, gây gánh nặng payload không cần thiết.

## 4. Kế hoạch Khắc phục (Roadmap)
1. **Giai đoạn 1**: "Bịt lỗ hổng". Thêm `getAccessFilter` vào 100% các Action dùng Admin Client.
2. **Giai đoạn 2**: "Đồng nhất hóa". Chuyển toàn bộ logic check quyền sang dùng `accessInfo.access` từ `getAccessFilter`.
3. **Giai đoạn 3**: "Tối ưu hóa Database". Thêm các Composite Index phục vụ cho việc lọc dữ liệu theo Chi nhánh (Manual RBAC).

---
**Ghi chú**: Tuyệt đối không can thiệp vào Logic nghiệp vụ (Business Rules) của các phần khác. Chỉ tập trung vào phần ổn định và bảo mật của các Action liên quan đến tối ưu hóa.
