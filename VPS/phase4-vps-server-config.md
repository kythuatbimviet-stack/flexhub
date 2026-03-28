# Phase 4: Cấu hình VPS Server (Nginx & SSL)

Để ứng dụng Next.js của bạn có thể truy cập bằng tên miền và hỗ trợ giao thức bảo mật HTTPS, bạn cần một bộ điều hướng gọi là **Nginx**.

## 1. Cài đặt Nginx
Trên VPS của bạn (đã cài Ubuntu/Debian):

```bash
sudo apt update
sudo apt install nginx -y
```

## 2. Cấu hình Nginx
Tạo một file cấu hình cho ứng dụng:

```bash
sudo nano /etc/nginx/sites-available/gymerp
```

**Nội dung của file cấu hình:**

```nginx
server {
    listen 80;
    server_name [DOMAIN_CUA_BAN];

    location / {
        proxy_pass http://localhost:3000; # Chuyển hướng đến container của Next.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kích hoạt cấu hình:

```bash
sudo ln -s /etc/nginx/sites-available/gymerp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 3. Cài đặt SSL (HTTPS) miễn phí
Sử dụng Certbot (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d [DOMAIN_CUA_BAN]
```

Làm theo hướng dẫn của Certbot để hoàn tất việc cấp dắt SSL. Ứng dụng sẽ tự động chuyển hướng từ HTTP sang HTTPS.

## 4. Tường lửa (Firewall)
Hãy đảm bảo VPS của bạn đã mở các cổng cần thiết:

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
sudo ufw enable
```

> [!IMPORTANT]
> - Sau khi đã cấu hình Nginx, bạn không nên để cổng `3000` và `8000` (Supabase) mở công khai cho bên ngoài. Chỉ để lại cổng `80`, `443` (Nginx) và `22` (SSH).
