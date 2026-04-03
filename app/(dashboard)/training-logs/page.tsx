'use client'

import * as React from 'react'
import { HeartHandshake, ClipboardList, Filter, LayoutGrid } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { TrainingLogStats } from '@/components/training-logs/training-log-stats'
import { TrainingLogFilters } from '@/components/training-logs/training-log-filters'
import { TrainingLogTable } from '@/components/training-logs/training-log-table'
import { fetchTrainingLogsReport } from '@/app/actions/training-logs'
import { fetchBranches } from '@/app/actions/branches'
import { fetchClientFilterOptions } from '@/app/actions/clients'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function TrainingLogsPage() {
    const { permissions, isLoading: isLoadingPermissions } = usePermissions()
    
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [ptFilter, setPtFilter] = React.useState('all')
    const [startDate, setStartDate] = React.useState(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = React.useState(format(new Date(), 'yyyy-MM-dd'))
    const [clientSearch, setClientSearch] = React.useState('')
    const [debouncedClientSearch, setDebouncedClientSearch] = React.useState('')

    // Debounce client search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedClientSearch(clientSearch)
        }, 500)
        return () => clearTimeout(timer)
    }, [clientSearch])

    // Fetch branches for filter
    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? (res.data ?? []) : []
        }
    })

    // Fetch PTs for filter
    const { data: filterOptions } = useQuery({
        queryKey: ['client-filter-options'],
        queryFn: fetchClientFilterOptions
    })
    const pts = filterOptions?.data?.pts || []

    // Main data query
    const { data: reportResult, isLoading, isFetching } = useQuery({
        queryKey: ['training-logs-report', branchFilter, ptFilter, debouncedClientSearch, startDate, endDate],
        queryFn: () => fetchTrainingLogsReport({
            startDate: startDate,
            endDate: endDate,
            branchId: branchFilter === 'all' ? undefined : branchFilter,
            ptName: ptFilter === 'all' ? undefined : ptFilter,
            clientSearch: debouncedClientSearch || undefined
        })
    })

    const reportData = reportResult?.data || []
    const stats = reportResult?.stats || { total: 0, y: 0, n: 0, td: 0 }

    const groupedData = React.useMemo(() => {
        const groups: { [key: string]: any } = {}
        reportData.forEach((log: any) => {
            const clientId = log.client_id
            if (!groups[clientId]) {
                groups[clientId] = {
                    clientId,
                    client: log.client,
                    logs: [],
                    stats: { y: 0, n: 0, td: 0 }
                }
            }
            groups[clientId].logs.push(log)
            if (log.status === 'Y') groups[clientId].stats.y++
            if (log.status === 'N') groups[clientId].stats.n++
            if (log.status === 'TĐ') groups[clientId].stats.td++
        })
        return Object.values(groups).sort((a: any, b: any) => 
            (a.client?.member_name || '').localeCompare(b.client?.member_name || '')
        )
    }, [reportData])

    const handleClearFilters = () => {
        setBranchFilter('all')
        setPtFilter('all')
        setStartDate(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'))
        setEndDate(format(new Date(), 'yyyy-MM-dd'))
        setClientSearch('')
    }

    if (isLoadingPermissions) return null

    return (
        <div className="space-y-6 pb-12 font-inter animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center shadow-sm">
                        <HeartHandshake className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-medium text-black dark:text-gray-100 tracking-tight">Tần suất tập luyện</h1>
                        <p className="text-[13px] text-slate-600 font-medium leading-none mt-1">Báo cáo chi tiết việc đi tập của hội viên.</p>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <TrainingLogStats stats={stats} />

            {/* Filters Box */}
            <div className="sticky top-0 z-20 pt-1 -mt-1">
                <TrainingLogFilters 
                    branches={branches}
                    pts={pts}
                    branchFilter={branchFilter}
                    setBranchFilter={setBranchFilter}
                    ptFilter={ptFilter}
                    setPtFilter={setPtFilter}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    clientSearch={clientSearch}
                    setClientSearch={setClientSearch}
                    onClear={handleClearFilters}
                    canViewAllBranches={permissions.canViewAllBranches}
                />
            </div>

            {/* Content Section */}
            <div className="space-y-1">
                <div className={cn(
                    "flex items-center justify-end gap-2 text-[11px] font-medium transition-all duration-300 px-1 overflow-hidden",
                    isFetching ? "h-6 opacity-100 translate-x-0" : "h-0 opacity-0 translate-x-4 pointer-events-none"
                )}>
                    <div className="w-4 h-4 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
                    <span className="text-slate-900">Đang cập nhật dữ liệu...</span>
                </div>

                <TrainingLogTable 
                    data={groupedData} 
                    isLoading={isLoading} 
                    branches={branches}
                />
            </div>
        </div>
    )
}
