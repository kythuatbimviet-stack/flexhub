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
        let clientsQuery = supabase.from('clients').select('id, status, source, registration_type, created_at, pt_name, branch_id, member_name, branches(name)')
        let revenueQuery = supabase.from('revenue').select('id, amount, actual_amount, recorded_at, branch_id, customer_id, branches(name), clients(member_name)')
        let expenseQuery = supabase.from('expense').select('id, amount, recorded_at, branch_id, description, branches(name)')
        let debtsQuery = supabase.from('debts').select('id, remaining_amount, paid_amount, status, created_at, branch_id, branches(name), clients(member_name)')
        let contractsQuery = supabase.from('contracts').select('id, status, total_amount, package_name, end_date, created_at, branch_id, branches(name), clients(member_name)')
        let branchesQuery = supabase.from('branches').select('id, name, province')
        let weightQuery = supabase.from('weight_tracking').select('client_id, weight, measurement_date').order('measurement_date', { ascending: true })
        let trainingLogsQuery = supabase.from('training_logs').select('date, status, client_id')

        // Apply RBAC filters
        if (!accessInfo.access.canViewAllBranches && accessInfo.access.allowedBranchIds) {
            const branchIds = accessInfo.access.allowedBranchIds
            clientsQuery = clientsQuery.in('branch_id', branchIds)
            revenueQuery = revenueQuery.in('branch_id', branchIds)
            expenseQuery = expenseQuery.in('branch_id', branchIds)
            debtsQuery = debtsQuery.in('branch_id', branchIds)
            contractsQuery = contractsQuery.in('branch_id', branchIds)
        }

        // Apply UI filters
        if (filters?.startDate) {
            clientsQuery = clientsQuery.gte('created_at', filters.startDate)
            revenueQuery = revenueQuery.gte('recorded_at', filters.startDate)
            expenseQuery = expenseQuery.gte('recorded_at', filters.startDate)
            debtsQuery = debtsQuery.gte('created_at', filters.startDate)
            contractsQuery = contractsQuery.gte('created_at', filters.startDate)
            weightQuery = weightQuery.gte('measurement_date', filters.startDate)
            trainingLogsQuery = trainingLogsQuery.gte('date', filters.startDate)
        }
        if (filters?.endDate) {
            clientsQuery = clientsQuery.lte('created_at', filters.endDate)
            revenueQuery = revenueQuery.lte('recorded_at', filters.endDate)
            expenseQuery = expenseQuery.lte('recorded_at', filters.endDate)
            debtsQuery = debtsQuery.lte('created_at', filters.endDate)
            contractsQuery = contractsQuery.lte('created_at', filters.endDate)
            weightQuery = weightQuery.lte('measurement_date', filters.endDate)
            trainingLogsQuery = trainingLogsQuery.lte('date', filters.endDate)
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
            { data: weights, error: wErr },
            { data: logs, error: lErr }
        ] = await Promise.all([
            clientsQuery,
            revenueQuery,
            expenseQuery,
            debtsQuery,
            contractsQuery,
            branchesQuery,
            weightQuery,
            trainingLogsQuery
        ])

        if (cErr) console.error('Dashboard Fetch Clients Error:', cErr)
        if (rErr) console.error('Dashboard Fetch Revenue Error:', rErr)
        if (eErr) console.error('Dashboard Fetch Expense Error:', eErr)
        if (dErr) console.error('Dashboard Fetch Debts Error:', dErr)
        if (hErr) console.error('Dashboard Fetch Contracts Error:', hErr)
        if (bErr) console.error('Dashboard Fetch Branches Error:', bErr)
        if (wErr) console.error('Dashboard Fetch Weight Error:', wErr)
        if (lErr) console.error('Dashboard Fetch Training Logs Error:', lErr)

        const safeClients = clients || []
        const safeRevenue = revenue || []
        const safeExpense = expense || []
        const safeDebts = debts || []
        const safeContracts = contracts || []
        const safeBranches = branches || []
        const safeWeights = weights || []
        const safeLogs = logs || []
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
        const totalActualRevenue = safeRevenue.reduce((sum, r) => sum + (Number(r.actual_amount) || 0), 0)
        const totalExpense = safeExpense.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

        // --- Branch-level Reports (Renamed from Province) ---
        const branchLevelMetrics: Record<string, { branchName: string, revenue: number, expense: number, weightLoss: number }> = {}
        const branchIdToName: Record<string, string> = {}
        
        safeBranches.forEach(b => {
            const bName = b.name || 'Chi nhánh chưa tên'
            branchIdToName[b.id] = bName
            if (!branchLevelMetrics[bName]) {
                branchLevelMetrics[bName] = { branchName: bName, revenue: 0, expense: 0, weightLoss: 0 }
            }
        })

        safeRevenue.forEach((r: any) => {
            const bName = (r as any).branches?.name || branchIdToName[r.branch_id || ''] || 'Chi nhánh khác'
            if (!branchLevelMetrics[bName]) branchLevelMetrics[bName] = { branchName: bName, revenue: 0, expense: 0, weightLoss: 0 }
            branchLevelMetrics[bName].revenue += Number(r.actual_amount || r.amount) || 0
        })

        safeExpense.forEach((e: any) => {
            const bName = (e as any).branches?.name || branchIdToName[e.branch_id || ''] || 'Chi nhánh khác'
            if (!branchLevelMetrics[bName]) branchLevelMetrics[bName] = { branchName: bName, revenue: 0, expense: 0, weightLoss: 0 }
            branchLevelMetrics[bName].expense += Number(e.amount) || 0
        })

        const clientsWeights = filteredWeights.reduce((acc: any, w) => {
            if (!acc[w.client_id]) acc[w.client_id] = []
            acc[w.client_id].push(w)
            return acc
        }, {})

        safeClients.forEach((client: any) => {
            const bName = client.branches?.name || branchIdToName[client.branch_id || ''] || 'Chi nhánh khác'
            if (!branchLevelMetrics[bName]) branchLevelMetrics[bName] = { branchName: bName, revenue: 0, expense: 0, weightLoss: 0 }
            
            const clientWeights = clientsWeights[client.id] || []
            const monthlyWeights = clientWeights.filter((w: any) => w.measurement_date >= monthStart && w.measurement_date <= monthEnd)
            if (monthlyWeights.length >= 2) {
                const loss = (monthlyWeights[0].weight || 0) - (monthlyWeights[monthlyWeights.length - 1].weight || 0)
                branchLevelMetrics[bName].weightLoss += Math.max(0, loss)
            }
        })

        const ptMetrics: Record<string, { 
            name: string; 
            branchName: string;
            leads: Record<string, number>; 
            totalWeightLoss: number; 
            maxWeightLoss: number; 
            revenue: number; 
            actualRevenue: number; 
            totalSessions: number;
            completedSessions: number;
        }> = {}

        safeClients.forEach(client => {
            const ptName = client.pt_name || 'Chưa gán PT'
            if (!ptMetrics[ptName]) {
                const bNameFromJoin = (client as any).branches?.name || (Array.isArray((client as any).branches) ? (client as any).branches[0]?.name : undefined);
                ptMetrics[ptName] = { 
                    name: ptName, 
                    branchName: bNameFromJoin || branchIdToName[client.branch_id || ''] || 'Vãng lai',
                    leads: { 'Facebook': 0, 'tiktok': 0, 'Outdoor': 0, 'PR': 0, 'Tự kiếm': 0, 'Khác': 0 },
                    totalWeightLoss: 0,
                    maxWeightLoss: 0,
                    revenue: 0,
                    actualRevenue: 0,
                    totalSessions: 0,
                    completedSessions: 0
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
        safeRevenue.forEach((r: any) => {
            const client = safeClients.find(c => c.id === r.customer_id)
            const ptName = client?.pt_name || 'Chưa gán PT'
            if (ptMetrics[ptName]) {
                ptMetrics[ptName].revenue += Number(r.amount) || 0
                ptMetrics[ptName].actualRevenue += Number(r.actual_amount || r.amount) || 0
                if ((r as any).branches?.name || (Array.isArray((r as any).branches) && (r as any).branches[0]?.name)) {
                    ptMetrics[ptName].branchName = (r as any).branches?.name || (r as any).branches[0]?.name
                }
            }
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

        const contractValueByStatus = safeContracts.reduce((acc: any, h) => {
            const status = h.status || 'Khác'
            acc[status] = (acc[status] || 0) + (Number(h.total_amount) || 0)
            return acc
        }, {})

        const packagePerformance: Record<string, { name: string, count: number, value: number }> = {}
        safeContracts.forEach(h => {
            const pkg = h.package_name || 'Gói chưa tên'
            if (!packagePerformance[pkg]) packagePerformance[pkg] = { name: pkg, count: 0, value: 0 }
            packagePerformance[pkg].count++
            packagePerformance[pkg].value += Number(h.total_amount) || 0
        })
        const contractPackageDistribution = Object.values(packagePerformance)
            .sort((a, b) => b.value - a.value)
            .slice(0, 10)

        const activeStatuses = ['Đang tập', 'Đã ký HĐ', 'Đang hiệu lực']
        const nowStr = now.toISOString().split('T')[0]
        const thirtyDaysStr = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const expiringContracts = safeContracts.filter(h => 
            activeStatuses.includes(h.status || '') && 
            h.end_date && 
            h.end_date <= thirtyDaysStr && 
            h.end_date >= nowStr
        )
        const expiringCount = expiringContracts.length
        const expiringValue = expiringContracts.reduce((sum, h) => sum + (Number(h.total_amount) || 0), 0)
        
        const activeContracts = safeContracts.filter(h => activeStatuses.includes(h.status || ''))
        const activeValue = activeContracts.reduce((sum, h) => sum + (Number(h.total_amount) || 0), 0)
        
        const newContractsCount = safeContracts.filter(h => h.created_at && h.created_at >= monthStart).length
        const averageContractValue = safeContracts.length > 0 ? totalContractValue / safeContracts.length : 0

        const activeList = [...activeContracts]
            .sort((a, b) => (Number(b.total_amount) || 0) - (Number(a.total_amount) || 0))
            .slice(0, 10)

        const expiredOrExpiringContracts = safeContracts.filter(h => 
            (h.status === 'Hết hạn HĐ' || activeStatuses.includes(h.status || '')) && 
            h.end_date && 
            h.end_date <= thirtyDaysStr
        )
        const expiringList = [...expiredOrExpiringContracts]
            .sort((a, b) => (a.end_date || '').localeCompare(b.end_date || ''))
            .slice(0, 10)

        const totalDebtAmount = safeDebts.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0)
        const totalPaidAmount = safeDebts.reduce((sum, d) => sum + (Number(d.paid_amount) || 0), 0)
        const overdueDebtCount = safeDebts.filter(d => d.status === 'Quá hạn').length
        const debtStatusCounts = safeDebts.reduce((acc: any, d) => {
            acc[d.status || 'Khác'] = (acc[d.status || 'Khác'] || 0) + 1
            return acc
        }, {})
        const debtValueByStatus = safeDebts.reduce((acc: any, d) => {
            const s = d.status || 'Khác'
            acc[s] = (acc[s] || 0) + (Number(d.remaining_amount) || 0)
            return acc
        }, {})
        const topDebtorsList = [...safeDebts]
            .sort((a, b) => (Number(b.remaining_amount) || 0) - (Number(a.remaining_amount) || 0))
            .slice(0, 10)

        const debtTrends = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(now, 5 - i)
            const mStart = startOfMonth(date).toISOString()
            const mEnd = endOfMonth(date).toISOString()
            const label = format(date, 'MMM')
            const amount = safeDebts.filter(d => d.created_at && d.created_at >= mStart && d.created_at <= mEnd).reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0)
            return { name: label, value: amount }
        })

        const debtRatio = totalContractValue === 0 ? 0 : (totalDebtAmount / totalContractValue) * 100
        const recoveryRate = totalContractValue === 0 ? 0 : (totalPaidAmount / totalContractValue) * 100

        const currentMonthRevenue = safeRevenue.filter(r => r.recorded_at && r.recorded_at >= monthStart).reduce((s, r) => s + (Number(r.amount) || 0), 0)
        const currentMonthActualRevenue = safeRevenue.filter(r => r.recorded_at && r.recorded_at >= monthStart).reduce((s, r) => s + (Number(r.actual_amount || r.amount) || 0), 0)
        const lastMonthRevenue = safeRevenue.filter(r => r.recorded_at && r.recorded_at >= lastMonthStart && r.recorded_at <= lastMonthEnd).reduce((s, r) => s + (Number(r.amount) || 0), 0)
        const revenueGrowthRate = lastMonthRevenue === 0 ? (currentMonthRevenue > 0 ? 100 : 0) : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100

        const monthlyTrends = Array.from({ length: 7 }).map((_, i) => {
            const date = subMonths(now, 6 - i)
            const mStart = startOfMonth(date).toISOString()
            const mEnd = endOfMonth(date).toISOString()
            const label = format(date, 'MMM')
            const rev = safeRevenue.filter(r => r.recorded_at && r.recorded_at >= mStart && r.recorded_at <= mEnd).reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
            const actualRev = safeRevenue.filter(r => r.recorded_at && r.recorded_at >= mStart && r.recorded_at <= mEnd).reduce((sum, r) => sum + (Number(r.actual_amount || r.amount) || 0), 0)
            const exp = safeExpense.filter(e => e.recorded_at && e.recorded_at >= mStart && e.recorded_at <= mEnd).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
            
            const monthContracts = safeContracts.filter(h => h.created_at && h.created_at >= mStart && h.created_at <= mEnd)
            const conCount = monthContracts.length
            const conValue = monthContracts.reduce((sum, h) => sum + (Number(h.total_amount) || 0), 0)
            
            return { 
                name: label, 
                revenue: rev, 
                actualRevenue: actualRev, 
                expense: exp, 
                profit: actualRev - exp,
                contractCount: conCount,
                contractValue: conValue
            }
        })

        const branchMetrics = safeBranches.map(branch => {
            const bRev = safeRevenue
                .filter(r => String(r.branch_id) === String(branch.id))
                .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
            const bActualRev = safeRevenue
                .filter(r => String(r.branch_id) === String(branch.id))
                .reduce((sum, r) => sum + (Number(r.actual_amount || r.amount) || 0), 0)
            const bExp = safeExpense
                .filter(e => String(e.branch_id) === String(branch.id))
                .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
            
            return { 
                id: branch.id, 
                name: branch.name, 
                revenue: bRev, 
                actualRevenue: bActualRev, 
                expense: bExp, 
                profit: bActualRev - bExp 
            }
        })
        
        // Final fallback for Best Branch calculation
        const bestBranch = [...branchMetrics].sort((a, b) => b.profit - a.profit)[0]?.name || 
                          Object.values(branchLevelMetrics).sort((a: any, b: any) => b.revenue - a.revenue)[0]?.branchName || 
                          'N/A'

        // --- 7. Training Logs Statistics ---
        const filteredLogs = safeLogs.filter(l => allowedClientIdSet.has(l.client_id))
        const trainingStatusCounts = filteredLogs.reduce((acc: any, l) => {
            acc[l.status || 'Khác'] = (acc[l.status || 'Khác'] || 0) + 1
            return acc
        }, {})

        const sessionsByDate: Record<string, number> = {}
        filteredLogs.forEach(l => {
            if (l.date) {
                sessionsByDate[l.date] = (sessionsByDate[l.date] || 0) + 1
            }
        })
        const trainingTrends = Object.entries(sessionsByDate)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name))

        // Link logs to PTs for consistency metrics
        filteredLogs.forEach(l => {
            const client = safeClients.find(c => c.id === l.client_id)
            const ptName = client?.pt_name || 'Chưa gán PT'
            if (ptMetrics[ptName]) {
                ptMetrics[ptName].totalSessions++
                if (l.status === 'Y') {
                    ptMetrics[ptName].completedSessions++
                }
            }
        })

        // Aggregate global weight trends
        const weightsByDate: Record<string, { total: number, count: number }> = {}
        filteredWeights.forEach(w => {
            if (w.measurement_date) {
                const date = w.measurement_date
                if (!weightsByDate[date]) weightsByDate[date] = { total: 0, count: 0 }
                weightsByDate[date].total += (Number(w.weight) || 0)
                weightsByDate[date].count++
            }
        })
        const aggregateWeightTrends = Object.entries(weightsByDate)
            .map(([name, data]) => ({ name, value: data.total / data.count }))
            .sort((a, b) => a.name.localeCompare(b.name))

        // PT Performance by consistency
        const topConsistencyPTs = Object.values(ptMetrics)
            .filter(p => p.totalSessions >= 5) // Only PTs with significant data
            .map(p => ({
                name: p.name,
                branchName: p.branchName,
                consistency: (p.completedSessions / p.totalSessions) * 100,
                totalSessions: p.totalSessions
            }))
            .sort((a, b) => b.consistency - a.consistency)
            .slice(0, 5)

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
                    totalActualRevenue: safeRevenue.reduce((s, r) => s + (Number(r.actual_amount || r.amount) || 0), 0),
                    currentMonthActualRevenue,
                    ptPerformance: Object.values(ptMetrics).sort((a, b) => b.revenue - a.revenue)
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
                contracts: { 
                    statusCounts: contractStatusCounts, 
                    valueByStatus: contractValueByStatus,
                    packageDistribution: contractPackageDistribution,
                    totalValue: totalContractValue, 
                    totalCount: safeContracts.length,
                    expiringCount, 
                    expiringValue,
                    activeValue,
                    activeCount: activeContracts.length,
                    activeList,
                    expiringList,
                    newContractsCount,
                    acv: averageContractValue
                },
                debts: { 
                    totalAmount: totalDebtAmount, 
                    overdueCount: overdueDebtCount, 
                    statusCounts: debtStatusCounts, 
                    valueByStatus: debtValueByStatus,
                    trends: debtTrends,
                    topDebtors: topDebtorsList,
                    debtRatio, 
                    recoveryRate 
                },
                finance: { 
                    monthlyTrends, 
                    branchMetrics: Object.values(branchLevelMetrics).map(b => ({
                        name: b.branchName,
                        revenue: b.revenue,
                        expense: b.expense,
                        profit: b.revenue - b.expense
                    })), 
                    totalRevenue: safeRevenue.reduce((s, r) => s + (Number(r.amount) || 0), 0), 
                    totalActualRevenue,
                    totalExpense: safeExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0),
                    totalProfit: totalActualRevenue - totalExpense,
                    profitMargin: totalActualRevenue === 0 ? 0 : ((totalActualRevenue - totalExpense) / totalActualRevenue) * 100,
                    topTransactions: [...safeRevenue].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)).slice(0, 10),
                    revenueGrowthRate,
                    expenseGrowthRate: (() => {
                        const totalExpense = safeExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0)
                        const lastMonthExpense = safeExpense.filter(e => e.recorded_at && e.recorded_at >= lastMonthStart && e.recorded_at <= lastMonthEnd).reduce((s, e) => s + (Number(e.amount) || 0), 0)
                        return lastMonthExpense === 0 ? (totalExpense > 0 ? 100 : 0) : ((totalExpense - lastMonthExpense) / lastMonthExpense) * 100
                    })(),
                    expenseRatio: (() => {
                        const totalActualRevenue = safeRevenue.reduce((s, r) => s + (Number(r.actual_amount || r.amount) || 0), 0)
                        const totalExpense = safeExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0)
                        return totalActualRevenue === 0 ? 0 : (totalExpense / totalActualRevenue) * 100
                    })(),
                    topExpenses: [...safeExpense].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)).slice(0, 10),
                    cashFlowTransactions: [
                        ...safeRevenue.map(r => ({ 
                            id: r.id, 
                            amount: Number(r.actual_amount || r.amount) || 0, 
                            type: 'revenue' as const, 
                            description: (r as any).clients?.member_name || (Array.isArray((r as any).clients) ? (r as any).clients[0]?.member_name : undefined) || 'Hội viên nạp tiền', 
                            date: r.recorded_at, 
                            branch: (r as any).branches?.name || (Array.isArray((r as any).branches) ? (r as any).branches[0]?.name : undefined)
                        })),
                        ...safeExpense.map(e => ({ 
                            id: e.id, 
                            amount: -(Number(e.amount) || 0), 
                            type: 'expense' as const, 
                            description: e.description || 'Chi phí vận hành', 
                            date: e.recorded_at, 
                            branch: (e as any).branches?.name || (Array.isArray((e as any).branches) ? (e as any).branches[0]?.name : undefined)
                        }))
                    ].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 10)
                },
                training: {
                    statusCounts: trainingStatusCounts,
                    trends: trainingTrends,
                    totalSessions: filteredLogs.length,
                    topConsistencyPTs,
                    weightTrends: aggregateWeightTrends
                },
                topPerformers: { topPTs: Object.values(ptMetrics).map(p => ({ name: p.name, branchName: p.branchName, amount: p.revenue })).sort((a: any, b: any) => b.amount - a.amount).slice(0, 5) },
                counts: {
                    clients: safeClients.length,
                    contracts: safeContracts.length,
                    revenue: safeRevenue.length,
                    expense: safeExpense.length,
                    weights: filteredWeights.length,
                    debts: safeDebts.length,
                    logs: safeLogs.length
                }
            }
        }
    } catch (error: any) {
        console.error('Fetch Dashboard Metrics Error:', error)
        return { success: false, error: error.message || 'Lỗi không xác định' }
    }
}
