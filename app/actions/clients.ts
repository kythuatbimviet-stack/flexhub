'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchClients() {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false })

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

export async function importClients(clients: any[]) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('clients')
            .upsert(clients, { onConflict: 'id' })

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
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('clients')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Bulk Delete Clients Error:', error)
            return { success: false, error: error.message }
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
        const adminClient = await createAdminClient()

        // Auto-fetch branch_id and branch_name based on user email
        const { data: { user: authUser } } = await adminClient.auth.getUser()
        if (authUser?.email) {
            const { data: userProfile } = await adminClient
                .from('users')
                .select('branch_id, branch_name')
                .eq('email', authUser.email)
                .single()

            if (userProfile?.branch_id) {
                client.branch_id = userProfile.branch_id
            }
            if (userProfile?.branch_name) {
                client.branch_name = userProfile.branch_name
            }
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
        const adminClient = await createAdminClient()
        const now = new Date()
        const year = now.getFullYear().toString().slice(-2)      // e.g. "26"
        const month = String(now.getMonth() + 1).padStart(2, '0') // e.g. "03"

        let branchCode = '00'

        // Preference 1: Explicitly provided branch ID from the client (e.g., from user profile hook)
        if (clientBranchId) {
            branchCode = String(clientBranchId).toUpperCase()
        } else {
            // Preference 2: Fallback to checking the auth session on the server
            const { data: { user: authUser } } = await adminClient.auth.getUser()

            if (authUser?.email) {
                // Look up branch_id directly from users table — branch_id IS the branch code (text PK)
                const { data: userProfile } = await adminClient
                    .from('users')
                    .select('branch_id')
                    .eq('email', authUser.email)
                    .single()

                if (userProfile?.branch_id) {
                    branchCode = String(userProfile.branch_id).toUpperCase()
                }
            }
        }

        // Build prefix: LF-[BranchCode]-[YYMM]-
        // NOTE: Although the prompt requested LF-CN001-2603001, we format the YYMM and Seq together with a dash before YYMM and no dash before Seq: LF-CN001-2603[seq] or LF-CN001-2603-001 depending on the literal prompt: LF-[branch_id]-yymm-số thứ tự
        // The prompt examples states: LF-CN001-2603001
        const prefix = `LF-${branchCode}-${year}${month}`

        // Count existing clients with same prefix to determine next seq number
        // We need to look for IDs starting with LF-BranchCode-YYMM
        const { data: existing } = await adminClient
            .from('clients')
            .select('id')
            .like('id', `${prefix}%`)

        const seq = String((existing?.length ?? 0) + 1).padStart(3, '0')
        const newId = `${prefix}${seq}`

        return { success: true, data: newId }
    } catch (error: any) {
        console.error('Generate Client ID Error:', error)
        return { success: false, error: error.message }
    }
}
