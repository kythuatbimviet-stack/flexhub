'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type ConfigItem = {
    id: number
    nam: string
    value: number
    is_default: boolean
}

export async function fetchConfigParams(tableName: string) {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('value', { ascending: true })

        if (error) throw error
        return { success: true, data: data as ConfigItem[] }
    } catch (error: any) {
        console.error(`Error fetching from ${tableName}:`, error)
        return { success: false, error: error.message }
    }
}

export async function createConfigParam(tableName: string, data: Partial<ConfigItem>) {
    try {
        const supabase = await createAdminClient()
        const { error } = await supabase
            .from(tableName)
            .insert([data])

        if (error) throw error
        revalidatePath('/config-params')
        return { success: true }
    } catch (error: any) {
        console.error(`Error creating in ${tableName}:`, error)
        return { success: false, error: error.message }
    }
}

export async function updateConfigParam(tableName: string, id: number, data: Partial<ConfigItem>) {
    try {
        const supabase = await createAdminClient()
        const { error } = await supabase
            .from(tableName)
            .update(data)
            .eq('id', id)

        if (error) throw error
        revalidatePath('/config-params')
        return { success: true }
    } catch (error: any) {
        console.error(`Error updating in ${tableName}:`, error)
        return { success: false, error: error.message }
    }
}

export async function deleteConfigParam(tableName: string, id: number) {
    try {
        const supabase = await createAdminClient()
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/config-params')
        return { success: true }
    } catch (error: any) {
        console.error(`Error deleting from ${tableName}:`, error)
        return { success: false, error: error.message }
    }
}
export async function fetchClientConfigs() {
    try {
        const supabase = await createAdminClient()

        // Fetch all client-related tables in parallel
        const [
            statusRes,
            sourceRes,
            goalRes,
            timeRes,
            regTypeRes
        ] = await Promise.all([
            supabase.from('config_client_status').select('*').order('value', { ascending: true }),
            supabase.from('config_client_source').select('*').order('value', { ascending: true }),
            supabase.from('config_client_goal').select('*').order('value', { ascending: true }),
            supabase.from('config_client_training_time').select('*').order('value', { ascending: true }),
            supabase.from('config_client_registration_type').select('*').order('value', { ascending: true })
        ])

        if (statusRes.error) throw statusRes.error

        return {
            success: true,
            data: {
                statuses: statusRes.data as ConfigItem[],
                sources: sourceRes.data as ConfigItem[] || [],
                goals: goalRes.data as ConfigItem[] || [],
                trainingTimes: timeRes.data as ConfigItem[] || [],
                registrationTypes: regTypeRes.data as ConfigItem[] || []
            }
        }
    } catch (error: any) {
        console.error('Error fetching client configs:', error)
        return { success: false, error: error.message }
    }
}
