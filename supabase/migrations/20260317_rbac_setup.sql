-- Add created_by_email column to clients and contracts tables
-- to support Role-Based Access Control (RBAC) filtering for Staff role.

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_by_email TEXT;

-- Update existing records to have a default value (optional, e.g., set to an admin email)
-- UPDATE public.clients SET created_by_email = 'admin@example.com' WHERE created_by_email IS NULL;
-- UPDATE public.contracts SET created_by_email = 'admin@example.com' WHERE created_by_email IS NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_clients_created_by_email ON public.clients(created_by_email);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by_email ON public.contracts(created_by_email);
