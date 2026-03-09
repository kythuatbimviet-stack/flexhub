'use client'

import * as React from 'react'
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    FileText,
    Calendar,
    Building2,
    CreditCard,
    Trash,
    Clock,
    BadgeCheck,
    Package,
    RotateCcw,
    FileDown,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fetchContracts, bulkDeleteContracts } from '@/app/actions/contracts'

import { AddContractDialog } from '@/components/contracts/add-contract-dialog'
import { ContractDetailsSheet } from '@/components/contracts/contract-details-sheet'
import { ImportExcelContractDialog } from '@/components/contracts/import-excel-contract-dialog'
import { fetchBranches } from '@/app/actions/branches'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import * as XLSX from 'xlsx'

const THIRTY_MINUTES = 30 * 60 * 1000

export default function ContractsPage() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = React.useState('')
    const [debouncedSearch, setDebouncedSearch] = React.useState('')
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(20)
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedContract, setSelectedContract] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)

    // Filter states
    const [statusFilter, setStatusFilter] = React.useState('all')
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [ptFilter, setPtFilter] = React.useState('all')
    const [contractTypeFilter, setContractTypeFilter] = React.useState('all')

    // Debounce search
    React.useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1) }, 400)
        return () => clearTimeout(t)
    }, [searchTerm])
    React.useEffect(() => { setPage(1) }, [statusFilter, branchFilter, ptFilter, contractTypeFilter, pageSize])

    // ── Data from global cache ────────────────────────────────────────────────
    const { data: contracts = [], isLoading } = useQuery<any[]>({
        queryKey: ['contracts-all'],
        queryFn: async () => {
            const res = await fetchContracts()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: THIRTY_MINUTES,
        select: (data) => Array.isArray(data) ? data : [],
    })

    const { data: branches = [] } = useQuery<any[]>({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: Infinity,
    })

    // ── Client-side filtering ─────────────────────────────────────────────────
    const filteredContracts = React.useMemo(() => {
        return (contracts ?? []).filter((c: any) => {
            if (debouncedSearch) {
                const q = debouncedSearch.toLowerCase()
                if (
                    !c.member_name?.toLowerCase().includes(q) &&
                    !c.id?.toLowerCase().includes(q) &&
                    !c.package_name?.toLowerCase().includes(q)
                ) return false
            }
            if (statusFilter !== 'all' && c.status !== statusFilter) return false
            if (branchFilter !== 'all' && c.branch_id !== branchFilter) return false
            if (ptFilter !== 'all' && c.trainer_name !== ptFilter) return false
            if (contractTypeFilter !== 'all' && c.contract_type !== contractTypeFilter) return false
            return true
        })
    }, [contracts, debouncedSearch, statusFilter, branchFilter, ptFilter, contractTypeFilter])

    // ── Pagination (client-side) ──────────────────────────────────────────────
    const totalCount = filteredContracts.length
    const totalPages = pageSize === -1 ? 1 : Math.ceil(totalCount / pageSize)
    const pagedContracts = React.useMemo(() => {
        if (pageSize === -1) return filteredContracts
        const from = (page - 1) * pageSize
        return filteredContracts.slice(from, from + pageSize)
    }, [filteredContracts, page, pageSize])

    // ── Filter option lists (full DB, not just current page) ─────────────────
    const ptOptions = React.useMemo(() =>
        Array.from(new Set((contracts ?? []).map((c: any) => c.trainer_name).filter(Boolean))),
        [contracts]
    )
    const typeOptions = React.useMemo(() =>
        Array.from(new Set((contracts ?? []).map((c: any) => c.contract_type).filter(Boolean))),
        [contracts]
    )

    // Status counts for the badge tabs
    const statusCounts = React.useMemo(() => {
        const counts: Record<string, number> = { total: contracts?.length ?? 0 }
        const statuses = ['Đang thực hiện', 'Hoàn thành', 'Đã hủy']
        statuses.forEach(s => {
            counts[s] = (contracts ?? []).filter((c: any) => c.status === s).length
        })
        return counts
    }, [contracts])

    const refetch = () => queryClient.invalidateQueries({ queryKey: ['contracts-all'] })

    const clearFilters = () => {
        setSearchTerm(''); setStatusFilter('all'); setBranchFilter('all')
        setPtFilter('all'); setContractTypeFilter('all')
        toast.info('Đã xóa tất cả bộ lọc')
    }

    const handleRowClick = (contract: any, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
            (e.target as HTMLElement).tagName.toLowerCase() === 'label'
        ) return
        setSelectedContract(contract); setIsDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
            const result = await bulkDeleteContracts([id])
            if (!result.success) toast.error('Lỗi khi xóa: ' + result.error)
            else { toast.success('Đã xóa hợp đồng thành công'); refetch() }
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return
        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} hợp đồng đã chọn?`)) {
            const result = await bulkDeleteContracts(selectedRows)
            if (!result.success) toast.error('Lỗi khi xóa hàng loạt: ' + result.error)
            else { toast.success(`Đã xóa thành công ${selectedRows.length} hợp đồng`); setSelectedRows([]); refetch() }
        }
    }

    const exportToExcel = () => {
        if (!filteredContracts?.length) { toast.error('Không có dữ liệu để xuất'); return }
        const data = filteredContracts.map((c: any) => ({
            'Mã HĐ': c.id, 'Khách hàng': c.member_name, 'Số điện thoại': c.phone,
            'Email': c.email, 'Gói tập': c.package_name, 'Loại hợp đồng': c.contract_type,
            'Tổng tiền': c.total_amount, 'Phương thức': c.payment_method,
            'Chi nhánh': c.branches?.name || '', 'PT phụ trách': c.trainer_name,
            'Ngày ký': c.start_date ? new Date(c.start_date).toLocaleDateString('vi-VN') : '',
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Contracts')
        XLSX.writeFile(wb, `Contracts_Export_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Đã xuất file Excel thành công')
    }

    const toggleRow = (id: string) =>
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
    const toggleAll = () =>
        setSelectedRows(selectedRows.length === pagedContracts.length ? [] : pagedContracts.map((c: any) => c.id))

    return (
        <div className="space-y-1.5 font-inter pb-10">
            <ContractDetailsSheet
                contract={selectedContract} open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen} onSuccess={refetch}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-red-500" />
                        Hợp đồng
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Theo dõi và quản lý các hợp đồng dịch vụ của hội viên.</p>
                </div>
                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {selectedRows.length > 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <Button variant="ghost" onClick={handleBulkDelete}
                                    className="text-red-700 hover:text-red-800 hover:bg-red-50 font-medium px-4 h-11 rounded-xl border border-red-100">
                                    <Trash className="w-4 h-4 mr-2" />
                                    Xóa ({selectedRows.length})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex gap-2">
                        <ImportExcelContractDialog onSuccess={refetch} />
                        <Button variant="ghost" onClick={exportToExcel}
                            className="rounded-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 h-11 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                            <FileDown className="w-4.5 h-4.5 mr-2" />
                            <span className="hidden sm:inline">Xuất Excel</span>
                        </Button>
                        <AddContractDialog onSuccess={refetch} />
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 py-0">
                <div className="py-1 px-1 sm:px-1.5 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                <input
                                    placeholder="Tìm kiếm hợp đồng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 h-9 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                                />
                            </div>
                            <Button variant="outline" size="icon"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={cn("lg:hidden h-9 w-9 rounded-lg border-gray-200 dark:border-gray-800",
                                    showMobileFilters ? "bg-red-50 text-red-600 border-red-200" : "bg-white dark:bg-gray-800/50")}>
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>

                        <AnimatePresence>
                            {(showMobileFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                                <motion.div
                                    initial={typeof window !== 'undefined' && window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden lg:overflow-visible lg:flex lg:flex-row lg:items-center gap-2">
                                    <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center pt-2 lg:pt-0">
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
                                                <SelectValue placeholder="Trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả trạng thái <span className="text-gray-400">({statusCounts.total})</span></SelectItem>
                                                <SelectItem value="Đang thực hiện">Đang thực hiện <span className="text-gray-400">({statusCounts['Đang thực hiện'] || 0})</span></SelectItem>
                                                <SelectItem value="Hoàn thành">Hoàn thành <span className="text-gray-400">({statusCounts['Hoàn thành'] || 0})</span></SelectItem>
                                                <SelectItem value="Đã hủy">Đã hủy <span className="text-gray-400">({statusCounts['Đã hủy'] || 0})</span></SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
                                                <SelectValue placeholder="Chi nhánh" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                                {branches.map((branch: any) => (
                                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={ptFilter} onValueChange={setPtFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
                                                <SelectValue placeholder="PT phụ trách" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả PT</SelectItem>
                                                {ptOptions.map((pt: string) => (
                                                    <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
                                                <SelectValue placeholder="Loại hợp đồng" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả loại</SelectItem>
                                                {typeOptions.map((type: string) => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button variant="ghost" onClick={clearFilters}
                                            className="h-9 px-3 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 transition-all col-span-2 lg:col-span-1 justify-center">
                                            <RotateCcw className="w-4 h-4 mr-2 lg:mr-0" />
                                            <span className="lg:hidden text-sm font-medium">Làm mới bộ lọc</span>
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
                                    <span className="text-gray-900 dark:text-gray-100 font-black">{pagedContracts.length}</span> / {totalCount} hợp đồng
                                </div>
                                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                                    <SelectTrigger className="h-7 w-16 rounded-lg border-gray-100 dark:border-gray-800 text-[10px] font-bold focus:ring-red-500 bg-white dark:bg-gray-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
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
                                        checked={selectedRows.length === pagedContracts.length && pagedContracts.length > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-gray-300 dark:border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Hợp đồng & Hội viên</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Dịch vụ & Gói tập</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Giá trị & Thanh toán</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Chi nhánh & Ngày ký</TableHead>
                                <TableHead className="text-right pr-8 text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Tùy chọn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell className="text-right pr-8"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : pagedContracts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-gray-400 text-sm font-medium">Không tìm thấy hợp đồng nào.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedContracts.map((contract: any) => (
                                    <TableRow key={contract.id} onClick={(e) => handleRowClick(contract, e)}
                                        className={cn('border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors',
                                            selectedRows.includes(contract.id) && 'bg-red-50/30 dark:bg-red-950/20')}>
                                        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox checked={selectedRows.includes(contract.id)}
                                                onCheckedChange={() => toggleRow(contract.id)} className="rounded-lg" />
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-normal text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                    {contract.member_name}
                                                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">{contract.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Package className="w-3 h-3 text-gray-400" />
                                                    {contract.package_name || 'Chưa chọn gói'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                    <Clock className="w-3 h-3" />
                                                    {contract.contract_type || 'Dịch vụ'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                <span className="text-sm font-medium text-red-600">
                                                    {contract.total_amount ? Number(contract.total_amount).toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                    <CreditCard className="w-3 h-3" />
                                                    {contract.payment_method || 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3 h-3 text-gray-400" />
                                                    {contract.branches?.name || 'Văn phòng'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                    <Calendar className="w-3 h-3" />
                                                    {contract.start_date ? new Date(contract.start_date).toLocaleDateString('vi-VN') : '-'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedContract(contract); setIsDetailsOpen(true) }}
                                                    className="w-8 h-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600">
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(contract.id) }}
                                                    className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
