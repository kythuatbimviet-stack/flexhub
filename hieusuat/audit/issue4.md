# Issue 4 — `fetchWeightRecords()` Không Giới Hạn Data, Dùng Anon Client

> Mức độ: 🟡 TRUNG BÌNH  
> File: `app/actions/weight-tracking.ts` — dòng 7–25  
> Impact: ⭐⭐⭐ — Nặng khi có nhiều bản ghi weight tracking

---

## Mô tả vấn đề

### Vấn đề A: Không có limit

```ts
export async function fetchWeightRecords() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('weight_tracking')
        .select('*')          // ← Lấy TẤT CẢ cột
        .order('measurement_date', { ascending: false })
        // ← Không có .limit() hay .range()
}
```

Khi dữ liệu lớn (gym có 500+ hội viên, mỗi người 52 tuần = 26,000+ records) → transfer toàn bộ qua network.

### Vấn đề B: Đã có hàm tối ưu nhưng chưa dùng

Hàm `fetchWeightRecordsRecent(days)` ĐÃ ĐƯỢC VIẾT SẴN (dòng 36–58):

```ts
// ĐÃ CÓ SẴN — dòng 36
export async function fetchWeightRecordsRecent(days: number = 180) {
    const supabase = await createClient()
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('weight_tracking')
        .select('*')
        .gte('measurement_date', sinceStr)   // ← Chỉ lấy 180 ngày gần nhất
        .order('measurement_date', { ascending: false })
}
```

---

## Giải pháp đề xuất

Kiểm tra `weight-tracking/page.tsx` đang gọi hàm nào:
- Nếu gọi `fetchWeightRecords()` → đổi sang `fetchWeightRecordsRecent(180)`
- Nếu đã gọi `fetchWeightRecordsRecent()` → không cần sửa

Ngoài ra, cân nhắc thêm `select` cụ thể columns thay vì `select('*')` trong `fetchWeightRecordsRecent`:

```ts
.select('id, client_id, contract_id, measurement_date, weight, height, month, day')
// Chỉ lấy các cột cần thiết cho giao diện — bỏ qua audit fields
```

---

## Điều kiện KHÔNG thay đổi

- ✅ Giữ nguyên `fetchWeightRecords()` — không xóa (các hàm khác có thể đang dùng)
- ✅ Giữ nguyên `fetchWeightRecordsRecent()` — chỉ chuyển sang dùng nó
- ✅ Giữ nguyên RLS trên weight_tracking (dữ liệu cá nhân, cần bảo mật)
- ❌ KHÔNG sửa business logic của trang weight-tracking

---

## Trạng thái

- [ ] Chờ approve
- [ ] Đang thực hiện
- [ ] Hoàn tất
