'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { isAdmin, UserProfile } from '@/lib/permissions'
import { getAccessFilter } from '@/lib/access-filter'

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
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()
        let query = supabase
            .from('users')
            .select(`
                *,
                branches (name)
            `)
            .order('created_at', { ascending: false })

        // Apply RBAC filters
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            query = query.in('branch_id', accessInfo.access.allowedBranchIds)
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
            'avatar_url', 'status', 'managed_branches', 'dob', 'age'
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
    const supabase = await createClient()
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return { success: false, error: 'Unauthorized' }

        // 1. Get the current state of the record being updated
        const adminClient = await createAdminClient()
        const { data: currentRecord } = await adminClient
            .from('users')
            .select('email, permissions')
            .eq('id', id)
            .single()

        const isSystemAdmin = await checkAdmin()
        const isSelfUpdate = currentRecord?.email === authUser.email

        if (!isSystemAdmin && !isSelfUpdate) {
            return { success: false, error: 'Bạn không có quyền cập nhật người dùng này' }
        }

        const validColumns = [
            'email', 'name', 'phone', 'branch_id', 'branch_name', 
            'position', 'department', 'permissions', 'direct_manager', 
            'avatar_url', 'status', 'managed_branches', 'dob', 'age'
        ]
        
        // [SEC] If NOT admin, prevent changing sensitive fields
        if (!isSystemAdmin) {
            delete updates.permissions
            delete updates.branch_id
            delete updates.branch_name
            delete updates.status
            delete updates.managed_branches
            delete updates.position
            delete updates.department
        }

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

        const { data, error } = await adminClient // Use admin client to bypass RLS
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

export async function fetchMyDefinitiveProfileByEmail() {
    const supabase = await createClient()
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { success: false, error: 'Not authenticated' }

        const definitiveEmail = user.email || user.user_metadata?.email
        if (!definitiveEmail) {
            console.error('[fetchMyDefinitiveProfileByEmail] No email found in Auth user object')
            return { success: false, error: 'Không tìm thấy địa chỉ email trong phiên đăng nhập' }
        }

        const adminSupabase = await createAdminClient()
        
        // FORCED SCHEMA: public, TABLE: users
        // Query ALL rows with this email because of potential duplication (Old ID vs New ID)
        const { data: allRows, error } = await adminSupabase
            .schema('public')
            .from('users')
            .select('*') // Select all columns to check completeness
            .ilike('email', definitiveEmail.trim())

        if (error) {
            console.error('[fetchMyDefinitiveProfileByEmail] DB error:', error.message)
            return { success: false, error: error.message }
        }
        
        if (!allRows || allRows.length === 0) {
            // New user case: Automatically create a record in public.users
            console.log('[fetchMyDefinitiveProfileByEmail] No record found. Auto-creating for:', definitiveEmail)
            
            const newUser = {
                id: user.id,
                email: definitiveEmail,
                name: user.user_metadata?.full_name || definitiveEmail.split('@')[0],
                avatar_url: user.user_metadata?.avatar_url || '',
                status: 'Activated',
                position: 'Nhân viên'
            }

            const { data: inserted, error: insertError } = await adminSupabase
                .from('users')
                .insert(newUser)
                .select()
                .single()

            if (insertError) {
                console.error('[fetchMyDefinitiveProfileByEmail] Auto-create failed:', insertError.message)
                // Fallback to returning the transient data if insert failed (e.g. RLS issues even for admin)
                return { 
                    success: true, 
                    data: newUser,
                    idMatched: true,
                    isLegacy: false,
                    isNew: true
                }
            }

            return { 
                success: true, 
                data: inserted,
                idMatched: true,
                isLegacy: false,
                isNew: true
            }
        }

        // FIND THE BEST RECORD
        // 1. Look for ID match
        const idMatchedUser = allRows.find(r => r.id === user.id)
        if (idMatchedUser) {
            console.log('[fetchMyDefinitiveProfileByEmail] ID match found:', user.id)
            
            // Force definitive email
            idMatchedUser.email = definitiveEmail

            // MERGE FALLBACK: If DB record has no name/avatar but Auth has them, use Auth values
            if (!idMatchedUser.name && user.user_metadata?.full_name) idMatchedUser.name = user.user_metadata.full_name
            if (!idMatchedUser.avatar_url && user.user_metadata?.avatar_url) idMatchedUser.avatar_url = user.user_metadata.avatar_url
            
            return { success: true, data: idMatchedUser, idMatched: true, isLegacy: false }
        }

        // 2. If no ID match exists, we have Legacy users
        console.log('[fetchMyDefinitiveProfileByEmail] Legacy user detected (Email match only):', definitiveEmail)
        // Find the record with most info (has name, phone, or branch_id)
        const sortedRows = [...allRows].sort((a, b) => {
            const scoreA = [a.name, a.phone, a.branch_id, a.position].filter(Boolean).length
            const scoreB = [b.name, b.phone, b.branch_id, b.position].filter(Boolean).length
            return scoreB - scoreA
        })

        const data = sortedRows[0]
        
        // Force definitive email into the data object to ensure it's never missing
        data.email = definitiveEmail

        // MERGE FALLBACK for Legacy: If DB record has no name/avatar but Auth has them, use Auth values
        if (!data.name && user.user_metadata?.full_name) data.name = user.user_metadata.full_name
        if (!data.avatar_url && user.user_metadata?.avatar_url) data.avatar_url = user.user_metadata.avatar_url

        console.log('[fetchMyDefinitiveProfileByEmail] Returning legacy profile for:', definitiveEmail)
        
        return { 
            success: true, 
            data, 
            idMatched: false, 
            isLegacy: true,
            email: definitiveEmail 
        }
    } catch (error: any) {
        console.error('[fetchMyDefinitiveProfileByEmail] Unexpected error:', error.message)
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

export async function updateMyProfile(updates: { name?: string; avatar_url?: string; dob?: string }) {
    const supabase = await createClient()
    try {
        const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser()
        if (authUserError || !authUser) return { success: false, error: 'Chưa đăng nhập' }

        // 1. Update Auth Metadata (for session sync)
        if (updates.name || updates.avatar_url) {
            await supabase.auth.updateUser({
                data: { 
                    full_name: updates.name, 
                    avatar_url: updates.avatar_url 
                }
            })
        }

        // 2. Prepare DB updates
        const dbUpdates: any = {
            ...updates,
            updated_at: new Date().toISOString()
        }

        // 3. Recalculate age if DOB changed
        if (updates.dob) {
            const birthDate = new Date(updates.dob)
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const m = today.getMonth() - birthDate.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--
            }
            dbUpdates.age = age
        }

        // 4. Update users table via Admin Client (bypass RLS)
        const adminSupabase = await createAdminClient()
        const userEmail = authUser.email?.trim()
        if (!userEmail) return { success: false, error: 'User email not found' }

        const { error: dbError } = await adminSupabase
            .from('users')
            .upsert({
                email: userEmail,
                ...dbUpdates
            }, { onConflict: 'email' })

        if (dbError) throw dbError

        revalidatePath('/profile')
        return { success: true }
    } catch (error: any) {
        console.error('[updateMyProfile] Error:', error.message)
        return { success: false, error: error.message }
    }
}
