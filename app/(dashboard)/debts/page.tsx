'use client'

import * as React from 'react'
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    HandCoins,
    Calendar,
    Building2,
    CreditCard,
    Trash,
    Clock,
    BadgeCheck,
    RotateCcw,
    FileDown,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    ArrowUpRight
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
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fetchDebts, deleteDebt } from '@/app/actions/debts'
import { fetchBranches } from '@/app/actions/branches'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import * as XLSX from 'xlsx'
import { DebtDetailsSheet } from '@/components/debts/debt-details-sheet'

const THIRTY_MINUTES = 30 * 60 * 1000

export default function DebtPage() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = React.useState('')
    const [debouncedSearch, setDebouncedSearch] = React.useState('')
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(20)
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedDebt, setSelectedDebt] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)

    // Filter states
    const [statusFilter, setStatusFilter] = React.useState('all')
    const [branchFilter, setBranchFilter] = React.useState('all')

    // Debounce search
    React.useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1) }, 400)
        return () => clearTimeout(t)
    }, [searchTerm])

    const { data: debts = [], isLoading } = useQuery<any[]>({
        queryKey: ['debts-all'],
        queryFn: async () => {
            const res = await fetchDebts()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: THIRTY_MINUTES,
    })

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: Infinity,
    })

    const filteredDebts = React.useMemo(() => {
        return (debts ?? []).filter((d: any) => {
            if (debouncedSearch) {
                const q = debouncedSearch.toLowerCase()
                if (
                    !d.clients?.member_name?.toLowerCase().includes(q) &&
                    !d.id?.toLowerCase().includes(q) &&
                    !d.contracts?.id?.toLowerCase().includes(q)
                ) return false
            }
            if (statusFilter !== 'all' && d.status !== statusFilter) return false
            if (branchFilter !== 'all' && d.branch_id !== branchFilter) return false
            return true
        })
    }, [debts, debouncedSearch, statusFilter, branchFilter])

    const totalCount = filteredDebts.length
    const totalPages = pageSize === -1 ? 1 : Math.ceil(totalCount / pageSize)
    const pagedDebts = React.useMemo(() => {
        if (pageSize === -1) return filteredDebts
        const from = (page - 1) * pageSize
        return filteredDebts.slice(from, from + pageSize)
    }, [filteredDebts, page, pageSize])

    const statusCounts = React.useMemo(() => {
        const counts: Record<string, number> = { total: debts?.length ?? 0 }
        const statuses = ['Chưa thanh toán', 'Thanh toán một phần', 'Đã thanh toán']
        statuses.forEach(s => {
            counts[s] = (debts ?? []).filter((d: any) => d.status === s).length
        })
        return counts
    }, [debts])

    const totalDebtAmount = React.useMemo(() => {
        return filteredDebts.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0)
    }, [filteredDebts])

    const refetch = () => {
        queryClient.invalidateQueries({ queryKey: ['debts-all'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    }

    const clearFilters = () => {
        setSearchTerm(''); setStatusFilter('all'); setBranchFilter('all')
        toast.info('Đã xóa tất cả bộ lọc')
    }

    const handleRowClick = (debt: any, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input[type="checkbox"]')
        ) return
        setSelectedDebt(debt); setIsDetailsOpen(true)
    }

    const exportToExcel = () => {
        if (!filteredDebts?.length) { toast.error('Không có dữ liệu để xuất'); return }
        const data = filteredDebts.map((d: any) => ({
            'Khách hàng': d.clients?.member_name,
            'Số điện thoại': d.clients?.phone,
            'Hợp đồng': d.contracts?.id,
            'Tổng tiền': d.total_amount,
            'Đã trả': d.paid_amount,
            'Còn nợ': d.remaining_amount,
            'Trạng thái': d.status,
            'Chi nhánh': d.branches?.name || '',
            'Ngày tạo': new Date(d.created_at).toLocaleDateString('vi-VN'),
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Debts')
        XLSX.writeFile(wb, `Cong_No_Export_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Đã xuất file Excel thành công')
    }

    const toggleRow = (id: string) =>
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
    const toggleAll = () =>
        setSelectedRows(selectedRows.length === pagedDebts.length ? [] : pagedDebts.map((d: any) => d.id))

    return (
        <div className="space-y-1.5 font-inter pb-10">
            <DebtDetailsSheet
                debt={selectedDebt} open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen} onSuccess={refetch}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <HandCoins className="w-8 h-8 text-amber-500" />
                        Quản lý Công nợ
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Theo dõi và quản lý công nợ khách hàng, lịch hẹn thanh toán nhanh chóng.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={exportToExcel}
                        className="rounded-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 h-11 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                        <FileDown className="w-4.5 h-4.5 mr-2" />
                        <span className="hidden sm:inline">Xuất Excel</span>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
                <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative group p-5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                        <DollarSign className="w-12 h-12 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng công nợ hiện tại</p>
                        <div className="text-2xl font-black text-amber-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalDebtAmount)}
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">Từ {filteredDebts.length} hợp đồng có nợ</p>
                    </div>
                </Card>
            </div>

            {/* Status Tabs */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="bg-transparent h-auto p-0 flex flex-nowrap overflow-x-auto no-scrollbar gap-1 px-1 mb-1 w-full justify-start">
                    <TabsTrigger value="all" className={cn("flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm border-none text-gray-600 hover:text-gray-700 data-[state=active]:text-amber-600")}>
                        Tất cả trạng thái
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">{statusCounts.total}</span>
                    </TabsTrigger>
                    {['Chưa thanh toán', 'Thanh toán một phần', 'Đã thanh toán'].map((s) => (
                        <TabsTrigger key={s} value={s} className={cn("flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm border-none text-gray-500 hover:text-gray-700 data-[state=active]:text-amber-600")}>
                            {s}
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">{statusCounts[s] || 0}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Filter Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 py-0">
                <div className="py-1 px-1 sm:px-1.5 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                                <input
                                    placeholder="Tìm khách hàng, mã nợ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 h-9 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                                />
                            </div>
                            <Button variant="outline" size="icon"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={cn("lg:hidden h-9 w-9 rounded-lg border-gray-200 dark:border-gray-800",
                                    showMobileFilters ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-white dark:bg-gray-800/50")}>
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

                                        <Button variant="ghost" onClick={clearFilters}
                                            className="h-9 px-3 rounded-lg text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 border border-transparent hover:border-amber-100 transition-all col-span-2 lg:col-span-1 justify-center">
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
                                    <span className="text-gray-900 dark:text-gray-100 font-black">{pagedDebts.length}</span> / {totalCount} khoản nợ
                                </div>
                                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                                    <SelectTrigger className="h-7 w-16 rounded-lg border-gray-100 dark:border-gray-800 text-[10px] font-bold focus:ring-amber-500 bg-white dark:bg-gray-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="-1">Tất cả</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {pageSize !== -1 && totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <Button variant="outline" size="sm" disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className="rounded-lg border-gray-100 dark:border-gray-800 h-7 px-2 text-[10px] font-bold bg-white dark:bg-gray-800">
                                        <ChevronLeft className="w-3 h-3 mr-1" />Trong
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                            let pn = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
                                            return (
                                                <Button key={pn} variant={page === pn ? 'default' : 'outline'} size="sm"
                                                    onClick={() => setPage(pn)}
                                                    className={cn('w-7 h-7 rounded-lg p-0 text-[10px] font-black',
                                                        page === pn ? 'bg-amber-600 hover:bg-amber-700' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800')}>
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
                                        checked={selectedRows.length === pagedDebts.length && pagedDebts.length > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-gray-300 dark:border-gray-600 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-amber-300 h-9">Khách hàng & Hợp đồng</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-amber-300 h-9">Tổng tiền nợ</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-amber-300 h-9">Đã trả / Còn lại</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-amber-300 h-9">Chi nhánh & Ngày tạo</TableHead>
                                <TableHead className="text-right pr-8 text-[11px] font-medium text-gray-400 dark:text-amber-300 h-9">Tùy chọn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell className="text-right pr-8"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : pagedDebts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                                                <HandCoins className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-gray-400 text-sm font-medium">Không tìm thấy dữ liệu công nợ nào.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedDebts.map((debt: any) => (
                                    <TableRow key={debt.id} onClick={(e) => handleRowClick(debt, e)}
                                        className={cn('border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors',
                                            selectedRows.includes(debt.id) && 'bg-amber-50/30 dark:bg-amber-950/20')}>
                                        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox checked={selectedRows.includes(debt.id)}
                                                onCheckedChange={() => toggleRow(debt.id)} className="rounded-lg" />
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-normal text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                    {debt.clients?.member_name}
                                                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">HĐ: {debt.contracts?.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {Number(debt.total_amount).toLocaleString('vi-VN')} ₫
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span className="text-emerald-600 font-medium">
                                                    {Number(debt.paid_amount).toLocaleString('vi-VN')} ₫
                                                </span>
                                                <span className="text-red-500 font-bold text-[11px]">
                                                    Còn nợ: {Number(debt.remaining_amount).toLocaleString('vi-VN')} ₫
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3 h-3 text-gray-400" />
                                                    {debt.branches?.name || 'Văn phòng'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(debt.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedDebt(debt); setIsDetailsOpen(true) }}
                                                    className="h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 px-3 text-[10px] font-bold">
                                                    CHI TIẾT <ArrowUpRight className="ml-1 w-3 h-3" />
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
