'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getAccessFilter } from '@/lib/access-filter'
import { checkAdmin } from './users'

export type TrainingResult = {
    id: string
    client_id: string
    contract_id?: string
    phase: string
    measurement_num: number
    measurement_date: string
    created_by: string
    measurement_chest: number
    measurement_bicep_left: number
    measurement_bicep_right: number
    measurement_waist: number
    measurement_hip: number
    measurement_thigh_left: number
    measurement_thigh_right: number
    muscle_mass: number
    body_fat: number
    created_at: string
    updated_at: string
}

export async function fetchTrainingResults(clientId: string) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('training_results')
            .select('*')
            .eq('client_id', clientId)
            .order('measurement_date', { ascending: false })
            .order('measurement_num', { ascending: false })

        if (error) {
            console.error('Fetch Training Results Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data: data as TrainingResult[] }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function createTrainingResult(formData: Partial<TrainingResult>) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()
        
        const finalData = {
            ...formData,
            id: crypto.randomUUID(),
            created_by: accessInfo.user?.email || 'System',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('training_results')
            .insert([finalData])
            .select()
            .single()

        if (error) {
            console.error('Create Training Result Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/clients') // Or specific client path if dynamic
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Create Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateTrainingResult(id: string, updates: Partial<TrainingResult>) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('training_results')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Update Training Result Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/clients')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Update Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteTrainingResult(id: string) {
    try {
        if (!(await checkAdmin())) return { success: false, error: 'Chỉ Admin mới có quyền xóa kết quả tập luyện' }
        
        const supabase = await createAdminClient()
        const { error } = await supabase
            .from('training_results')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete Training Result Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/clients')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Delete Error:', error)
        return { success: false, error: error.message }
    }
}
