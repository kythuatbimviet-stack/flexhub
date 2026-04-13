-- ===== PHASE 1: COMPOSITE INDEXES =====
-- Chạy toàn bộ block này cùng lúc trong Supabase SQL Editor

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_branch_status 
    ON public.clients(branch_id, status);

CREATE INDEX IF NOT EXISTS idx_clients_branch_assigned_pt 
    ON public.clients(branch_id, assigned_pt);

CREATE INDEX IF NOT EXISTS idx_clients_branch_created_by 
    ON public.clients(branch_id, created_by_email);

-- contracts
CREATE INDEX IF NOT EXISTS idx_contracts_branch_status 
    ON public.contracts(branch_id, status);

CREATE INDEX IF NOT EXISTS idx_contracts_branch_assigned_pt 
    ON public.contracts(branch_id, assigned_pt);

-- revenue
CREATE INDEX IF NOT EXISTS idx_revenue_recorded_at_branch 
    ON public.revenue(recorded_at, branch_id);

-- expense
CREATE INDEX IF NOT EXISTS idx_expense_recorded_at_branch 
    ON public.expense(recorded_at, branch_id);

-- weight_tracking
CREATE INDEX IF NOT EXISTS idx_weight_client_date 
    ON public.weight_tracking(client_id, measurement_date);
