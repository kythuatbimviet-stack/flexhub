'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getAccessFilter } from '@/lib/access-filter'

export async function fetchHealthProfiles() {
    try {
        const adminClient = await createAdminClient()
        const accessInfo = await getAccessFilter()
        
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        let query = adminClient
            .from('health_profiles')
            .select(`
                *,
                contracts!inner (
                    id, client_id, branch_id, trainer_name, assigned_pt,
                    clients (member_name, phone)
                )
            `)

        // [SEC] Apply RBAC filters consistent with contracts/clients
        if (!accessInfo.access.canViewAllBranches) {
            const allowedIds = accessInfo.access.allowedBranchIds || []
            if (allowedIds.length > 0) {
                // Filter health profiles by the branch of their associated contract
                query = query.in('contracts.branch_id', allowedIds)
            } else {
                // Fallback: restrict to records created by the user
                query = query.eq('created_by', accessInfo.user.email)
            }
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Fetch Health Profiles Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function createHealthProfile(profile: any) {
    try {
        const adminClient = await createAdminClient()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const finalProfile = {
            ...profile,
            id: profile.id || crypto.randomUUID(),
            created_by: user?.email || profile.created_by || null,
            created_at: profile.created_at || new Date().toISOString()
        }

        const { data, error } = await adminClient
            .from('health_profiles')
            .insert(finalProfile)
            .select()
            .single()

        if (error) {
            console.error('Create Health Profile Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/health-profiles')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Create Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateHealthProfile(id: string, updates: any) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('health_profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Update Health Profile Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/health-profiles')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Update Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteHealthProfile(id: string) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('health_profiles')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete Health Profile Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/health-profiles')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function importHealthProfiles(profiles: any[]) {
    try {
        const adminClient = await createAdminClient()
        
        const { data, error } = await adminClient
            .from('health_profiles')
            .insert(profiles)
            .select()

        if (error) {
            console.error('Bulk Import Health Profiles Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/health-profiles')
        return { success: true, count: data.length }
    } catch (error: any) {
        console.error('Unexpected Import Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteHealthProfiles(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('health_profiles')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Bulk Delete Health Profiles Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/health-profiles')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Bulk Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchLatestHealthProfileForClient(clientId: string) {
    try {
        const adminClient = await createAdminClient()
        
        const { data, error } = await adminClient
            .from('health_profiles')
            .select(`
                *,
                contracts!inner (
                    id, client_id
                )
            `)
            .eq('contracts.client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('Fetch Latest Health Profile Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Latest Error:', error)
        return { success: false, error: error.message }
    }
}
