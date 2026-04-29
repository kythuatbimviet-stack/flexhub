'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchMealPlans() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('nutrition_meal_plans')
            .select(`
                *,
                contracts (id, client_id, clients (member_name, phone)),
                nutrition_meals (
                    *,
                    nutrition_meal_items (*)
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Fetch Meal Plans Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function createMealPlan(plan: any, meals: any[]) {
    try {
        const adminClient = await createAdminClient()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const planId = crypto.randomUUID()
        const finalPlan = {
            ...plan,
            id: planId,
            created_by: user?.email || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        // 1. Create Plan
        const { error: planError } = await adminClient
            .from('nutrition_meal_plans')
            .insert(finalPlan)

        if (planError) throw planError

        // 2. Create Meals and Items
        for (const meal of meals) {
            const mealId = crypto.randomUUID()
            const { error: mealError } = await adminClient
                .from('nutrition_meals')
                .insert({
                    ...meal,
                    id: mealId,
                    plan_id: planId
                })
            
            if (mealError) throw mealError

            if (meal.items && meal.items.length > 0) {
                const items = meal.items.map((item: any) => ({
                    ...item,
                    id: crypto.randomUUID(),
                    meal_id: mealId
                }))
                const { error: itemsError } = await adminClient
                    .from('nutrition_meal_items')
                    .insert(items)
                
                if (itemsError) throw itemsError
            }
        }

        revalidatePath('/nutrition-meal-plans')
        return { success: true, id: planId }
    } catch (error: any) {
        console.error('Create Meal Plan Error:', error)
        return { success: false, error: error.message }
    }
}

export async function importMealData(mealsRaw: any[], itemsRaw: any[]) {
    try {
        const adminClient = await createAdminClient()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // 1. Group meals by HDHV ID (Contract ID) to create Plans
        const plansMap = new Map()
        
        // Grouping meals by Contract
        for (const meal of mealsRaw) {
            const contractId = meal.contract_id || 'UNKNOWN'
            if (!plansMap.has(contractId)) {
                plansMap.set(contractId, {
                    id: crypto.randomUUID(),
                    contract_id: contractId === 'UNKNOWN' ? null : contractId,
                    name: `Thực đơn ${contractId}`,
                    meals: []
                })
            }
            plansMap.get(contractId).meals.push(meal)
        }

        // 2. Insert Plans
        const plansToInsert = Array.from(plansMap.values()).map(p => ({
            id: p.id,
            contract_id: p.contract_id,
            name: p.name,
            created_by: user?.email || 'System Import'
        }))

        const { error: pErr } = await adminClient.from('nutrition_meal_plans').insert(plansToInsert)
        if (pErr) throw pErr

        // 3. Insert Meals and keep mapping of external_id -> internal_id
        const mealExternalToInternal = new Map()
        const mealsToInsert = []

        for (const plan of plansMap.values()) {
            for (const m of plan.meals) {
                const internalId = crypto.randomUUID()
                mealExternalToInternal.set(m.external_id, internalId)
                mealsToInsert.push({
                    id: internalId,
                    plan_id: plan.id,
                    meal_order: parseInt(m.meal_order) || 0,
                    name: m.name,
                    kcal: parseFloat(m.kcal) || 0,
                    external_id: m.external_id
                })
            }
        }

        const { error: mErr } = await adminClient.from('nutrition_meals').insert(mealsToInsert)
        if (mErr) throw mErr

        // 4. Insert Items
        const itemsToInsert = itemsRaw.map(item => ({
            id: crypto.randomUUID(),
            meal_id: mealExternalToInternal.get(item.meal_external_id),
            food_id: item.food_id,
            quantity: parseFloat(item.quantity) || 0,
            protein: parseFloat(item.protein) || 0,
            carb: parseFloat(item.carb) || 0,
            fat: parseFloat(item.fat) || 0,
            fiber: parseFloat(item.fiber) || 0,
            kcal: parseFloat(item.kcal) || 0,
            external_id: item.external_id
        })).filter(item => item.meal_id) // Only items belonging to an imported meal

        if (itemsToInsert.length > 0) {
            const { error: iErr } = await adminClient.from('nutrition_meal_items').insert(itemsToInsert)
            if (iErr) throw iErr
        }

        revalidatePath('/nutrition-meal-plans')
        return { success: true, plansCount: plansToInsert.length, mealsCount: mealsToInsert.length, itemsCount: itemsToInsert.length }
    } catch (error: any) {
        console.error('Import Meal Data Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteMealPlan(id: string) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('nutrition_meal_plans')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/nutrition-meal-plans')
        return { success: true }
    } catch (error: any) {
        console.error('Delete Meal Plan Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteMealPlans(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('nutrition_meal_plans')
            .delete()
            .in('id', ids)

        if (error) throw error

        revalidatePath('/nutrition-meal-plans')
        return { success: true }
    } catch (error: any) {
        console.error('Bulk Delete Meal Plans Error:', error)
        return { success: false, error: error.message }
    }
}
