'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, format } from 'date-fns'

export async function fetchDashboardMetrics(filters?: { startDate?: string; endDate?: string; branchId?: string }) {
    const supabase = await createAdminClient()
    const now = new Date()
    
    const sevenMonthsAgo = startOfMonth(subMonths(now, 6))
    const monthStart = startOfMonth(now).toISOString()
    const monthEnd = endOfMonth(now).toISOString()
    const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
    const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()

    try {
        // Build base queries
        let clientsQuery = supabase.from('clients').select('id, status, source, registration_type, created_at, pt_name, branch_id')
        let revenueQuery = supabase.from('revenue').select('amount, recorded_at, branch_id, customer_id')
        let expenseQuery = supabase.from('expense').select('amount, recorded_at, branch_id')
        let debtsQuery = supabase.from('debts').select('remaining_amount, paid_amount, status, created_at, branch_id')
        let contractsQuery = supabase.from('contracts').select('id, status, total_amount, end_date, created_at, branch_id')
        const branchesQuery = supabase.from('branches').select('id, name')

        // Apply filters if provided
        if (filters?.startDate) {
            clientsQuery = clientsQuery.gte('created_at', filters.startDate)
            revenueQuery = revenueQuery.gte('recorded_at', filters.startDate)
            expenseQuery = expenseQuery.gte('recorded_at', filters.startDate)
            debtsQuery = debtsQuery.gte('created_at', filters.startDate)
            contractsQuery = contractsQuery.gte('created_at', filters.startDate)
        }
        if (filters?.endDate) {
            clientsQuery = clientsQuery.lte('created_at', filters.endDate)
            revenueQuery = revenueQuery.lte('recorded_at', filters.endDate)
            expenseQuery = expenseQuery.lte('recorded_at', filters.endDate)
            debtsQuery = debtsQuery.lte('created_at', filters.endDate)
            contractsQuery = contractsQuery.lte('created_at', filters.endDate)
        }
        if (filters?.branchId && filters.branchId !== 'all') {
            clientsQuery = clientsQuery.eq('branch_id', filters.branchId)
            revenueQuery = revenueQuery.eq('branch_id', filters.branchId)
            expenseQuery = expenseQuery.eq('branch_id', filters.branchId)
            debtsQuery = debtsQuery.eq('branch_id', filters.branchId)
            contractsQuery = contractsQuery.eq('branch_id', filters.branchId)
        }

        // 1. Fetch data in parallel
        const [
            { data: clients, error: cErr },
            { data: revenue, error: rErr },
            { data: expense, error: eErr },
            { data: debts, error: dErr },
            { data: contracts, error: hErr },
            { data: branches, error: bErr }
        ] = await Promise.all([
            clientsQuery,
            revenueQuery,
            expenseQuery,
            debtsQuery,
            contractsQuery,
            branchesQuery
        ])

        if (cErr) console.error('Dashboard Fetch Clients Error:', cErr)
        if (rErr) console.error('Dashboard Fetch Revenue Error:', rErr)
        if (eErr) console.error('Dashboard Fetch Expense Error:', eErr)
        if (dErr) console.error('Dashboard Fetch Debts Error:', dErr)
        if (hErr) console.error('Dashboard Fetch Contracts Error:', hErr)
        if (bErr) console.error('Dashboard Fetch Branches Error:', bErr)

        console.log('Dashboard Data Counts:', {
            clients: clients?.length || 0,
            revenue: revenue?.length || 0,
            expense: expense?.length || 0,
            debts: debts?.length || 0,
            contracts: contracts?.length || 0,
            branches: branches?.length || 0,
            filters
        })

        const safeClients = clients || []
        const safeRevenue = revenue || []
        const safeExpense = expense || []
        const safeDebts = debts || []
        const safeContracts = contracts || []
        const safeBranches = branches || []

        // --- Tab 1: Khách hàng (Customers) ---
        const totalCustomers = safeClients.length
        const customerStatusCounts = safeClients.reduce((acc: any, c) => {
            acc[c.status || 'Khác'] = (acc[c.status || 'Khác'] || 0) + 1
            return acc
        }, {})
        const customerSourceCounts = safeClients.reduce((acc: any, c) => {
            acc[c.source || 'Khác'] = (acc[c.source || 'Khác'] || 0) + 1
            return acc
        }, {})

        const newThisMonth = safeClients.filter(c => c.created_at && c.created_at >= monthStart).length
        const newLastMonth = safeClients.filter(c => c.created_at && c.created_at >= lastMonthStart && c.created_at <= lastMonthEnd).length
        const customerGrowthRate = newLastMonth === 0 ? (newThisMonth > 0 ? 100 : 0) : ((newThisMonth - newLastMonth) / newLastMonth) * 100

        // --- Tab 2: Lộ trình (Registration Routes) ---
        const registrationRouteCounts = safeClients.reduce((acc: any, c) => {
            const route = c.registration_type || 'Chưa xác định'
            acc[route] = (acc[route] || 0) + 1
            return acc
        }, {})
        const popularRoute = Object.entries(registrationRouteCounts).sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'N/A'

        // --- Tab 3: Hợp đồng (Contracts) ---
        const contractStatusCounts = safeContracts.reduce((acc: any, h) => {
            acc[h.status || 'Khác'] = (acc[h.status || 'Khác'] || 0) + 1
            return acc
        }, {})
        const totalContractValue = safeContracts.reduce((sum, h) => sum + (Number(h.total_amount) || 0), 0)
        
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const expiringCount = safeContracts.filter(h => 
            h.status === 'Đang hiệu lực' && 
            h.end_date && 
            h.end_date <= thirtyDaysFromNow && 
            h.end_date >= now.toISOString()
        ).length

        const newContractsCount = safeContracts.filter(h => h.created_at && h.created_at >= monthStart).length

        // --- Tab 4: Công nợ (Debts) ---
        const totalDebtAmount = safeDebts.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0)
        const totalPaidAmount = safeDebts.reduce((sum, d) => sum + (Number(d.paid_amount) || 0), 0)
        const overdueDebtCount = safeDebts.filter(d => d.status === 'Quá hạn').length
        const debtStatusCounts = safeDebts.reduce((acc: any, d) => {
            acc[d.status || 'Khác'] = (acc[d.status || 'Khác'] || 0) + 1
            return acc
        }, {})
        
        const debtRatio = totalContractValue === 0 ? 0 : (totalDebtAmount / totalContractValue) * 100
        const recoveryRate = totalContractValue === 0 ? 0 : (totalPaidAmount / totalContractValue) * 100

        // --- Tab 1: Khách hàng (Customers) - Final adjustments ---
        const topSource = Object.entries(customerSourceCounts).sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'N/A'
        const activeClients = safeClients.filter(c => c.status === 'Đang hoạt động').length
        const activeRate = totalCustomers === 0 ? 0 : (activeClients / totalCustomers) * 100

        // --- Tab 5, 6, 7: Tài chính (Financials) ---
        const currentMonthRevenue = safeRevenue
            .filter(r => r.recorded_at && r.recorded_at >= monthStart && r.recorded_at <= monthEnd)
            .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
        
        const lastMonthRevenue = safeRevenue
            .filter(r => r.recorded_at && r.recorded_at >= lastMonthStart && r.recorded_at <= lastMonthEnd)
            .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
        
        const revenueGrowthRate = lastMonthRevenue === 0 ? (currentMonthRevenue > 0 ? 100 : 0) : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100

        const totalRevenue = safeRevenue.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
        const totalExpense = safeExpense.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

        // Monthly Trends (Last 7 months)
        const monthlyTrends = Array.from({ length: 7 }).map((_, i) => {
            const date = subMonths(now, 6 - i)
            const mStart = startOfMonth(date).toISOString()
            const mEnd = endOfMonth(date).toISOString()
            const label = format(date, 'MMM')

            const rev = safeRevenue
                .filter(r => r.recorded_at && r.recorded_at >= mStart && r.recorded_at <= mEnd)
                .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
            
            const exp = safeExpense
                .filter(e => e.recorded_at && e.recorded_at >= mStart && e.recorded_at <= mEnd)
                .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

            return {
                name: label,
                revenue: rev,
                expense: exp,
                profit: rev - exp
            }
        })

        // Branch Metrics
        const branchMetrics = safeBranches.map(branch => {
            const bRev = safeRevenue.filter(r => r.branch_id === branch.id).reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
            const bExp = safeExpense.filter(e => e.branch_id === branch.id).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
            return {
                id: branch.id,
                name: branch.name,
                revenue: bRev,
                expense: bExp,
                profit: bRev - bExp
            }
        })

        const bestBranch = [...branchMetrics].sort((a, b) => b.profit - a.profit)[0]?.name || 'N/A'

        // Top Performers (PTs)
        const ptSales = safeRevenue.reduce((acc: any, r: any) => {
            const client = safeClients.find(c => c.id === r.customer_id)
            const ptName = client?.pt_name || 'Chưa gán PT'
            acc[ptName] = (acc[ptName] || 0) + (Number(r.amount) || 0)
            return acc
        }, {})

        const topPTs = Object.entries(ptSales)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount }))

        return {
            success: true,
            data: {
                summary: {
                    totalCustomers,
                    currentMonthRevenue,
                    revenueGrowthRate,
                    totalDebtAmount,
                    overdueDebtCount,
                    netCashFlow: totalRevenue - totalExpense,
                    customerGrowthRate,
                    newThisMonth,
                    bestBranch
                },
                customers: {
                    statusCounts: customerStatusCounts,
                    sourceCounts: customerSourceCounts,
                    newThisMonth,
                    newLastMonth,
                    topSource,
                    activeRate
                },
                registrationRoutes: {
                    counts: registrationRouteCounts,
                    popularRoute
                },
                contracts: {
                    statusCounts: contractStatusCounts,
                    totalValue: totalContractValue,
                    expiringCount,
                    newContractsCount
                },
                debts: {
                    statusCounts: debtStatusCounts,
                    totalAmount: totalDebtAmount,
                    overdueCount: overdueDebtCount,
                    debtRatio,
                    recoveryRate
                },
                finance: {
                    monthlyTrends,
                    branchMetrics,
                    totalRevenue,
                    totalExpense
                },
                topPerformers: {
                    topPTs
                },
                counts: {
                    clients: safeClients.length,
                    contracts: safeContracts.length,
                    revenue: safeRevenue.length,
                    expense: safeExpense.length,
                    debts: safeDebts.length
                }
            }
        }

    } catch (error: any) {
        console.error('Fetch Dashboard Metrics Error:', error)
        return { 
            success: false, 
            error: error.message || 'Lỗi không xác định khi lấy dữ liệu dashboard'
        }
    }
}
