# Phase 3: Thiết lập CI/CD (GitHub Actions)

Mục tiêu là mỗi khi bạn `push` code lên GitHub (nhánh `main`), ứng dụng sẽ tự động đóng gói (build image) và triển khai lên VPS.

## 1. Cấu hình GitHub Secrets

Bạn cần vào kho lưu trữ của mình trên GitHub, chọn **Settings** > **Secrets and variables** > **Actions** và thêm các **Repository secrets** sau:

- `VPS_HOST`: Địa chỉ IP của VPS của bạn (ví dụ: `1.2.3.4`).
- `VPS_USER`: Tên người dùng để SSH (ví dụ: `root` hoặc `ubuntu`).
- `VPS_SSH_KEY`: Nội dung file khóa riêng tư của bạn (Private SSH Key). Đây là file dùng để login vào VPS mà không cần mật khẩu.
- `VPS_SSH_PASSPHRASE`: (Tùy chọn) Nếu SSH Key của bạn có mật khẩu bảo vệ.

## 2. Chuẩn bị VPS

Để CI/CD hoạt động, bạn cần tạo một thư mục trên VPS và đưa file `docker-compose.yml` lên đó trước:

```bash
# Login vào VPS
ssh [USER]@[IP]

# Tạo thư mục dự án
mkdir -p ~/gymerp
cd ~/gymerp

# Tạo file .env.production tại đây (Lấy nội dung từ Phase 2)
nano .env.production
```

## 3. Hoạt động của Workflow

Tôi đã tạo file `.github/workflows/deploy.yml` cho bạn. Quy trình như sau:
1. GitHub sử dụng `GITHUB_TOKEN` có sẵn để đẩy Image lên **GitHub Container Registry (GHCR)**.
2. GHCR là nơi lưu trữ Image của bạn một cách bảo mật và miễn phí.
3. Sau khi đẩy Image xong, GitHub sẽ dùng SSH để thông báo cho VPS của bạn thực hiện lệnh:
   - `docker compose pull`: Tải bản mới nhất về.
   - `docker compose up -d`: Khởi động lại ứng dụng với bản mới nhất.
   - `docker image prune -f`: Xóa các image cũ để tiết kiệm dung lượng VPS.

> [!TIP]
> - Hãy kiểm tra xem nhánh mặc định của bạn là `main` hay `master`. Nếu là `master`, hãy sửa lại dòng cuối cùng của file `deploy.yml`.
> - Đừng quên tạo SSH key (nếu chưa có) và thêm Public Key vào file `authorized_keys` trên VPS.
