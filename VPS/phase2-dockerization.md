# Phase 2: Đóng gói với Docker (App Dockerization)

Để ứng dụng Next.js chạy được trên VPS một cách ổn định và dễ quản lý, chúng ta sẽ sử dụng Docker.

## 1. Các file đã cấu hình
Tôi đã tạo cho bạn các file sau:
- `Dockerfile`: Chứa các bước để xây dựng "Image" cho dự án (sử dụng chế độ standalone để tối ưu dung lượng).
- `.dockerignore`: Các file không cần đưa vào Docker (giúp build nhanh hơn).
- `docker-compose.yml`: File giúp chạy container trên VPS với đầy đủ các cấu hình biến môi trường.

## 2. Kiểm tra App tại Local (Tùy chọn)
Trước khi đưa lên VPS, bạn có thể chạy thử tại máy cá nhân nếu đã cài Docker:

```bash
# Build và chạy thử
docker-compose up --build
```

Sau đó truy cập `http://localhost:3000` để xem kết quả.

## 3. Biến môi trường trên VPS
Khi chạy trên VPS, Docker sẽ ưu tiên đọc file `.env.production` (hoặc cấu hình trực tiếp trong `docker-compose.yml`).
Bạn hãy tạo một file `.env.production` trên VPS (cùng thư mục với `docker-compose.yml`) với các thông số Supabase từ Phase 1:

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=http://[IP_VPS_HOAC_DOMAIN]:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://[DOMAIN_CUA_BAN]
```

## 4. Cấp quyền truy cập
Hãy chắc chắn rằng Firewall của VPS đã mở cổng `3000` (để test) hoặc cổng `80/443` (thông qua Nginx sẽ cấu hình ở Phase 4).
