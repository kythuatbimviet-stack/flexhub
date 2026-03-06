'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchContracts() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('contracts')
            .select(`
                *,
                clients (member_name, phone),
                branches (name)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createContract(contract: any) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('contracts')
            .insert([contract])
            .select()

        if (error) throw error
        revalidatePath('/contracts')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateContract(id: string, updates: any) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('contracts')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        revalidatePath('/contracts')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteContract(id: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/contracts')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteContracts(ids: string[]) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .in('id', ids)

        if (error) throw error
        revalidatePath('/contracts')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function importContracts(contracts: any[]) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('contracts')
            .insert(contracts)
            .select()

        if (error) throw error
        revalidatePath('/contracts')
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
