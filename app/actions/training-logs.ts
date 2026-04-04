'use server'

import { createAdminClient, createClient as createSupabaseClient } from '@/lib/supabase-server'
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

export async function fetchTrainingLogsSummary({
    startDate,
    endDate,
    branchId,
    ptName,
    clientSearch,
    page = 1,
    pageSize = 20
}: {
    startDate?: string
    endDate?: string
    branchId?: string
    ptName?: string
    clientSearch?: string
    page?: number
    pageSize?: number
} = {}) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()
        
        // 1. Build client query first (filtered)
        let clientQuery = adminClient
            .from('clients')
            .select('*', { count: 'exact' })
        
        if (branchId && branchId !== 'all') {
            clientQuery = clientQuery.eq('branch_id', branchId)
        }
        
        if (ptName && ptName !== 'all') {
            clientQuery = clientQuery.ilike('pt_name', `%${ptName}%`)
        }

        if (clientSearch) {
            clientQuery = clientQuery.ilike('member_name', `%${clientSearch}%`)
        }

        // Apply RBAC filters to clients
        if (!accessInfo.access.canViewAllBranches) {
            const allowedIds = accessInfo.access.allowedBranchIds || []
            if (allowedIds.length > 0) {
                clientQuery = clientQuery.in('branch_id', allowedIds)
            }
        }

        // Paginate clients
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        
        const { data: clients, count: totalClients, error: clientError } = await clientQuery
            .order('member_name', { ascending: true })
            .range(from, to)

        if (clientError) throw clientError

        if (!clients || clients.length === 0) {
            return { success: true, data: [], total: 0 }
        }

        // 2. Fetch logs summary for these clients only
        const clientIds = clients.map(c => c.id)
        let logsQuery = adminClient
            .from('training_logs')
            .select('client_id, status')
            .in('client_id', clientIds)
        
        if (startDate) logsQuery = logsQuery.gte('date', startDate)
        if (endDate) logsQuery = logsQuery.lte('date', endDate)

        const { data: logs, error: logsError } = await logsQuery

        if (logsError) throw logsError

        // 3. Aggregate logs by client
        const clientSummaries = clients.map(client => {
            const clientLogs = (logs || []).filter(l => l.client_id === client.id)
            return {
                clientId: client.id,
                client: {
                    member_name: client.member_name,
                    branch_id: client.branch_id,
                    pt_name: client.pt_name
                },
                stats: {
                    y: clientLogs.filter(l => l.status === 'Y').length,
                    n: clientLogs.filter(l => l.status === 'N').length,
                    td: clientLogs.filter(l => l.status === 'TĐ').length
                }
            }
        })

        return { 
            success: true, 
            data: clientSummaries, 
            total: totalClients || 0 
        }
    } catch (error: any) {
        console.error('Fetch Training Logs Summary Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchTotalTrainingStats({
    startDate,
    endDate,
    branchId,
    ptName,
    clientSearch
}: {
    startDate?: string
    endDate?: string
    branchId?: string
    ptName?: string
    clientSearch?: string
} = {}) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()
        
        // This is tricky because we need to filter training_logs by client filters
        // If there are many clients, we might need a more efficient way.
        // But for statistics, let's join training_logs with clients!inner
        
        let query = adminClient
            .from('training_logs')
            .select(`
                status,
                client:clients!inner (
                    branch_id,
                    pt_name,
                    member_name
                )
            `)

        if (startDate) query = query.gte('date', startDate)
        if (endDate) query = query.lte('date', endDate)
        
        if (branchId && branchId !== 'all') {
            query = query.filter('client.branch_id', 'eq', branchId)
        }
        
        if (ptName && ptName !== 'all') {
            query = query.filter('client.pt_name', 'ilike', `%${ptName}%`)
        }

        if (clientSearch) {
            query = query.filter('client.member_name', 'ilike', `%${clientSearch}%`)
        }

        // RBAC
        if (!accessInfo.access.canViewAllBranches) {
            const allowedIds = accessInfo.access.allowedBranchIds || []
            if (allowedIds.length > 0) {
                query = query.filter('client.branch_id', 'in', `(${allowedIds.join(',')})`)
            }
        }

        const { data, error } = await query

        if (error) throw error

        const stats = {
            total: data?.length || 0,
            y: data?.filter(l => l.status === 'Y').length || 0,
            n: data?.filter(l => l.status === 'N').length || 0,
            td: data?.filter(l => l.status === 'TĐ').length || 0
        }

        return { success: true, stats }
    } catch (error: any) {
        console.error('Fetch Total Training Stats Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchClientLogsInRange(clientId: string, startDate?: string, endDate?: string) {
    try {
        const adminClient = await createAdminClient()
        let query = adminClient
            .from('training_logs')
            .select('*')
            .eq('client_id', clientId)
            .order('date', { ascending: false })
            .order('updated_at', { ascending: false })

        if (startDate) query = query.gte('date', startDate)
        if (endDate) query = query.lte('date', endDate)

        const { data, error } = await query
        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('Fetch Client Logs In Range Error:', error)
        return { success: false, error: error.message }
    }
}

// Keep legacy for backward compatibility if needed, but updated to use summary logic if possible
// Or just keep it as is for now while migrating. 
// Actually, it's better to refactor the page first.
export async function fetchTrainingLogsReport(params: any) {
    // Legacy support: fetch everything (might be slow but functionally correct)
    // We'll replace its usage in the page.tsx
    return fetchTrainingLogsSummary({ ...params, pageSize: 1000 }) 
}
