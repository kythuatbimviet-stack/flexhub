'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { getAccessFilter } from '@/lib/access-filter'

export async function fetchDashboardMetrics(filters?: { startDate?: string; endDate?: string; branchId?: string }) {
    const supabase = await createAdminClient()
    const now = new Date()
    
    const yearStart = startOfMonth(new Date(now.getFullYear(), 0, 1)).toISOString()
    const monthStart = startOfMonth(now).toISOString()
    const monthEnd = endOfMonth(now).toISOString()
    const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
    const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()

    try {
        const accessInfo = await getAccessFilter()
        if (!accessInfo) return { success: false, error: 'Unauthorized' }

        // Build base queries
        let clientsQuery = supabase.from('clients').select('id, status, source, registration_type, created_at, pt_name, branch_id, member_name')
        let revenueQuery = supabase.from('revenue').select('amount, recorded_at, branch_id, customer_id')
        let expenseQuery = supabase.from('expense').select('amount, recorded_at, branch_id')
        let debtsQuery = supabase.from('debts').select('remaining_amount, paid_amount, status, created_at, branch_id')
        let contractsQuery = supabase.from('contracts').select('id, status, total_amount, end_date, created_at, branch_id')
        let branchesQuery = supabase.from('branches').select('id, name, province')
        let weightQuery = supabase.from('weight_tracking').select('client_id, weight, measurement_date').order('measurement_date', { ascending: true })

        // Apply RBAC filters
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            const branchIds = accessInfo.access.allowedBranchIds
            clientsQuery = clientsQuery.in('branch_id', branchIds)
            revenueQuery = revenueQuery.in('branch_id', branchIds)
            expenseQuery = expenseQuery.in('branch_id', branchIds)
            debtsQuery = debtsQuery.in('branch_id', branchIds)
            contractsQuery = contractsQuery.in('branch_id', branchIds)
            branchesQuery = branchesQuery.in('id', branchIds)
        }

        // Apply UI filters
        if (filters?.startDate) {
            clientsQuery = clientsQuery.gte('created_at', filters.startDate)
            revenueQuery = revenueQuery.gte('recorded_at', filters.startDate)
            expenseQuery = expenseQuery.gte('recorded_at', filters.startDate)
            debtsQuery = debtsQuery.gte('created_at', filters.startDate)
            contractsQuery = contractsQuery.gte('created_at', filters.startDate)
            weightQuery = weightQuery.gte('measurement_date', filters.startDate)
        }
        if (filters?.endDate) {
            clientsQuery = clientsQuery.lte('created_at', filters.endDate)
            revenueQuery = revenueQuery.lte('recorded_at', filters.endDate)
            expenseQuery = expenseQuery.lte('recorded_at', filters.endDate)
            debtsQuery = debtsQuery.lte('created_at', filters.endDate)
            contractsQuery = contractsQuery.lte('created_at', filters.endDate)
            weightQuery = weightQuery.lte('measurement_date', filters.endDate)
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
            { data: branches, error: bErr },
            { data: weights, error: wErr }
        ] = await Promise.all([
            clientsQuery,
            revenueQuery,
            expenseQuery,
            debtsQuery,
            contractsQuery,
            branchesQuery,
            weightQuery
        ])

        if (cErr) console.error('Dashboard Fetch Clients Error:', cErr)
        if (rErr) console.error('Dashboard Fetch Revenue Error:', rErr)
        if (eErr) console.error('Dashboard Fetch Expense Error:', eErr)
        if (dErr) console.error('Dashboard Fetch Debts Error:', dErr)
        if (hErr) console.error('Dashboard Fetch Contracts Error:', hErr)
        if (bErr) console.error('Dashboard Fetch Branches Error:', bErr)
        if (wErr) console.error('Dashboard Fetch Weight Error:', wErr)

        const safeClients = clients || []
        const safeRevenue = revenue || []
        const safeExpense = expense || []
        const safeDebts = debts || []
        const safeContracts = contracts || []
        const safeBranches = branches || []
        const safeWeights = weights || []
        // Filter weights to only clients we have access to (replaces pre-filter serial queries)
        const allowedClientIdSet = new Set(safeClients.map(c => c.id))
        const filteredWeights = safeWeights.filter(w => allowedClientIdSet.has(w.client_id))

        // --- Core Calculations ---
        const totalCustomers = safeClients.length
        const customerStatusCounts = safeClients.reduce((acc: any, c) => {
            acc[c.status || 'Khác'] = (acc[c.status || 'Khác'] || 0) + 1
            return acc
        }, {})
        const customerSourceCounts = safeClients.reduce((acc: any, c) => {
            acc[c.source || 'Khác'] = (acc[c.source || 'Khác'] || 0) + 1
            return acc
        }, {})
        const topSource = Object.entries(customerSourceCounts).sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'N/A'
        const activeClients = safeClients.filter(c => c.status === 'Đang hoạt động').length
        const activeRate = totalCustomers === 0 ? 0 : (activeClients / totalCustomers) * 100

        const newThisMonth = safeClients.filter(c => c.created_at && c.created_at >= monthStart).length
        const newLastMonth = safeClients.filter(c => c.created_at && c.created_at >= lastMonthStart && c.created_at <= lastMonthEnd).length
        const customerGrowthRate = newLastMonth === 0 ? (newThisMonth > 0 ? 100 : 0) : ((newThisMonth - newLastMonth) / newLastMonth) * 100

        const totalContractValue = safeContracts.reduce((sum, h) => sum + (Number(h.total_amount) || 0), 0)
        const totalRevenue = safeRevenue.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
        const totalExpense = safeExpense.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

        // --- Branch-level Reports (Renamed from Province) ---
        const branchLevelMetrics: Record<string, { branchName: string, revenue: number, weightLoss: number }> = {}
        const branchIdToName: Record<string, string> = {}
        safeBranches.forEach(b => {
            branchIdToName[b.id] = b.name || 'Chi nhánh chưa tên'
        })

        safeRevenue.forEach(r => {
            const bName = branchIdToName[r.branch_id || ''] || 'Chi nhánh khác'
            if (!branchLevelMetrics[bName]) branchLevelMetrics[bName] = { branchName: bName, revenue: 0, weightLoss: 0 }
            branchLevelMetrics[bName].revenue += Number(r.amount) || 0
        })

        const clientsWeights = filteredWeights.reduce((acc: any, w) => {
            if (!acc[w.client_id]) acc[w.client_id] = []
            acc[w.client_id].push(w)
            return acc
        }, {})

        safeClients.forEach(client => {
            const bName = branchIdToName[client.branch_id || ''] || 'Chi nhánh khác'
            if (!branchLevelMetrics[bName]) branchLevelMetrics[bName] = { branchName: bName, revenue: 0, weightLoss: 0 }
            
            const clientWeights = clientsWeights[client.id] || []
            const monthlyWeights = clientWeights.filter((w: any) => w.measurement_date >= monthStart && w.measurement_date <= monthEnd)
            if (monthlyWeights.length >= 2) {
                const loss = (monthlyWeights[0].weight || 0) - (monthlyWeights[monthlyWeights.length - 1].weight || 0)
                branchLevelMetrics[bName].weightLoss += Math.max(0, loss)
            }
        })

        // --- PT Performance ---
        const ptMetrics: Record<string, { 
            name: string, 
            leads: Record<string, number>, 
            totalWeightLoss: number, 
            maxWeightLoss: number,
            revenue: number
        }> = {}

        safeClients.forEach(client => {
            const ptName = client.pt_name || 'Chưa gán PT'
            if (!ptMetrics[ptName]) {
                ptMetrics[ptName] = { 
                    name: ptName, 
                    leads: { 'Facebook': 0, 'tiktok': 0, 'Outdoor': 0, 'PR': 0, 'Tự kiếm': 0, 'Khác': 0 },
                    totalWeightLoss: 0,
                    maxWeightLoss: 0,
                    revenue: 0
                }
            }

            const source = client.source || 'Khác'
            if (ptMetrics[ptName].leads[source] !== undefined) ptMetrics[ptName].leads[source]++
            else ptMetrics[ptName].leads['Khác']++

            const clientWeights = clientsWeights[client.id] || []
            const monthlyWeights = clientWeights.filter((w: any) => w.measurement_date >= monthStart && w.measurement_date <= monthEnd)
            if (monthlyWeights.length >= 2) {
                const loss = (monthlyWeights[0].weight || 0) - (monthlyWeights[monthlyWeights.length - 1].weight || 0)
                ptMetrics[ptName].totalWeightLoss += Math.max(0, loss)
            }

            const yearlyWeights = clientWeights.filter((w: any) => w.measurement_date >= yearStart)
            if (yearlyWeights.length >= 2) {
                const startWeight = yearlyWeights[0].weight || 0
                const minWeight = Math.min(...yearlyWeights.map((w: any) => Number(w.weight) || Infinity))
                const maxLoss = Math.max(0, startWeight - minWeight)
                if (maxLoss > ptMetrics[ptName].maxWeightLoss) ptMetrics[ptName].maxWeightLoss = maxLoss
            }
        })

        safeRevenue.forEach(r => {
            const client = safeClients.find(c => c.id === r.customer_id)
            const ptName = client?.pt_name || 'Chưa gán PT'
            if (ptMetrics[ptName]) ptMetrics[ptName].revenue += Number(r.amount) || 0
        })

        // --- Restoring Existing Fields ---
        const registrationRouteCounts = safeClients.reduce((acc: any, c) => {
            const route = c.registration_type || 'Chưa xác định'
            acc[route] = (acc[route] || 0) + 1
            return acc
        }, {})
        const popularRoute = Object.entries(registrationRouteCounts).sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'N/A'

        const contractStatusCounts = safeContracts.reduce((acc: any, h) => {
            acc[h.status || 'Khác'] = (acc[h.status || 'Khác'] || 0) + 1
            return acc
        }, {})

        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const expiringCount = safeContracts.filter(h => 
            h.status === 'Đang hiệu lực' && h.end_date && h.end_date <= thirtyDaysFromNow && h.end_date >= now.toISOString()
        ).length
        const newContractsCount = safeContracts.filter(h => h.created_at && h.created_at >= monthStart).length

        const totalDebtAmount = safeDebts.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0)
        const totalPaidAmount = safeDebts.reduce((sum, d) => sum + (Number(d.paid_amount) || 0), 0)
        const overdueDebtCount = safeDebts.filter(d => d.status === 'Quá hạn').length
        const debtStatusCounts = safeDebts.reduce((acc: any, d) => {
            acc[d.status || 'Khác'] = (acc[d.status || 'Khác'] || 0) + 1
            return acc
        }, {})
        const debtRatio = totalContractValue === 0 ? 0 : (totalDebtAmount / totalContractValue) * 100
        const recoveryRate = totalContractValue === 0 ? 0 : (totalPaidAmount / totalContractValue) * 100

        const currentMonthRevenue = safeRevenue.filter(r => r.recorded_at && r.recorded_at >= monthStart).reduce((s, r) => s + (Number(r.amount) || 0), 0)
        const lastMonthRevenue = safeRevenue.filter(r => r.recorded_at && r.recorded_at >= lastMonthStart && r.recorded_at <= lastMonthEnd).reduce((s, r) => s + (Number(r.amount) || 0), 0)
        const revenueGrowthRate = lastMonthRevenue === 0 ? (currentMonthRevenue > 0 ? 100 : 0) : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100

        const monthlyTrends = Array.from({ length: 7 }).map((_, i) => {
            const date = subMonths(now, 6 - i)
            const mStart = startOfMonth(date).toISOString()
            const mEnd = endOfMonth(date).toISOString()
            const label = format(date, 'MMM')
            const rev = safeRevenue.filter(r => r.recorded_at && r.recorded_at >= mStart && r.recorded_at <= mEnd).reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
            const exp = safeExpense.filter(e => e.recorded_at && e.recorded_at >= mStart && e.recorded_at <= mEnd).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
            return { name: label, revenue: rev, expense: exp, profit: rev - exp }
        })

        const branchMetrics = safeBranches.map(branch => {
            const bRev = safeRevenue.filter(r => r.branch_id === branch.id).reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
            const bExp = safeExpense.filter(e => e.branch_id === branch.id).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
            return { id: branch.id, name: branch.name, revenue: bRev, expense: bExp, profit: bRev - bExp }
        })
        const bestBranch = [...branchMetrics].sort((a, b) => b.profit - a.profit)[0]?.name || 'N/A'

        return {
            success: true,
            data: {
                summary: {
                    totalCustomers,
                    currentMonthRevenue,
                    totalRevenue,
                    totalExpense,
                    netCashFlow: totalRevenue - totalExpense,
                    newThisMonth,
                    customerGrowthRate,
                    bestBranch,
                    revenueGrowthRate
                },
                branchPersonnel: {
                    branches: Object.values(branchLevelMetrics),
                    pts: Object.values(ptMetrics).sort((a, b) => b.totalWeightLoss - a.totalWeightLoss)
                },
                customers: {
                    statusCounts: customerStatusCounts,
                    sourceCounts: customerSourceCounts,
                    newThisMonth,
                    newLastMonth,
                    topSource,
                    activeRate
                },
                registrationRoutes: { counts: registrationRouteCounts, popularRoute },
                contracts: { statusCounts: contractStatusCounts, totalValue: totalContractValue, expiringCount, newContractsCount },
                debts: { totalAmount: totalDebtAmount, overdueCount: overdueDebtCount, statusCounts: debtStatusCounts, debtRatio, recoveryRate },
                finance: { monthlyTrends, branchMetrics, totalRevenue, totalExpense },
                topPerformers: { topPTs: Object.values(ptMetrics).map(p => ({ name: p.name, amount: p.revenue })).sort((a, b) => b.amount - a.amount).slice(0, 5) },
                counts: {
                    clients: safeClients.length,
                    contracts: safeContracts.length,
                    revenue: safeRevenue.length,
                    expense: safeExpense.length,
                    weights: filteredWeights.length,
                    debts: safeDebts.length
                }
            }
        }
    } catch (error: any) {
        console.error('Fetch Dashboard Metrics Error:', error)
        return { success: false, error: error.message || 'Lỗi không xác định' }
    }
}
