'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchClientInBodyRecords(clientId: string) {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('client_inbody_records')
            .select('*')
            .eq('client_id', clientId)
            .order('recorded_at', { ascending: false })

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchAllInBodyRecords() {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('client_inbody_records')
            .select(`
                *,
                clients (id, member_name, phone)
            `)
            .order('recorded_at', { ascending: false })

        if (error) {
            console.error('Fetch All InBody Records Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function createInBodyRecord(record: any) {
    try {
        const adminClient = await createAdminClient()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const finalRecord = {
            ...record,
            id: record.id || crypto.randomUUID(),
            created_by: user?.email || record.created_by || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            recorded_at: record.recorded_at || new Date().toISOString()
        }

        const { data, error } = await adminClient
            .from('client_inbody_records')
            .insert(finalRecord)
            .select()
            .single()

        if (error) {
            console.error('Create InBody Record Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/clients')
        revalidatePath('/inbody')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Create Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateInBodyRecord(id: string, updates: any) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('client_inbody_records')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Update InBody Record Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/clients')
        revalidatePath('/inbody')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Update Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteInBodyRecord(id: string) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('client_inbody_records')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete InBody Record Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/clients')
        revalidatePath('/inbody')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchInBodyRecordById(id: string) {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('client_inbody_records')
            .select(`
                *,
                clients (id, member_name, phone)
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Fetch InBody Record By Id Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteInBodyRecords(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('client_inbody_records')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Bulk Delete InBody Records Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/clients')
        revalidatePath('/inbody')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Bulk Delete Error:', error)
        return { success: false, error: error.message }
    }
}
