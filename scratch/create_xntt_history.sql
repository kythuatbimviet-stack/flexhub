-- Tạo bảng quản lý lịch sử gửi Xác nhận thanh toán (XNTT)
CREATE TABLE IF NOT EXISTS xntt_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id text, -- Có thể là EF-001 hoặc UUID
    client_id text REFERENCES clients(id) ON DELETE CASCADE, -- Đã sửa từ uuid thành text để khớp với bảng clients
    revenue_id text, -- Đã sửa thành text để linh hoạt với ID của bảng revenue
    email text NOT NULL,
    subject text NOT NULL,
    html_body text NOT NULL,
    send_payload text NOT NULL, -- JSON payload cho GAS Webhook
    amount numeric, -- Số tiền xác nhận
    payment_method text, -- Hình thức thanh toán
    status text DEFAULT 'pending', -- 'pending', 'done', 'error'
    created_at timestamptz DEFAULT now(),
    created_by_email text
);

-- Index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_xntt_history_client_id ON xntt_history(client_id);
CREATE INDEX IF NOT EXISTS idx_xntt_history_contract_id ON xntt_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_xntt_history_revenue_id ON xntt_history(revenue_id);
