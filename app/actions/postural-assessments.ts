'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getAccessFilter } from '@/lib/access-filter'

export type PosturalAssessment = {
    id?: string
    client_id: string
    pt_id: string
    assessment_date: string
    forward_head: boolean
    head_tilt_rotation: boolean
    head_notes?: string
    head_image_url?: string
    uneven_shoulders: boolean
    rounded_shoulders: boolean
    kyphosis: boolean
    lordosis: boolean
    back_notes?: string
    back_image_url?: string
    pelvic_tilt_anterior: boolean
    pelvic_tilt_posterior: boolean
    pelvic_notes?: string
    pelvic_image_url?: string
    knee_valgus: boolean
    knee_varus: boolean
    knee_hyperextension: boolean
    knee_notes?: string
    knee_image_url?: string
    pronation: boolean
    supination: boolean
    feet_notes?: string
    feet_image_url?: string
    recommendations?: string
    created_at?: string
    updated_at?: string
    // Joined data
    client?: {
        member_name: string
        id: string
        phone?: string
    }
}

// Fetch all assessments (with filter)
export async function fetchPosturalAssessments(clientId?: string) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // Use admin client to bypass schema/RLS permission issues (consistent with write ops)
        const adminClient = await createAdminClient()
        let query = adminClient
            .from('postural_assessments')
            .select(`
                *,
                client:clients(id, member_name, phone)
            `)
            .order('assessment_date', { ascending: false })

        if (clientId) {
            query = query.eq('client_id', clientId)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        console.error('Fetch Postural Assessments Error:', error)
        return { success: false, error: error.message }
    }
}

// Save (Insert or Update)
export async function savePosturalAssessment(assessment: PosturalAssessment) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()
        const isUpdate = !!assessment.id

        const dataToSave = { ...assessment }
        delete (dataToSave as any).client // Clean up joined data if present

        let result
        if (isUpdate) {
            result = await adminClient
                .from('postural_assessments')
                .update(dataToSave)
                .eq('id', assessment.id)
                .select()
                .single()
        } else {
            result = await adminClient
                .from('postural_assessments')
                .insert(dataToSave)
                .select()
                .single()
        }

        if (result.error) throw result.error
        
        revalidatePath('/postural-assessments')
        return { success: true, data: result.data }
    } catch (error: any) {
        console.error('Save Postural Assessment Error:', error)
        return { success: false, error: error.message }
    }
}

// Delete
export async function deletePosturalAssessment(id: string) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('postural_assessments')
            .delete()
            .eq('id', id)

        if (error) throw error
        
        revalidatePath('/postural-assessments')
        return { success: true }
    } catch (error: any) {
        console.error('Delete Postural Assessment Error:', error)
        return { success: false, error: error.message }
    }
}
// Import bulk
export async function importPosturalAssessments(records: any[]) {
    try {
        const adminClient = await createAdminClient()
        
        const { data, error } = await adminClient
            .from('postural_assessments')
            .upsert(records, { onConflict: 'id' })
            .select()

        if (error) throw error
        
        revalidatePath('/postural-assessments')
        return { success: true, count: data?.length || 0 }
    } catch (error: any) {
        console.error('Import Postural Assessments Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeletePosturalAssessments(ids: string[]) {
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('postural_assessments')
            .delete()
            .in('id', ids)

        if (error) throw error
        
        revalidatePath('/postural-assessments')
        return { success: true }
    } catch (error: any) {
        console.error('Bulk Delete Postural Assessments Error:', error)
        return { success: false, error: error.message }
    }
}
