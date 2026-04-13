-- ===== PHASE 4: RPC AGGREGATE FUNCTION =====
-- Thay thế N+1 COUNT queries trong fetchClientsPage bằng 1 RPC call
-- Chạy trong Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION get_client_status_counts(
    p_branch_ids    text[]   DEFAULT NULL,
    p_email         text     DEFAULT NULL,
    p_pt_name       text     DEFAULT NULL,
    p_is_staff_only boolean  DEFAULT false,
    p_search        text     DEFAULT NULL,
    p_source        text     DEFAULT NULL,
    p_reg_type      text     DEFAULT NULL
)
RETURNS TABLE(status text, cnt bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(c.status, 'Không xác định')::text AS status,
        COUNT(*)::bigint AS cnt
    FROM public.clients c
    WHERE
        -- Branch filter
        (p_branch_ids IS NULL OR c.branch_id = ANY(p_branch_ids))
        
        -- Staff-only filter: must be owner or assigned
        AND (
            NOT p_is_staff_only
            OR c.created_by_email = p_email
            OR c.assigned_pt = p_email
            OR (p_pt_name IS NOT NULL AND c.pt_name ILIKE '%' || p_pt_name || '%')
        )
        
        -- Search filter
        AND (
            p_search IS NULL
            OR p_search = ''
            OR c.member_name ILIKE '%' || p_search || '%'
            OR c.phone ILIKE '%' || p_search || '%'
            OR c.email ILIKE '%' || p_search || '%'
            OR c.id ILIKE '%' || p_search || '%'
        )
        
        -- Source filter
        AND (p_source IS NULL OR p_source = '' OR c.source = p_source)
        
        -- Registration type filter
        AND (p_reg_type IS NULL OR p_reg_type = '' OR c.registration_type = p_reg_type)
        
    GROUP BY c.status;
END;
$$;

-- Grant quyền gọi function
GRANT EXECUTE ON FUNCTION get_client_status_counts TO anon, authenticated, service_role;
