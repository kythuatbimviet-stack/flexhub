# Setup Guide: Hệ Thống Quản Lý Vận Tải & Công Nợ

Tech Stack: **Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase · Lucide Icons**

---

## 1. CHUẨN BỊ MÔI TRƯỜNG

### Yêu cầu tối thiểu
| Tool | Version | Kiểm tra |
|------|---------|----------|
| Node.js | ≥ 20.x LTS | `node -v` |
| npm | ≥ 10.x | `npm -v` |
| Git | any | `git -v` |

> Tải Node.js tại: https://nodejs.org

---

## 2. TẠO DỰ ÁN NEXT.JS

Mở terminal tại thư mục cha (không phải thư mục dự án) rồi chạy:

```bash
# Xóa thư mục cũ nếu có rác từ lần trước
rd /s /q "19. Quanlyxe"
mkdir "19. Quanlyxe"
cd "19. Quanlyxe"

# Khởi tạo Next.js (trả lời các câu hỏi như bên dưới)
npx create-next-app@latest .
```

### Trả lời các câu hỏi như sau:

```
✔ Would you like to use TypeScript?          → Yes
✔ Would you like to use ESLint?              → Yes
✔ Would you like to use Tailwind CSS?        → Yes
✔ Would you like your code inside a `src` directory? → No
✔ Would you like to use App Router?          → Yes
✔ Would you like to use Turbopack?           → Yes
✔ Would you like to customize import alias?  → No (dùng @/* mặc định)
```

> **Lưu ý**: Nếu muốn tự động (không hỏi), thêm flag `--yes` vào cuối lệnh.

---

## 3. CÀI ĐẶT THƯ VIỆN

Chạy từng lệnh theo thứ tự:

### A. Supabase Auth & Client
```bash
npm install @supabase/ssr @supabase/supabase-js
```

### B. UI & Icons
```bash
npm install lucide-react sonner next-themes
```

### C. Form & Validation
```bash
npm install react-hook-form @hookform/resolvers zod
```

### D. Utilities
```bash
npm install date-fns clsx tailwind-merge class-variance-authority
```

### E. shadcn/ui (component library)
```bash
npx shadcn@latest init
```

Trả lời câu hỏi shadcn:
```
✔ Which style would you like to use? → Default
✔ Which color would you like to use as the base color? → Zinc
✔ Would you like to use CSS variables for theming? → Yes
```

### F. Cài các shadcn components cần dùng
```bash
npx shadcn@latest add button input label select textarea badge card dialog sheet table tabs separator dropdown-menu avatar tooltip scroll-area
```

---

## 4. CẤU HÌNH SUPABASE

### Bước 1: Tạo Supabase project
1. Vào https://supabase.com → **New Project**
2. Đặt tên, mật khẩu DB, chọn region **Southeast Asia (Singapore)**
3. Vào **Project Settings → API** → Copy:
   - `Project URL`
   - `anon public key`

### Bước 2: Bật Google OAuth
1. Vào **Authentication → Providers → Google**
2. Bật **Enable Google provider**
3. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo OAuth 2.0 Client
   - Authorized redirect URIs: `https://[your-project].supabase.co/auth/v1/callback`
4. Copy **Client ID** và **Client Secret** vào Supabase

### Bước 3: Tạo file `.env.local`
Tạo file `.env.local` tại root dự án:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxxxxxxxxxxxxxxxxxxx
```

---

## 5. CHẠY SQL SCHEMA TRONG SUPABASE

1. Vào Supabase Dashboard → **SQL Editor → New Query**
2. Copy toàn bộ nội dung file `guide/schema.sql` và chạy
3. Kiểm tra ** Tables** đã có đủ: `users`, `partners`, `vehicles`, `shipments`, `expenses`, `transactions`

---

## 6. KIỂM TRA & CHẠY DEV

```bash
# Kiểm tra không có lỗi TypeScript/build
npm run build

# Chạy development server
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`

---

## 7. CẤU TRÚC THƯ MỤC SAU KHI SETUP

```
├── app/
│   ├── layout.tsx              # Root layout (ThemeProvider, Toaster)
│   ├── page.tsx                # Redirect về /dashboard
│   ├── globals.css             # CSS gốc + Tailwind
│   ├── (auth)/
│   │   └── login/page.tsx      # Trang đăng nhập Google
│   ├── auth/callback/route.ts  # Xử lý OAuth callback
│   └── dashboard/
│       ├── layout.tsx          # Layout sidebar
│       ├── page.tsx            # Dashboard tổng quan
│       ├── van-chuyen/         # Module vận chuyển
│       ├── chi-phi/            # Module chi phí
│       ├── thu-chi/            # Module thu/chi
│       ├── cong-no/            # Module công nợ
│       ├── doi-tac/            # Danh mục đối tác
│       └── xe/                 # Danh mục xe
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── sidebar.tsx             # Navigation sidebar
│   ├── dashboard-shell.tsx     # Layout wrapper
│   └── [feature]/              # Feature components
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server Supabase client
│   ├── actions/                # Server actions
│   └── utils.ts                # cn() helper
├── middleware.ts                # Auth protection
├── guide/
│   ├── setup_guide.md          # File này
│   └── schema.sql              # SQL schema đầy đủ
└── .env.local                  # Secrets (KHÔNG commit git)
```

---

## 8. LỖI THƯỜNG GẶP & CÁCH XỬ LÝ

| Lỗi | Nguyên nhân | Cách sửa |
|-----|------------|----------|
| `Cannot find module '@supabase/ssr'` | Chưa cài package | `npm install @supabase/ssr` |
| `NEXT_PUBLIC_SUPABASE_URL not set` | Thiếu `.env.local` | Tạo file `.env.local` theo mục 4 |
| `Error: 401 invalid_grant` | Google OAuth config sai | Kiểm tra redirect URI trong Google Console |
| `Module not found: @/components/ui/button` | Chưa chạy shadcn init | `npx shadcn@latest init` |
| `Port 3000 already in use` | Port bị chiếm | `npm run dev -- --port 3001` |
| `tailwind: command not found` | Dùng Tailwind v4 khác v3 | CSS import trực tiếp trong globals.css |

---

## 9. CHECKLIST TRƯỚC KHI CODE

```
[ ] Node.js ≥ 20 đã cài
[ ] create-next-app đã chạy thành công
[ ] npm install (tất cả packages) không lỗi
[ ] npx shadcn@latest init đã chạy
[ ] .env.local đã tạo với 2 biến Supabase
[ ] SQL schema đã chạy trong Supabase Dashboard
[ ] Google OAuth đã bật trong Supabase
[ ] npm run dev → http://localhost:3000 mở được
```
