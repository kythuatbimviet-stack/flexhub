'use client'

import React from 'react'
import {
    Search,
    Filter,
    TrendingUp,
    Plus,
    Calendar,
    User,
    Edit2,
    Trash2,
    RotateCcw,
    FileDown,
    Activity,
    ChevronDown,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format, isWithinInterval, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { fetchWeightRecords, fetchWeightRecordsRecent, deleteWeightRecord, deleteBulkWeightRecords } from '@/app/actions/weight-tracking'
import { fetchClients } from '@/app/actions/clients'
import { fetchContracts } from '@/app/actions/contracts'
import { fetchUsers } from '@/app/actions/users'
import { WeightChart } from '@/components/weight-tracking/weight-chart'
import { AddWeightDialog } from '@/components/weight-tracking/add-weight-dialog'
import { WeightDetailsSheet } from '@/components/weight-tracking/weight-details-sheet'
import { WeightGanttView } from '../../../components/weight-tracking/weight-gantt-view'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

export default function WeightTrackingPage() {
    const queryClient = useQueryClient()
    const searchParams = useSearchParams()
    const urlClientId = searchParams.get('clientId')

    const [selectedClientId, setSelectedClientId] = React.useState<string>(urlClientId || 'all')
    const [startDate, setStartDate] = React.useState<string>('')
    const [endDate, setEndDate] = React.useState<string>('')
    const [selectedRecord, setSelectedRecord] = React.useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)
    const [viewMode, setViewMode] = React.useState<'table' | 'gantt'>('gantt')
    const [searchTerm, setSearchTerm] = React.useState('')
    const [filterBranch, setFilterBranch] = React.useState('all')
    const [filterPT, setFilterPT] = React.useState('all')
    const [filterPackage, setFilterPackage] = React.useState('all')
    const [expandedClients, setExpandedClients] = React.useState<Set<string>>(new Set())
    const [selectedRecordIds, setSelectedRecordIds] = React.useState<Set<string>>(new Set())

    // ── Weight records — own cache key, staleTime 5 phút ──────────────────────
    const FIVE_MINUTES = 5 * 60 * 1000
    const THIRTY_MINUTES = 30 * 60 * 1000

    const { data: records = [], isLoading: isLoadingRecords, refetch: refetchRecords, error: queryError } = useQuery<any[]>({
        queryKey: ['weight-records'],
        queryFn: async () => {
            const res = await fetchWeightRecordsRecent(180) // ✅ 180 ngày gần nhất, filter server-side
            if (!res.success) throw new Error(res.error || 'Lỗi tải dữ liệu theo dõi cân nặng')
            return res.data ?? []
        },
        staleTime: FIVE_MINUTES,          // ✅ Tránh refetch liên tục khi focus tab
        refetchOnWindowFocus: false,       // ✅ Chỉ refetch khi user thao tác
        select: (data) => Array.isArray(data) ? data : [],
    })

    React.useEffect(() => {
        if (queryError) {
            toast.error('Lỗi tải dữ liệu: ' + (queryError as Error).message)
        }
    }, [queryError])

    // ── Clients — Reuse cache từ AppDataInitializer (key: 'clients-all') ──────
    const { data: clients = [] } = useQuery<any[]>({
        queryKey: ['clients-all'],         // ✅ Dùng đúng cache key chung
        queryFn: async () => {
            const res = await fetchClients()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: FIVE_MINUTES,
        select: (data) => Array.isArray(data) ? data : [],
    })

    // ── Contracts — Reuse cache từ AppDataInitializer (key: 'contracts-all') ──
    const { data: contracts = [] } = useQuery<any[]>({
        queryKey: ['contracts-all'],       // ✅ Dùng đúng cache key chung
        queryFn: async () => {
            const res = await fetchContracts()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: THIRTY_MINUTES,
        select: (data) => Array.isArray(data) ? data : [],
    })

    // ── Users — Ít thay đổi, cache 30 phút ───────────────────────────────────
    const { data: users = [] } = useQuery<any[]>({
        queryKey: ['users-all'],           // ✅ Key nhất quán, tránh duplicate
        queryFn: async () => {
            const res = await fetchUsers()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: THIRTY_MINUTES,         // ✅ Users ít thay đổi
        select: (data) => Array.isArray(data) ? data : [],
    })

    const branchOptions = React.useMemo(() => {
        const branches = new Set(contracts.map(c => c.facility_name).filter(Boolean))
        return Array.from(branches).sort()
    }, [contracts])

    const ptOptions = React.useMemo(() => {
        const pts = new Set(contracts.map(c => c.trainer_name).filter(Boolean))
        return Array.from(pts).sort()
    }, [contracts])

    const packageOptions = React.useMemo(() => {
        const pkgs = new Set(contracts.map(c => c.registration_type).filter(Boolean))
        return Array.from(pkgs).sort()
    }, [contracts])

    const refetchAll = () => {
        refetchRecords()
    }

    const filteredRecords = React.useMemo(() => {
        if (!Array.isArray(records)) return []
        return records.filter((record: any) => {
            const client = clients.find(c => c.id === record.client_id)
            if (!client) return false

            // Find latest contract for additional filtering
            const clientContracts = contracts
                .filter(con => con.client_id === record.client_id)
                .sort((a, b) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime())
            const contract = clientContracts[0]

            // Search Filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase().trim()
                const nameMatch = client.member_name?.toLowerCase().includes(search)
                const phoneMatch = client.phone?.includes(search)
                if (!nameMatch && !phoneMatch) return false
            }

            // Categorical Filters
            if (selectedClientId !== 'all' && record.client_id !== selectedClientId) return false
            if (filterBranch !== 'all' && contract?.facility_name !== filterBranch) return false
            if (filterPT !== 'all' && contract?.trainer_name !== filterPT) return false
            if (filterPackage !== 'all' && contract?.registration_type !== filterPackage) return false

            // Date Filter
            if (startDate || endDate) {
                const recordDate = parseISO(record.measurement_date)
                const start = startDate ? parseISO(startDate) : new Date(0)
                const end = endDate ? parseISO(endDate) : new Date()

                if (!isWithinInterval(recordDate, { start, end })) return false
            }

            return true
        })
    }, [records, clients, contracts, selectedClientId, searchTerm, filterBranch, filterPT, filterPackage, startDate, endDate])

    // Data for chart: only show if a specific client is filtered (e.g. via search)
    const chartData = React.useMemo(() => {
        const uniqueClientIds = new Set(filteredRecords.map(r => r.client_id))
        if (uniqueClientIds.size === 1) {
            return [...filteredRecords].sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime())
        }
        return []
    }, [filteredRecords])

    const groupedRecords = React.useMemo(() => {
        const groups: { [key: string]: any[] } = {}
        filteredRecords.forEach(record => {
            if (!groups[record.client_id]) groups[record.client_id] = []
            groups[record.client_id].push(record)
        })

        return Object.entries(groups).map(([clientId, clientRecords]) => {
            const sorted = [...clientRecords].sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime())
            const earliest = sorted[0]
            const latest = sorted[sorted.length - 1]
            const diff = latest.weight - earliest.weight
            const client = clients.find(c => c.id === clientId)

            return {
                clientId,
                clientName: client?.member_name || 'N/A',
                earliest,
                latest,
                diff,
                allRecords: sorted.reverse() // Most recent first in expansion
            }
        }).sort((a, b) => a.clientName.localeCompare(b.clientName))
    }, [filteredRecords, clients])

    const toggleExpand = (clientId: string) => {
        const newExpanded = new Set(expandedClients)
        if (newExpanded.has(clientId)) {
            newExpanded.delete(clientId)
        } else {
            newExpanded.add(clientId)
        }
        setExpandedClients(newExpanded)
    }

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => deleteBulkWeightRecords(ids),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(`Đã xóa ${selectedRecordIds.size} bản ghi thành công`)
                queryClient.invalidateQueries({ queryKey: ['weight-records'] })
                setSelectedRecordIds(new Set())
            } else {
                toast.error('Lỗi khi xóa hàng loạt: ' + res.error)
            }
        }
    })

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
            const result = await deleteWeightRecord(id)
            if (result.success) {
                toast.success('Đã xóa bản ghi thành công')
                queryClient.invalidateQueries({ queryKey: ['weight-records'] })
                const newSelected = new Set(selectedRecordIds)
                newSelected.delete(id)
                setSelectedRecordIds(newSelected)
            } else {
                toast.error('Lỗi khi xóa: ' + result.error)
            }
        }
    }

    const handleBulkDelete = () => {
        if (selectedRecordIds.size === 0) return
        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRecordIds.size} bản ghi đã chọn?`)) {
            bulkDeleteMutation.mutate(Array.from(selectedRecordIds))
        }
    }

    const toggleSelectRecord = (id: string) => {
        const newSelected = new Set(selectedRecordIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedRecordIds(newSelected)
    }

    const toggleSelectClient = (clientId: string, clientRecords: any[]) => {
        const newSelected = new Set(selectedRecordIds)
        const recordIds = clientRecords.map(r => r.id)
        const allSelected = recordIds.every(id => newSelected.has(id))

        if (allSelected) {
            recordIds.forEach(id => newSelected.delete(id))
        } else {
            recordIds.forEach(id => newSelected.add(id))
        }
        setSelectedRecordIds(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedRecordIds.size === filteredRecords.length) {
            setSelectedRecordIds(new Set())
        } else {
            setSelectedRecordIds(new Set(filteredRecords.map(r => r.id)))
        }
    }

    const exportToExcel = () => {
        const dataToExport = filteredRecords.map((r: any) => ({
            'Khách hàng': r.clients?.member_name || clients.find(c => c.id === r.client_id)?.member_name || 'N/A',
            'Ngày đo': format(new Date(r.measurement_date), 'dd/MM/yyyy'),
            'Cân nặng thực tế (kg)': r.weight,
            'Cân nặng mục tiêu (kg)': r.target_weight || '',
            'Chiều cao (cm)': r.height || '',
            'Ghi chú': r.measurements || '',
            'Ngày hẹn tiếp theo': r.next_measurement_date ? format(new Date(r.next_measurement_date), 'dd/MM/yyyy') : ''
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'WeightTracking')
        XLSX.writeFile(wb, 'lo_trinh_tang_can.xlsx')
        toast.success('Đã xuất file Excel')
    }

    const resetFilters = () => {
        setSearchTerm('')
        setFilterBranch('all')
        setFilterPT('all')
        setFilterPackage('all')
        setStartDate('')
        setEndDate('')
        toast.info('Đã xóa bộ lọc')
    }

    return (
        <div className="space-y-1.5 font-inter">
            <WeightDetailsSheet
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                record={selectedRecord}
                onSuccess={refetchAll}
                clients={clients}
                users={users}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-2 tracking-tight">
                        <Activity className="w-8 h-8 text-[#FD5771]" />
                        Tiến trình thay đổi
                    </h1>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">Theo dõi và quản lý chỉ số cơ thể của khách hàng theo thời gian.</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedRecordIds.size > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            className="rounded-xl h-11 px-4 transition-all font-medium shadow-lg shadow-red-200 dark:shadow-none"
                            disabled={bulkDeleteMutation.isPending}
                        >
                            {bulkDeleteMutation.isPending ? (
                                <Loader2 className="w-4.5 h-4.5 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="w-4.5 h-4.5 mr-2" />
                            )}
                            Xóa đã chọn ({selectedRecordIds.size})
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        onClick={exportToExcel}
                        className="rounded-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 h-11 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                        <FileDown className="w-4.5 h-4.5 mr-2" />
                        Xuất Excel
                    </Button>
                    <Button
                        variant={viewMode === 'gantt' ? 'default' : 'outline'}
                        onClick={() => setViewMode(viewMode === 'gantt' ? 'table' : 'gantt')}
                        className={cn(
                            "rounded-xl h-11 px-4 transition-all font-medium",
                            viewMode === 'gantt' ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none" : "border-slate-200 dark:border-slate-800 text-slate-600"
                        )}
                    >
                        <TrendingUp className="w-4.5 h-4.5 mr-2" />
                        Weight Gantt
                    </Button>
                    <AddWeightDialog onSuccess={refetchAll} clients={clients} />
                </div>
            </div>

            {viewMode === 'gantt' ? (
                <div className="px-1 h-[calc(100vh-165px)]">
                    {isLoadingRecords ? (
                        // Skeleton loading cho Gantt view
                        <div className="h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
                            <div className="flex h-full">
                                {/* Client list skeleton */}
                                <div className="w-48 border-r border-gray-100 dark:border-gray-800 flex-shrink-0 p-3 space-y-2">
                                    <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3" />
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="h-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl" style={{ opacity: 1 - i * 0.1 }} />
                                    ))}
                                </div>
                                {/* Gantt grid skeleton */}
                                <div className="flex-1 p-3 space-y-2">
                                    <div className="flex gap-1 mb-3">
                                        {Array.from({ length: 14 }).map((_, i) => (
                                            <div key={i} className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded" />
                                        ))}
                                    </div>
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="flex gap-1">
                                            {Array.from({ length: 14 }).map((_, j) => (
                                                <div key={j} className="flex-1 h-12 bg-gray-50 dark:bg-gray-800/30 rounded" style={{ opacity: Math.random() > 0.6 ? 0.5 : 0.15 }} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <WeightGanttView
                        records={records}
                            clients={clients}
                            contracts={contracts}
                            onSuccess={refetchAll}
                        />
                    )}
                </div>
            ) : (
                <>
                    {/* Optimized Compact Filter Section */}
                    <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 transition-all duration-300 py-0">
                        <div className="py-1 px-1 sm:px-1.5 border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-gray-800/20 rounded-xl">
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                                {/* Search & Toggle Row */}
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <Input
                                            placeholder="Tìm khách hàng..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="h-9 w-full pl-9 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 text-xs focus-visible:ring-1 focus-visible:ring-blue-500"
                                        />
                                    </div>

                                    {/* Mobile Filter Toggle */}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                                        className={cn(
                                            "lg:hidden h-9 w-9 rounded-lg border-gray-200 dark:border-gray-800 transition-all",
                                            showMobileFilters ? "bg-red-50 text-red-600 border-red-200 shadow-sm" : "bg-white dark:bg-gray-800/50"
                                        )}
                                    >
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Filters Content */}
                                <AnimatePresence>
                                    {(showMobileFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                                        <motion.div
                                            initial={typeof window !== 'undefined' && window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden lg:overflow-visible lg:flex lg:flex-row lg:items-center gap-2"
                                        >
                                            <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center pt-2 lg:pt-0">
                                                <div className="relative flex-1 lg:w-44">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        className="pl-10 h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm shadow-none"
                                                    />
                                                </div>
                                                <div className="relative flex-1 lg:w-44">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        className="pl-10 h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm shadow-none"
                                                    />
                                                </div>

                                                <div className="col-span-1 lg:w-48">
                                                    <Select value={filterBranch} onValueChange={setFilterBranch}>
                                                        <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs w-48">
                                                            <SelectValue placeholder="Chi nhánh" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                            <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                                            {branchOptions.map(opt => (
                                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="col-span-1 lg:w-48">
                                                    <Select value={filterPT} onValueChange={setFilterPT}>
                                                        <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs w-48">
                                                            <SelectValue placeholder="PT" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                            <SelectItem value="all">Tất cả PT</SelectItem>
                                                            {ptOptions.map(opt => (
                                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="col-span-2 lg:w-56">
                                                    <Select value={filterPackage} onValueChange={setFilterPackage}>
                                                        <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs w-56">
                                                            <SelectValue placeholder="Gói tập" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                            <SelectItem value="all">Tất cả gói tập</SelectItem>
                                                            {packageOptions.map(opt => (
                                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    onClick={resetFilters}
                                                    className="h-9 px-3 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all shrink-0 col-span-2 lg:col-span-1 justify-center lg:w-auto"
                                                >
                                                    <RotateCcw className="w-4 h-4 mr-2 lg:mr-0" />
                                                    <span className="lg:hidden text-sm font-medium">Làm mới bộ lọc</span>
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </Card>

                    {chartData.length > 0 && (
                        <div className="px-1">
                            <WeightChart data={chartData} />
                        </div>
                    )}

                    {/* Table Section */}
                    <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white dark:bg-gray-900 transition-all duration-500">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-gray-50 dark:border-gray-800 hover:bg-transparent border-t-0">
                                        <TableHead className="w-10 h-9 p-0 text-center">
                                            <Checkbox 
                                                checked={filteredRecords.length > 0 && selectedRecordIds.size === filteredRecords.length}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead className="w-10 h-9"></TableHead>
                                        <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Hội viên</TableHead>
                                        <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 text-center">Bắt đầu</TableHead>
                                        <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 text-center">Hiện tại</TableHead>
                                        <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 text-center">Thay đổi</TableHead>
                                        <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 text-right pr-8">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingRecords ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-sm">Đang tải dữ liệu...</TableCell>
                                        </TableRow>
                                    ) : groupedRecords.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                                                        <Activity className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                                    </div>
                                                    <p className="text-gray-400 text-sm font-medium">Thêm lộ trình đầu tiên</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        groupedRecords.map((group) => (
                                            <React.Fragment key={group.clientId}>
                                                <TableRow
                                                    className={cn(
                                                        "border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 group transition-colors cursor-pointer",
                                                        group.allRecords.some(r => selectedRecordIds.has(r.id)) && "bg-blue-50/30 dark:bg-blue-900/10"
                                                    )}
                                                    onClick={() => toggleExpand(group.clientId)}
                                                >
                                                    <TableCell className="w-10 p-0 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox 
                                                            checked={group.allRecords.every(r => selectedRecordIds.has(r.id))}
                                                            onCheckedChange={() => toggleSelectClient(group.clientId, group.allRecords)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3 text-center w-10">
                                                        {expandedClients.has(group.clientId) ?
                                                            <ChevronDown className="w-4 h-4 text-gray-400" /> :
                                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                                        }
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-bold text-gray-900 dark:text-white">{group.clientName}</span>
                                                            <span className="text-[11px] text-gray-400">{group.allRecords.length} lượt đo</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300">{group.earliest ? `${group.earliest.weight} kg` : '-'}</span>
                                                            {group.earliest && <span className="text-[10px] text-gray-400">{format(new Date(group.earliest.measurement_date), 'dd/MM/yyyy')}</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[13px] font-bold text-gray-900 dark:text-white">{group.latest ? `${group.latest.weight} kg` : '-'}</span>
                                                            {group.latest && <span className="text-[10px] text-gray-400">{format(new Date(group.latest.measurement_date), 'dd/MM/yyyy')}</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        {group.latest && group.earliest ? (
                                                            <div className={cn(
                                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-bold",
                                                                group.diff > 0 ? "bg-red-50 text-red-600" : group.diff < 0 ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-600"
                                                            )}>
                                                                {group.diff > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : group.diff < 0 ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : null}
                                                                {group.diff > 0 ? `+${group.diff.toFixed(1)} kg` : `${group.diff.toFixed(1)} kg`}
                                                            </div>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right py-3 pr-6">
                                                        <div className="flex justify-end gap-1">
                                                            {/* Placeholder for expansion indicator or actions if needed at group level */}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                <AnimatePresence>
                                                    {expandedClients.has(group.clientId) && (
                                                        <TableRow className="bg-gray-50/30 dark:bg-gray-900/40 border-none hover:bg-gray-50/30 dark:hover:bg-gray-900/40">
                                                            <TableCell colSpan={7} className="p-0">
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden border-l-2 border-red-500 ml-10 mb-2 mt-1"
                                                                >
                                                                    <Table>
                                                                        <TableHeader className="bg-transparent">
                                                                            <TableRow className="border-none hover:bg-transparent">
                                                                                <TableHead className="w-10 h-8 p-0 text-center"></TableHead>
                                                                                <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-4">Ngày đo</TableHead>
                                                                                <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-slate-400">Thực tế</TableHead>
                                                                                <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-slate-400">Cần đạt</TableHead>
                                                                                <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-slate-400">Chiều cao</TableHead>
                                                                                <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-slate-400">Hẹn tiếp theo</TableHead>
                                                                                <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right pr-8">Thao tác</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {group.allRecords.map((record: any) => (
                                                                                <TableRow
                                                                                    key={record.id}
                                                                                    className={cn(
                                                                                        "border-gray-100/50 dark:border-gray-800/50 hover:bg-white dark:hover:bg-gray-800/80 transition-colors cursor-pointer",
                                                                                        selectedRecordIds.has(record.id) && "bg-blue-50/50 dark:bg-blue-900/20"
                                                                                    )}
                                                                                    onClick={() => {
                                                                                        setSelectedRecord(record)
                                                                                        setIsDetailsOpen(true)
                                                                                    }}
                                                                                >
                                                                                    <TableCell className="w-10 p-0 text-center" onClick={(e) => e.stopPropagation()}>
                                                                                        <Checkbox 
                                                                                            checked={selectedRecordIds.has(record.id)}
                                                                                            onCheckedChange={() => toggleSelectRecord(record.id)}
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell className="py-2 pl-4 text-xs font-medium text-slate-900 dark:text-slate-200">
                                                                                        {format(new Date(record.measurement_date), 'dd/MM/yyyy')}
                                                                                    </TableCell>
                                                                                    <TableCell className="py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                                                        {record.weight} kg
                                                                                    </TableCell>
                                                                                    <TableCell className="py-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                                                                                        {record.target_weight || '-'} kg
                                                                                    </TableCell>
                                                                                    <TableCell className="py-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                                                                                        {record.height || '-'} cm
                                                                                    </TableCell>
                                                                                    <TableCell className="py-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                                                        {record.next_measurement_date ? format(new Date(record.next_measurement_date), 'dd/MM/yyyy') : '-'}
                                                                                    </TableCell>
                                                                                    <TableCell className="py-2 text-right pr-8">
                                                                                        <div className="flex justify-end gap-1">
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    setSelectedRecord(record)
                                                                                                    setIsDetailsOpen(true)
                                                                                                }}
                                                                                                className="w-7 h-7 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600"
                                                                                            >
                                                                                                <Edit2 className="h-3 w-3" />
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    handleDelete(record.id)
                                                                                                }}
                                                                                                className="w-7 h-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600"
                                                                                            >
                                                                                                <Trash2 className="h-3 w-3" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </motion.div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    )
}
