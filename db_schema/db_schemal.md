-- 1. Bảng Khách hàng
CREATE TABLE customers (
    id TEXT PRIMARY KEY, -- Mã khách hàng
    name TEXT NOT NULL,
    shipping_address TEXT,
    phone TEXT,
    email TEXT,
    tax_code TEXT,
    company_name TEXT,
    tax_address TEXT,
    legal_rep TEXT,
    position TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng Danh mục
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon_url TEXT,
    unit TEXT,
    grain TEXT,
    thickness TEXT,
    avg_size TEXT,
    finishing TEXT,
    material_origin TEXT,
    country_origin TEXT,
    price_list_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Sản phẩm (Master)
CREATE TABLE items (
    id TEXT PRIMARY KEY, -- Item ID
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category_id TEXT REFERENCES categories(id),
    vendor_id TEXT, -- Sẽ liên kết bảng NCC nếu có
    cost_price NUMERIC DEFAULT 0,
    selling_price NUMERIC DEFAULT 0,
    unit TEXT,
    grain TEXT,
    thickness TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Kho hàng
CREATE TABLE warehouses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng Tồn kho (Từng tấm da)
CREATE TABLE inventory (
    id TEXT PRIMARY KEY, -- Inventory ID / Barcode
    item_id TEXT REFERENCES items(id),
    sku TEXT, -- SKU định danh tấm (Ví dụ: AR154M-0)
    amount NUMERIC NOT NULL, -- Diện tích tấm (sqft hoặc m2)
    unit TEXT,
    status TEXT DEFAULT 'Còn hàng', -- Còn hàng, Đã bán, Giữ chỗ
    is_defect BOOLEAN DEFAULT FALSE, -- Lỗ gù
    warehouse_id TEXT REFERENCES warehouses(id),
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng Báo giá
CREATE TABLE quotations (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    file_url TEXT,
    discount_rate NUMERIC DEFAULT 0,
    vat_rate NUMERIC DEFAULT 0,
    extra_fee NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Mới',
    created_by TEXT,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Bảng Đơn hàng
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    quotation_id TEXT REFERENCES quotations(id),
    delivery_note_url TEXT, -- Phiếu xuất kho
    invoice_url TEXT, -- Invoice
    contract_url TEXT, -- Hợp đồng kinh tế
    discount_amount NUMERIC DEFAULT 0,
    deposit_amount NUMERIC DEFAULT 0,
    vat_rate NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Chờ xử lý',
    created_by TEXT,
    exported_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bảng Kiện hàng
CREATE TABLE packages (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id),
    package_name TEXT, -- Kiện 01, Kiện 02
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Chi tiết sản phẩm trong đơn hàng (Liên kết với từng tấm trong kho)
CREATE TABLE order_items (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES orders(id),
    inventory_id TEXT REFERENCES inventory(id),
    package_id TEXT REFERENCES packages(id),
    unit_price NUMERIC DEFAULT 0,
    quantity NUMERIC, -- Diện tích thực tế tấm đó
    total_price NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Quản lý Mẫu
CREATE TABLE sample_catalogues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sample_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalogue_id TEXT REFERENCES sample_catalogues(id),
    customer_id TEXT REFERENCES customers(id),
    status TEXT,
    note TEXT,
    sender_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);