# Phase 3 — Shared `getAccessFilter` (Tránh Duplicate Auth Queries)

> **Rủi ro**: ⚠️ Thấp — cần test sau khi sửa  
> **Thời gian ước tính**: 20–30 phút  
> **Files liên quan**:
> - [MỚI] `lib/access-filter.ts`
> - [SỬA] `app/actions/clients.ts`
> - [SỬA] `app/actions/contracts.ts`
> - [SỬA] `app/actions/dashboard.ts`
> - [SỬA] `app/actions/financial.ts`
> **Ảnh hưởng ứng dụng**: Không thay đổi logic, chỉ consolidate

---

## Vấn Đề Hiện Tại

Mỗi file action đều tự định nghĩa riêng `getAccessFilter` với `cache()`:

```ts
// clients.ts có:
const getAccessFilter = cache(async () => { ... }) // Cache A

// contracts.ts cũng có:
const getAccessFilter = cache(async () => { ... }) // Cache B — KHÁC với Cache A

// dashboard.ts cũng có:
const getAccessFilter = cache(async () => { ... }) // Cache C — KHÁC nữa
```

**Hậu quả**: Nếu một page load gọi 3 server actions từ 3 file khác nhau → **3 cặp `auth.getUser()` + `users table query`** dù user là cùng 1 người.

---

## Giải Pháp

Tạo 1 file shared, import vào tất cả file action.

---

## Bước 1: Tạo File `lib/access-filter.ts` (MỚI)

```ts
// lib/access-filter.ts
import { cache } from 'react'
import { createClient } from './supabase-server'
import { getAccessControl, UserProfile } from './permissions'

/**
 * Shared access filter — cached per-request.
 * cache() ensures auth.getUser() + users table query
 * chỉ chạy 1 lần duy nhất trong cùng 1 server request,
 * dù được gọi từ nhiều server actions khác nhau.
 */
export const getAccessFilter = cache(async () => {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return null

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()

    if (!profile) return null

    return {
        user: profile as UserProfile,
        access: getAccessControl(profile as UserProfile),
        authId: authUser.id,
    }
})
```

---

## Bước 2: Sửa `app/actions/clients.ts`

**Xóa** đoạn này ở đầu file (dòng 8–22):

```ts
// XÓA ĐOẠN NÀY:
const getAccessFilter = cache(async () => {
    const supabase = await createSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return null

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()

    if (!profile) return null
    return { user: profile as UserProfile, access: getAccessControl(profile as UserProfile) }
})
```

**Thêm** import ở đầu file:

```ts
import { getAccessFilter } from '@/lib/access-filter'
```

**Xóa** import không còn dùng:

```ts
// Có thể xóa nếu không còn dùng ở chỗ nào khác:
import { cache } from 'react'
```

---

## Bước 3: Sửa `app/actions/contracts.ts`

Làm tương tự như `clients.ts`:

1. Xóa `const getAccessFilter = cache(async () => { ... })` ở đầu file (dòng 10–23)
2. Thêm `import { getAccessFilter } from '@/lib/access-filter'`

---

## Bước 4: Sửa `app/actions/dashboard.ts`

1. Xóa `const getAccessFilter = cache(async () => { ... })` ở đầu file (dòng 8–21)
2. Thêm `import { getAccessFilter } from '@/lib/access-filter'`

**Lưu ý**: `dashboard.ts` dùng `getAccessFilter` từ `createAdminClient()` — nhưng thực ra phần auth lookup (`getUser` + profile) vẫn cần `createClient()` (anon). Admin client chỉ dùng cho data queries. → Shared filter vẫn đúng.

---

## Bước 5: Sửa `app/actions/financial.ts`

1. Xóa `const getAccessFilter = cache(async () => { ... })` ở đầu file (dòng 8–25)
2. Thêm `import { getAccessFilter } from '@/lib/access-filter'`

**Lưu ý**: `financial.ts` có thêm `authId: authUser.id` trong return — shared filter đã bao gồm `authId` rồi.

---

## Checklist Thực Hiện

- [ ] Tạo file `lib/access-filter.ts`
- [ ] Sửa `clients.ts` — xóa local `getAccessFilter`, thêm import
- [ ] Sửa `contracts.ts` — xóa local `getAccessFilter`, thêm import
- [ ] Sửa `dashboard.ts` — xóa local `getAccessFilter`, thêm import
- [ ] Sửa `financial.ts` — xóa local `getAccessFilter`, thêm import
- [ ] Chạy `npm run build` — kiểm tra không có lỗi TypeScript
- [ ] Test đăng nhập và load các trang chính

---

## Test Sau Khi Sửa

| Trang | Kiểm tra |
|-------|---------|
| `/clients` | Load danh sách bình thường |
| `/contracts` | Load danh sách bình thường |
| `/` (dashboard) | Load metrics bình thường |
| `/financial/revenue` | Load danh sách bình thường |
| Đăng nhập Staff account | Chỉ thấy data của branch mình |
| Đăng nhập Admin account | Thấy toàn bộ data |

---

## Rollback (Nếu Cần)

Nếu có lỗi sau khi sửa:
1. Xóa file `lib/access-filter.ts`
2. Khôi phục lại đoạn `const getAccessFilter = cache(...)` trong từng file action (lấy từ git hoặc backup)
3. Xóa `import { getAccessFilter } from '@/lib/access-filter'` vừa thêm

---

## Kết Quả Kỳ Vọng

Trước: Load dashboard (gọi 4 server actions) = **4 lần `auth.getUser()`** + **4 lần query bảng `users`**

Sau: Load dashboard = **1 lần `auth.getUser()`** + **1 lần query bảng `users`** (cache shared)
