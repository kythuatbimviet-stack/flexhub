'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getAccessFilter } from '@/lib/access-filter'

export async function fetchDebts() {
    const supabase = await createAdminClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        let query = supabase
            .from('debts')
            .select(`
                *,
                clients (id, member_name, phone, avatar_url, email, dob, height, weight),
                branches (name),
                debt_installments (id, amount, status, due_date, revenue:revenue_id (payment_method))
            `)
            .order('created_at', { ascending: false })

        // Apply RBAC filters
        if (accessInfo.access.isStaffOnly) {
            const email = accessInfo.user.email
            const name = accessInfo.user.name
            query = query.or(`created_by_email.eq.${email},assigned_pt.eq.${email},trainer_name.ilike.%${name}%`, { foreignTable: 'contracts' })
        } else if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            query = query.in('branch_id', accessInfo.access.allowedBranchIds)
        }


        const { data, error } = await query

        if (error) {
            console.error('[fetchDebts] Error fetching debts:', error)
            throw error
        }
        return { success: true, data }
    } catch (error: any) {
        console.error('[fetchDebts] Exception in fetchDebts:', error)
        return { success: false, error: error.message }
    }
}


export async function fetchDebtsByCustomer(customerId: string) {
    const supabase = await createAdminClient()
    try {
        const { data, error } = await supabase
            .from('debts')
            .select(`
                *,
                contracts (id, contract_name, package_name, status, start_date, end_date, total_amount),
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
    const supabase = await createAdminClient()
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
            .select(`
                *,
                revenue:revenue_id (payment_method)
            `)
            .eq('debt_id', debtId)
            .order('installment_number', { ascending: true })

        if (instError) throw instError

        return { success: true, data: { ...debt, installments } }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createDebtInstallments(debtId: string, installments: any[]) {
    const supabase = await createAdminClient()
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
    const supabase = await createAdminClient()
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
                const newPaidAmount = Number(debt.paid_amount) + Number(revenueData.amount)
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

export async function updateDebtInstallment(id: string, data: any) {
    const supabase = await createAdminClient()
    try {
        const { error } = await supabase
            .from('debt_installments')
            .update(data)
            .eq('id', id)

        if (error) throw error
        revalidatePath('/debts')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteDebtInstallment(id: string) {
    const supabase = await createAdminClient()
    try {
        const { error } = await supabase
            .from('debt_installments')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/debts')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createDebtInstallment(debtId: string, installment: any) {
    const supabase = await createAdminClient()
    try {
        const { data, error } = await supabase
            .from('debt_installments')
            .insert([{ ...installment, debt_id: debtId }])
            .select()
            .single()

        if (error) throw error
        revalidatePath('/debts')
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteDebt(id: string) {
    const supabase = await createAdminClient()
    try {
        const { error } = await supabase
            .from('debts')
            .delete()
            .eq('id', id)

        if (error) throw error
        revalidatePath('/debts')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
