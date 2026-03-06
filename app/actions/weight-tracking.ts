'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchWeightRecords() {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('weight_tracking')
            .select(`
                *,
                clients (
                    member_name
                ),
                contracts (
                    registration_type
                )
            `)
            .order('measurement_date', { ascending: false })

        if (error) {
            console.error('Fetch Weight Records Error:', error)
            return { success: false, error: error.message }
        }

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
