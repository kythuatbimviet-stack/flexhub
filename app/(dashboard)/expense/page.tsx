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
    Banknote,
    Filter,
    Calendar,
    ArrowUpDown,
    Trash2,
    Eye,
    Edit2,
    Building2,
    CreditCard,
    RotateCcw
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchExpense, bulkDeleteExpense, fetchExpenseTypes } from '@/app/actions/financial'
import { fetchBranches } from '@/app/actions/branches'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { AddExpenseSheet } from '@/components/financial/add-expense-sheet'
import { ImportExcelExpenseDialog } from '@/components/financial/import-expense-dialog'
import { ExpenseDetailsSheet } from '@/components/financial/expense-details-sheet'
import { Checkbox } from '@/components/ui/checkbox'

export default function ExpensePage() {
    const [searchQuery, setSearchQuery] = React.useState('')
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [categoryFilter, setCategoryFilter] = React.useState('all')
    const [paymentMethodFilter, setPaymentMethodFilter] = React.useState('all')
    const [selectedExpenses, setSelectedExpenses] = React.useState<string[]>([])
    const [viewingExpense, setViewingExpense] = React.useState<any>(null)
    const [detailSheetOpen, setDetailSheetOpen] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)

    const { data: expenseData, refetch } = useQuery({
        queryKey: ['expense'],
        queryFn: async () => {
            const result = await fetchExpense()
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

    const { data: categories } = useQuery({
        queryKey: ['financial-categories-expense'],
        queryFn: async () => {
            const result = await fetchExpenseTypes()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const filteredExpense = React.useMemo(() => {
        if (!expenseData) return []
        return expenseData.filter((item: any) => {
            const matchesSearch =
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesBranch = branchFilter === 'all' || item.branch_id === branchFilter
            const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter
            const matchesPaymentMethod = paymentMethodFilter === 'all' || item.payment_method === paymentMethodFilter
            return matchesSearch && matchesBranch && matchesCategory && matchesPaymentMethod
        })
    }, [expenseData, searchQuery, branchFilter, categoryFilter, paymentMethodFilter])

    const totalAmount = React.useMemo(() => {
        return filteredExpense.reduce((sum: number, item: any) => sum + item.amount, 0)
    }, [filteredExpense])

    const handleExportExcel = () => {
        const exportData = filteredExpense.map((item: any) => ({
            'ID': item.id,
            'Ngày': new Date(item.recorded_at).toLocaleDateString('vi-VN'),
            'Số tiền': item.amount,
            'Danh mục': item.category_id,
            'Chi nhánh': item.branches?.name,
            'Thanh toán': item.payment_method,
            'Diễn giải': item.description,
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Khoản chi')
        XLSX.writeFile(wb, `bao_cao_chi_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Đã xuất file Excel thành công')
    }

    const handleBulkDelete = async () => {
        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedExpenses.length} khoản chi đã chọn?`)) {
            try {
                const result = await bulkDeleteExpense(selectedExpenses)
                if (result.success) {
                    toast.success('Đã xóa dữ liệu thành công')
                    setSelectedExpenses([])
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
        if (selectedExpenses.length === filteredExpense.length) {
            setSelectedExpenses([])
        } else {
            setSelectedExpenses(filteredExpense.map((r: any) => r.id))
        }
    }

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedExpenses(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const resetFilters = () => {
        setSearchQuery('')
        setBranchFilter('all')
        setCategoryFilter('all')
        setPaymentMethodFilter('all')
    }

    return (
        <div className="space-y-1.5 font-inter pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Banknote className="w-8 h-8 text-rose-600" />
                        Khoản chi
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Quản lý các khoản chi phí phát sinh.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        className="h-11 rounded-xl border-gray-100 dark:border-gray-800 text-gray-500 hover:text-rose-600 transition-all font-semibold"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        Xuất Excel
                    </Button>
                    <ImportExcelExpenseDialog onSuccess={refetch} />
                    <AddExpenseSheet onSuccess={refetch} />
                </div>
            </div>

            {/* Stats Summary Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
                <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative group p-5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                        <Banknote className="w-12 h-12 text-rose-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng chi phí</p>
                        <div className="text-2xl font-black text-rose-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">Từ {filteredExpense.length} giao dịch</p>
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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                                <Input
                                    placeholder="Tìm kiếm giao dịch..."
                                    className="pl-10 h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-rose-500 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="h-9 px-3 rounded-lg text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-gray-100 dark:border-gray-800 transition-all flex items-center gap-2"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Làm mới</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={cn(
                                    "lg:hidden h-9 w-9 rounded-lg border-gray-200 dark:border-gray-800 transition-all",
                                    showMobileFilters ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-white dark:bg-gray-800/50"
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
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden lg:overflow-visible lg:flex lg:flex-row lg:items-center gap-2"
                                >
                                    <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center pt-2 lg:pt-0">
                                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-rose-500 text-xs sm:text-sm lg:w-44 px-3">
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
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-rose-500 text-xs sm:text-sm lg:w-44 px-3">
                                                <SelectValue placeholder="Danh mục" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả danh mục</SelectItem>
                                                {categories?.map((cat: any) => (
                                                    <SelectItem key={cat.id} value={cat.nam}>{cat.nam}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-rose-500 text-xs sm:text-sm lg:w-40 px-3">
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {selectedExpenses.length > 0 && (
                        <div className="mt-2 flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                    {selectedExpenses.length} đã chọn
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
                            <TableRow className="hover:bg-transparent border-gray-100/50 dark:border-gray-800/50 h-10 uppercase tracking-wider text-[11px] font-medium text-gray-400">
                                <TableHead className="w-[40px] px-1 text-center">
                                    <Checkbox
                                        checked={selectedExpenses.length === filteredExpense.length && filteredExpense.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded-md border-gray-300"
                                    />
                                </TableHead>
                                <TableHead>Ngày</TableHead>
                                <TableHead>Chi nhánh</TableHead>
                                <TableHead>Danh mục</TableHead>
                                <TableHead>Số tiền</TableHead>
                                <TableHead>Hình thức</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpense.map((item: any) => (
                                <TableRow
                                    key={item.id}
                                    onClick={() => {
                                        setViewingExpense(item)
                                        setDetailSheetOpen(true)
                                    }}
                                    className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 border-gray-100/50 dark:border-gray-800/50 transition-colors cursor-pointer"
                                >
                                    <TableCell
                                        className="px-1 text-center"
                                        onClick={(e) => toggleSelect(item.id, e)}
                                    >
                                        <Checkbox
                                            checked={selectedExpenses.includes(item.id)}
                                            onCheckedChange={() => { }} // Controlled by row/cell click
                                            className="rounded-md border-gray-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                                        />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                {new Date(item.recorded_at).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter mt-0.5">Ghi nhận</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                                {item.branches?.short_name || 'LF'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium mt-0.5">{item.branches?.name || 'Chi nhánh'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="w-fit inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">
                                                {item.category_id || 'Chưa phân loại'}
                                            </span>
                                            {item.description && (
                                                <span className="text-[11px] text-gray-400 line-clamp-1 max-w-[180px]">
                                                    {item.description}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-sm font-black text-rose-600 dark:text-rose-400 tracking-tight">
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
                            {filteredExpense.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl flex items-center justify-center">
                                                <Banknote className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Không tìm thấy dữ liệu</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <ExpenseDetailsSheet
                expense={viewingExpense}
                open={detailSheetOpen}
                onOpenChange={setDetailSheetOpen}
                onSuccess={refetch}
            />
        </div>
    )
}
