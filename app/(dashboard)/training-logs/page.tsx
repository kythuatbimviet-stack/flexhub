'use client'

import * as React from 'react'
import { HeartHandshake, ClipboardList, Filter, LayoutGrid } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrainingLogStats } from '@/components/training-logs/training-log-stats'
import { TrainingLogFilters } from '@/components/training-logs/training-log-filters'
import { TrainingLogTable } from '@/components/training-logs/training-log-table'
import { fetchTrainingLogsReport } from '@/app/actions/training-logs'
import { fetchBranches } from '@/app/actions/branches'
import { fetchClientFilterOptions } from '@/app/actions/clients'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'

export default function TrainingLogsPage() {
    const { permissions, isLoading: isLoadingPermissions } = usePermissions()
    
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [ptFilter, setPtFilter] = React.useState('all')
    const [statusFilter, setStatusFilter] = React.useState('all')
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
        queryKey: ['training-logs-report', branchFilter, ptFilter, statusFilter, debouncedClientSearch],
        queryFn: () => fetchTrainingLogsReport({
            branchId: branchFilter === 'all' ? undefined : branchFilter,
            ptName: ptFilter === 'all' ? undefined : ptFilter,
            status: statusFilter === 'all' ? undefined : statusFilter,
            clientSearch: debouncedClientSearch || undefined
        })
    })

    const reportData = reportResult?.data || []
    const stats = reportResult?.stats || { total: 0, y: 0, n: 0, td: 0 }

    const handleClearFilters = () => {
        setBranchFilter('all')
        setPtFilter('all')
        setStatusFilter('all')
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
                        <p className="text-[13px] text-gray-500 font-medium leading-none mt-1">Báo cáo chi tiết việc đi tập của hội viên.</p>
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
                    clientSearch={clientSearch}
                    setClientSearch={setClientSearch}
                    onClear={handleClearFilters}
                    canViewAllBranches={permissions.canViewAllBranches}
                />
            </div>

            {/* Content Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
                        <TabsList className="bg-gray-100/50 dark:bg-gray-800/50 p-1 h-9 rounded-xl border border-gray-100 dark:border-gray-800">
                            <TabsTrigger value="all" className="rounded-lg text-[12px] font-medium px-4 h-7 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
                                Tất cả ({stats.total})
                            </TabsTrigger>
                            <TabsTrigger value="Y" className="rounded-lg text-[12px] font-medium px-4 h-7 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                                Tập với PT ({stats.y})
                            </TabsTrigger>
                            <TabsTrigger value="N" className="rounded-lg text-[12px] font-medium px-4 h-7 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm">
                                Nghỉ tập ({stats.n})
                            </TabsTrigger>
                            <TabsTrigger value="TĐ" className="rounded-lg text-[12px] font-medium px-4 h-7 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">
                                Tự tập ({stats.td})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className={cn(
                        "flex items-center gap-2 text-[11px] font-medium transition-all duration-300",
                        isFetching ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
                    )}>
                        <div className="w-4 h-4 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
                        <span className="text-gray-400">Đang cập nhật dữ liệu...</span>
                    </div>
                </div>

                <TrainingLogTable 
                    data={reportData} 
                    isLoading={isLoading} 
                    branches={branches}
                />
            </div>
        </div>
    )
}
