import { createAdminClient } from './lib/supabase-server'

async function debugZaloUsers() {
    try {
        const adminClient = await createAdminClient()
        const { count, error } = await adminClient
            .from('zalo_users')
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.error('Debug: DB Error:', error)
            return
        }
        console.log('Debug: Total Zalo Users in DB:', count)
    } catch (e) {
        console.error('Debug: Unknown Error:', e)
    }
}

debugZaloUsers()
