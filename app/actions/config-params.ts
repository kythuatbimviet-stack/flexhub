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

export async function deleteBulkConfigParams(tableName: string, ids: number[]) {
    try {
        const supabase = await createAdminClient()
        const { error } = await supabase
            .from(tableName)
            .delete()
            .in('id', ids)

        if (error) throw error
        revalidatePath('/config-params')
        return { success: true }
    } catch (error: any) {
        console.error(`Error bulk deleting from ${tableName}:`, error)
        return { success: false, error: error.message }
    }
}
const ALL_CONFIG_TABLES = [
    'config_client_goal',
    'config_client_registration_type',
    'config_client_source',
    'config_client_status',
    'config_client_training_time',
    'config_contract_source',
    'config_contract_status',
    'config_contract_trainer_type',
    'config_contract_type',
    'config_event_group',
    'config_expense_status',
    'config_finance_bank_account',
    'config_finance_ewallet',
    'config_finance_expense_type',
    'config_finance_income_type',
    'config_finance_payment_method',
] as const

export type AllConfigs = Record<typeof ALL_CONFIG_TABLES[number], ConfigItem[]>

export async function fetchAllConfigs(): Promise<{ success: boolean; data?: AllConfigs; error?: string }> {
    try {
        const supabase = await createAdminClient()
        const results = await Promise.all(
            ALL_CONFIG_TABLES.map(t => supabase.from(t).select('*').order('value', { ascending: true }))
        )
        const data = {} as AllConfigs
        ALL_CONFIG_TABLES.forEach((table, i) => {
            data[table] = (results[i].data as ConfigItem[]) || []
        })
        return { success: true, data }
    } catch (error: any) {
        console.error('Error fetching all configs:', error)
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

export async function fetchContractConfigs() {
    try {
        const supabase = await createAdminClient()

        const { data, error } = await supabase
            .from('config_contract_status')
            .select('*')
            .order('value', { ascending: true })

        if (error) throw error

        return {
            success: true,
            data: {
                statuses: data as ConfigItem[]
            }
        }
    } catch (error: any) {
        console.error('Error fetching contract configs:', error)
        return { success: false, error: error.message }
    }
}
