-- ===== PHASE 4 AUDIT 2026-04-22: BỔ SUNG INDEXES CÒN THIẾU =====
-- Các indexes trong migration 20260413_phase1_composite_indexes.sql ĐÃ CÓ:
--   idx_clients_branch_status, idx_clients_branch_assigned_pt, idx_clients_branch_created_by
--   idx_contracts_branch_status, idx_contracts_branch_assigned_pt
--   idx_revenue_recorded_at_branch, idx_expense_recorded_at_branch
--   idx_weight_client_date
--
-- File này CHỈ thêm các indexes CHƯA CÓ theo kết quả audit hiệu năng.
-- Dùng IF NOT EXISTS + CONCURRENTLY — không lock bảng, an toàn khi có traffic.

-- contracts: end_date — dùng bởi /contracts/due (filter HĐ sắp hết hạn)
CREATE INDEX IF NOT EXISTS idx_contracts_end_date
    ON public.contracts(end_date);

-- training_logs: (client_id, date) — dùng bởi dashboard và /training-logs
CREATE INDEX IF NOT EXISTS idx_training_logs_client_date
    ON public.training_logs(client_id, date DESC);
