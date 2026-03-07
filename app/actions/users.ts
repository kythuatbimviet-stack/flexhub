'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchUsers() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                branches (name)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createUser(user: any) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([user])
            .select()

        if (error) throw error
        revalidatePath('/users')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateUser(id: string, updates: any) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        revalidatePath('/users')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteUser(id: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/users')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteUsers(ids: string[]) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .in('id', ids)

        if (error) throw error
        revalidatePath('/users')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkCreateUsers(users: any[]) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('users')
            .insert(users)
            .select()

        if (error) throw error
        revalidatePath('/users')
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function fetchCurrentUserProfile() {
    const supabase = await createClient()
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { success: false, error: 'Not authenticated' }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()

        if (error) return { success: false, error: 'User profile not found' }
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
