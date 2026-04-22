# 01 — Tổng Quan Kết Quả Audit Hiệu Năng Load Dữ Liệu

**Ngày:** 2026-04-22  
**Hệ thống:** GymERP — Next.js 14 App Router + Supabase (PostgreSQL)

---

## 1. Bức Tranh Tổng Thể

GymERP là một ứng dụng ERP cho phòng gym được xây dựng trên Next.js 14 App Router với Supabase làm backend CSDL. Luồng tải dữ liệu chủ yếu thông qua **Server Actions** (`'use server'`), kết hợp với **React Client Components** để hiển thị.

```
User Request → Client Component → Server Action → Supabase PostgreSQL
                                    ↑
                          getAccessFilter (RBAC cache)
```

---

## 2. Điểm Mạnh (Ghi Nhận Tích Cực)

### ✅ 2.1 Parallel Fetching ở Dashboard
File `dashboard.ts` dùng `Promise.all()` để tải **8 bảng cùng lúc**, tránh waterfall queries:
```typescript
const [clients, revenue, expense, debts, contracts, branches, weights, logs] 
    = await Promise.all([...])
```
→ **Tốt:** Giảm tổng thời gian chờ từ tổng cộng N queries xuống còn thời gian của query lâu nhất.

### ✅ 2.2 React `cache()` cho getAccessFilter
`lib/access-filter.ts` dùng `cache()` từ React để dedup auth check trong cùng một request:
```typescript
export const getAccessFilter = cache(async () => { ... })
```
→ **Tốt:** Dù nhiều Server Actions đều gọi `getAccessFilter()`, DB chỉ bị hit **1 lần/request**.

### ✅ 2.3 Server-Side Pagination cho Clients
`fetchClientsPage()` trong `clients.ts` có pagination thật sự tại DB:
```typescript
dataQuery = dataQuery.range(from, to)  // Supabase LIMIT/OFFSET
```
→ **Tốt:** Không load toàn bộ clients về client.

### ✅ 2.4 RPC cho Status Counts
`fetchClientsPage()` gọi `get_client_status_counts` RPC song song với data query, tránh thêm round-trip riêng để đếm.

### ✅ 2.5 `fetchContractsLite()` — Selective Fields
Hàm `fetchContractsLite()` select đúng các fields cần thiết thay vì `SELECT *`, giảm data transfer.

### ✅ 2.6 Weight Tracking có Limit
`fetchWeightRecordsRecent()` có `.limit(1000)` và date-range filter server-side.

---

## 3. Điểm Yếu (Vấn Đề Tìm Thấy)

### 🔴 3.1 [CRITICAL] Dashboard — Unbounded Full Table Scans
**File:** `app/actions/dashboard.ts`  
`fetchDashboardMetrics()` tải TOÀN BỘ 8 bảng về server, **không có LIMIT**:
- `clients` → tất cả clients
- `revenue` → tất cả doanh thu (có thể hàng nghìn records)
- `expense` → tất cả chi phí
- `debts` → tất cả công nợ
- `contracts` → tất cả hợp đồng
- `weight_tracking` → tất cả lịch sử cân nặng
- `training_logs` → tất cả nhật ký tập

→ **Rủi ro**: Khi data grow (>5000 records/bảng), response payload có thể lên đến hàng chục MB, gây timeout hoặc OOM.

### 🔴 3.2 [CRITICAL] `fetchContracts()` dùng `SELECT *`
**File:** `app/actions/contracts.ts`, dòng 118-125  
```typescript
let query = supabase.from('contracts').select(`*, clients(...), branches(...)`)
```
`SELECT *` trên bảng contracts với **80+ cột** (bao gồm base64 ảnh, PDF URL, long text fields), join thêm clients và branches. Không có filter ngày, không có limit.

### 🟠 3.3 [HIGH] `fetchRevenue()` và `fetchExpense()` — Không Có Pagination
**File:** `app/actions/financial.ts`  
```typescript
// fetchRevenue(): SELECT * FROM revenue JOIN clients(*) — không LIMIT
let query = supabase.from('revenue').select(`*, clients(*), contracts(...)`)
```
Đặc biệt nguy hiểm: JOIN `clients(*)` (SELECT *) cho mỗi revenue record.

### 🟠 3.4 [HIGH] `fetchWeightRecords()` — Không Có Limit/Filter
**File:** `app/actions/weight-tracking.ts`, dòng 7-25  
```typescript
// fetchWeightRecords(): SELECT * FROM weight_tracking — không filter
const { data, error } = await supabase.from('weight_tracking').select('*')
```
Không có bất kỳ date filter hay limit. Tất cả historical data được tải về.

### 🟠 3.5 [HIGH] `fetchClients()` — Legacy Function Không Có Pagination
**File:** `app/actions/clients.ts`, dòng 27-72  
Hàm `fetchClients()` (cũ) vẫn tồn tại và tải **toàn bộ clients** không có phân trang. Nếu còn code nào đó gọi hàm này thay vì `fetchClientsPage()` thì sẽ bị ảnh hưởng.

### 🟠 3.6 [HIGH] Không Có Connection Pooling
**File:** `lib/supabase-server.ts`  
`createAdminClient()` tạo Supabase client mới mỗi lần gọi:
```typescript
export async function createAdminClient() {
    return createSupabaseClient(URL, KEY, { ... })  // New instance every call
}
```
Không có singleton, không có PgBouncer config. Ở mức traffic cao, mỗi Server Action invocation tạo một DB connection mới.

### 🟡 3.7 [MEDIUM] Dashboard Tính Toán Phía Server Thay Vì DB
`fetchDashboardMetrics()` tải toàn bộ data rồi tính toán (trend, groupBy, sort, filter theo tháng) hoàn toàn trong JavaScript, thay vì đẩy aggregation về PostgreSQL dùng `GROUP BY`, `SUM()`, `COUNT()` qua RPC/View.

### 🟡 3.8 [MEDIUM] No HTTP-level Caching cho Dashboard
Không thấy `unstable_cache`, `revalidateTag`, hay Next.js `cache()` wrapper cho các queries dashboard chạy tốn kém. Mỗi page load đều hit DB từ đầu.

### 🟡 3.9 [MEDIUM] `safeRevenue.forEach` lồng trong loop clients — O(N×M)
**File:** `dashboard.ts`, dòng 223-233  
```typescript
safeRevenue.forEach(r => {
    const client = safeClients.find(c => c.id === r.customer_id)  // O(N) inner scan
    ...
})
```
`.find()` trong forEach tạo vòng lặp O(N×M). Với 500 revenues × 500 clients = 250,000 phép so sánh.

### 🟡 3.10 [MEDIUM] Training Logs không có giới hạn ngày trong Dashboard
`dashboard.ts` tải `training_logs` không có bất kỳ giới hạn ngày nào (chỉ filter theo UI filter nếu có). Bảng này có thể phình rất nhanh (mỗi client mỗi ngày = 1 record).

### 🟡 3.11 [MEDIUM] `fetchCashFlowData` — Không Có Pagination
**File:** `app/actions/financial.ts`, dòng 444+  
Tải toàn bộ revenue + expense trong khoảng thời gian, không giới hạn số records.

---

## 4. Điểm Số Tổng Hợp

| Hạng mục | Điểm | Nhận xét |
|----------|------|----------|
| Parallel Fetching | 8/10 | Dashboard dùng Promise.all tốt |
| Field Selection (Select chọn lọc) | 4/10 | Nhiều nơi vẫn SELECT * |
| Pagination/Limit | 3/10 | Chỉ clients có pagination thật |
| Server-Side Aggregation | 3/10 | Hầu hết tính toán ở JS layer |
| Caching Strategy | 4/10 | Chỉ getAccessFilter được cache |
| Connection Management | 5/10 | Không có pooling strategy rõ ràng |
| RBAC Filter Implementation | 8/10 | Nhất quán, an toàn |
| **Tổng quan** | **5/10** | Chấp nhận được ở quy mô nhỏ, rủi ro cao khi scale |

---

## 5. Kết Luận

Hệ thống GymERP **hoạt động tốt ở quy mô hiện tại** (vài trăm clients, vài nghìn records) nhờ parallel fetching và React cache. Tuy nhiên, **không có biện pháp phòng ngừa cho scale-up**: khi dữ liệu tăng lên 10k+ records, các full table scan sẽ gây **timeout và degraded UX nghiêm trọng**.

Ưu tiên cải tiến:
1. **Ngay lập tức:** Thêm `.limit()` và date filter mặc định cho dashboard queries
2. **Ngắn hạn:** Chuyển aggregation dashboard về PostgreSQL (RPC/Materialized View)
3. **Trung hạn:** Implement HTTP-level caching (Next.js `unstable_cache`) cho dashboard
