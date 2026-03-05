# Hướng dẫn Push GitHub & Deploy Railway

Tài liệu này hướng dẫn bạn quy trình đưa mã nguồn lên GitHub và triển khai ứng dụng lên Railway.

## 1. Đưa mã nguồn lên GitHub

### Bước 1: Khởi tạo Git (nếu chưa có)
Mở terminal tại thư mục gốc của dự án và chạy các lệnh sau:
```bash
git init
git add .
git commit -m "Initial commit - Auryleather ERP"
```

### Bước 2: Tạo Repository trên GitHub
1. Truy cập [github.com](https://github.com) và tạo một Repository mới (nên để chế độ **Private**).
2. Copy đường dẫn SSH hoặc HTTPS của repository (Ví dụ: `https://github.com/user/auryleather.git`).

### Bước 3: Kết nối và Push code
```bash
git branch -M main
git remote add origin <ĐƯỜNG_DẪN_REPO_CỦA_BẠN>
git push -u origin main
```

---

## 2. Triển khai lên Railway

### Bước 1: Kết nối tài khoản
1. Truy cập [railway.app](https://railway.app) và đăng nhập bằng tài khoản GitHub.
2. Chọn **"New Project"** -> **"Deploy from GitHub repo"**.
3. Chọn repository `auryleather` mà bạn vừa push lên.

### Bước 2: Cấu hình Biến môi trường (Variables)
Đây là bước **QUAN TRỌNG NHẤT**. Railway cần các thông tin kết nối Supabase để ứng dụng hoạt động.
Vào mục **Variables** trong dự án Railway và thêm các biến sau (lấy từ file `.env` hoặc `.env.local` của bạn):

| Key | Value (Ví dụ) |
|-----|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` |
| `NEXTAUTH_SECRET` | `một-chuỗi-ký-tự-ngẫu-nhiên-dài` |
| `NEXTAUTH_URL` | `https://your-app-name.up.railway.app` |

### Bước 3: Cấu hình Build & Deploy
Railway thường tự nhận diện Next.js. Tuy nhiên bạn nên kiểm tra:
- **Build Command**: `npm run build` hoặc `next build`
- **Start Command**: `npm run start` hoặc `next start`

---

## 3. Lưu ý quan trọng

1. **.gitignore**: Đảm bảo file `.gitignore` của bạn đã bao gồm các file nhạy cảm như `.env`, `.env.local`, `node_modules`. Tuyệt đối không push các file này lên GitHub.
2. **Supabase Auth**: 
   - Sau khi có URL chính thức từ Railway (VD: `https://auryleather.up.railway.app`), bạn cần vào **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
   - Cập nhật **Site URL** thành URL của Railway.
   - Thêm URL của Railway vào **Redirect URLs**.
3. **Database**: Railway sẽ kết nối trực tiếp đến Supabase của bạn, nên dữ liệu sẽ được giữ nguyên.

---
*Tài liệu được khởi tạo ngày 05/03/2026 bởi Antigravity.*
