'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchNutritionFoods() {
    try {
        const supabase = await createClient()
        // Loại bỏ image_base64 khỏi danh sách để tránh vượt giới hạn 1MB body của Server Actions
        // image_base64 chỉ được fetch khi cần hiển thị/edit từng record riêng lẻ
        const { data, error } = await supabase
            .from('nutrition_foods')
            .select('id, food_group, food_type, protein, carbs, fat, fiber, unit, conversion_factor, image_base64, created_at, updated_at')
            .order('food_group', { ascending: true })
            .order('food_type', { ascending: true })

        if (error) {
            console.error('Fetch Nutrition Foods Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

// Fetch đầy đủ một record (bao gồm image_base64) — dùng cho dialog chỉnh sửa
export async function fetchNutritionFoodById(id: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('nutrition_foods')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Fetch Nutrition Food By ID Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Fetch By ID Error:', error)
        return { success: false, error: error.message }
    }
}

export async function importNutritionFoods(foods: any[]) {
    try {
        const adminClient = await createAdminClient()
        
        // Use upsert to avoid conflicts if IDs already exist
        const { data, error } = await adminClient
            .from('nutrition_foods')
            .upsert(foods, { onConflict: 'id' })
            .select()

        if (error) {
            console.error('Bulk Import Nutrition Foods Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/nutrition-foods')
        return { success: true, count: data.length }
    } catch (error: any) {
        console.error('Unexpected Import Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteNutritionFood(id: string) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('nutrition_foods')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete Nutrition Food Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/nutrition-foods')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function createNutritionFood(food: any) {
    try {
        const adminClient = await createAdminClient()
        
        // Generate a simple text ID if not provided
        const finalFood = {
            ...food,
            id: food.id || `food_${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const { data, error } = await adminClient
            .from('nutrition_foods')
            .insert([finalFood])
            .select()

        if (error) {
            console.error('Create Nutrition Food Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/nutrition-foods')
        return { success: true, data: data[0] }
    } catch (error: any) {
        console.error('Unexpected Create Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateNutritionFood(id: string, food: any) {
    try {
        const adminClient = await createAdminClient()
        
        const { data, error } = await adminClient
            .from('nutrition_foods')
            .update({
                ...food,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()

        if (error) {
            console.error('Update Nutrition Food Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/nutrition-foods')
        return { success: true, data: data[0] }
    } catch (error: any) {
        console.error('Unexpected Update Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteNutritionFoods(ids: string[]) {
    try {
        const adminClient = await createAdminClient()
        const { error } = await adminClient
            .from('nutrition_foods')
            .delete()
            .in('id', ids)

        if (error) {
            console.error('Bulk Delete Nutrition Foods Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/nutrition-foods')
        return { success: true }
    } catch (error: any) {
        console.error('Unexpected Bulk Delete Error:', error)
        return { success: false, error: error.message }
    }
}

export async function downloadImageAsBase64(url: string) {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Không thể tải ảnh từ link này. Vui lòng kiểm tra lại đường dẫn.')
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('Link này không trỏ đến một tệp ảnh hợp lệ.')
        }

        const buffer = await response.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        
        return { 
            success: true, 
            base64: `data:${contentType};base64,${base64}` 
        }
    } catch (error: any) {
        console.error('Download Image Error:', error)
        return { success: false, error: error.message }
    }
}
