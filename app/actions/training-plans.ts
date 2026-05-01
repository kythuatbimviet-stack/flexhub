'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type Exercise = {
    id: string
    name: string
    name_vi?: string
    category: string
    muscle_groups: string[]
    equipment: string
    description?: string
    demo_url?: string
}

export type TrainingProgram = {
    id: string
    name: string
    goal?: string
    level?: string
    duration_weeks?: number
    is_template: boolean
    is_public: boolean
    created_by?: string
    client_id?: string
    created_at: string
    updated_at: string
    sessions?: TrainingSession[]
}

export type TrainingSession = {
    id: string
    program_id: string
    day_label: string
    sort_order: number
    notes?: string
    exercises?: SessionExercise[]
}

export type SessionExercise = {
    id: string
    session_id: string
    exercise_id: string
    exercise?: Exercise
    sets?: string
    reps?: string
    rest_seconds?: number
    intensity?: string
    tempo?: string
    notes?: string
    sort_order: number
}

// Fetch all exercises from the library
export async function fetchExercises() {
    try {
        const supabase = await createAdminClient()
        
        // Debug check for key (internal log)
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder') {
            console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing or placeholder')
            return { success: false, error: 'Hệ thống chưa cấu hình Service Role Key' }
        }

        const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .order('name')
        
        if (error) {
            console.error('Supabase query error (exercises):', error)
            return { success: false, error: error.message }
        }
        
        if (!data) return { success: true, data: [] }

        // Ensure robust data structure for client-side
        const sanitizedData = data.map(ex => ({
            ...ex,
            muscle_groups: Array.isArray(ex.muscle_groups) ? ex.muscle_groups : [],
            category: ex.category || 'Khác',
            equipment: ex.equipment || 'Không có',
            name_vi: ex.name_vi || ''
        }))
        
        return { success: true, data: sanitizedData }
    } catch (err: any) {
        console.error('Unexpected error in fetchExercises:', err)
        return { success: false, error: err.message }
    }
}

// Create a new exercise
export async function createExercise(exercise: Partial<Exercise>) {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('exercises')
            .insert({
                ...exercise,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error
        revalidatePath('/exercise-library')
        return { success: true, data }
    } catch (err: any) {
        console.error('Error creating exercise:', err)
        return { success: false, error: err.message }
    }
}

// Update an existing exercise
export async function updateExercise(id: string, exercise: Partial<Exercise>) {
    try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
            .from('exercises')
            .update({
                ...exercise,
                // updated_at: new Date().toISOString() // exercises table doesn't have updated_at yet, sticking to what exists
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        revalidatePath('/exercise-library')
        return { success: true, data }
    } catch (err: any) {
        console.error('Error updating exercise:', err)
        return { success: false, error: err.message }
    }
}

// Delete an exercise
export async function deleteExercise(id: string) {
    try {
        const supabase = await createAdminClient()
        const { error } = await supabase
            .from('exercises')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/exercise-library')
        return { success: true }
    } catch (err: any) {
        console.error('Error deleting exercise:', err)
        return { success: false, error: err.message }
    }
}

// Bulk delete exercises
export async function bulkDeleteExercises(ids: string[]) {
    try {
        const supabase = await createAdminClient()
        const { error } = await supabase
            .from('exercises')
            .delete()
            .in('id', ids)

        if (error) throw error
        revalidatePath('/exercise-library')
        return { success: true }
    } catch (err: any) {
        console.error('Error bulk deleting exercises:', err)
        return { success: false, error: err.message }
    }
}

// Fetch all program templates (PT library)
export async function fetchProgramTemplates() {
    try {
        const supabase = await createAdminClient()
        
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder') {
            return { success: false, error: 'Hệ thống chưa cấu hình Service Role Key' }
        }

        const { data, error } = await supabase
            .from('training_programs')
            .select(`
                *,
                sessions:training_sessions(
                    *,
                    exercises:training_session_exercises(
                        *,
                        exercise:exercises(*)
                    )
                )
            `)
            .eq('is_template', true)
            .order('created_at', { ascending: false })
        
        if (error) {
            console.error('Supabase query error (templates):', error)
            return { success: false, error: error.message }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('Unexpected error in fetchProgramTemplates:', err)
        return { success: false, error: err.message }
    }
}

// Fetch programs assigned to a specific client
export async function fetchClientPrograms(clientId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('training_programs')
        .select(`
            *,
            sessions:training_sessions(
                *,
                exercises:training_session_exercises(
                    *,
                    exercise:exercises(*)
                )
            )
        `)
        .eq('client_id', clientId)
        .eq('is_template', false)
        .order('created_at', { ascending: false })
    
    if (error) return { success: false, error: error.message }
    return { success: true, data }
}

// Create a new program (Template)
export async function createProgramTemplate(program: Partial<TrainingProgram>, sessions: any[]) {
    const supabase = await createAdminClient()
    
    try {
        // 1. Create the program
        const { data: progData, error: progError } = await supabase
            .from('training_programs')
            .insert({ ...program, is_template: true })
            .select()
            .single()
        
        if (progError) throw progError

        // 2. Create sessions and exercises
        for (const session of sessions) {
            const { data: sessData, error: sessError } = await supabase
                .from('training_sessions')
                .insert({
                    program_id: progData.id,
                    day_label: session.day_label,
                    sort_order: session.sort_order,
                    notes: session.notes
                })
                .select()
                .single()
            
            if (sessError) throw sessError

            if (session.exercises && session.exercises.length > 0) {
                const exercisesToInsert = session.exercises.map((ex: any, idx: number) => ({
                    session_id: sessData.id,
                    exercise_id: ex.exercise_id,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest_seconds: ex.rest_seconds,
                    intensity: ex.intensity,
                    tempo: ex.tempo,
                    notes: ex.notes,
                    sort_order: idx
                }))

                const { error: exError } = await supabase
                    .from('training_session_exercises')
                    .insert(exercisesToInsert)
                
                if (exError) throw exError
            }
        }

        revalidatePath('/training-plans')
        return { success: true, data: progData }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// Update an existing program template
export async function updateProgramTemplate(programId: string, program: Partial<TrainingProgram>, sessions: any[]) {
    const supabase = await createAdminClient()
    
    try {
        // 1. Update the program basic info
        const { error: progError } = await supabase
            .from('training_programs')
            .update({ ...program, updated_at: new Date().toISOString() })
            .eq('id', programId)
        
        if (progError) throw progError

        // 2. Clean up existing sessions and exercises (Cascade delete handles exercises)
        const { error: deleteError } = await supabase
            .from('training_sessions')
            .delete()
            .eq('program_id', programId)
        
        if (deleteError) throw deleteError

        // 3. Re-insert sessions and exercises
        for (const session of sessions) {
            const { data: sessData, error: sessError } = await supabase
                .from('training_sessions')
                .insert({
                    program_id: programId,
                    day_label: session.day_label,
                    sort_order: session.sort_order,
                    notes: session.notes
                })
                .select()
                .single()
            
            if (sessError) throw sessError

            if (session.exercises && session.exercises.length > 0) {
                const exercisesToInsert = session.exercises.map((ex: any, idx: number) => ({
                    session_id: sessData.id,
                    exercise_id: ex.exercise_id,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest_seconds: ex.rest_seconds,
                    intensity: ex.intensity,
                    tempo: ex.tempo,
                    notes: ex.notes,
                    sort_order: idx
                }))

                const { error: exError } = await supabase
                    .from('training_session_exercises')
                    .insert(exercisesToInsert)
                
                if (exError) throw exError
            }
        }

        revalidatePath('/training-plans')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// Assign a template to a client (Cloning logic)
export async function assignProgramToClient(templateId: string, clientId: string, ptName: string) {
    const supabase = await createAdminClient()
    
    try {
        // 1. Fetch template structure
        const { data: template, error: fetchError } = await supabase
            .from('training_programs')
            .select(`
                *,
                sessions:training_sessions(
                    *,
                    exercises:training_session_exercises(*)
                )
            `)
            .eq('id', templateId)
            .single()
        
        if (fetchError) throw fetchError

        // 2. Clone program info as an instance
        const { data: newProg, error: progError } = await supabase
            .from('training_programs')
            .insert({
                name: template.name,
                goal: template.goal,
                level: template.level,
                duration_weeks: template.duration_weeks,
                is_template: false,
                is_public: false,
                created_by: ptName,
                client_id: clientId
            })
            .select()
            .single()
        
        if (progError) throw progError

        // 3. Clone sessions and exercises
        for (const session of template.sessions) {
            const { data: newSess, error: sessError } = await supabase
                .from('training_sessions')
                .insert({
                    program_id: newProg.id,
                    day_label: session.day_label,
                    sort_order: session.sort_order,
                    notes: session.notes
                })
                .select()
                .single()
            
            if (sessError) throw sessError

            if (session.exercises && session.exercises.length > 0) {
                const clonedExercises = session.exercises.map((ex: any) => ({
                    session_id: newSess.id,
                    exercise_id: ex.exercise_id,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest_seconds: ex.rest_seconds,
                    intensity: ex.intensity,
                    tempo: ex.tempo,
                    notes: ex.notes,
                    sort_order: ex.sort_order
                }))

                const { error: exError } = await supabase
                    .from('training_session_exercises')
                    .insert(clonedExercises)
                
                if (exError) throw exError
            }
        }

        // 4. Create assignment record
        const { error: assignError } = await supabase
            .from('client_training_assignments')
            .insert({
                client_id: clientId,
                program_id: newProg.id,
                pt_id: ptName,
                start_date: new Date().toISOString().split('T')[0]
            })
        
        if (assignError) throw assignError

        revalidatePath('/training-plans')
        revalidatePath(`/clients/detail/${clientId}`)
        return { success: true, data: newProg }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// Delete a program
export async function deleteProgram(id: string) {
    const supabase = await createAdminClient()
    const { error } = await supabase
        .from('training_programs')
        .delete()
        .eq('id', id)
    
    if (error) return { success: false, error: error.message }
    revalidatePath('/training-plans')
    return { success: true }
}

export async function bulkDeleteTrainingPrograms(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('training_programs')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Bulk Delete Training Programs Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/training-plans')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Bulk Delete Error:', error)
        return { success: false, error: error.message }
    }
}
