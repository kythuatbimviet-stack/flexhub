'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type Setting = {
    id: string
    data_name: string
    categories: string
    nam: string
    value: number
    default: number | null
}

export async function fetchSettings() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('datasetup')
            .select('*')
            .order('data_name', { ascending: true })
            .order('categories', { ascending: true })
            .order('value', { ascending: true })

        if (error) throw error
        return { success: true, data: data as Setting[] }
    } catch (error: any) {
        console.error('Error fetching settings:', error)
        return { success: false, error: error.message }
    }
}

export async function createSetting(setting: Omit<Setting, 'id'>) {
    const supabase = await createClient()
    try {
        // Generate a simple ID if not provided (following CAIDATxxx pattern)
        // First, get the max CAIDAT number
        const { data: lastItems } = await supabase
            .from('datasetup')
            .select('id')
            .like('id', 'CAIDAT%')
            .order('id', { ascending: false })
            .limit(1)

        let nextId = 'CAIDAT001'
        if (lastItems && lastItems.length > 0) {
            const lastIdNum = parseInt(lastItems[0].id.replace('CAIDAT', ''))
            nextId = `CAIDAT${(lastIdNum + 1).toString().padStart(3, '0')}`
        }

        const { data, error } = await supabase
            .from('datasetup')
            .insert([{ ...setting, id: nextId }])
            .select()
            .single()

        if (error) throw error
        revalidatePath('/settings')
        return { success: true, data }
    } catch (error: any) {
        console.error('Error creating setting:', error)
        return { success: false, error: error.message }
    }
}

export async function updateSetting(id: string, updates: Partial<Setting>) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('datasetup')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        revalidatePath('/settings')
        return { success: true, data }
    } catch (error: any) {
        console.error('Error updating setting:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteSetting(id: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('datasetup')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/settings')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting setting:', error)
        return { success: false, error: error.message }
    }
}
