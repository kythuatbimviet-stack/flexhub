# Audit: `/training-logs` — Tần Suất Tập Luyện

> **Ngày thực hiện:** 2026-04-22  
> **Phạm vi:** Data fetching, query logic, rendering pipeline  
> **Phương pháp:** Static analysis toàn bộ source code

---

## Danh Sách File Báo Cáo

| File | Nội dung | Ưu tiên |
|------|----------|---------|
| `01_P0_critical.md` | Vấn đề nghiêm trọng cần sửa ngay | 🔴 P0 — Critical |
| `02_P1_high.md` | Vấn đề quan trọng, nên sửa sớm | 🟡 P1 — High |
| `03_P2_medium.md` | Cải thiện dài hạn | 🟢 P2 — Medium |
| `04_diem_tot.md` | Các điểm logic hiện tại đang hoạt động tốt | ✅ Baseline |

---

## Sơ Đồ Kiến Trúc Data Fetching

```
page.tsx (Client Component)
│
├── useQuery → fetchBranches()                   [branches]
├── useQuery → fetchClientFilterOptions()         [PT list]
├── useQuery → fetchTotalTrainingStats()          [Stats cards]  ← VẤN ĐỀ P0
└── useQuery → fetchTrainingLogsSummary()         [Table data]
                        │
                        └── TrainingLogTable
                                    │
                                    └── [onClick expand] ClientLogDetails
                                                │
                                                └── useQuery → fetchClientLogsInRange()  ← VẤN ĐỀ P1
```

---

## Tổng Hợp Mức Độ Rủi Ro

| Mức | Số vấn đề | Tác động |
|-----|-----------|---------|
| 🔴 Critical (P0) | 3 | Load hàng chục nghìn rows về JS, sai RBAC, hàm legacy nguy hiểm |
| 🟡 High (P1) | 2 | Refetch không cần thiết, quét toàn bộ bảng khi không có ngày |
| 🟢 Medium (P2) | 3 | SELECT thừa columns, thiếu index, UX filter chưa rõ ràng |
| ✅ Tốt | 7 | Pagination, debounce, staleTime, lazy-load, cache auth... |
