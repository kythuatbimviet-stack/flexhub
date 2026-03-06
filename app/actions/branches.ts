'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchBranches() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('branches')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createBranch(branch: any) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('branches')
            .insert([branch])
            .select()

        if (error) throw error
        revalidatePath('/branches')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateBranch(id: string, updates: any) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('branches')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        revalidatePath('/branches')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteBranch(id: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('branches')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/branches')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteBranches(ids: string[]) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('branches')
            .delete()
            .in('id', ids)

        if (error) throw error
        revalidatePath('/branches')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkCreateBranches(branches: any[]) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('branches')
            .insert(branches)
            .select()

        if (error) throw error
        revalidatePath('/branches')
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
