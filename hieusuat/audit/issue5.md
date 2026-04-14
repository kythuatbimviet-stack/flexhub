# Issue 5 — `console.log` Còn Lại Trong Production Code

> Mức độ: 🟢 NHỎ  
> File: `app/actions/financial.ts` — dòng 228, 429  
> Impact: ⭐⭐ — Tốn I/O server không cần thiết, lộ thông tin

---

## Mô tả vấn đề

Trong `financial.ts` còn 2 `console.log` chạy trên mỗi request:

```ts
// financial.ts — dòng 228 (trong fetchExpense)
console.log('Fetch Expense Data:', data?.length || 0, 'rows found')

// financial.ts — dòng 429 (trong fetchExpenseTypes)
console.log('Fetch Expense Types Success:', data?.length || 0, 'rows found')
```

### Hệ quả thực tế

- Mỗi lần `fetchExpense()` được gọi → in log ra server console (Vercel / Node)
- Mỗi lần `fetchExpenseTypes()` được gọi → in log ra server console
- **Tốn I/O không cần thiết** trên server
- **Lộ thông tin** về số lượng bản ghi (tiềm ẩn bảo mật)
- `AppDataInitializer` gọi `fetchExpense()` định kỳ 10 phút → spam log liên tục

---

## Giải pháp đề xuất

Xóa 2 dòng `console.log`:

```ts
// financial.ts — dòng 228: XÓA dòng này
// console.log('Fetch Expense Data:', data?.length || 0, 'rows found')

// financial.ts — dòng 429: XÓA dòng này  
// console.log('Fetch Expense Types Success:', data?.length || 0, 'rows found')
```

Giữ nguyên các `console.error` — đây là cần thiết để debug khi có lỗi thực sự.

---

## Điều kiện KHÔNG thay đổi

- ✅ Giữ nguyên tất cả `console.error(...)` 
- ✅ Giữ nguyên toàn bộ logic `fetchExpense()` và `fetchExpenseTypes()`
- ❌ KHÔNG sửa bất kỳ phần nào khác

---

## Trạng thái

- [ ] Chờ approve
- [ ] Đang thực hiện
- [ ] Hoàn tất
