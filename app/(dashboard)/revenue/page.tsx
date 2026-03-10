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
    CreditCard
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchRevenue, bulkDeleteRevenue } from '@/app/actions/financial'
import { fetchBranches } from '@/app/actions/branches'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { AddRevenueSheet } from '@/components/financial/add-revenue-sheet'
import { ImportExcelRevenueDialog } from '@/components/financial/import-revenue-dialog'
import { RevenueDetailsSheet } from '@/components/financial/revenue-details-sheet'
import { Checkbox } from '@/components/ui/checkbox'

export default function RevenuePage() {
    const [searchQuery, setSearchQuery] = React.useState('')
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [categoryFilter, setCategoryFilter] = React.useState('all')
    const [selectedRevenues, setSelectedRevenues] = React.useState<string[]>([])
    const [viewingRevenue, setViewingRevenue] = React.useState<any>(null)
    const [detailSheetOpen, setDetailSheetOpen] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)

    const { data: revenueData, refetch } = useQuery({
        queryKey: ['revenue'],
        queryFn: async () => {
            const result = await fetchRevenue()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })


    const filteredRevenue = React.useMemo(() => {
        if (!revenueData) return []
        return revenueData.filter((item: any) => {
            const matchesSearch =
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.clients?.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesBranch = branchFilter === 'all' || item.branch_id === branchFilter
            const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter
            return matchesSearch && matchesBranch && matchesCategory
        })
    }, [revenueData, searchQuery, branchFilter, categoryFilter])

    const totalAmount = React.useMemo(() => {
        return filteredRevenue.reduce((sum: number, item: any) => sum + item.amount, 0)
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
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Khoản thu')
        XLSX.writeFile(wb, `bao_cao_thu_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Đã xuất file Excel thành công')
    }

    const handleBulkDelete = async () => {
        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRevenues.length} khoản thu đã chọn?`)) {
            try {
                const result = await bulkDeleteRevenue(selectedRevenues)
                if (result.success) {
                    toast.success('Đã xóa dữ liệu thành công')
                    setSelectedRevenues([])
                    refetch()
                } else {
                    toast.error('Lỗi khi xóa: ' + result.error)
                }
            } catch (error: any) {
                toast.error(error.message)
            }
        }
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

    return (
        <div className="space-y-1.5 font-inter pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <DollarSign className="w-8 h-8 text-emerald-600" />
                        Khoản thu
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Theo dõi và quản lý mọi dòng tiền đi vào hệ thống.</p>
                </div>
                <div className="flex items-center gap-2">
                    <ImportExcelRevenueDialog onSuccess={refetch} />
                    <AddRevenueSheet onSuccess={refetch} />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
                <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative group p-5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                        <DollarSign className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng thu (Lọc)</p>
                        <div className="text-2xl font-black text-emerald-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">Từ {filteredRevenue.length} giao dịch</p>
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
                                size="icon"
                                onClick={handleExportExcel}
                                className="h-9 w-9 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-gray-400 hover:text-emerald-600"
                            >
                                <FileDown className="w-4 h-4" />
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
                                    <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center pt-2 lg:pt-0">
                                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-emerald-500 text-xs sm:text-sm lg:w-44 px-3">
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
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-emerald-500 text-xs sm:text-sm lg:w-44 px-3">
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
                                <TableHead className="text-gray-400">Số tiền</TableHead>
                                <TableHead className="text-gray-400">Hình thức</TableHead>
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
                                    <TableCell className="py-3 text-sm font-black text-emerald-600 dark:text-emerald-400">
                                        {new Intl.NumberFormat('vi-VN').format(item.amount)}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-3 h-3 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">{item.payment_method}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredRevenue.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center">
                                                <DollarSign className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Không tìm thấy khoản thu</p>
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
        </div >
    )
}
