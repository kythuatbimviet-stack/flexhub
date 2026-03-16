'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchAppConfig() {
    const supabase = await createAdminClient()
    try {
        const { data, error } = await supabase
            .from('app_config')
            .select('*')
            .order('key', { ascending: true })

        if (error) throw error
        
        // Convert to key-value object for easy access
        const config: Record<string, string> = {}
        data?.forEach(item => {
            config[item.key] = item.value || ''
        })
        
        return { success: true, data: config, raw: data }
    } catch (error: any) {
        console.error('Error fetching app config:', error)
        return { success: false, error: error.message }
    }
}

export async function upsertBatchAppConfig(entries: { key: string, value: string }[]) {
    const supabase = await createAdminClient()
    try {
        const { error } = await supabase
            .from('app_config')
            .upsert(entries, { onConflict: 'key' })

        if (error) throw error
        
        revalidatePath('/google-drive-config')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating app config:', error)
        return { success: false, error: error.message }
    }
}
