'use client'

import * as React from 'react'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Search,
    Clock,
    BadgeCheck,
    Package,
    Building2,
    CalendarClock,
    FileText,
    ArrowLeft,
    User,
    Edit2,
    Trash2,
    Trash,
    CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fetchContracts, bulkDeleteContracts } from '@/app/actions/contracts'
import Link from 'next/link'
import { ContractDetailsSheet } from '@/components/contracts/contract-details-sheet'

export default function DueContractsPage() {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [tab, setTab] = React.useState('this-week')
    const [selectedContract, setSelectedContract] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(20)

    const handleRowClick = (contract: any, e: React.MouseEvent) => {
        // Prevent opening if clicking on checkbox or actions
        if ((e.target as HTMLElement).closest('[data-no-click]')) return
        
        setSelectedContract(contract)
        setIsDetailsOpen(true)
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

    const toggleRow = (id: string) =>
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
    const toggleAll = () =>
        setSelectedRows(selectedRows.length === pagedContracts.length && pagedContracts.length > 0 ? [] : pagedContracts.map((c: any) => c.id))

    const { data: contracts = [], isLoading, refetch } = useQuery<any[]>({
        queryKey: ['contracts-all'],
        queryFn: async () => {
            const res = await fetchContracts()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: 5 * 60 * 1000,
    })

    const filteredContracts = React.useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const next7Days = new Date(today)
        next7Days.setDate(today.getDate() + 7)

        const next14Days = new Date(today)
        next14Days.setDate(today.getDate() + 14)

        const next30Days = new Date(today)
        next30Days.setDate(today.getDate() + 30)

        return (contracts ?? []).filter((c: any) => {
            if (!c.end_date) return false
            const endDate = new Date(c.end_date)
            endDate.setHours(0, 0, 0, 0)

            // Search filter
            if (searchTerm) {
                const q = searchTerm.toLowerCase()
                if (
                    !c.member_name?.toLowerCase().includes(q) &&
                    !c.id?.toLowerCase().includes(q)
                ) return false
            }

            // Tab filter
            if (tab === 'this-week') {
                return endDate >= today && endDate <= next7Days
            }
            if (tab === 'next-week') {
                return endDate > next7Days && endDate <= next14Days
            }
            if (tab === 'this-month') {
                return endDate >= today && endDate <= next30Days
            }
            return true
        })
    }, [contracts, tab, searchTerm])

    // ── Pagination (client-side) ──────────────────────────────────────────────
    const totalCount = filteredContracts.length
    const totalPages = pageSize === -1 ? 1 : Math.ceil(totalCount / pageSize)
    const pagedContracts = React.useMemo(() => {
        if (pageSize === -1) return filteredContracts
        const from = (page - 1) * pageSize
        return filteredContracts.slice(from, from + pageSize)
    }, [filteredContracts, page, pageSize])

    React.useEffect(() => { setPage(1) }, [tab, searchTerm, pageSize])

    const counts = React.useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const next7 = new Date(today)
        next7.setDate(today.getDate() + 7)
        const next14 = new Date(today)
        next14.setDate(today.getDate() + 14)
        const next30 = new Date(today)
        next30.setDate(today.getDate() + 30)

        const cAll = contracts ?? []
        return {
            thisWeek: cAll.filter((c: any) => {
                const d = new Date(c.end_date); return d >= today && d <= next7
            }).length,
            nextWeek: cAll.filter((c: any) => {
                const d = new Date(c.end_date); return d > next7 && d <= next14
            }).length,
            thisMonth: cAll.filter((c: any) => {
                const d = new Date(c.end_date); return d >= today && d <= next30
            }).length,
        }
    }, [contracts])

    const getRemainingDays = (end_date: string) => {
        if (!end_date) return null
        const end = new Date(end_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diff = end.getTime() - today.getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return (
        <div className="space-y-6 font-inter pb-10">
            <ContractDetailsSheet
                contract={selectedContract} open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen} onSuccess={refetch}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-gray-100">
                            <Link href="/contracts">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <CalendarClock className="w-8 h-8 text-red-600" />
                            Hợp đồng đến hạn
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight ml-12">
                        Theo dõi các hợp đồng sắp hết hạn để kịp thời gia hạn.
                    </p>
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
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-900 p-6">
                <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <TabsList className="bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl h-auto self-start">
                            <TabsTrigger value="this-week" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all flex items-center gap-2">
                                Tuần này
                                <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold", tab === 'this-week' ? "bg-red-50 text-red-600" : "bg-gray-200 text-gray-500")}>
                                    {counts.thisWeek}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="next-week" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all flex items-center gap-2">
                                Tuần tới
                                <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold", tab === 'next-week' ? "bg-red-50 text-red-600" : "bg-gray-200 text-gray-500")}>
                                    {counts.nextWeek}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="this-month" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all flex items-center gap-2">
                                Tháng tới
                                <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold", tab === 'this-month' ? "bg-red-50 text-red-600" : "bg-gray-200 text-gray-500")}>
                                    {counts.thisMonth}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative group max-w-sm w-full lg:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                            <input
                                placeholder="Tìm theo tên hội viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 h-10 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Pagination controls (top) */}
                    {!isLoading && totalCount > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-3 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/10 gap-4 mt-1 rounded-b-xl">
                            <div className="flex items-center gap-4">
                                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
                                    <span className="text-gray-900 dark:text-gray-100 font-black">{pagedContracts.length}</span> / {totalCount} hợp đồng
                                </div>
                                <Select value={pageSize.toString()} onValueChange={(v: string) => setPageSize(parseInt(v))}>
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

                    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-none">
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
                                    <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Chi nhánh và PT</TableHead>
                                    <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Ngày hợp đồng</TableHead>
                                    <TableHead className="text-right pr-8 text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Tùy chọn</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                                            <TableCell><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                            <TableCell><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div></TableCell>
                                            <TableCell><div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                            <TableCell><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                            <TableCell><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                            <TableCell className="text-right pr-8"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredContracts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-gray-200" />
                                                </div>
                                                <p className="text-gray-400 text-sm font-medium">Không có hợp đồng nào đến hạn trong giai đoạn này.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pagedContracts.map((contract: any) => {
                                        const remainingDays = getRemainingDays(contract.end_date)
                                        return (
                                            <TableRow key={contract.id} onClick={(e) => handleRowClick(contract, e)}
                                                className={cn('border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group',
                                                    selectedRows.includes(contract.id) && 'bg-red-50/30 dark:bg-red-950/20')}>
                                                <TableCell className="pl-6" data-no-click>
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
                                                            <User className="w-3 h-3" />
                                                            {contract.trainer_name || 'Chưa có PT'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-[11px] text-gray-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>Ký: {contract.start_date ? new Date(contract.start_date).toLocaleDateString('vi-VN') : '-'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" />
                                                            <span>Hết: {contract.end_date ? new Date(contract.end_date).toLocaleDateString('vi-VN') : '-'}</span>
                                                        </div>
                                                        <div className={cn("mt-1 font-bold", remainingDays !== null && remainingDays <= 0 ? "text-red-500" : "text-blue-500")}>
                                                            Còn: {remainingDays !== null ? (remainingDays > 0 ? `${remainingDays} ngày` : 'Hết hạn') : '-'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8" data-no-click>
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
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Tabs>
            </Card>
        </div>
    )
}
