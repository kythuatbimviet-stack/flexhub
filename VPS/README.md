# 🚀 Hướng dẫn Chuyển đổi GymERP sang Self-hosted VPS

Chào mừng bạn đến với hướng dẫn chuyển đổi dự án GymERP sang VPS Contabo của bạn. Quy trình đã được chia nhỏ thành 4 giai đoạn dễ thực hiện.

## 📋 Mục lục các Giai đoạn

### [Giai đoạn 1: Chuyển đổi Dữ liệu (Database Migration)](./phase1-database-migration.md)
*   Trích xuất dữ liệu từ Supabase Cloud.
*   Khôi phục dữ liệu vào Supabase Self-hosted trên VPS.
*   Lấy các thông số kết nối mới.

### [Giai đoạn 2: Đóng gói Ứng dụng với Docker](./phase2-dockerization.md)
*   Hiểu về `Dockerfile` và `docker-compose.yml`.
*   Cách tạo và chạy Container Next.js standalone.
*   Cách cấu hình biến môi trường trên VPS.

### [Giai đoạn 3: Tự động hóa Triển khai (CI/CD Setup)](./phase3-cicd-setup.md)
*   Thiết lập GitHub Secrets để kết nối VPS.
*   Cách hoạt động của GitHub Actions (Build -> Push -> Deploy).
*   Cách chuẩn bị thư mục dự án trên VPS.

### [Giai đoạn 4: Cấu hình Server & SSL](./phase4-vps-server-config.md)
*   Cài đặt và cấu hình Nginx để làm Reverse Proxy (Cổng 80/443).
*   Cài đặt Certbot để nhận SSL (HTTPS) miễn phí.
*   Bảo mật Firewall trên VPS.

---

## 🛠️ Trạng thái hiện tại
Tôi đã tự động tạo cho bạn các file cốt lõi sau đây trong dự án:
- `next.config.ts`: Đã thêm `output: 'standalone'`.
- `Dockerfile`: File build image Next.js tối ưu.
- `.dockerignore`: Các file không cần thiết cho Docker.
- `docker-compose.yml`: File chạy ứng dụng trên VPS.
- `.github/workflows/deploy.yml`: Workflow tự động triển khai.

## 💡 Lưu ý quan trọng
Để bắt đầu, bạn hãy thực hiện theo đúng thứ tự từ **Phase 1** đến **Phase 4**. Chúc bạn thành công!
