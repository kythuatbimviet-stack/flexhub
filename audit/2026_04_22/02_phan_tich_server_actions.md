# 02 — Phân Tích Chi Tiết Server Actions Theo Module

**Ngày:** 2026-04-22

---

## 1. Module: Dashboard (`app/actions/dashboard.ts`)

### 1.1 `fetchDashboardMetrics(filters?)`

| Thuộc tính | Giá trị |
|-----------|---------|
| File | `app/actions/dashboard.ts:7` |
| Số lượng queries | 8 (chạy song song) |
| Có LIMIT? | ❌ Không |
| Có Pagination? | ❌ Không |
| Có Server-Side Aggregation? | ❌ Không (tính toán ở JS) |
| SELECT * ? | Có một phần (weight_tracking, training_logs) |
| Có Date Filter mặc định? | ❌ Không (chỉ filter theo UI input) |

**Queries được thực thi:**

```sql
-- Query 1: clients
SELECT id, status, source, registration_type, created_at, pt_name, branch_id, member_name, branches(name)
FROM clients
-- Không LIMIT, không date filter mặc định

-- Query 2: revenue
SELECT id, amount, actual_amount, recorded_at, branch_id, customer_id, branches(name), clients(member_name)
FROM revenue

-- Query 3: expense  
SELECT id, amount, recorded_at, branch_id, description, branches(name)
FROM expense

-- Query 4: debts
SELECT id, remaining_amount, paid_amount, status, created_at, branch_id, branches(name), clients(member_name)
FROM debts

-- Query 5: contracts
SELECT id, status, total_amount, package_name, end_date, created_at, branch_id, branches(name), clients(member_name)
FROM contracts

-- Query 6: branches
SELECT id, name, province FROM branches

-- Query 7: weight_tracking
SELECT client_id, weight, measurement_date FROM weight_tracking
ORDER BY measurement_date ASC
-- Không LIMIT!

-- Query 8: training_logs
SELECT date, status, client_id FROM training_logs
-- Không LIMIT, không date filter!
```

**Vấn đề nghiêm trọng nhất:**
```typescript
// O(N×M) inner loop — dòng 224
safeRevenue.forEach(r => {
    const client = safeClients.find(c => c.id === r.customer_id)  // LINEAR SCAN
    ...
})

// Nên thay bằng Map lookup — O(1):
const clientMap = new Map(safeClients.map(c => [c.id, c]))
safeRevenue.forEach(r => {
    const client = clientMap.get(r.customer_id)  // O(1)
})
```

**Ước tính payload tại 5000 records/bảng:**
- `clients` 5000 records × ~800 bytes = ~4 MB
- `revenue` 10000 records × ~300 bytes = ~3 MB  
- `weight_tracking` 20000 records × ~100 bytes = ~2 MB
- `training_logs` 50000 records × ~80 bytes = ~4 MB
- **Tổng: ~13 MB** dữ liệu xử lý per request (chưa tính JSON overhead)

---

## 2. Module: Contracts (`app/actions/contracts.ts`)

### 2.1 `fetchContracts()`

| Thuộc tính | Giá trị |
|-----------|---------|
| File | `app/actions/contracts.ts:112` |
| Có LIMIT? | ❌ Không |
| SELECT * ? | ✅ `SELECT *` trên contracts (80+ cols) + JOIN clients + branches |
| Có Pagination? | ❌ Không |
| Mức độ rủi ro | 🔴 Critical |

```typescript
// 80+ columns + full client + branch data
.select(`
    *,
    clients (member_name, phone, avatar_url, dob, status, source, 
             signature_url, height, weight, medical_history),
    branches (name, account_number, account_holder, bank_name, ...)
`)
// Không có LIMIT, OFFSET, hoặc date range filter
```

> ⚠️ **medical_history**, **signature_url** (base64), và nhiều text fields dài được luôn tải về ngay cả khi chỉ cần hiển thị danh sách.

### 2.2 `fetchContractsLite()` — Đánh giá tích cực

| Thuộc tính | Giá trị |
|-----------|---------|
| File | `app/actions/contracts.ts:168` |
| SELECT * ? | ❌ Chọn lọc fields |
| Có Pagination? | ❌ Vẫn không có |
| JOIN | `clients(member_name, phone, dob, avatar_url, email)` — hợp lý |

```typescript
// Tốt: chỉ select các fields cần thiết
.select(`
    id, client_id, status, branch_id, start_date, end_date, ...
    clients (member_name, phone, dob, avatar_url, email),
    branches(name)
`)
```
**Khuyến nghị:** Thêm server-side pagination (`.range(from, to)`) và filter ngày mặc định (ví dụ: 1 năm gần nhất).

### 2.3 `fetchContractById(id)` — OK

Tốt: fetch by primary key, dùng `.maybeSingle()`. Performance ổn.

### 2.4 `deleteContract(id)` — Sequential Queries

```typescript
// 6 queries tuần tự (không parallel) khi xóa 1 hợp đồng:
1. contracts.select (RBAC check)
2. debts.select (lấy debt IDs)
3. debt_installments.delete
4. revenue.select (lấy revenue IDs)
5. debt_installments.update (clear refs)
6. revenue.delete
7. debts.delete
8. contracts.delete
```
Có thể tối ưu bằng CASCADE DELETE ở DB level.

---

## 3. Module: Clients (`app/actions/clients.ts`)

### 3.1 `fetchClients()` — Legacy, Không Pagination

| Thuộc tính | Giá trị |
|-----------|---------|
| File | `app/actions/clients.ts:27` |
| SELECT * ? | ✅ SELECT * |
| Có Pagination? | ❌ Không |
| Mức độ rủi ro | 🟠 High |

```typescript
// Tải toàn bộ clients không có giới hạn
let query = adminClient.from('clients').select('*').order('created_at', { ascending: false })
```

### 3.2 `fetchClientsPage()` — Đúng Chuẩn ✅

| Thuộc tính | Giá trị |
|-----------|---------|
| File | `app/actions/clients.ts:74` |
| Có Pagination? | ✅ Server-side `.range(from, to)` |
| Có Status Count RPC? | ✅ Parallel RPC call |
| Có Search Server-Side? | ✅ `.or()` filter |

**Đây là pattern chuẩn** cần nhân rộng cho contracts, revenue, expense.

---

## 4. Module: Financial (`app/actions/financial.ts`)

### 4.1 `fetchRevenue()` — Không Pagination, JOIN nặng

| Thuộc tính | Giá trị |
|-----------|---------|
| File | `app/actions/financial.ts:26` |
| Có LIMIT? | ❌ Không |
| Có Pagination? | ❌ Không |
| JOIN nặng | `clients(*)` — SELECT * trên clients |
| Mức độ rủi ro | 🟠 High |

```typescript
// JOIN clients(*) = SELECT * trên clients cho mỗi revenue record
.select(`
    *, tax_rate, tax_amount, actual_amount,
    branches(name),
    clients(*),           // ← NGUY HIỂM: SELECT * bao gồm tất cả fields clients
    contracts(id, ...)
`)
```

### 4.2 `fetchRevenueByDateRange(startDate?, endDate?)` — Khá Hơn

```typescript
// Có date filter server-side
if (startDate) query = query.gte('recorded_at', startDate)
if (endDate) query = query.lte('recorded_at', endDate + 'T23:59:59')
```
→ Tốt hơn `fetchRevenue()` nhưng vẫn không có LIMIT.

### 4.3 `fetchExpense()` — Không Pagination

Tương tự `fetchRevenue()`. Không có limit, không pagination.

### 4.4 `fetchCashFlowData(filters?)` — Có Filter, Không Có Limit

```typescript
// Tốt: có date filter, branch filter, payment method filter
// Xấu: không có LIMIT — có thể tải hàng nghìn records
const [{ data: revenue }, { data: expense }] = await Promise.all([
    rQuery.order('recorded_at', { ascending: false }),
    eQuery.order('recorded_at', { ascending: false })
])
```

---

## 5. Module: Weight Tracking (`app/actions/weight-tracking.ts`)

### 5.1 `fetchWeightRecords()` — Không Filter, Không Limit

| Thuộc tính | Giá trị |
|-----------|---------|
| File | `app/actions/weight-tracking.ts:7` |
| SELECT * ? | ✅ SELECT * |
| Có LIMIT? | ❌ Không |
| Có Date Filter? | ❌ Không |
| Mức độ rủi ro | 🟠 High |

```typescript
// Tải TOÀN BỘ lịch sử cân nặng của hệ thống
const { data, error } = await supabase
    .from('weight_tracking')
    .select('*')
    .order('measurement_date', { ascending: false })
    // Không LIMIT, không filter!
```

### 5.2 `fetchWeightRecordsRecent(days, startDate?, endDate?)` — Tốt ✅

```typescript
// Tốt: có date filter + LIMIT
const { data } = await query
    .order('measurement_date', { ascending: false })
    .limit(1000)
```

### 5.3 `fetchClientWeightHistory(clientId)` — OK

Filter theo `client_id`, không tải cross-client data. Chấp nhận được.

### 5.4 `fetchTrainingLogs(startDate, endDate)` — Có Date Range ✅

```typescript
// Tốt: có date range bắt buộc
.gte('date', startDate).lte('date', endDate)
```

---

## 6. Module: Users (`app/actions/users.ts`)

Không phân tích sâu trong audit này nhưng cần kiểm tra tương tự.

---

## 7. Bảng Tóm Tắt Đánh Giá Các Hàm

| Hàm | Pagination | LIMIT | Select Selective | Server Aggregation | Rating |
|-----|-----------|-------|------------------|--------------------|--------|
| `fetchDashboardMetrics` | ❌ | ❌ | Một phần | ❌ | 🔴 |
| `fetchContracts` | ❌ | ❌ | ❌ (SELECT *) | N/A | 🔴 |
| `fetchContractsLite` | ❌ | ❌ | ✅ | N/A | 🟡 |
| `fetchContractById` | N/A | N/A | Một phần | N/A | ✅ |
| `fetchClients` | ❌ | ❌ | ❌ (SELECT *) | N/A | 🟠 |
| `fetchClientsPage` | ✅ | ✅ | ✅ | ✅ (RPC) | ✅ |
| `fetchRevenue` | ❌ | ❌ | ❌ (clients(*)) | N/A | 🟠 |
| `fetchRevenueByDateRange` | ❌ | ❌ | ❌ (clients(*)) | N/A | 🟡 |
| `fetchExpense` | ❌ | ❌ | Một phần | N/A | 🟡 |
| `fetchCashFlowData` | ❌ | ❌ | ✅ | N/A | 🟡 |
| `fetchWeightRecords` | ❌ | ❌ | ❌ (SELECT *) | N/A | 🔴 |
| `fetchWeightRecordsRecent` | ❌ | ✅ (1000) | ❌ (SELECT *) | N/A | 🟡 |
| `fetchClientWeightHistory` | ❌ | ❌ | ❌ (SELECT *) | N/A | 🟡 |
| `fetchTrainingLogs` | ❌ | ❌ | ❌ (SELECT *) | N/A | 🟡 |
