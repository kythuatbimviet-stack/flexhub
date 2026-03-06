'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchMemberships() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('memberships')
            .select(`
                *,
                branches!branch_id (
                    name
                )
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createMembership(pkg: any) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('memberships')
            .insert([pkg])
            .select()

        if (error) throw error
        revalidatePath('/packages')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateMembership(id: string, updates: any) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('memberships')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        revalidatePath('/packages')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteMembership(id: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('memberships')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/packages')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteMemberships(ids: string[]) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('memberships')
            .delete()
            .in('id', ids)

        if (error) throw error
        revalidatePath('/packages')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkCreateMemberships(pkgs: any[]) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('memberships')
            .insert(pkgs)
            .select()

        if (error) throw error
        revalidatePath('/packages')
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
