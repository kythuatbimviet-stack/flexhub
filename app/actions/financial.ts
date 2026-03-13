'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// --- Categories ---

export async function fetchFinancialCategories(type?: 'revenue' | 'expense') {
    const supabase = await createClient()
    try {
        let query = supabase.from('financial_categories').select('*').order('name')
        if (type) {
            query = query.eq('type', type)
        }
        const { data, error } = await query
        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// --- Revenue ---

export async function fetchRevenue() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('revenue')
            .select(`
                *,
                branches (name),
                clients (member_name)
            `)
            .order('recorded_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createRevenue(data: any) {
    const supabase = await createClient()
    try {
        const { data: userData } = await supabase.auth.getUser()
        const { data: result, error } = await supabase
            .from('revenue')
            .insert([{ ...data, recorded_by: userData.user?.id }])
            .select()
            .single()

        if (error) throw error

        // If linked to an installment, update it
        if (data.installment_id) {
            await supabase
                .from('debt_installments')
                .update({ status: 'Đã thanh toán', revenue_id: result.id })
                .eq('id', data.installment_id)
        }

        // If linked to a debt, update the total paid_amount
        if (data.debt_id) {
            const { data: debt } = await supabase
                .from('debts')
                .select('paid_amount, total_amount')
                .eq('id', data.debt_id)
                .single()

            if (debt) {
                const newPaidAmount = Number(debt.paid_amount) + Number(data.amount)
                const newRemaining = Math.max(0, Number(debt.total_amount) - newPaidAmount)
                const newStatus = newRemaining <= 0 ? 'Đã thanh toán' : 'Thanh toán một phần'

                await supabase
                    .from('debts')
                    .update({
                        paid_amount: newPaidAmount,
                        remaining_amount: newRemaining,
                        status: newStatus
                    })
                    .eq('id', data.debt_id)
            }
        }

        revalidatePath('/revenue')
        revalidatePath('/cash-flow')
        revalidatePath('/debts')
        revalidatePath('/')
        return { success: true, data: result }
    } catch (error: any) {
        console.error('Create Revenue Error:', error)
        return { success: false, error: error.message }
    }
}

export async function bulkCreateRevenue(revenues: any[]) {
    const supabase = await createClient()
    try {
        const { data: userData } = await supabase.auth.getUser()
        const revenuesWithUser = revenues.map(r => ({ ...r, recorded_by: userData.user?.id }))
        const { data, error } = await supabase
            .from('revenue')
            .insert(revenuesWithUser)
            .select()

        if (error) throw error
        revalidatePath('/revenue')
        revalidatePath('/cash-flow')
        revalidatePath('/')
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateRevenue(id: string, updates: any) {
    const supabase = await createClient()
    try {
        const { data: result, error } = await supabase
            .from('revenue')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        revalidatePath('/revenue')
        revalidatePath('/cash-flow')
        revalidatePath('/')
        return { success: true, data: result[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteRevenue(id: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase.from('revenue').delete().eq('id', id)
        if (error) throw error
        revalidatePath('/revenue')
        revalidatePath('/cash-flow')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteRevenue(ids: string[]) {
    const supabase = await createClient()
    try {
        const { error } = await supabase.from('revenue').delete().in('id', ids)
        if (error) throw error
        revalidatePath('/revenue')
        revalidatePath('/cash-flow')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// --- Expense ---

export async function fetchExpense() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('expense')
            .select(`
                *,
                branches (name, short_name)
            `)
            .order('recorded_at', { ascending: false })

        if (error) {
            console.error('Fetch Expense Error:', error)
            throw error
        }

        console.log('Fetch Expense Data:', data?.length || 0, 'rows found')
        return { success: true, data }
    } catch (error: any) {
        console.error('Fetch Expense Failed:', error.message)
        return { success: false, error: error.message }
    }
}

export async function createExpense(data: any) {
    const supabase = await createClient()
    try {
        const { data: userData } = await supabase.auth.getUser()
        const { data: result, error } = await supabase
            .from('expense')
            .insert([{ ...data, recorded_by: userData.user?.id }])
            .select()

        if (error) throw error
        revalidatePath('/expense')
        revalidatePath('/cash-flow')
        revalidatePath('/')
        return { success: true, data: result[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkCreateExpense(expenses: any[]) {
    const supabase = await createClient()
    try {
        const { data: userData } = await supabase.auth.getUser()
        const expensesWithUser = expenses.map(e => ({ ...e, recorded_by: userData.user?.id }))
        const { data, error } = await supabase
            .from('expense')
            .insert(expensesWithUser)
            .select()

        if (error) throw error
        revalidatePath('/expense')
        revalidatePath('/cash-flow')
        revalidatePath('/')
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateExpense(id: string, updates: any) {
    const supabase = await createClient()
    try {
        const { data: result, error } = await supabase
            .from('expense')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        revalidatePath('/expense')
        revalidatePath('/cash-flow')
        return { success: true, data: result[0] }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteExpense(id: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase.from('expense').delete().eq('id', id)
        if (error) throw error
        revalidatePath('/expense')
        revalidatePath('/cash-flow')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteExpense(ids: string[]) {
    const supabase = await createClient()
    try {
        const { error } = await supabase.from('expense').delete().in('id', ids)
        if (error) throw error
        revalidatePath('/expense')
        revalidatePath('/cash-flow')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// --- Cash Flow ---

export async function fetchCashFlowData() {
    const supabase = await createClient()
    try {
        const { data: revenue, error: rError } = await supabase
            .from('revenue')
            .select(`
                id, 
                amount, 
                recorded_at, 
                branch_id, 
                description, 
                payment_method,
                branches (name)
            `)

        const { data: expense, error: eError } = await supabase
            .from('expense')
            .select(`
                id, 
                amount, 
                recorded_at, 
                branch_id, 
                description, 
                payment_method,
                branches (name)
            `)

        if (rError) throw rError
        if (eError) throw eError

        return { success: true, data: { revenue, expense } }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// --- Configuration ---

export async function fetchExpenseTypes() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('config_finance_expense_type')
            .select('*')
            .order('nam')

        if (error) {
            console.error('Fetch Expense Types Error:', error)
            throw error
        }

        console.log('Fetch Expense Types Success:', data?.length || 0, 'rows found')
        return { success: true, data }
    } catch (error: any) {
        console.error('Fetch Expense Types Failed:', error.message)
        return { success: false, error: error.message }
    }
}
