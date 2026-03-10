'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchDebts() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('debts')
            .select(`
                *,
                contracts (id, contract_name, package_name),
                clients (id, member_name, phone),
                branches (name)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function fetchDebtsByCustomer(customerId: string) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('debts')
            .select(`
                *,
                contracts (id, contract_name, package_name),
                branches (name)
            `)
            .eq('client_id', customerId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function fetchDebtDetails(debtId: string) {
    const supabase = await createClient()
    try {
        const { data: debt, error: debtError } = await supabase
            .from('debts')
            .select(`
                *,
                contracts (*),
                clients (*),
                branches (name)
            `)
            .eq('id', debtId)
            .single()

        if (debtError) throw debtError

        const { data: installments, error: instError } = await supabase
            .from('debt_installments')
            .select('*')
            .eq('debt_id', debtId)
            .order('installment_number', { ascending: true })

        if (instError) throw instError

        return { success: true, data: { ...debt, installments } }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createDebtInstallments(debtId: string, installments: any[]) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('debt_installments')
            .insert(installments.map(inst => ({ ...inst, debt_id: debtId })))
            .select()

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function payInstallment(installmentId: string, revenueData: any) {
    const supabase = await createClient()
    try {
        // 1. Create Revenue record
        const { data: revenue, error: revError } = await supabase
            .from('revenue')
            .insert([revenueData])
            .select()
            .single()

        if (revError) throw revError

        // 2. Update Installment
        const { error: instError } = await supabase
            .from('debt_installments')
            .update({
                status: 'Đã thanh toán',
                revenue_id: revenue.id
            })
            .eq('id', installmentId)

        if (instError) throw instError

        // 3. Update Debt Balance (this should ideally be a trigger in SQL, but doing it here for safety)
        const { data: installment } = await supabase
            .from('debt_installments')
            .select('debt_id, amount')
            .eq('id', installmentId)
            .single()

        if (installment) {
            const { data: debt } = await supabase
                .from('debts')
                .select('paid_amount, total_amount')
                .eq('id', installment.debt_id)
                .single()

            if (debt) {
                const newPaidAmount = Number(debt.paid_amount) + Number(installment.amount)
                const newRemaining = Number(debt.total_amount) - newPaidAmount
                const newStatus = newRemaining <= 0 ? 'Đã thanh toán' : 'Thanh toán một phần'

                await supabase
                    .from('debts')
                    .update({
                        paid_amount: newPaidAmount,
                        remaining_amount: newRemaining,
                        status: newStatus
                    })
                    .eq('id', installment.debt_id)
            }
        }

        revalidatePath('/debts')
        revalidatePath('/revenue')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteDebt(id: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('debts')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/debts')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
