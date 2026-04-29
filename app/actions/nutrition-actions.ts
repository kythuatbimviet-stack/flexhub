'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchNutritionDesigns() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('nutrition_designs')
            .select(`
                *,
                clients (member_name, phone)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Fetch Nutrition Designs Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function createNutritionDesign(design: any) {
    try {
        const adminClient = await createAdminClient()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const finalDesign = {
            ...design,
            id: design.id || crypto.randomUUID(),
            created_by: user?.email || design.created_by || null,
            created_at: design.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        // Supabase will automatically handle the relations if client_id and contract_id are correct TEXT values
        const { data, error } = await adminClient
            .from('nutrition_designs')
            .insert(finalDesign)
            .select()
            .single()

        if (error) {
            console.error('Create Nutrition Design Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/nutrition-designs')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Create Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateNutritionDesign(id: string, updates: any) {
    try {
        const adminClient = await createAdminClient()
        const { data, error } = await adminClient
            .from('nutrition_designs')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Update Nutrition Design Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/nutrition-designs')
        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Update Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteNutritionDesign(id: string) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('nutrition_designs')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete Nutrition Design Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/nutrition-designs')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function importNutritionDesigns(designs: any[]) {
    try {
        const adminClient = await createAdminClient()
        
        // Use insert for bulk data
        const { data, error } = await adminClient
            .from('nutrition_designs')
            .insert(designs)
            .select()

        if (error) {
            console.error('Bulk Import Nutrition Designs Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/nutrition-designs')
        return { success: true, count: data.length }
    } catch (error: any) {
        console.error('Unexpected Import Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteNutritionDesigns(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('nutrition_designs')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Bulk Delete Nutrition Designs Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/nutrition-designs')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Bulk Delete Error:', error)
        return { success: false, error: error.message }
    }
}
