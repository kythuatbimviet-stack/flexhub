'use server'

import { createClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-server'
import { getAccessFilter } from '@/lib/access-filter'
import { revalidatePath } from 'next/cache'

export type RoadmapPhase = {
    id?: string
    roadmap_id?: string
    phase_number: number
    phase_title: string
    primary_goal: string
    supplementary_goal: string
    methodology: string
    expected_results: string
    total_time: string
    total_sessions: string
    order_index: number
}

export type TrainingRoadmap = {
    id: string
    client_id: string
    contract_id?: string
    goal: string
    duration_overall: string
    created_at: string
    updated_at: string
    created_by: string
    is_active: boolean
    phases?: RoadmapPhase[]
}

/**
 * Fetch all roadmaps for a specific client
 */
export async function fetchRoadmaps(clientId: string) {
    try {
        const adminClient = await createAdminClient()
        
        const { data, error } = await adminClient
            .from('training_roadmaps')
            .select(`
                *,
                phases:roadmap_phases(*)
            `)
            .eq('client_id', clientId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data: data as TrainingRoadmap[] }
    } catch (error: any) {
        console.error('Error fetching roadmaps:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Create a new training roadmap with phases
 */
export async function createRoadmap(roadmapData: Partial<TrainingRoadmap>, phases: Partial<RoadmapPhase>[]) {
    try {
        const adminClient = await createAdminClient()
        const accessFilter = await getAccessFilter()
        
        const { data: roadmap, error: roadmapError } = await adminClient
            .from('training_roadmaps')
            .insert([{
                ...roadmapData,
                created_by: accessFilter.email || 'System'
            }])
            .select()
            .single()

        if (roadmapError) throw roadmapError

        // Insert phases
        const phasesToInsert = phases.map((phase, index) => ({
            ...phase,
            roadmap_id: roadmap.id,
            order_index: index
        }))

        const { error: phasesError } = await adminClient
            .from('roadmap_phases')
            .insert(phasesToInsert)

        if (phasesError) throw phasesError

        revalidatePath('/training-roadmap')
        return { success: true, data: roadmap }
    } catch (error: any) {
        console.error('Error creating roadmap:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Update a training roadmap and its phases
 */
export async function updateRoadmap(roadmapId: string, roadmapData: Partial<TrainingRoadmap>, phases: RoadmapPhase[]) {
    try {
        const adminClient = await createAdminClient()
        
        // Update main roadmap info
        const { error: roadmapError } = await adminClient
            .from('training_roadmaps')
            .update({
                ...roadmapData,
                updated_at: new Date().toISOString()
            })
            .eq('id', roadmapId)

        if (roadmapError) throw roadmapError

        // Handle phases: simple approach - delete and recreate for this specific roadmap
        const { error: deleteError } = await adminClient
            .from('roadmap_phases')
            .delete()
            .eq('roadmap_id', roadmapId)

        if (deleteError) throw deleteError

        const phasesToInsert = phases.map((phase, index) => {
            const { id, ...rest } = phase // Remove old ID
            return {
                ...rest,
                roadmap_id: roadmapId,
                order_index: index
            }
        })

        const { error: phasesError } = await adminClient
            .from('roadmap_phases')
            .insert(phasesToInsert)

        if (phasesError) throw phasesError

        revalidatePath('/training-roadmap')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating roadmap:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Delete (deactivate) a roadmap
 */
export async function deleteRoadmap(id: string) {
    try {
        const adminClient = await createAdminClient()
        
        const { error } = await adminClient
            .from('training_roadmaps')
            .update({ is_active: false })
            .eq('id', id)

        if (error) throw error

        revalidatePath('/training-roadmap')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting roadmap:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Fetch all unique clients who have active roadmaps
 */
export async function fetchAllActiveRoadmapsWithClients() {
    try {
        const adminClient = await createAdminClient()
        
        const { data, error } = await adminClient
            .from('training_roadmaps')
            .select(`
                *,
                client:clients (
                    id,
                    member_name,
                    phone,
                    pt_name
                )
            `)
            .eq('is_active', true)
            .order('updated_at', { ascending: false })

        if (error) throw error

        return { success: true, data: data as any[] }
    } catch (error: any) {
        console.error('Error fetching all roadmaps:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Import multiple roadmaps from Excel data
 */
export async function importTrainingRoadmaps(data: any[]) {
    try {
        const adminClient = await createAdminClient()
        const accessFilter = await getAccessFilter()
        const createdBy = accessFilter.email || 'System'

        let count = 0
        for (const item of data) {
            if (!item.client_id) continue

            // Insert basic roadmap
            const { data: roadmap, error: roadmapError } = await adminClient
                .from('training_roadmaps')
                .insert([{
                    client_id: item.client_id,
                    goal: item.goal || '',
                    duration_overall: item.duration_overall || '',
                    created_by: createdBy,
                    is_active: true
                }])
                .select()
                .single()

            if (roadmapError) {
                console.error('Error importing roadmap row:', roadmapError)
                continue
            }

            // Insert default phases if not provided, to ensure functionality
            const phasesToInsert = (item.phases || [
                { phase_number: 1, phase_title: 'HUẤN LUYỆN NỀN TẢNG', primary_goal: roadmap.goal, total_time: '1 Tháng', total_sessions: '12 Buổi' },
                { phase_number: 2, phase_title: 'TĂNG CƯỜNG THỂ CHẤT', primary_goal: roadmap.goal, total_time: '1 Tháng', total_sessions: '12 Buổi' },
                { phase_number: 3, phase_title: 'TỐI ƯU HÓA KẾT QUẢ', primary_goal: roadmap.goal, total_time: '1 Tháng', total_sessions: '12 Buổi' },
            ]).map((p: any, idx: number) => ({
                phase_number: p.phase_number || (idx + 1),
                phase_title: p.phase_title || `Giai đoạn ${idx + 1}`,
                primary_goal: p.primary_goal || roadmap.goal,
                supplementary_goal: p.supplementary_goal || '',
                methodology: p.methodology || '',
                expected_results: p.expected_results || '',
                total_time: p.total_time || '1 Tháng',
                total_sessions: p.total_sessions || '12 Buổi',
                roadmap_id: roadmap.id,
                order_index: idx
            }))

            await adminClient.from('roadmap_phases').insert(phasesToInsert)
            
            count++
        }

        revalidatePath('/training-roadmap')
        return { success: true, count }
    } catch (error: any) {
        console.error('Error importing roadmaps:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteTrainingRoadmaps(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        
        const { error } = await adminClient
            .from('training_roadmaps')
            .update({ is_active: false })
            .in('id', ids)

        if (error) throw error

        revalidatePath('/training-roadmap')
        return { success: true }
    } catch (error: any) {
        console.error('Error bulk deleting roadmaps:', error)
        return { success: false, error: error.message }
    }
}
