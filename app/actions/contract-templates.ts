'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// Lấy tất cả templates kèm thông tin chi nhánh
export async function fetchAllContractTemplates() {
    const supabase = await createAdminClient()
    try {
        const { data, error } = await supabase
            .from('contract_templates')
            .select('*, branches(id, name)')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data: data || [] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// Lấy template active phù hợp nhất cho một branch
// Ưu tiên: branch-specific → global (branch_id null) → null
export async function fetchActiveTemplateForBranch(branchId?: string | null) {
    const supabase = await createAdminClient()
    try {
        // Thử lấy template active cho branch cụ thể
        if (branchId) {
            const { data: branchTemplate } = await supabase
                .from('contract_templates')
                .select('*')
                .eq('branch_id', branchId)
                .eq('is_active', true)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (branchTemplate) return { success: true, data: branchTemplate }
        }

        // Fallback: lấy template global active (branch_id = null)
        const { data: globalTemplate, error } = await supabase
            .from('contract_templates')
            .select('*')
            .is('branch_id', null)
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) throw error
        return { success: true, data: globalTemplate || null }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createContractTemplate(data: {
    name: string
    content: string
    branch_id?: string | null
    is_active?: boolean
}) {
    const supabase = await createAdminClient()
    try {
        const { data: result, error } = await supabase
            .from('contract_templates')
            .insert([{ ...data, is_active: data.is_active ?? true }])
            .select()
            .single()

        if (error) throw error
        revalidatePath('/contract-template')
        return { success: true, data: result }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateContractTemplate(id: string, data: {
    name?: string
    content?: string
    branch_id?: string | null
    is_active?: boolean
}) {
    const supabase = await createAdminClient()
    try {
        const { data: result, error } = await supabase
            .from('contract_templates')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        revalidatePath('/contract-template')
        return { success: true, data: result }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteContractTemplate(id: string) {
    const supabase = await createAdminClient()
    try {
        const { error } = await supabase
            .from('contract_templates')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/contract-template')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function toggleTemplateStatus(id: string, isActive: boolean) {
    const supabase = await createAdminClient()
    try {
        const { data, error } = await supabase
            .from('contract_templates')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        revalidatePath('/contract-template')
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// Legacy - kept for backward compatibility
export async function fetchContractTemplate() {
    return fetchActiveTemplateForBranch(null)
}

export async function upsertContractTemplate(name: string, content: string, id?: string) {
    if (id) return updateContractTemplate(id, { name, content })
    return createContractTemplate({ name, content })
}
