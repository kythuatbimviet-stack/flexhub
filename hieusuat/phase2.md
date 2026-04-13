# Phase 2 — Thêm `cache()` cho `fetchCurrentUserProfile`

> **Rủi ro**: ✅ Gần bằng 0  
> **Thời gian ước tính**: 5 phút  
> **File cần sửa**: `app/actions/users.ts`  
> **Số dòng thay đổi**: ~2 dòng  
> **Ảnh hưởng ứng dụng**: Không có — hành vi giống hệt, chỉ tránh gọi DB thừa

---

## Tại Sao Làm Phase Này?

`fetchCurrentUserProfile()` hiện **không có cache** → mỗi component gọi hàm này sẽ tạo 1 query DB riêng. Nếu nhiều component trong cùng 1 page render đều cần thông tin user hiện tại, sẽ có nhiều query duplicate.

`cache()` của React đảm bảo trong cùng 1 server request, hàm chỉ thực thi **1 lần duy nhất** — các lần gọi sau nhận kết quả cached.

---

## Thay Đổi Cụ Thể

**File**: `app/actions/users.ts`

### Trước

```ts
// Dòng 179 — hiện tại
export async function fetchCurrentUserProfile() {
    const supabase = await createClient()
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { success: false, error: 'Not authenticated' }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .maybeSingle()
        // ...
    }
}
```

### Sau

```ts
import { cache } from 'react'  // ← Đã có sẵn trong file (dùng ở nhiều chỗ khác)

// Wrap bằng cache() — chỉ thêm `cache(` trước `async` và `)` ở cuối
export const fetchCurrentUserProfile = cache(async () => {
    const supabase = await createClient()
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { success: false, error: 'Not authenticated' }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .maybeSingle()
        // ...phần còn lại giữ nguyên hoàn toàn
    }
})
```

**Thay đổi thực tế chỉ là**:
1. Đổi `export async function fetchCurrentUserProfile()` → `export const fetchCurrentUserProfile = cache(async () =>`
2. Thêm `)` đóng `cache(` ở cuối function

---

## Kiểm Tra `cache` Đã Được Import Chưa

```ts
// Đầu file users.ts — kiểm tra dòng import
import { cache } from 'react'
```

Nếu chưa có thì thêm dòng import này vào đầu file.

---

## Lý Do An Toàn Tuyệt Đối

- `cache()` **không thay đổi giá trị trả về** — vẫn cùng data
- `cache()` **không persist qua requests** — mỗi request mới sẽ gọi DB lại bình thường
- `cache()` chỉ deduplicate trong **cùng 1 server request** — không phải global cache
- Nếu function throw error, `cache()` **không cache error** → lần sau vẫn thử lại

---

## Verify Sau Khi Sửa

1. Chạy lại `npm run dev`
2. Đăng nhập và điều hướng qua các trang
3. Kiểm tra console server không có lỗi
4. Hành vi ứng dụng giống hệt trước

---

## Rollback (Nếu Cần)

Đơn giản là xóa `cache(` và `)` ở cuối, đổi `const` → `async function`.
