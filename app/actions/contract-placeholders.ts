'use server'

import { createAdminClient, createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_PLACEHOLDERS, type PlaceholderCategory } from '@/lib/placeholder-defaults'

export interface ContractPlaceholder {
    id: string
    key: string
    label: string
    description?: string | null
    category: PlaceholderCategory
    sample_value?: string | null
    is_active: boolean
    is_default: boolean
    sort_order: number
    created_at: string
    updated_at: string
}


// ── Lấy tất cả placeholder ───────────────────────────────────────────────────
export async function fetchAllPlaceholders() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const maskedUrl = url.replace(/(https?:\/\/).{5}(.*)/, '$1*****$2')
    
    const diagnostics: any = {
        projectUrl: maskedUrl,
        serviceKeyDefined: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        envCheck: {
            url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
    }
    
    const supabaseAdmin = await createAdminClient()
    
    // Diagnostic 1: Health Check
    try {
        const { error: tplError } = await supabaseAdmin.from('contract_templates').select('id').limit(1)
        const { error: brError } = await supabaseAdmin.from('branches').select('id').limit(1)

        diagnostics.tablesHealth = {
            contract_templates: tplError ? `ERROR: ${tplError.message}` : 'OK',
            branches: brError ? `ERROR: ${brError.message}` : 'OK'
        }
    } catch (e: any) {
        diagnostics.globalHealth = `CRASHED: ${e.message}`
    }


    try {
        const { data, error, status, statusText } = await supabaseAdmin
            .from('contract_placeholders')
            .select('*')
            .order('sort_order', { ascending: true })

        if (error) {
            diagnostics.mainError = { message: error.message, code: error.code, status }
            
            // Log for developer to see in terminal
            console.error('[fetchAllPlaceholders] Error details:', error)
            
            throw error
        }
        
        return { success: true, data: (data || []) as ContractPlaceholder[], diagnostics }
    } catch (error: any) {
        return { success: false, error: error.message, diagnostics, data: [] }
    }
}

// ── Lấy placeholder đang active (dùng cho render template) ───────────────────
export async function fetchActivePlaceholders() {
    const supabaseAdmin = await createAdminClient()
    try {
        const { data, error, status, statusText } = await supabaseAdmin
            .from('contract_placeholders')
            .select('key, label, sample_value, category')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('[fetchActivePlaceholders] Admin Client Error:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                status,
                statusText
            })
            
            // Fallback for debug
            const supabasePublic = await createClient()
            const { data: pData, error: pError } = await supabasePublic
                .from('contract_placeholders')
                .select('key, label, sample_value, category')
                .eq('is_active', true)
                .order('sort_order', { ascending: true })
            
            if (pError) throw error
            return { success: true, data: (pData || []) as any[] }
        }
        return { success: true, data: (data || []) as Pick<ContractPlaceholder, 'key' | 'label' | 'sample_value' | 'category'>[] }
    } catch (error: any) {
        console.error('[fetchActivePlaceholders] Final Catch Error:', error)
        return { success: false, error: error.message, data: [] }
    }
}

// ── Tạo placeholder mới ───────────────────────────────────────────────────────
export async function createPlaceholder(data: {
    key: string
    label: string
    description?: string | null
    category: PlaceholderCategory
    sample_value?: string | null
    is_active?: boolean
    sort_order?: number
}) {
    const supabase = await createAdminClient()
    try {
        // Chuẩn hóa key: luôn wrap bằng {{ }}
        let key = data.key.trim()
        if (!key.startsWith('{{')) key = `{{${key}`
        if (!key.endsWith('}}')) key = `${key}}}`

        const { data: result, error } = await supabase
            .from('contract_placeholders')
            .insert([{ ...data, key, is_default: false, is_active: data.is_active ?? true }])
            .select()
            .single()

        if (error) throw error
        revalidatePath('/contract-template')
        return { success: true, data: result as ContractPlaceholder }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ── Cập nhật placeholder ──────────────────────────────────────────────────────
export async function updatePlaceholder(id: string, data: {
    key?: string
    label?: string
    description?: string | null
    category?: PlaceholderCategory
    sample_value?: string | null
    is_active?: boolean
    sort_order?: number
}) {
    const supabase = await createAdminClient()
    try {
        // Chuẩn hóa key nếu có update
        if (data.key) {
            let key = data.key.trim()
            if (!key.startsWith('{{')) key = `{{${key}`
            if (!key.endsWith('}}')) key = `${key}}}`
            data = { ...data, key }
        }

        const { data: result, error } = await supabase
            .from('contract_placeholders')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        revalidatePath('/contract-template')
        return { success: true, data: result as ContractPlaceholder }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ── Xóa placeholder ───────────────────────────────────────────────────────────
export async function deletePlaceholder(id: string) {
    const supabase = await createAdminClient()
    try {
        const { error } = await supabase
            .from('contract_placeholders')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/contract-template')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ── Bật/Tắt placeholder ───────────────────────────────────────────────────────
export async function togglePlaceholderStatus(id: string, isActive: boolean) {
    const supabase = await createAdminClient()
    try {
        const { data, error } = await supabase
            .from('contract_placeholders')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        revalidatePath('/contract-template')
        return { success: true, data: data as ContractPlaceholder }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ── RESET VỀ MẶC ĐỊNH ─────────────────────────────────────────────────────────
// Chiến lược:
//   1. Xóa tất cả placeholder có is_default = true (các placeholder mặc định cũ)
//   2. Insert lại toàn bộ DEFAULT_PLACEHOLDERS
//   3. Giữ nguyên placeholder tùy chỉnh (is_default = false) của user
export async function resetPlaceholdersToDefault() {
    const supabase = await createAdminClient()
    try {
        // Bước 1: Xóa placeholder mặc định cũ
        const { error: deleteError } = await supabase
            .from('contract_placeholders')
            .delete()
            .eq('is_default', true)

        if (deleteError) throw deleteError

        // Bước 2: Insert lại mặc định
        const { error: insertError } = await supabase
            .from('contract_placeholders')
            .insert(DEFAULT_PLACEHOLDERS.map(p => ({ ...p })))

        if (insertError) throw insertError

        revalidatePath('/contract-template')
        return { success: true, count: DEFAULT_PLACEHOLDERS.length }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
