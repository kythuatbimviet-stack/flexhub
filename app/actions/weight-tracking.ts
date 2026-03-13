'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchWeightRecords() {
    try {
        const supabase = await createClient()
        // Try simple select first to see if data flows at all
        const { data, error } = await supabase
            .from('weight_tracking')
            .select('*')
            .order('measurement_date', { ascending: false })

        if (error) {
            console.error('Fetch Weight Records Error:', error)
            return { success: false, error: `${error.code}: ${error.message} - ${error.details}` }
        }

        // If simple select works, try to fetch joined data manually or in next step
        // For now, let's see if we get ANY data
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function createWeightRecord(record: any) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('weight_tracking')
            .insert(record)

        if (error) {
            console.error('Create Weight Record Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/weight-tracking')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Create Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateWeightRecord(id: string, updates: any) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('weight_tracking')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Update Weight Record Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/weight-tracking')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Update Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteWeightRecord(id: string) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('weight_tracking')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete Weight Record Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/weight-tracking')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteBulkWeightRecords(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('weight_tracking')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Delete Bulk Weight Records Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/weight-tracking')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Bulk Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function fetchWeightChartData(clientId: string) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('weight_tracking')
            .select('measurement_date, weight')
            .eq('client_id', clientId)
            .order('measurement_date', { ascending: true })

        if (error) {
            console.error('Fetch Chart Data Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Chart Data Fetch Error:', error)
        return { success: false, error: error.message }
    }
}
export async function upsertWeightRecord(clientId: string, date: string, field: 'weight' | 'height', value: number, contractId?: string | null) {
    try {
        const adminClient = await createAdminClient()

        // Check if record exists for this client and date
        const { data: existing, error: fetchError } = await adminClient
            .from('weight_tracking')
            .select('id')
            .eq('client_id', clientId)
            .eq('measurement_date', date)
            .maybeSingle()

        if (fetchError) throw fetchError

        if (existing) {
            // Update
            const { error: updateError } = await adminClient
                .from('weight_tracking')
                .update({ [field]: value })
                .eq('id', existing.id)
            if (updateError) throw updateError
        } else {
            // Insert
            const { error: insertError } = await adminClient
                .from('weight_tracking')
                .insert({
                    id: crypto.randomUUID(),
                    client_id: clientId,
                    contract_id: contractId,
                    measurement_date: date,
                    [field]: value
                })
            if (insertError) throw insertError
        }

        revalidatePath('/weight-tracking')
        return { success: true }
    } catch (error: any) {
        console.error('Upsert Weight Record Error:', error)
        return { success: false, error: error.message }
    }
}
