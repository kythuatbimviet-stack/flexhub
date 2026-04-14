# Issue 1 — `staleTime: 0` trong `use-permissions.ts`

> Mức độ: 🔴 NGHIÊM TRỌNG  
> File: `hooks/use-permissions.ts` — dòng 32  
> Impact: ⭐⭐⭐⭐⭐ — Xảy ra mỗi lần user switch tab

---

## Mô tả vấn đề

`usePermissions()` được dùng ở **hầu hết mọi trang** trong dashboard.  
Hiện tại cấu hình:

```ts
const { data: profileResult, isLoading } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: fetchCurrentUserProfile,
    staleTime: 0,                   // ← LUÔN STALE ngay sau khi fetch
    refetchOnWindowFocus: true,     // ← Kết hợp với staleTime:0 → refetch MỌI LÚC focus tab
    refetchOnReconnect: true,
})
```

### Hệ quả thực tế

- Mỗi lần người dùng click vào tab trình duyệt (từ tab khác qua lại) → **gọi `fetchCurrentUserProfile`**
- `fetchCurrentUserProfile` thực hiện 2 queries:
  1. `supabase.auth.getUser()` — network call tới Supabase Auth server
  2. `supabase.from('users').select(...)` — query bảng users
- Người dùng switch tab 20 lần trong ngày = **40 queries thừa**
- Trên mobile / mạng chậm: **+200–500ms mỗi lần focus tab**

---

## Căn nguyên

`staleTime: 0` có nghĩa là data **luôn luôn bị coi là stale ngay sau khi fetch xong**.  
Kết hợp với `refetchOnWindowFocus: true` → mỗi lần focus → trigger refetch ngay lập tức.

---

## Giải pháp đề xuất

Đổi `staleTime: 0` thành `2 * 60 * 1000` (2 phút):

```ts
// hooks/use-permissions.ts
const { data: profileResult, isLoading } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: fetchCurrentUserProfile,
    staleTime: 2 * 60 * 1000,   // ← 2 phút: đủ để detect role change kịp thời
    refetchOnWindowFocus: true,  // ← Giữ nguyên — chỉ refetch nếu data đã stale (>2 phút)
    refetchOnReconnect: true,
})
```

### Lý do chọn 2 phút
- Đủ gần để detect quyền thay đổi (admin cập nhật role user)
- Đủ xa để không spam khi người dùng làm việc bình thường
- Cơ chế **fingerprint detection** giữ nguyên hoàn toàn — vẫn flush cache khi phát hiện thay đổi

---

## Điều kiện KHÔNG thay đổi

- ✅ Giữ nguyên `refetchOnWindowFocus: true`
- ✅ Giữ nguyên `refetchOnReconnect: true`
- ✅ Giữ nguyên toàn bộ `getPermissionFingerprint()` logic
- ✅ Giữ nguyên cơ chế `invalidateQueries` khi role thay đổi
- ❌ KHÔNG sửa bất kỳ logic RBAC hay permission nào khác

---

## Trạng thái

- [ ] Chờ approve
- [ ] Đang thực hiện
- [ ] Hoàn tất
