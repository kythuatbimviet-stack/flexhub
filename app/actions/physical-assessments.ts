'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchPhysicalAssessments() {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('physical_assessments')
            .select(`
                *,
                contracts (id, client_id, clients (member_name, phone))
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Fetch Physical Assessments Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function createPhysicalAssessment(assessment: any) {
    try {
        const adminClient = await createAdminClient()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const finalAssessment = {
            ...assessment,
            id: assessment.id || crypto.randomUUID(),
            created_by: user?.email || assessment.created_by || null,
            created_at: assessment.created_at || new Date().toISOString()
        }

        const { data, error } = await adminClient
            .from('physical_assessments')
            .insert(finalAssessment)
            .select()
            .single()

        if (error) {
            console.error('Create Physical Assessment Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/physical-assessments')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Create Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updatePhysicalAssessment(id: string, updates: any) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('physical_assessments')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Update Physical Assessment Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/physical-assessments')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Update Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deletePhysicalAssessment(id: string) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('physical_assessments')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete Physical Assessment Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/physical-assessments')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function importPhysicalAssessments(assessments: any[]) {
    try {
        const adminClient = await createAdminClient()
        
        // chunking if needed, but for now simple insert
        const { data, error } = await adminClient
            .from('physical_assessments')
            .insert(assessments)
            .select()

        if (error) {
            console.error('Bulk Import Physical Assessments Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/physical-assessments')
        return { success: true, count: data.length }
    } catch (error: any) {
        console.error('Unexpected Import Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeletePhysicalAssessments(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('physical_assessments')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Bulk Delete Physical Assessments Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/physical-assessments')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Bulk Delete Error:', error)
        return { success: false, error: error.message }
    }
}
