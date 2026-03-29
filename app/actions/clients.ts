'use server'

import { createAdminClient, createClient as createSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getAccessControl, UserProfile } from '@/lib/permissions'
import { cache } from 'react'

// Dedup: cache() ensures only 1 DB call per request even if multiple actions use this
const getAccessFilter = cache(async () => {
    const supabase = await createSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return null

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()

    if (!profile) return null
    return { user: profile as UserProfile, access: getAccessControl(profile as UserProfile) }
})

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
        if (accessInfo.access.isStaffOnly) {
            query = query.or(`created_by_email.eq.${accessInfo.user.email},assigned_pt.eq.${accessInfo.user.email},pt_name.ilike.%${accessInfo.user.name}%`)
        } else if (!accessInfo.access.canViewAllBranches) {
            query = query.or(`branch_id.eq.${accessInfo.user.branch_id},created_by_email.eq.${accessInfo.user.email}`)
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
            if (accessInfo.access.isStaffOnly) {
                q = q.or(`created_by_email.eq.${accessInfo.user.email},assigned_pt.eq.${accessInfo.user.email},pt_name.ilike.%${accessInfo.user.name}%`)
            } else if (!accessInfo.access.canViewAllBranches) {
                q = q.or(`branch_id.eq.${accessInfo.user.branch_id},created_by_email.eq.${accessInfo.user.email}`)
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

        // 2. Fetch status config + main data in PARALLEL (was serial before – config blocked data)
        const [mainResult, statusConfigResult] = await Promise.all([
            dataQuery,
            adminClient.from('config_client_status').select('nam')
        ])
        const statusNames = statusConfigResult.data?.map((s: any) => s.nam) || []

        // 3. Count per status in PARALLEL (only after we know status names)
        const totalCountPromise = applyBaseFilters(adminClient.from('clients').select('*', { count: 'exact', head: true }))
        const countPromises = statusNames.map((s: string) => {
            return applyBaseFilters(adminClient.from('clients').select('*', { count: 'exact', head: true })).eq('status', s)
        })
        const countResults = await Promise.all([totalCountPromise, ...countPromises])

        const { data, error, count } = mainResult

        if (error) {
            console.error('Fetch Clients Page Error:', error)
            return { success: false, error: error.message }
        }

        // Process status counts — countResults[0] = total, [1..N] = per-status
        const statusCounts: Record<string, number> = {}
        const totalOverallCount = countResults[0].count || 0
        statusCounts['total'] = totalOverallCount
        statusNames.forEach((s: string, i: number) => {
            statusCounts[s] = countResults[i + 1].count || 0
        })

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

        // Sanitize updates to remove any legacy fields
        if (updates && typeof updates === 'object') {
            delete (updates as any).avata_url
        }

        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('clients')
            .update(updates)
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
    try {
        // [SEC] Auth check before accessing admin client
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()
        const now = new Date()
        const year = now.getFullYear().toString().slice(-2)      // e.g. "26"
        const month = String(now.getMonth() + 1).padStart(2, '0') // e.g. "03"

        let branchCode = '00'

        // Preference 1: Explicitly provided branch ID from the client (e.g., from user profile hook)
        if (clientBranchId) {
            branchCode = String(clientBranchId).toUpperCase()
        } else if (accessInfo.user.branch_id) {
            // Preference 2: Use branch_id from authenticated user profile
            branchCode = String(accessInfo.user.branch_id).toUpperCase()
        }

        // Build prefix: EF-[BranchCode]-[YYMM]-
        const prefix = `EF-${branchCode}-${year}${month}`

        // Find the latest ID with this prefix to get the highest sequence number
        const { data: latest } = await adminClient
            .from('clients')
            .select('id')
            .like('id', `${prefix}%`)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle()

        let nextSeq = 1
        if (latest && latest.id) {
            const match = latest.id.match(/\d{3}$/)
            if (match) {
                const currentSeq = parseInt(match[0], 10)
                if (!isNaN(currentSeq)) {
                    nextSeq = currentSeq + 1
                }
            }
        }

        const newId = `${prefix}${String(nextSeq).padStart(3, '0')}`

        return { success: true, data: newId }
    } catch (error: any) {
        console.error('Generate Client ID Error:', error)
        return { success: false, error: error.message }
    }
}
