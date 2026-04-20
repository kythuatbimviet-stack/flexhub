'use client'

import * as React from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import {
    Search,
    FileDown,
    MoreHorizontal,
    DollarSign,
    Filter,
    Calendar,
    ArrowUpDown,
    Trash2,
    Eye,
    Edit2,
    Building2,
    User,
    CreditCard,
    RotateCcw
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRevenueByDateRange, bulkDeleteRevenue, deleteRevenue } from '@/app/actions/financial'
import { fetchBranches } from '@/app/actions/branches'
import { fetchContractById, sendPaymentConfirmationAction } from '@/app/actions/contracts'
import { fetchUsers } from '@/app/actions/users'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { AddRevenueSheet } from '@/components/financial/add-revenue-sheet'
import { ImportExcelRevenueDialog } from '@/components/financial/import-revenue-dialog'
import { RevenueDetailsSheet } from '@/components/financial/revenue-details-sheet'
import { RevenuePaymentConfirmationDialog } from '@/components/financial/revenue-payment-confirmation-dialog'
import { Checkbox } from '@/components/ui/checkbox'

export default function RevenuePage() {
    const [searchQuery, setSearchQuery] = React.useState('')
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [categoryFilter, setCategoryFilter] = React.useState('all')
    const [paymentMethodFilter, setPaymentMethodFilter] = React.useState('all')
    const [selectedRevenues, setSelectedRevenues] = React.useState<string[]>([])
    const [viewingRevenue, setViewingRevenue] = React.useState<any>(null)
    const [detailSheetOpen, setDetailSheetOpen] = React.useState(false)
    const [xnttDialogOpen, setXnttDialogOpen] = React.useState(false)
    const [selectedXnttRevenue, setSelectedXnttRevenue] = React.useState<any>(null)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)
    const [editingRevenue, setEditingRevenue] = React.useState<any>(null)
    const [editSheetOpen, setEditSheetOpen] = React.useState(false)
    const [sendingXnttId, setSendingXnttId] = React.useState<string | null>(null)
    
    // Date Filters
    const [quickDateFilter, setQuickDateFilter] = React.useState('today')
    const [startDate, setStartDate] = React.useState(() => new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = React.useState(() => new Date().toISOString().split('T')[0])

    const queryClient = useQueryClient()
    const { data: revenueData, refetch: originalRefetch } = useQuery({
        queryKey: ['revenue', startDate, endDate],
        queryFn: async () => {
            const result = await fetchRevenueByDateRange(startDate || undefined, endDate || undefined)
            if (!result.success) throw new Error(result.error)
            return result.data
        },
        staleTime: 30 * 1000, // 30 giây
        refetchOnWindowFocus: false,
    })

    const refetch = () => {
        originalRefetch()
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    }

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
        staleTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    })

    const { data: pts } = useQuery({
        queryKey: ['users-pts'],
        queryFn: async () => {
            const result = await fetchUsers()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    })


    const handleQuickDateChange = (value: string) => {
        setQuickDateFilter(value)
        if (value === 'all') {
            setStartDate('')
            setEndDate('')
            return
        }

        const now = new Date()
        let start = new Date()
        let end = new Date()

        switch (value) {
            case 'today':
                break
            case 'yesterday':
                start.setDate(now.getDate() - 1)
                end.setDate(now.getDate() - 1)
                break
            case 'this-week':
                start.setDate(now.getDate() - now.getDay())
                break
            case 'last-week':
                start.setDate(now.getDate() - now.getDay() - 7)
                end.setDate(now.getDate() - now.getDay() - 1)
                break
            case 'this-month':
                start = new Date(now.getFullYear(), now.getMonth(), 1)
                break
            case 'last-month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                end = new Date(now.getFullYear(), now.getMonth(), 0)
                break
        }

        setStartDate(format(start, 'yyyy-MM-dd'))
        setEndDate(format(end, 'yyyy-MM-dd'))
    }

    const handleBulkDelete = async () => {
        if (selectedRevenues.length === 0) return
        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRevenues.length} bản ghi đã chọn?`)) {
            try {
                const result = await bulkDeleteRevenue(selectedRevenues)
                if (result.success) {
                    toast.success(`Đã xóa ${selectedRevenues.length} bản ghi thành công`)
                    setSelectedRevenues([])
                    refetch()
                } else {
                    toast.error(result.error)
                }
            } catch (error: any) {
                toast.error(error.message)
            }
        }
    }

    const handleOpenDetail = (revenue: any) => {
        setViewingRevenue(revenue)
        setDetailSheetOpen(true)
    }

    const handleOpenEdit = (revenue: any) => {
        setEditingRevenue(revenue)
        setEditSheetOpen(true)
    }

    const handleOpenXntt = (revenue: any) => {
        setSelectedXnttRevenue(revenue)
        setXnttDialogOpen(true)
    }

    const filteredRevenue = React.useMemo(() => {
        if (!revenueData) return []
        return revenueData.filter((item: any) => {
            const matchesSearch =
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.clients?.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesBranch = branchFilter === 'all' || item.branch_id === branchFilter
            const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter
            const matchesPaymentMethod = paymentMethodFilter === 'all' || item.payment_method === paymentMethodFilter
            // Date filter đã xử lý ở server-side, không cần filter lại ở đây
            return matchesSearch && matchesBranch && matchesCategory && matchesPaymentMethod
        })
    }, [revenueData, searchQuery, branchFilter, categoryFilter, paymentMethodFilter])

    const stats = React.useMemo(() => {
        return filteredRevenue.reduce((acc: any, item: any) => {
            acc.total += item.amount
            if (item.payment_method === 'Tiền mặt') acc.cash += item.amount
            if (item.payment_method === 'Chuyển khoản') acc.transfer += item.amount
            return acc
        }, { total: 0, cash: 0, transfer: 0 })
    }, [filteredRevenue])

    const handleExportExcel = () => {
        const exportData = filteredRevenue.map((item: any) => ({
            'ID': item.id,
            'Ngày': new Date(item.recorded_at).toLocaleDateString('vi-VN'),
            'Số tiền': item.amount,
            'Danh mục': item.category_id,
            'Chi nhánh': item.branches?.name,
            'Khách hàng': item.clients?.member_name || 'Vãng lai',
            'Thanh toán': item.payment_method,
            'Diễn giải': item.description,
            'Trạng thái XNTT': item.xntt_history?.[0]?.status === 'done' ? 'Đã gửi' : (item.xntt_history?.[0]?.status === 'error' ? 'Lỗi' : (item.xntt_history?.[0] ? 'Đang gửi' : 'Chưa gửi')),
            'Ngày gửi XNTT': item.xntt_history?.[0]?.created_at ? new Date(item.xntt_history[0].created_at).toLocaleString('vi-VN') : '',
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Khoản thu')
        XLSX.writeFile(wb, `bao_cao_thu_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Đã xuất file Excel thành công')
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa khoản thu này?')) {
            try {
                const result = await deleteRevenue(id)
                if (result.success) {
                    toast.success('Đã xóa dữ liệu thành công')
                    refetch()
                } else {
                    toast.error('Lỗi khi xóa: ' + result.error)
                }
            } catch (error: any) {
                toast.error(error.message)
            }
        }
    }

    const { data: users = [] } = useQuery({
        queryKey: ['users-all'],
        queryFn: async () => {
            const res = await fetchUsers()
            return res.success ? (res.data ?? []) : []
        },
    })

    const handleManualSendXntt = async (item: any) => {
        setSelectedXnttRevenue(item)
        setXnttDialogOpen(true)
    }

    const toggleSelectAll = () => {
        if (selectedRevenues.length === filteredRevenue.length) {
            setSelectedRevenues([])
        } else {
            setSelectedRevenues(filteredRevenue.map((r: any) => r.id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedRevenues(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const resetFilters = () => {
        setSearchQuery('')
        setBranchFilter('all')
        setCategoryFilter('all')
        setEndDate(new Date().toISOString().split('T')[0])
    }

    return (
        <div className="space-y-1.5 font-inter pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        Khoản thu
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Theo dõi và quản lý mọi dòng tiền đi vào hệ thống.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        className="h-11 rounded-xl border-gray-100 dark:border-gray-800 text-gray-500 hover:text-emerald-600 transition-all font-semibold"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        Xuất Excel
                    </Button>
                    <ImportExcelRevenueDialog onSuccess={refetch} />
                    <AddRevenueSheet onSuccess={refetch} />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
                <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative group p-5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                        <DollarSign className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng thu (Lọc)</p>
                        <div className="text-2xl font-black text-emerald-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.total)}
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">Từ {filteredRevenue.length} giao dịch</p>
                    </div>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative group p-5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                        <DollarSign className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiền mặt</p>
                        <div className="text-2xl font-black text-blue-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.cash || 0)}
                        </div>
                    </div>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative group p-5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                        <DollarSign className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chuyển khoản</p>
                        <div className="text-2xl font-black text-purple-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.transfer || 0)}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Optimized Compact Filter Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 transition-all duration-300 py-0">
                <div className="py-1 px-1 sm:px-1.5 border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-gray-800/20 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        {/* Search & Toggle Button Row */}
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                <Input
                                    placeholder="Tìm mã, khách, diễn giải..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-emerald-500 text-sm"
                                />
                            </div>

                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="h-9 px-3 rounded-lg text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-gray-100 dark:border-gray-800 transition-all flex items-center gap-2"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Làm mới</span>
                            </Button>

                            {/* Mobile Filter Toggle */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={cn(
                                    "lg:hidden h-9 w-9 rounded-lg border-gray-200 dark:border-gray-800 transition-all",
                                    showMobileFilters ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white dark:bg-gray-800/50"
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
                                    <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center pt-2 lg:pt-0">
                                        <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center">
                                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                                <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-emerald-500 text-xs sm:text-sm lg:w-40 px-3">
                                                    <SelectValue placeholder="Chi nhánh" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                                    {branches?.map((branch: any) => (
                                                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                                <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-emerald-500 text-xs sm:text-sm lg:w-36 px-3">
                                                    <SelectValue placeholder="Danh mục" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                                                    <SelectItem value="Hợp đồng">Hợp đồng</SelectItem>
                                                    <SelectItem value="Công nợ">Công nợ</SelectItem>
                                                    <SelectItem value="Khác">Khác</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 lg:flex lg:flex-row gap-2 items-center">
                                            <div className="flex items-center gap-2">
                                                <Select value={quickDateFilter} onValueChange={handleQuickDateChange}>
                                                    <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-emerald-500 text-xs sm:text-sm lg:w-40 px-3">
                                                        <SelectValue placeholder="Thời gian" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                        <SelectItem value="all">Tất cả thời gian</SelectItem>
                                                        <SelectItem value="today">Hôm nay</SelectItem>
                                                        <SelectItem value="this-week">Tuần này</SelectItem>
                                                        <SelectItem value="last-week">Tuần trước</SelectItem>
                                                        <SelectItem value="this-month">Tháng này</SelectItem>
                                                        <SelectItem value="last-month">Tháng trước</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <div className="flex items-center gap-1.5 flex-1">
                                                    <Input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => {
                                                            setStartDate(e.target.value)
                                                            setQuickDateFilter('')
                                                        }}
                                                        className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-emerald-500 text-xs px-2 lg:w-[130px]"
                                                    />
                                                    <span className="text-gray-400 text-xs">-</span>
                                                    <Input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => {
                                                            setEndDate(e.target.value)
                                                            setQuickDateFilter('')
                                                        }}
                                                        className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-emerald-500 text-xs px-2 lg:w-[130px]"
                                                    />
                                                </div>
                                            </div>

                                            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                                <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-emerald-500 text-xs sm:text-sm lg:w-36 px-3">
                                                    <SelectValue placeholder="Hình thức" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    <SelectItem value="all">Tất cả hình thức</SelectItem>
                                                    {['Tiền mặt', 'Chuyển khoản', 'Thẻ'].map(m => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {selectedRevenues.length > 0 && (
                        <div className="mt-2 flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                    {selectedRevenues.length} đã chọn
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="h-8 text-[11px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 px-3"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Xóa tất cả
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Table Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-100/50 dark:border-gray-800/50 h-10 uppercase tracking-wider text-[11px] font-medium">
                                <TableHead className="w-[40px] px-1 text-center">
                                    <Checkbox
                                        checked={selectedRevenues.length === filteredRevenue.length && filteredRevenue.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded-md border-gray-300"
                                    />
                                </TableHead>
                                <TableHead className="text-gray-400">Ngày</TableHead>
                                <TableHead className="text-gray-400">Mã / Khách hàng</TableHead>
                                <TableHead className="text-gray-400">Danh mục</TableHead>
                                <TableHead className="text-gray-400">Số tiền / Hình thức</TableHead>
                                <TableHead className="text-gray-400">Ghi chú</TableHead>
                                <TableHead className="text-gray-400">Xác nhận gửi</TableHead>
                                <TableHead className="text-gray-400 text-right pr-6 w-[120px]">Tùy chọn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRevenue.map((item: any) => (
                                <TableRow
                                    key={item.id}
                                    className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 border-gray-100/50 dark:border-gray-800/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setViewingRevenue(item)
                                        setDetailSheetOpen(true)
                                    }}
                                >
                                    <TableCell className="px-1 text-center" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedRevenues.includes(item.id)}
                                            onCheckedChange={() => toggleSelect(item.id)}
                                            className="rounded-md border-gray-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                        />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                {new Date(item.recorded_at).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                                ID: {item.id.split('-')[0]}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-[10px] uppercase">
                                                {item.clients?.member_name?.charAt(0) || <User className="w-3 h-3" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.clients?.member_name || 'Khách vãng lai'}</span>
                                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{item.branches?.name}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">
                                            {item.category_id || 'Phổ thông'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                {new Intl.NumberFormat('vi-VN').format(item.amount)}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                                {item.payment_method}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                                            {item.description || '-'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        {(() => {
                                            const history = item.xntt_history?.[0]
                                            if (!history) return <span className="text-[10px] text-gray-400 font-medium">Chưa gửi</span>
                                            
                                            const status = history.status
                                            const date = history.created_at ? format(new Date(history.created_at), 'HH:mm dd/MM') : ''

                                            return (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={cn(
                                                        "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit",
                                                        status === 'done' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" :
                                                        status === 'error' ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30" :
                                                        "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                                                    )}>
                                                        {status === 'done' ? 'Đã gửi' : status === 'error' ? 'Lỗi gửi' : 'Đang xử lý'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">{date}</span>
                                                </div>
                                            )
                                        })()}
                                    </TableCell>
                                    <TableCell className="py-3 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                                                onClick={() => handleManualSendXntt(item)}
                                                disabled={sendingXnttId === item.id}
                                                title="Gửi xác nhận thanh toán"
                                            >
                                                <RotateCcw className={cn("w-3.5 h-3.5", sendingXnttId === item.id && "animate-spin")} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                                                onClick={() => {
                                                    setEditingRevenue(item)
                                                    setEditSheetOpen(true)
                                                }}
                                                title="Sửa"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                                                onClick={() => handleDelete(item.id)}
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredRevenue.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                                                <DollarSign className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thêm khoản thu đầu tiên</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <RevenueDetailsSheet
                revenue={viewingRevenue}
                open={detailSheetOpen}
                onOpenChange={setDetailSheetOpen}
                onSuccess={refetch}
            />

            <AddRevenueSheet
                revenue={editingRevenue}
                open={editSheetOpen}
                onOpenChange={(open) => {
                    setEditSheetOpen(open)
                    if (!open) setEditingRevenue(null)
                }}
                onSuccess={refetch}
            />

            <RevenuePaymentConfirmationDialog
                open={xnttDialogOpen}
                onOpenChange={setXnttDialogOpen}
                revenue={selectedXnttRevenue}
            />
        </div >
    )
}
