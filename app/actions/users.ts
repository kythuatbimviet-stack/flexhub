'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { isAdmin, getAccessControl, UserProfile } from '@/lib/permissions'

async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return false

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()

    if (!profile) return false
    return isAdmin(profile as UserProfile)
}

export async function fetchUsers() {
    const supabase = await createClient()
    try {
        // [SEC] Require authentication and apply branch-level access control
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser?.email) return { success: false, error: 'Unauthorized' }

        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .maybeSingle()

        if (!profile) return { success: false, error: 'Unauthorized' }
        const access = getAccessControl(profile as UserProfile)

        let query = supabase
            .from('users')
            .select(`
                *,
                branches (name)
            `)
            .order('created_at', { ascending: false })

        // Apply RBAC filters
        if (!access.canViewAllBranches && access.allowedBranchIds) {
            query = query.in('branch_id', access.allowedBranchIds)
        }

        const { data, error } = await query
        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createUser(user: any) {
    if (!(await checkAdmin())) return { success: false, error: 'Chỉ Admin mới có quyền tạo người dùng' }
    const supabase = await createClient()
    try {
        const validColumns = [
            'email', 'name', 'phone', 'branch_id', 'branch_name', 
            'position', 'department', 'permissions', 'direct_manager', 
            'avatar_url', 'status', 'managed_branches'
        ]
        
        const sanitizedUser = Object.keys(user)
            .filter(key => validColumns.includes(key))
            .reduce((obj: any, key) => {
                if (key === 'managed_branches' && Array.isArray(user[key])) {
                    obj[key] = JSON.stringify(user[key])
                } else {
                    obj[key] = user[key]
                }
                return obj
            }, {})

        const { data, error } = await supabase
            .from('users')
            .insert([sanitizedUser])
            .select()

        if (error) throw error
        revalidatePath('/users')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateUser(id: string, updates: any) {
    if (!(await checkAdmin())) return { success: false, error: 'Chỉ Admin mới có quyền cập nhật người dùng' }
    const supabase = await createClient()
    try {
        const validColumns = [
            'email', 'name', 'phone', 'branch_id', 'branch_name', 
            'position', 'department', 'permissions', 'direct_manager', 
            'avatar_url', 'status', 'managed_branches'
        ]
        
        const sanitizedUpdates = Object.keys(updates)
            .filter(key => validColumns.includes(key))
            .reduce((obj: any, key) => {
                if (key === 'managed_branches' && Array.isArray(updates[key])) {
                    obj[key] = JSON.stringify(updates[key])
                } else {
                    obj[key] = updates[key]
                }
                return obj
            }, {})

        const { data, error } = await supabase
            .from('users')
            .update(sanitizedUpdates)
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
    if (!(await checkAdmin())) return { success: false, error: 'Chỉ Admin mới có quyền xóa người dùng' }
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
    if (!(await checkAdmin())) return { success: false, error: 'Chỉ Admin mới có quyền xóa người dùng' }
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
    if (!(await checkAdmin())) return { success: false, error: 'Chỉ Admin mới có quyền tạo người dùng' }
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
            .maybeSingle()

        if (error) return { success: false, error: 'User profile not found' }
        return { success: true, data: data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function fetchUserByEmail(email: string) {
    const supabase = await createClient()
    try {
        // [SEC] Require authentication before looking up any user by email
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser?.email) return { success: false, error: 'Unauthorized' }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle()

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
