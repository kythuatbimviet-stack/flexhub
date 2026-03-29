'use client'

import * as React from 'react'
import {
    Search, Filter, MoreHorizontal, Edit2, Trash2, Mail, Phone,
    FileDown, Trash, Loader2, Activity, Dumbbell, RotateCcw,
    ChevronRight, ChevronLeft, TrendingUp, Users, Target, UserStar, Check,
    Building2, FilePlus2, ArrowUpDown, ChevronUp, ChevronDown, Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
import { fetchClientConfigs } from '@/app/actions/config-params'
import { ClientDetailsSheet } from '@/components/clients/client-details-sheet'
import { ImportExcelClientDialog } from '@/components/clients/import-excel-client-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchClientsPage, bulkDeleteClients } from '@/app/actions/clients'
import { fetchBranches } from '@/app/actions/branches'
import { ContractDetailsSheet } from '@/components/contracts/contract-details-sheet'
import { AddWeightDialog } from '@/components/weight-tracking/add-weight-dialog'
import { useRouter } from 'next/navigation'
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar'

const THIRTY_MINUTES = 30 * 60 * 1000

export default function ClientsPage() {
    const queryClient = useQueryClient()
    const router = useRouter()

    const [searchTerm, setSearchTerm] = React.useState('')
    const [debouncedSearch, setDebouncedSearch] = React.useState('')
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(20)
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedClient, setSelectedClient] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [isContractCreateOpen, setIsContractCreateOpen] = React.useState(false)
    const [contractInitialClient, setContractInitialClient] = React.useState<any>(null)

    // Filter states
    const [statusFilter, setStatusFilter] = React.useState('all')
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [ptFilter, setPtFilter] = React.useState('all')
    const [regTypeFilter, setRegTypeFilter] = React.useState('all')
    const [sourceFilter, setSourceFilter] = React.useState('all')
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)
    const [sortConfig, setSortConfig] = React.useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' })
    const [isSortOpen, setIsSortOpen] = React.useState(false)

    // Debounce search
    React.useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1) }, 400)
        return () => clearTimeout(t)
    }, [searchTerm])
    React.useEffect(() => { setPage(1) }, [statusFilter, branchFilter, ptFilter, regTypeFilter, sourceFilter, pageSize])

    // ── Data from global cache ────────────────────────────────────────────────
    const { data: configResult } = useQuery({
        queryKey: ['client-configs'],
        queryFn: fetchClientConfigs,
        staleTime: Infinity,
    })
    const clientStatuses = React.useMemo(() => configResult?.data?.statuses || [], [configResult])

    const { data: branches = [] } = useQuery<any[]>({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: Infinity,
    })

    // ── Server-side paginated data ────────────────────────────────────────────
    const clientsQuery = useQuery({
        queryKey: [
            'clients-page',
            page, pageSize, debouncedSearch, statusFilter, branchFilter, ptFilter, regTypeFilter, sourceFilter,
            sortConfig.key, sortConfig.direction
        ],
        queryFn: async () => {
            const res = await fetchClientsPage({
                page,
                pageSize,
                search: debouncedSearch,
                status: statusFilter !== 'all' ? statusFilter : '',
                branch: branchFilter !== 'all' ? branchFilter : '',
                pt: ptFilter !== 'all' ? ptFilter : '',
                source: sourceFilter !== 'all' ? sourceFilter : '',
                regType: regTypeFilter !== 'all' ? regTypeFilter : '',
                sortKey: sortConfig.key,
                sortOrder: sortConfig.direction,
            })
            if (!res.success) throw new Error(res.error)
            return res
        },
        staleTime: THIRTY_MINUTES,
        placeholderData: (prev) => prev, // keep old data while fetching new page (no layout shift)
    })

    const statusCounts: Record<string, number> = clientsQuery.data?.statusCounts ?? {}
    const { data, isLoading, refetch: originalRefetch } = clientsQuery
    const pagedClients = React.useMemo(() => data?.data || [], [data])
    const totalCount = data?.count || 0
    const totalPages = Math.ceil(totalCount / pageSize)

    const refetch = () => {
        originalRefetch()
        queryClient.invalidateQueries({ queryKey: ['clients-page'] })
        queryClient.invalidateQueries({ queryKey: ['contracts-all'] })
        queryClient.invalidateQueries({ queryKey: ['revenue'] })
        queryClient.invalidateQueries({ queryKey: ['debts-all'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    }

    // For Export Excel — fetch all records once (no filter) when user clicks export
    const { data: allClientsForExport = [] } = useQuery<any[]>({
        queryKey: ['clients-all-export'],
        queryFn: async () => {
            const res = await fetchClientsPage({ pageSize: -1 })
            return res.success ? (res.data ?? []) : []
        },
        staleTime: THIRTY_MINUTES,
        enabled: false, // only fetch when exportToExcel triggers refetch
    })

    // ── Filter option lists - derived from current page (server handles actual filtering) ──
    const ptOptions = React.useMemo(() =>
        Array.from(new Set(pagedClients.map((c: any) => c.pt_name).filter(Boolean))), [pagedClients])
    const regTypeOptions = React.useMemo(() =>
        Array.from(new Set(pagedClients.map((c: any) => c.registration_type).filter(Boolean))), [pagedClients])
    const sourceOptions = React.useMemo(() =>
        Array.from(new Set(pagedClients.map((c: any) => c.source).filter(Boolean))), [pagedClients])

    const stats = statusCounts

    const clearFilters = () => {
        setSearchTerm(''); setStatusFilter('all'); setBranchFilter('all')
        setPtFilter('all'); setRegTypeFilter('all'); setSourceFilter('all'); setPage(1)
        setSortConfig({ key: 'created_at', direction: 'desc' })
        toast.info('Đã xóa tất cả bộ lọc')
    }

    const SortPopover = () => {
        const [localSort, setLocalSort] = React.useState(sortConfig)

        const fields = [
            { label: 'Ngày tạo', value: 'created_at' },
            { label: 'Tên hội viên', value: 'member_name' },
            { label: 'Mã khách hàng', value: 'id' },
            { label: 'Số điện thoại', value: 'phone' },
            { label: 'Trạng thái', value: 'status' },
            { label: 'Hợp đồng mới nhất', value: 'updated_at' },
        ]

        return (
            <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-950 dark:text-gray-300 transition-all font-inter">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        <span className="text-[12px] font-medium text-black dark:text-gray-300">Sắp xếp: </span>
                        <span className="text-[12px] text-red-600 ml-1 font-semibold">
                            {fields.find(f => f.value === sortConfig.key)?.label} ({sortConfig.direction === 'asc' ? 'Tăng' : 'Giảm'})
                        </span>
                        <ChevronDown className="w-3 h-3 ml-1.5 text-gray-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 rounded-2xl shadow-xl border-gray-100 dark:border-gray-800" align="end">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-gray-900 dark:text-gray-300 pl-1">Ưu tiên theo</label>
                            <Select value={localSort.key} onValueChange={(v) => setLocalSort(prev => ({ ...prev, key: v }))}>
                                <SelectTrigger className="h-9 rounded-xl border-gray-200 bg-gray-50/10 font-medium text-xs text-gray-950 dark:text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100">
                                    {fields.map(f => <SelectItem key={f.value} value={f.value} className="font-medium">{f.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-gray-900 dark:text-gray-300 pl-1">Thứ tự</label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50/10 rounded-xl border border-gray-200/50">
                                <button
                                    onClick={() => setLocalSort(prev => ({ ...prev, direction: 'asc' }))}
                                    className={cn(
                                        "py-1.5 rounded-lg text-xs font-semibold transition-all",
                                        localSort.direction === 'asc' ? "bg-white shadow-sm text-red-600 border border-red-50" : "text-gray-900 dark:text-gray-400 hover:text-black"
                                    )}
                                >
                                    Tăng dần
                                </button>
                                <button
                                    onClick={() => setLocalSort(prev => ({ ...prev, direction: 'desc' }))}
                                    className={cn(
                                        "py-1.5 rounded-lg text-xs font-semibold transition-all",
                                        localSort.direction === 'desc' ? "bg-white shadow-sm text-red-600 border border-red-50" : "text-gray-900 dark:text-gray-400 hover:text-black"
                                    )}
                                >
                                    Giảm dần
                                </button>
                            </div>
                        </div>
                        <Button
                            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-9 font-medium shadow-sm transition-all active:scale-95 text-xs"
                            onClick={() => {
                                setSortConfig(localSort)
                                setIsSortOpen(false)
                                setPage(1)
                            }}
                        >
                            Đồng ý
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    const handleRowClick = (client: any, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
            (e.target as HTMLElement).tagName.toLowerCase() === 'label'
        ) return
        setSelectedClient(client); setIsDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn xóa khách hàng thì toàn bộ hợp đồng, công nợ, doanh thu liên quan đến khách hàng này sẽ bị xóa? Bạn có muốn tiếp tục không?')) return
        const result = await bulkDeleteClients([id])
        if (!result.success) {
            toast.error('Lỗi khi xóa: ' + result.error)
        } else {
            toast.success('Đã xóa hồ sơ khách hàng thành công')
            refetch()
        }
    }

    const handleBulkDelete = async () => {
        if (!selectedRows.length) return
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} hồ sơ đã chọn? Toàn bộ hợp đồng, công nợ, doanh thu liên quan sẽ bị xóa. Bạn có muốn tiếp tục không?`)) return
        const result = await bulkDeleteClients(selectedRows)
        if (!result.success) {
            toast.error('Lỗi khi xóa hàng loạt: ' + result.error)
        } else {
            toast.success(`Đã xóa thành công ${selectedRows.length} hồ sơ`)
            setSelectedRows([])
            refetch()
        }
    }

    const exportToExcel = () => {
        const dataToExport = pagedClients.length > 0
            ? pagedClients.map((c: any) => ({
                'Mã KH': c.id,
                'Tên hội viên': c.member_name,
                'Số điện thoại': c.phone,
                'Email': c.email,
                'Địa chỉ': c.address,
                'Ngày sinh': c.date_of_birth,
                'Tuổi': c.age,
                'Chiều cao': c.height,
                'Cân nặng': c.weight,
                'Mục tiêu cân nặng': c.target_weight,
                'Mục tiêu': c.goal,
                'Trạng thái': c.status,
                'Tên PT phụ trách': c.pt_name,
                'PT được gán (Email)': c.assigned_pt,
                'Mã chi nhánh': c.branch_id,
                'Tên chi nhánh': c.branch_name || c.branch_id || 'Hệ thống',
                'Nguồn khách': c.source,
                'Người giới thiệu': c.referrer,
                'Loại đăng ký': c.registration_type,
                'Tiền sử bệnh lý': c.medical_history,
                'Thời gian tập luyện': c.training_time,
                'Ghi chú': c.notes,
                'Chu kỳ khách hàng': c.customer_cycle,
                'Zalo ID': c.zalo_id,
                'Facebook ID': c.facebook_id,
                'Lịch sử tác động': c.action_log,
                'dob': c.dob,
                'URL chữ ký': c.signature_url,
                'Người tạo (ID)': c.created_by,
                'Email người tạo': c.created_by_email,
                'Ngày tạo': c.created_at ? new Date(c.created_at).toLocaleString('vi-VN') : '',
                'Ngày cập nhật': c.updated_at ? new Date(c.updated_at).toLocaleString('vi-VN') : '',
            }))
            : [{ 'Thông báo': 'Danh sách trống' }]
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Clients')
        XLSX.writeFile(wb, 'eva_fit_clients_full_export.xlsx')
        toast.success('Đã xuất file Excel thành công với 32 trường dữ liệu')
    }

    const toggleRow = (id: string) =>
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
    const toggleAll = () =>
        setSelectedRows(selectedRows.length === pagedClients.length ? [] : pagedClients.map((c: any) => c.id))

    return (
        <div className="space-y-1.5 font-inter pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Users className="w-8 h-8 text-[#FD5771]" />
                        Khách hàng
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Quản lý và theo dõi thông tin hội viên chi tiết.</p>
                </div>
                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {selectedRows.length > 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}>
                                <Button variant="ghost" onClick={handleBulkDelete}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium px-4 h-11 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <Trash className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Xóa ({selectedRows.length})</span>
                                    <span className="sm:hidden">{selectedRows.length}</span>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex gap-2">
                        <ImportExcelClientDialog onSuccess={refetch} />
                        <Button variant="ghost" onClick={exportToExcel}
                            className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 h-11 px-4 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all">
                            <FileDown className="w-4.5 h-4.5 mr-2" />
                            <span className="hidden sm:inline">Xuất Excel</span>
                        </Button>
                        <Button onClick={() => { setSelectedClient(null); setIsDetailsOpen(true); }} 
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-11 transition-colors shadow-sm font-medium dark:shadow-red-900/20 active:scale-95">
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Thêm Khách hàng</span>
                            <span className="sm:hidden">Thêm mới</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }} className="w-full">
                <TabsList className="bg-transparent h-auto p-0 flex flex-nowrap overflow-x-auto no-scrollbar gap-1 px-1 mb-1 w-full justify-start">
                    <TabsTrigger value="all" className={cn("flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm border-none text-gray-600 hover:text-gray-700 data-[state=active]:text-red-600")}>
                        Tất cả
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">{stats.total}</span>
                    </TabsTrigger>
                    {clientStatuses.map((s: any) => (
                        <TabsTrigger key={s.id} value={s.nam} className={cn("flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm border-none text-gray-500 hover:text-gray-700 data-[state=active]:text-red-600")}>
                            {s.nam}
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">{stats[s.nam] || 0}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Filter Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 py-0">
                <div className="py-1 px-1 sm:px-1.5 bg-gray-50/10 dark:bg-gray-800/20 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                <Input placeholder="Tìm tên, SĐT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-sm" />
                            </div>
                            <Button variant="outline" size="icon"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={cn("lg:hidden h-9 w-9 rounded-lg border-gray-200 dark:border-gray-800 transition-all",
                                    showMobileFilters ? "bg-red-50 text-red-600 border-red-200" : "bg-white dark:bg-gray-800/50")}>
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>

                        <AnimatePresence>
                            {(showMobileFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                                <motion.div
                                    initial={typeof window !== 'undefined' && window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                                    animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden lg:overflow-visible lg:flex lg:flex-row lg:items-center gap-2">
                                    <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center pt-2 lg:pt-0">
                                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3">
                                                <SelectValue placeholder="Chi nhánh" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả Chi nhánh</SelectItem>
                                                {branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={ptFilter} onValueChange={setPtFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3">
                                                <SelectValue placeholder="PT" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả PT</SelectItem>
                                                {ptOptions.map((pt: any) => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={regTypeFilter} onValueChange={setRegTypeFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3">
                                                <SelectValue placeholder="Gói tập" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả Gói tập</SelectItem>
                                                {regTypeOptions.map((t: any) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3">
                                                <SelectValue placeholder="Nguồn khách" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả Nguồn</SelectItem>
                                                {sourceOptions.map((s: any) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                            <SortPopover />
                                            <Button variant="ghost" onClick={clearFilters}
                                                className="h-9 px-3 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 transition-all col-span-2 lg:col-span-1 justify-center">
                                                <RotateCcw className="w-4 h-4 mr-2 lg:mr-0" />
                                                <span className="lg:hidden text-sm">Làm mới bộ lọc</span>
                                            </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pagination controls (top) */}
                    {!isLoading && totalCount > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-3 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/10 gap-4 mt-1 rounded-b-xl">
                            <div className="flex items-center gap-4">
                                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
                                    <span className="text-gray-900 dark:text-gray-100 font-black">{pagedClients.length}</span> / {totalCount} khách
                                </div>
                                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                                    <SelectTrigger className="h-7 w-16 rounded-lg border-gray-100 dark:border-gray-800 text-[10px] font-bold focus:ring-red-500 bg-white dark:bg-gray-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="30">30</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="-1">Tất cả</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {pageSize !== -1 && totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <Button variant="outline" size="sm" disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className="rounded-lg border-gray-100 dark:border-gray-800 h-7 px-2 text-[10px] font-bold bg-white dark:bg-gray-800">
                                        <ChevronLeft className="w-3 h-3 mr-1" />Trước
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                            let pn = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
                                            return (
                                                <Button key={pn} variant={page === pn ? 'default' : 'outline'} size="sm"
                                                    onClick={() => setPage(pn)}
                                                    className={cn('w-7 h-7 rounded-lg p-0 text-[10px] font-black',
                                                        page === pn ? 'bg-red-600 hover:bg-red-700' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800')}>
                                                    {pn}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                    <Button variant="outline" size="sm" disabled={page === totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        className="rounded-lg border-gray-100 dark:border-gray-800 h-7 px-2 text-[10px] font-bold bg-white dark:bg-gray-800">
                                        Sau<ChevronRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Table */}
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-50 dark:border-gray-800 hover:bg-transparent border-t-0">
                                <TableHead className="w-12 pl-6 h-9">
                                    <Checkbox
                                        checked={selectedRows.length === pagedClients.length && pagedClients.length > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-gray-300 dark:border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-black text-black dark:text-blue-300 h-9">
                                    Hội viên
                                </TableHead>
                                <TableHead className="text-[11px] font-black text-black dark:text-blue-300 h-9 hidden md:table-cell">
                                    Liên hệ
                                </TableHead>
                                <TableHead className="text-[11px] font-black text-black dark:text-blue-300 h-9 hidden sm:table-cell">
                                    PT & Chi nhánh
                                </TableHead>
                                <TableHead className="text-[11px] font-black text-black dark:text-blue-300 h-9 hidden lg:table-cell">Chỉ số & Mục tiêu</TableHead>
                                <TableHead className="text-[11px] font-black text-black dark:text-blue-300 h-9">
                                    Trạng thái
                                </TableHead>
                                <TableHead className="text-right pr-8 text-[11px] font-black text-black dark:text-blue-300 h-9">
                                    Tùy chọn
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-24" /></div></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell className="text-right pr-8"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : pagedClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                                                <Users className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                            </div>
                                            <p className="text-gray-400 text-sm font-medium">Thêm hội viên đầu tiên</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedClients.map((client: any) => (
                                    <TableRow key={client.id} onClick={(e) => handleRowClick(client, e)}
                                        className={cn('border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer group transition-colors',
                                            selectedRows.includes(client.id) && 'bg-red-50/30 dark:bg-red-950/20')}>
                                        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox checked={selectedRows.includes(client.id)}
                                                onCheckedChange={() => toggleRow(client.id)} className="rounded-lg" />
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border-2 border-white dark:border-gray-800 shadow-sm">
                                                    <AvatarImage src={client.avatar_url} alt={client.member_name} className="object-cover" />
                                                    <AvatarFallback className="bg-red-50 text-red-600 font-medium text-[10px]">
                                                        {client.member_name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-black dark:text-gray-100 flex items-center gap-1.5 uppercase font-inter tracking-tight">
                                                        {client.member_name}
                                                        {client.status === 'Đang tập' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                                                    </span>
                                                    <span className="text-[10px] text-red-600 dark:text-red-500 font-bold tracking-tight">{client.id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-col text-sm text-slate-800 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500" />{client.phone || '-'}</div>
                                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 text-[11px] font-medium"><Mail className="w-3 h-3" />{client.email || 'N/A'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="flex flex-col text-sm text-slate-800 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5"><Dumbbell className="w-3 h-3 text-red-500" />{client.pt_name || 'Chưa gán PT'}</div>
                                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 text-[11px] font-medium"><Building2 className="w-3 h-3" />{branches.find((b: any) => b.id === client.branch_id)?.name || 'Hệ thống'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex flex-col text-[11px] text-slate-800 dark:text-gray-300 leading-normal font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Activity className="w-3 h-3 text-red-500" />
                                                    {client.height ? `${client.height}cm` : '-'} | {client.weight ? `${client.weight}kg` : '-'} → {client.target_weight ? `${client.target_weight}kg` : '-'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 line-clamp-1 max-w-[150px]">
                                                    <Target className="w-3 h-3" />
                                                    {client.medical_history || 'Không có tiền sử bệnh lý'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={cn(
                                                'border-none rounded-xl px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-widest',
                                                client.status === 'Chốt đăng kí' && 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30',
                                                client.status === 'Đang tập' && 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 border border-green-100 dark:border-green-900/30',
                                                client.status === 'Tạm dừng' && 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30',
                                                client.status === 'Đã nghỉ' && 'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
                                            )}>
                                                {client.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setIsDetailsOpen(true) }}
                                                    className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-gray-500" title="Chỉnh sửa">
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setContractInitialClient(client)
                                                        setIsContractCreateOpen(true)
                                                    }}
                                                    className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 text-gray-500" 
                                                    title="Thêm hợp đồng"
                                                >
                                                    <FilePlus2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <AddWeightDialog onSuccess={refetch} clients={pagedClients} initialClientId={client.id}
                                                    triggerOverride={
                                                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}
                                                            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-gray-500" title="Thêm lộ trình">
                                                            <Activity className="h-3.5 w-3.5" />
                                                        </Button>
                                                    }
                                                />
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-gray-400">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100 dark:border-gray-800">
                                                        <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">Tác vụ hội viên</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setIsDetailsOpen(true) }}
                                                            className="flex items-center gap-2 px-3 py-2 cursor-pointer focus:bg-gray-50 dark:focus:bg-gray-800 rounded-lg mx-1">
                                                            <Edit2 className="w-3.5 h-3.5 text-blue-500" /><span className="text-sm font-medium">Chỉnh sửa hồ sơ</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/weight-tracking?clientId=${client.id}`) }}
                                                            className="flex items-center gap-2 px-3 py-2 cursor-pointer focus:bg-gray-50 dark:focus:bg-gray-800 rounded-lg mx-1">
                                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span className="text-sm font-medium">Xem lộ trình</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 my-1 mx-1" />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`tel:${client.phone}`, '_self') }}
                                                            className="flex items-center gap-2 px-3 py-2 cursor-pointer focus:bg-gray-50 dark:focus:bg-gray-800 rounded-lg mx-1">
                                                            <Phone className="w-3.5 h-3.5 text-indigo-500" /><span className="text-sm font-medium">Gọi điện</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push('/zalo-users') }}
                                                            className="flex items-center gap-2 px-3 py-2 cursor-pointer focus:bg-gray-50 dark:focus:bg-gray-800 rounded-lg mx-1">
                                                            <UserStar className="w-3.5 h-3.5 text-sky-500" /><span className="text-sm font-medium">Mời quan tâm Zalo</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 my-1 mx-1" />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(client.id) }}
                                                            className="flex items-center gap-2 px-3 py-2 cursor-pointer focus:bg-rose-50 dark:focus:bg-rose-950/20 text-rose-600 rounded-lg mx-1">
                                                            <Trash2 className="w-3.5 h-3.5" /><span className="text-sm font-medium">Xóa hồ sơ</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <ClientDetailsSheet client={selectedClient} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} onSuccess={refetch} />
            <ContractDetailsSheet
                contract={null}
                open={isContractCreateOpen}
                onOpenChange={setIsContractCreateOpen}
                onSuccess={refetch}
                initialClientId={contractInitialClient?.id}
                initialClient={contractInitialClient}
            />
        </div>
    )
}
