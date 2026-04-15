'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getAccessFilter } from '@/lib/access-filter'

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
    const supabase = await createAdminClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        let query = supabase
            .from('revenue')
            .select(`
                *,
                branches (name),
                clients (member_name)
            `)
            .order('recorded_at', { ascending: false })

        // Apply RBAC filters
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            query = query.in('branch_id', accessInfo.access.allowedBranchIds)
        }

        const { data, error } = await query

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function fetchRevenueByDateRange(startDate?: string, endDate?: string) {
    const supabase = await createAdminClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        let query = supabase
            .from('revenue')
            .select(`
                *,
                branches (name),
                clients (member_name)
            `)
            .order('recorded_at', { ascending: false })

        // Apply RBAC filters (giữ nguyên từ fetchRevenue)
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            query = query.in('branch_id', accessInfo.access.allowedBranchIds)
        }

        // Apply date range filter at server side
        if (startDate) query = query.gte('recorded_at', startDate)
        if (endDate) query = query.lte('recorded_at', endDate + 'T23:59:59')

        const { data, error } = await query
        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createRevenue(data: any) {
    const supabase = await createClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // RBAC Check for branch
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            if (!accessInfo.access.allowedBranchIds.includes(data.branch_id)) {
                throw new Error('Bạn không có quyền tạo khoản thu cho chi nhánh này')
            }
        }

        const { data: result, error } = await supabase
            .from('revenue')
            .insert([{ ...data, recorded_by: accessInfo.authId }])
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
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const revenuesWithUser = revenues.map(r => ({ ...r, recorded_by: accessInfo.authId }))
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
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // RBAC Check
        const { data: existing } = await supabase.from('revenue').select('branch_id').eq('id', id).maybeSingle()
        if (!existing) throw new Error('Không tìm thấy khoản thu')
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            if (!accessInfo.access.allowedBranchIds.includes(existing.branch_id)) {
                throw new Error('Bạn không có quyền xóa khoản thu này')
            }
        }

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
    const supabase = await createAdminClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        let query = supabase
            .from('expense')
            .select(`
                *,
                branches (name, short_name)
            `)
            .order('recorded_at', { ascending: false })

        // Apply RBAC filters
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            query = query.in('branch_id', accessInfo.access.allowedBranchIds)
        }

        const { data, error } = await query

        if (error) {
            console.error('Fetch Expense Error:', error)
            throw error
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Fetch Expense Failed:', error.message)
        return { success: false, error: error.message }
    }
}

export async function fetchExpenseByDateRange(startDate?: string, endDate?: string) {
    const supabase = await createAdminClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        let query = supabase
            .from('expense')
            .select(`
                *,
                branches (name, short_name)
            `)
            .order('recorded_at', { ascending: false })

        // Apply RBAC filters (giữ nguyên từ fetchExpense)
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            query = query.in('branch_id', accessInfo.access.allowedBranchIds)
        }

        // Apply date range filter at server side
        if (startDate) query = query.gte('recorded_at', startDate)
        if (endDate) query = query.lte('recorded_at', endDate + 'T23:59:59')

        const { data, error } = await query
        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createExpense(data: any) {
    const supabase = await createClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // RBAC Check
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            if (!accessInfo.access.allowedBranchIds.includes(data.branch_id)) {
                throw new Error('Bạn không có quyền tạo khoản chi cho chi nhánh này')
            }
        }

        const { data: result, error } = await supabase
            .from('expense')
            .insert([{ ...data, recorded_by: accessInfo.authId }])
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
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        const expensesWithUser = expenses.map(e => ({ ...e, recorded_by: accessInfo.authId }))
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

export async function fetchCashFlowData(filters?: {
    startDate?: string
    endDate?: string
    branchId?: string
    paymentMethod?: string
    customerId?: string
}) {
    const supabase = await createAdminClient()
    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        let rQuery = supabase
            .from('revenue')
            .select(`
                id, 
                amount, 
                recorded_at, 
                branch_id, 
                description, 
                payment_method,
                customer_id,
                contract_id,
                branches (name),
                clients (member_name)
            `)
        
        let eQuery = supabase
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

        // Apply RBAC filters
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            rQuery = rQuery.in('branch_id', accessInfo.access.allowedBranchIds)
            eQuery = eQuery.in('branch_id', accessInfo.access.allowedBranchIds)
        }

        // Apply filters
        if (filters?.startDate) {
            rQuery = rQuery.gte('recorded_at', filters.startDate)
            eQuery = eQuery.gte('recorded_at', filters.startDate)
        }
        if (filters?.endDate) {
            rQuery = rQuery.lte('recorded_at', filters.endDate + 'T23:59:59')
            eQuery = eQuery.lte('recorded_at', filters.endDate + 'T23:59:59')
        }
        if (filters?.branchId && filters.branchId !== 'all') {
            rQuery = rQuery.eq('branch_id', filters.branchId)
            eQuery = eQuery.eq('branch_id', filters.branchId)
        }
        if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
            rQuery = rQuery.eq('payment_method', filters.paymentMethod)
            eQuery = eQuery.eq('payment_method', filters.paymentMethod)
        }
        if (filters?.customerId && filters.customerId !== 'all') {
            rQuery = rQuery.eq('customer_id', filters.customerId)
        }

        const [{ data: revenue, error: rError }, { data: expense, error: eError }] = await Promise.all([
            rQuery.order('recorded_at', { ascending: false }),
            eQuery.order('recorded_at', { ascending: false })
        ])

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

        return { success: true, data }
    } catch (error: any) {
        console.error('Fetch Expense Types Failed:', error.message)
        return { success: false, error: error.message }
    }
}
