'use server'

import { createAdminClient, createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchZaloUsers() {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('zalo_users')
            .select('*')
            .order('last_interaction_date', { ascending: false })

        if (error) {
            console.error('Fetch Zalo Users Error:', error)
            return { success: false, error: error.message }
        }
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateZaloUser(id: string, updates: any) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('zalo_users')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        revalidatePath('/zalo-users')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteZaloUser(id: string) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('zalo_users')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/zalo-users')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteZaloUsers(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('zalo_users')
            .delete()
            .in('id', ids)

        if (error) throw error
        revalidatePath('/zalo-users')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
