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

export async function fetchTrainingLogsReport({
    startDate,
    endDate,
    branchId,
    ptName,
    status,
    clientSearch
}: {
    startDate?: string
    endDate?: string
    branchId?: string
    ptName?: string
    status?: string
    clientSearch?: string
} = {}) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()
        
        // Build the query and join with clients
        let query = adminClient
            .from('training_logs')
            .select(`
                *,
                client:clients (
                    member_name,
                    branch_id,
                    pt_name
                )
            `)
            .order('date', { ascending: false })
            .order('updated_at', { ascending: false })

        // Apply Date Filters
        if (startDate) query = query.gte('date', startDate)
        if (endDate) query = query.lte('date', endDate)
        if (status) query = query.eq('status', status)

        // Apply RBAC filters & Client filters
        // Note: Joining filters on joined table in Supabase requires slightly different syntax
        // But since we are filtering the results, we can filter by the client table fields if they match
        
        if (branchId) {
            query = query.filter('client.branch_id', 'eq', branchId)
        }
        
        if (ptName) {
            query = query.filter('client.pt_name', 'ilike', `%${ptName}%`)
        }

        if (clientSearch) {
            query = query.filter('client.member_name', 'ilike', `%${clientSearch}%`)
        }

        // RBAC: Same logic as clients
        if (!accessInfo.access.canViewAllBranches) {
            const allowedIds = accessInfo.access.allowedBranchIds || []
            
            if (accessInfo.access.isStaffOnly) {
                // For training logs, we only show logs of clients this staff can see
                const email = accessInfo.user.email
                const name = accessInfo.user.name
                
                // Staff see clients in allowed branches AND associated with them
                if (allowedIds.length > 0) {
                    query = query.filter('client.branch_id', 'in', `(${allowedIds.join(',')})`)
                }
                
                // This complex OR filter across joined tables is tricky in Supabase's Postgrest
                // We might need to handle this via a RPC or filter the client list first.
                // For now, let's try the direct join filter if supported, or filter client specifically.
            } else {
                // Manager/BM: strictly in allowed branches
                if (allowedIds.length > 0) {
                    query = query.filter('client.branch_id', 'in', `(${allowedIds.join(',')})`)
                }
            }
        }

        const { data, error } = await query

        if (error) {
            console.error('Fetch Training Logs Report Error:', error)
            return { success: false, error: error.message }
        }

        // Calculate statistics
        const stats = {
            total: data?.length || 0,
            y: data?.filter(l => l.status === 'Y').length || 0,
            n: data?.filter(l => l.status === 'N').length || 0,
            td: data?.filter(l => l.status === 'TĐ').length || 0
        }

        return { success: true, data, stats }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}
