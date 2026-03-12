'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { numberToVietnameseWords } from '@/lib/utils'

// Tự động tính các trường "bằng chữ" từ số tiền
function computeAmountTextFields(data: any): any {
    const enriched = { ...data }
    try {
        if (enriched.total_amount != null && enriched.total_amount !== '') {
            const amount = Number(enriched.total_amount)
            if (!isNaN(amount) && amount > 0) {
                enriched.total_amount_text = numberToVietnameseWords(amount) + ' đồng chẵn'
            }
        }
        if (enriched.package_price != null && enriched.package_price !== '') {
            const amount = Number(enriched.package_price)
            if (!isNaN(amount) && amount > 0) {
                enriched.package_price_text = numberToVietnameseWords(amount) + ' đồng chẵn'
            }
        }
        if (enriched.discounted_price != null && enriched.discounted_price !== '') {
            const amount = Number(enriched.discounted_price)
            if (!isNaN(amount) && amount > 0) {
                enriched.discounted_price_text = numberToVietnameseWords(amount) + ' đồng chẵn'
            }
        }
    } catch (e) {
        // silent fail — không nhằm để vỡ hàm chính
    }
    return enriched
}

export async function fetchContracts() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('contracts')
            .select(`
                *,
                clients (member_name, phone),
                branches (name)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function fetchContractById(id: string) {
    const supabase = await createAdminClient()
    try {
        const { data, error } = await supabase
            .from('contracts')
            .select(`
                *,
                clients (member_name, phone, email, dob, address),
                branches (name, id, legal_representative, representative_phone, center_address, center_phone)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createContract(contract: any) {
    const supabase = await createClient()
    try {
        const enriched = computeAmountTextFields(contract)
        const { data, error } = await supabase
            .from('contracts')
            .insert([enriched])
            .select()
            .single()

        if (error) throw error

        revalidatePath('/contracts')
        return { success: true, data }
    } catch (error: any) {
        console.error('Create Contract Error:', error)
        return { success: false, error: error.message }
    }
}

export async function finalizeContract(id: string, finalizeData: any) {
    const supabase = await createClient()
    try {
        const { contractUpdates, debtPlan } = finalizeData

        // 1. Cập nhật hợp đồng (Trạng thái, ngày ký, ngày bắt đầu/kết thúc)
        const { data: contractData, error: contractError } = await supabase
            .from('contracts')
            .update({
                ...contractUpdates,
                status: 'Đã ký HĐ'
            })
            .eq('id', id)
            .select()
            .single()

        if (contractError) throw contractError

        // 2. Nếu có trả trước, tạo khoản thu (Revenue)
        if (debtPlan && Number(debtPlan.paid_upfront) > 0) {
            const { error: revError } = await supabase
                .from('revenue')
                .insert([{
                    amount: debtPlan.paid_upfront,
                    client_id: contractData.client_id,
                    branch_id: contractData.branch_id,
                    contract_id: contractData.id,
                    category_id: 'Hợp đồng',
                    payment_method: contractUpdates.payment_method || 'Tiền mặt',
                    description: `Thu tiền trả trước cho HĐ ${contractData.id}`,
                    recorded_at: contractUpdates.signing_date || new Date().toISOString().split('T')[0]
                }])

            if (revError) console.error('Error creating upfront revenue:', revError)
        }

        // 3. Nếu có nợ, tạo hồ sơ nợ (Debt) và các kỳ (Installments)
        if (debtPlan && debtPlan.has_debt) {
            const { data: debtData, error: debtError } = await supabase
                .from('debts')
                .insert([{
                    contract_id: contractData.id,
                    client_id: contractData.client_id,
                    total_amount: contractData.total_amount,
                    paid_amount: debtPlan.paid_upfront,
                    remaining_amount: Number(contractData.total_amount) - Number(debtPlan.paid_upfront),
                    status: 'Thanh toán một phần',
                    branch_id: contractData.branch_id,
                    note: `Tự động tạo khi chốt ký HĐ ${contractData.id}`
                }])
                .select()
                .single()

            if (debtError) throw debtError

            if (debtPlan.installments && debtPlan.installments.length > 0) {
                const { error: instError } = await supabase
                    .from('debt_installments')
                    .insert(debtPlan.installments.map((inst: any) => ({
                        ...inst,
                        debt_id: debtData.id
                    })))

                if (instError) throw instError
            }
        }

        revalidatePath('/contracts')
        revalidatePath('/debts')
        revalidatePath('/financial/revenue')
        return { success: true, data: contractData }
    } catch (error: any) {
        console.error('Finalize Contract Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateContract(id: string, updates: any) {
    const supabase = await createClient()
    try {
        const enriched = computeAmountTextFields(updates)
        const { data, error } = await supabase
            .from('contracts')
            .update(enriched)
            .eq('id', id)
            .select()

        if (error) throw error
        revalidatePath('/contracts')
        return { success: true, data: data[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteContract(id: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/contracts')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteContracts(ids: string[]) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .in('id', ids)

        if (error) throw error
        revalidatePath('/contracts')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function importContracts(contracts: any[]) {
    const supabase = await createClient()
    try {
        const enriched = contracts.map(c => computeAmountTextFields(c))
        const { data, error } = await supabase
            .from('contracts')
            .insert(enriched)
            .select()

        if (error) throw error
        revalidatePath('/contracts')
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
