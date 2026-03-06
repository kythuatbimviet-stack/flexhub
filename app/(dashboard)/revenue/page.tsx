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
import { fetchRevenue, bulkDeleteRevenue, fetchFinancialCategories } from '@/app/actions/financial'
import { fetchBranches } from '@/app/actions/branches'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
import { AddRevenueDialog } from '@/components/financial/add-revenue-dialog'
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

    const { data: categories } = useQuery({
        queryKey: ['financial-categories-revenue'],
        queryFn: async () => {
            const result = await fetchFinancialCategories('revenue')
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const filteredRevenue = React.useMemo(() => {
        if (!revenueData) return []
        return revenueData.filter((item: any) => {
            const matchesSearch =
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            'Danh mục': item.financial_categories?.name,
            'Chi nhánh': item.branches?.name,
            'Khách hàng': item.customers?.name || 'Vãng lai',
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
        <div className="flex flex-col gap-8 p-8 bg-gray-50/50 min-h-screen font-inter">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-950 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <DollarSign className="text-white w-6 h-6" />
                        </div>
                        Quản lý Khoản thu
                    </h1>
                    <p className="text-gray-500 text-sm pl-1">Theo dõi và quản lý mọi dòng tiền đi vào hệ thống.</p>
                </div>
                <div className="flex items-center gap-3">
                    <ImportExcelRevenueDialog onSuccess={refetch} />
                    <AddRevenueDialog onSuccess={refetch} />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-110">
                        <DollarSign className="w-16 h-16 text-emerald-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Tổng thu (Lọc)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-medium">Từ {filteredRevenue.length} giao dịch</p>
                    </CardContent>
                </Card>
                {/* Add more summary cards here if needed (e.g. Daily, Monthly) */}
            </div>

            {/* Filters & Table Section */}
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/50 bg-white dark:bg-gray-900 overflow-hidden">
                <div className="p-8 border-b border-gray-50 dark:border-gray-800 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-1 items-center gap-4 max-w-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm mã, khách hàng, diễn giải..."
                                    className="pl-11 h-12 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                className="h-12 w-12 rounded-2xl border-gray-100 dark:border-gray-800 p-0 text-gray-400 hover:text-emerald-600 hover:border-emerald-100 transition-all"
                                onClick={handleExportExcel}
                            >
                                <FileDown className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                    <Building2 className="w-4 h-4 text-emerald-600" />
                                </div>
                                <Select value={branchFilter} onValueChange={setBranchFilter}>
                                    <SelectTrigger className="w-[160px] border-none bg-transparent shadow-none h-9 text-xs font-bold focus:ring-0">
                                        <SelectValue placeholder="Chi nhánh" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100">
                                        <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                        {branches?.map((branch: any) => (
                                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                    <Filter className="w-4 h-4 text-emerald-600" />
                                </div>
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-[160px] border-none bg-transparent shadow-none h-9 text-xs font-bold focus:ring-0">
                                        <SelectValue placeholder="Danh mục" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100">
                                        <SelectItem value="all">Tất cả danh mục</SelectItem>
                                        {categories?.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {selectedRevenues.length > 0 && (
                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-500/20">
                                    {selectedRevenues.length}
                                </div>
                                <span className="text-sm font-bold text-red-700 dark:text-red-400">Giao dịch đã chọn</span>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="rounded-xl px-4 bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-widest"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa tất cả
                            </Button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-50 dark:border-gray-800">
                                <TableHead className="w-[50px] pl-8">
                                    <Checkbox
                                        checked={selectedRevenues.length === filteredRevenue.length && filteredRevenue.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded-md border-gray-300"
                                    />
                                </TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-widest text-gray-400 py-6">Ngày</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-widest text-gray-400 py-6">Mã / Khách hàng</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-widest text-gray-400 py-6">Danh mục</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-widest text-gray-400 py-6">Số tiền</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-widest text-gray-400 py-6">Hình thức</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-widest text-gray-400 py-6 text-right pr-8">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRevenue.map((item: any) => (
                                <TableRow
                                    key={item.id}
                                    className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 border-gray-50 dark:border-gray-800 transition-colors"
                                >
                                    <TableCell className="pl-8">
                                        <Checkbox
                                            checked={selectedRevenues.includes(item.id)}
                                            onCheckedChange={() => toggleSelect(item.id)}
                                            className="rounded-md border-gray-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                        />
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                {new Date(item.recorded_at).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                                ID: {item.id.split('-')[0]}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-xs uppercase">
                                                {item.customers?.name?.charAt(0) || <User className="w-4 h-4" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.customers?.name || 'Khách vãng lai'}</span>
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{item.branches?.name}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                            {item.financial_categories?.name || 'Phổ thông'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-heavy text-emerald-600 dark:text-emerald-400 font-black tracking-tight">
                                            {new Intl.NumberFormat('vi-VN').format(item.amount)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{item.payment_method}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-9 h-9 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                onClick={() => {
                                                    setViewingRevenue(item)
                                                    setDetailSheetOpen(true)
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-9 h-9 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                onClick={() => {
                                                    setViewingRevenue(item)
                                                    setDetailSheetOpen(true)
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-9 h-9 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                                onClick={async () => {
                                                    if (confirm('Bạn có chắc muốn xóa khoản thu này?')) {
                                                        const result = await bulkDeleteRevenue([item.id])
                                                        if (result.success) {
                                                            toast.success('Đã xóa thành công')
                                                            refetch()
                                                        }
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
                                            <p className="text-sm font-bold text-gray-400">Không tìm thấy khoản thu nào</p>
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
        </div>
    )
}
