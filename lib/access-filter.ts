import { cache } from 'react'
import { createClient, createAdminClient } from './supabase-server'
import { getAccessControl, UserProfile } from './permissions'

/**
 * Shared access filter — cached per-request.
 * cache() ensures auth.getUser() + users table query
 * chỉ chạy 1 lần duy nhất trong cùng 1 server request,
 * dù được gọi từ nhiều server actions khác nhau.
 */
export const getAccessFilter = cache(async () => {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return null

    // Use Admin Client to bypass RLS on the 'users' table
    const adminClient = await createAdminClient()
    const { data: profile, error } = await adminClient
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()

    if (error) {
        console.error('[getAccessFilter] Error fetching user profile:', error)
        return null
    }

    if (!profile) {
        console.warn('[getAccessFilter] No profile found for email:', authUser.email)
        return null
    }

    return {
        user: profile as UserProfile,
        authId: authUser.id,
        access: getAccessControl(profile as UserProfile),
    }
})
