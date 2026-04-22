# Phân Tích Bug: Hợp Đồng Không Hiển Thị Trong "Tiến Trình Thay Đổi"

> **Ngày:** 2026-04-22 | **Mã HĐ báo lỗi:** `HD-CN003-2604001`  
> **Vị trí feature:** Weight-tracking → Chi tiết số đo → Chỉnh sửa → "Hợp đồng áp dụng"  
> **File chính liên quan:** `weight-details-sheet.tsx`, `add-weight-dialog.tsx`, `contracts.ts`

---

## Luồng Dữ Liệu Hiển Thị Danh Sách Hợp Đồng

```
User bấm "Chỉnh sửa" trong WeightDetailsSheet
        │
        ▼
useQuery → fetchContractsByClientId(selectedClientId)   [Server Action]
        │
        │  [Tầng 1 — RBAC server-side]
        │  Nếu user là Staff → chỉ trả về HĐ do họ tạo / được giao
        │
        ▼
contractsResult (array)
        │
        │  [Tầng 2 — filter UI]
        ▼
contractsResult?.filter((c: any) => c.status !== 'Hết hạn HĐ')
        │
        ▼
Danh sách Select <SelectItem> hiển thị cho user
```

---

## 🔴 Bug #1 — Filter UI Loại Bỏ Hợp Đồng `"Hết Hạn HĐ"` Dù `end_date` Vẫn Còn Dài

### Vị trí
- `components/weight-tracking/weight-details-sheet.tsx` — **Line 394**
- `components/weight-tracking/add-weight-dialog.tsx` — **Line 352**

### Code lỗi
```typescript
// weight-details-sheet.tsx:394
{contractsResult?.filter((c: any) => c.status !== 'Hết hạn HĐ').map((c: any) => (
//                                   ↑ Loại bỏ theo status, không theo end_date
    <SelectItem key={c.id} value={c.id}>
        {c.package_name || c.registration_type} ({c.id.slice(-4)})
    </SelectItem>
))}
```

### Nguyên nhân gốc
Field `status` trong bảng `contracts` có thể được cập nhật thành `'Hết hạn HĐ'` thông qua hàm `closeContract()`:
```typescript
// contracts.ts:1014-1015
// Sau khi xử lý xong, luôn chuyển trạng thái HĐ về "Hết hạn HĐ"
updates.status = 'Hết hạn HĐ'
```

Điều này có nghĩa: **Hợp đồng có thể bị đánh dấu "Hết hạn HĐ" trong khi `end_date` thực tế vẫn còn rất xa** — nếu manager đã chạy `closeContract()` sớm để mark HĐ đã kết thúc về mặt vận hành.

### Khả năng xảy ra với HD-CN003-2604001
Nếu hợp đồng này đã bị cập nhật `status = 'Hết hạn HĐ'` (dù `end_date` dài), nó **hoàn toàn bị loại khỏi dropdown** trong cả 2 form.

---

## 🔴 Bug #2 — RBAC Server-Side Filter Có Thể Loại Bỏ Hợp Đồng Theo Role

### Vị trí
`app/actions/contracts.ts` — Lines 937–947

### Code logic
```typescript
if (accessInfo.access.isStaffOnly) {
    // Staff chỉ thấy HĐ họ tạo hoặc được giao
    const email = accessInfo.user.email
    const name = accessInfo.user.name
    query = query.or(
      `created_by_email.eq.${email},assigned_pt.eq.${email},trainer_name.ilike.%${name}%`
    )
}
```

### Tình huống xảy ra lỗi

| Role người dùng | Kết quả |
|----------------|---------|
| Admin / CEO | ✅ Thấy tất cả HĐ |
| Manager chi nhánh | ✅ Thấy HĐ chi nhánh của mình |
| Staff PT | ⚠️ **Không thấy HĐ do Manager tạo cho client** |

---

## Cách Xác Định Nguyên Nhân Chính Xác

### Bước 1: Kiểm tra `status` của hợp đồng
```sql
SELECT id, status, end_date, created_by_email, assigned_pt, trainer_name, branch_id
FROM contracts
WHERE id = 'HD-CN003-2604001';
```
- Nếu `status = 'Hết hạn HĐ'` → **Bug #1** là nguyên nhân
- Nếu `status` khác → tiếp tục Bước 2

### Bước 2: Kiểm tra quyền của user đang đăng nhập
```sql
SELECT id, email, position, branch_id
FROM users
WHERE email = '<email-người-dùng-đang-báo-lỗi>';
```
So sánh với `created_by_email`, `assigned_pt`, `trainer_name` của hợp đồng — nếu không khớp và user là Staff → **Bug #2**.

---

## Fix Đề Xuất

### Fix #1 — Hiển thị tất cả HĐ, đánh label HĐ đã kết thúc (Ưu tiên — P0)

```typescript
// ❌ Cũ — weight-details-sheet.tsx:394 và add-weight-dialog.tsx:352
contractsResult?.filter((c: any) => c.status !== 'Hết hạn HĐ')

// ✅ Mới — Hiển thị tất cả, phân biệt bằng label
contractsResult?.map((c: any) => (
    <SelectItem key={c.id} value={c.id}>
        {c.package_name || c.registration_type} ({c.id.slice(-4)})
        {c.status === 'Hết hạn HĐ' ? ' — Đã kết thúc' : ''}
    </SelectItem>
))
```

Hoặc lọc theo `end_date` thực tế (chính xác hơn):
```typescript
contractsResult?.filter((c: any) => 
    !c.end_date || new Date(c.end_date) >= new Date()
)
```

### Fix #2 — Relaxed RBAC cho context Weight-Tracking (P1)

Staff cần thấy tất cả HĐ của client khi liên kết bản ghi cân nặng:
```typescript
export async function fetchContractsByClientId(
    clientId: string, 
    options?: { relaxedForWeightTracking?: boolean }
) {
    if (accessInfo.access.isStaffOnly && !options?.relaxedForWeightTracking) {
        query = query.or(`created_by_email.eq.${email},...`)
    } else {
        if (allowedIds.length > 0) {
            query = query.in('branch_id', allowedIds)
        }
    }
}
```

---

## Tóm Tắt

| # | Bug | Khả năng là nguyên nhân | Effort fix |
|---|-----|------------------------|------------|
| 1 | Filter UI: `status !== 'Hết hạn HĐ'` loại bỏ HĐ bất kể `end_date` | 🔴 **Cao nhất** | 🟢 1–2 dòng code |
| 2 | RBAC Staff không thấy HĐ Manager tạo | 🟡 Trung bình | 🟡 Thêm option parameter |
| 3 | HĐ chỉ fetch khi bấm Chỉnh sửa | 🟢 Không ảnh hưởng ẩn HĐ | — |

> **Hành động ngay:** Chạy câu SQL Bước 1 để xác nhận `status` của `HD-CN003-2604001`.  
> Nếu `status = 'Hết hạn HĐ'` → Fix #1 giải quyết được ngay mà không cần thay đổi server.
