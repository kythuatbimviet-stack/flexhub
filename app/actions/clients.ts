'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getAccessFilter } from '@/lib/access-filter'

export async function fetchClientById(id: string) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('clients')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        console.error('Fetch Client By ID Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchClients() {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()
        let query = adminClient
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false })

        // Apply RBAC filters
        if (!accessInfo.access.canViewAllBranches) {
            const allowedIds = accessInfo.access.allowedBranchIds || []
            
            if (accessInfo.access.isStaffOnly) {
                // Staff: Must be in allowed branches AND (Created by him OR Assigned to him)
                if (allowedIds.length > 0) {
                    query = query.in('branch_id', allowedIds)
                }
                const email = accessInfo.user.email
                const name = accessInfo.user.name
                query = query.or(`created_by_email.eq.${email},assigned_pt.eq.${email},pt_name.ilike.%${name}%`)
            } else {
                // Manager/BM: strictly in allowed branches
                if (allowedIds.length > 0) {
                    query = query.in('branch_id', allowedIds)
                } else {
                    query = query.eq('created_by_email', accessInfo.user.email)
                }
            }
        }

        const { data, error } = await query

        if (error) {
            console.error('Fetch Clients Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchClientsPage({
    page = 1,
    pageSize = 10,
    search = '',
    status = '',
    branch = '',
    pt = '',
    source = '',
    regType = '',
    sortKey = 'created_at',
    sortOrder = 'desc',
}: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    branch?: string
    pt?: string
    source?: string
    regType?: string
    sortKey?: string
    sortOrder?: 'asc' | 'desc'
} = {}) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()
        const isAll = pageSize === -1

        // Base filter helper (without status filter)
        const applyBaseFilters = (q: any) => {
            if (search) {
                q = q.or(`member_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,id.ilike.%${search}%`)
            }
            if (branch) q = q.eq('branch_id', branch)
            if (pt) q = q.ilike('pt_name', `%${pt}%`)
            if (source) q = q.eq('source', source)
            if (regType) q = q.eq('registration_type', regType)

            // Apply RBAC filters
            if (!accessInfo.access.canViewAllBranches) {
                const allowedIds = accessInfo.access.allowedBranchIds || []
                
                if (accessInfo.access.isStaffOnly) {
                    // Staff filters
                    if (allowedIds.length > 0) {
                        q = q.in('branch_id', allowedIds)
                    }
                    const email = accessInfo.user.email
                    const name = accessInfo.user.name
                    q = q.or(`created_by_email.eq.${email},assigned_pt.eq.${email},pt_name.ilike.%${name}%`)
                } else {
                    // Manager/BM filters
                    if (allowedIds.length > 0) {
                        q = q.in('branch_id', allowedIds)
                    } else {
                        q = q.eq('created_by_email', accessInfo.user.email)
                    }
                }
            }

            return q
        }

        // 1. Prepare Main Data Query
        let dataQuery = adminClient
            .from('clients')
            .select('*', { count: 'exact' })
            .order(sortKey || 'created_at', { ascending: sortOrder === 'asc' })

        if (!isAll) {
            const from = (page - 1) * pageSize
            const to = from + pageSize - 1
            dataQuery = dataQuery.range(from, to)
        }
        dataQuery = applyBaseFilters(dataQuery)
        if (status) dataQuery = dataQuery.eq('status', status)

        // 2. Fetch data chính + RPC status counts SONG SONG
        const [mainResult, statusCountResult] = await Promise.all([
            dataQuery,
            adminClient.rpc('get_client_status_counts', {
                p_branch_ids: accessInfo.access.allowedBranchIds?.length
                    ? accessInfo.access.allowedBranchIds
                    : null,
                p_email: accessInfo.user.email,
                p_pt_name: accessInfo.user.name,
                p_is_staff_only: accessInfo.access.isStaffOnly,
                p_search: search || null,
                p_source: source || null,
                p_reg_type: regType || null,
            })
        ])

        const { data, error, count } = mainResult

        if (error) {
            console.error('Fetch Clients Page Error:', error)
            return { success: false, error: error.message }
        }

        // Build statusCounts từ RPC result
        const statusCounts: Record<string, number> = { total: 0 }
        if (statusCountResult.data) {
            statusCountResult.data.forEach((row: { status: string; cnt: number }) => {
                statusCounts[row.status] = Number(row.cnt)
                statusCounts['total'] = (statusCounts['total'] || 0) + Number(row.cnt)
            })
        }

        return {
            success: true,
            data,
            count: count ?? 0,
            statusCounts
        }
    } catch (error: any) {
        console.error('Unexpected Fetch Clients Page Error:', error)
        return { success: false, error: error.message }
    }
}

export async function importClients(clients: any[]) {
    try {
        // [SEC] Auth check before bulk import
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // Sanitize every client in the array
        const sanitizedClients = clients.map(c => {
            const sanitized = { ...c }
            delete sanitized.avata_url
            return sanitized
        })

        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('clients')
            .upsert(sanitizedClients, { onConflict: 'id' })

        if (error) {
            console.error('Import Clients Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/clients')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Import Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteClients(ids: string[]) {
    try {
        // [SEC] Auth check before bulk delete
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()

        // 1. Delete associated data first to avoid foreign key violations
        // Note: Delete debt_installments first as they may point to revenue or debts
        const { data: debts } = await adminClient.from('debts').select('id').in('client_id', ids)
        const debtIds = debts?.map(d => d.id) || []
        
        if (debtIds.length > 0) {
            await adminClient.from('debt_installments').delete().in('debt_id', debtIds)
        }

        // Clear revenue references in debt_installments before deleting revenue
        const { data: revenues } = await adminClient.from('revenue').select('id').in('customer_id', ids)
        const revenueIds = revenues?.map(r => r.id) || []
        
        if (revenueIds.length > 0) {
            await adminClient.from('debt_installments').update({ revenue_id: null }).in('revenue_id', revenueIds)
            await adminClient.from('revenue').delete().in('id', revenueIds)
        }
        
        // Delete debts associated with these clients
        if (debtIds.length > 0) {
            await adminClient.from('debts').delete().in('id', debtIds)
        }
        
        // Delete contracts associated with these clients
        await adminClient.from('contracts').delete().in('client_id', ids)

        // 2. Finally delete the clients
        const { data, error } = await adminClient
            .from('clients')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Bulk Delete Clients Error:', error)
            return { success: false, error: 'Lỗi khi xóa khách hàng: ' + error.message }
        }

        revalidatePath('/clients')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Bulk Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateClient(id: string, updates: any) {
    try {
        // [SEC] Auth check before update
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // CHỈ định nghĩa các trường được phép cập nhật để bảo vệ tuyệt đối Ngày tạo (created_at)
        const safeUpdates: any = {}
        const allowedFields = [
            'member_name', 'phone', 'email', 'address', 'dob', 'age', 'gender',
            'height', 'weight', 'target_weight', 'goal', 'status', 'pt_name',
            'assigned_pt', 'branch_id', 'branch_name', 'source', 'referrer',
            'registration_type', 'medical_history', 'training_time', 'notes',
            'customer_cycle', 'zalo_id', 'facebook_id', 'action_log', 'signature_url',
            'status_reason',
            'survey_training_history', 'survey_injury_history', 'survey_work_stress', 
            'survey_pathology_details', 'survey_health_advice'
        ]

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                safeUpdates[field] = updates[field]
            }
        })

        // Luôn cập nhật thời gian sửa đổi, KHÔNG chạm vào created_at
        safeUpdates.updated_at = new Date().toISOString()

        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('clients')
            .update(safeUpdates)
            .eq('id', id)

        if (error) {
            console.error('Update Client Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/clients')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Update Error:', error)
        return { success: false, error: error.message }
    }
}

export async function createClient(client: any) {
    try {
        // [SEC] Auth check before create
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()

        // Auto-set created_by_email and branch from authenticated user profile
        client.created_by_email = accessInfo.user.email
        if (accessInfo.user.branch_id) {
            client.branch_id = accessInfo.user.branch_id
        }
        if ((accessInfo.user as any).branch_name) {
            client.branch_name = (accessInfo.user as any).branch_name
        }

        // Sanitize client object
        if (client && typeof client === 'object') {
            delete (client as any).avata_url
        }

        // Cấp mã nếu là tự động
        if (!client.id || client.id === '(Tự động)') {
            const { data: newId, error: rpcError } = await adminClient.rpc('fn_generate_next_id', {
                p_branch_id: client.branch_id,
                p_type: 'client',
                p_prefix: 'EF'
            })
            if (rpcError) throw new Error('Lỗi cấp phát mã khách hàng: ' + rpcError.message)
            client.id = newId
        }

        const { data, error } = await adminClient
            .from('clients')
            .insert(client)

        if (error) {
            console.error('Create Client Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/clients')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Create Error:', error)
        return { success: false, error: error.message }
    }
}

export async function generateClientId(clientBranchId?: string | null) {
    // Trả về placeholder, mã thật sẽ được cấp khi lưu xuống database
    return { success: true, data: '(Tự động)' }
}

/**
 * Fetch filter options (PTs list) based on user permissions
 * ONLY from the users table as requested.
 * Filtered by department = 'PT'.
 */
export async function fetchClientFilterOptions() {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()

        // Fetch users from 'users' table where department is 'PT'
        let query = adminClient
            .from('users')
            .select('name, branch_id, department')
            .eq('department', 'PT')
            .not('name', 'is', null)

        // Apply Branch restrictions from RBAC
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            query = query.in('branch_id', accessInfo.access.allowedBranchIds)
        }

        const { data: userData, error: userError } = await query
        if (userError) throw userError

        const pts = userData
            ?.filter(u => u.name && u.name.trim().length > 0)
            .map(u => ({ 
                name: u.name.trim(), 
                branch_id: u.branch_id 
            })) || []

        return {
            success: true,
            data: {
                pts: pts,
                isStaffOnly: accessInfo.access.isStaffOnly,
                userEmail: accessInfo.user.email,
                userName: accessInfo.user.name
            }
        }
    } catch (error: any) {
        console.error('Fetch Filter Options Error:', error)
        return { success: false, error: error.message }
    }
}
