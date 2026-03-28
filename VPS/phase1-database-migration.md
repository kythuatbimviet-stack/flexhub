# Phase 1: Database Migration (Cloud to VPS)

Để chuyển dữ liệu từ Supabase Cloud sang VPS của bạn, chúng ta sẽ sử dụng Supabase CLI để "Dump" (Trích xuất) và "Restore" (Khôi phục).

## 1. Yêu cầu chuẩn bị
- Đã cài đặt [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) trên máy tính cá nhân.
- VPS đã cài đặt Supabase Self-hosted và đang chạy.

## 2. Các bước thực hiện

### Bước 1: Trích xuất dữ liệu từ Supabase Cloud
Chạy lệnh sau trên máy tính cá nhân của bạn để tạo file sao lưu:

```bash
# Đăng nhập vào Supabase (nếu chưa)
supabase login

# Dump toàn bộ cấu trúc và dữ liệu (Thay [PROJECT_ID] bằng mã dự án trên cloud)
supabase db dump --project-ref [PROJECT_ID] -f supabase_backup.sql --data-only

# Dump cấu trúc (roles, schemas)
supabase db dump --project-ref [PROJECT_ID] -f supabase_schema.sql
```

### Bước 2: Khôi phục dữ liệu vào VPS
Giả sử Supabase trên VPS của bạn đang chạy ở cổng mặc định `5432` và bạn có mật khẩu Postgres:

```bash
# Khôi phục Schema
psql -h [IP_VPS] -p 5432 -U postgres -d postgres -f supabase_schema.sql

# Khôi phục Dữ liệu
psql -h [IP_VPS] -p 5432 -U postgres -d postgres -f supabase_backup.sql
```

> [!CAUTION]
> - Hãy đảm bảo rằng bạn đã mở cổng `5432` trên Firewall của VPS nếu bạn muốn kết nối từ máy cá nhân. 
> - Sau khi xong, hãy đóng cổng này lại hoặc chỉ cho phép IP cá nhân truy cập để bảo mật.

## 3. Cập nhật Biến môi trường
Sau khi dữ liệu đã qua VPS, bạn cần lấy các thông số mới:
- `NEXT_PUBLIC_SUPABASE_URL`: IP VPS hoặc Domain của bạn (ví dụ: `http://1.2.3.4:8000`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Lấy từ file cấu hình self-hosted của bạn.
- `SUPABASE_SERVICE_ROLE_KEY`: Lấy từ file cấu hình self-hosted của bạn.
