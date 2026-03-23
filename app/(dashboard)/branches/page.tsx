'use client'

import * as React from 'react'
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    Phone,
    Building2,
    MapPin,
    User,
    Trash,
    FileSpreadsheet,
    XCircle,
    Loader2,
    RotateCcw,
    Plus
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'
import { fetchBranches, bulkDeleteBranches } from '@/app/actions/branches'

import { BranchDetailsSheet } from '@/components/branches/branch-details-sheet'
import { ImportBranchesDialog } from '@/components/branches/import-branches-dialog'

export default function BranchesPage() {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [filterStatus, setFilterStatus] = React.useState('all')
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedBranch, setSelectedBranch] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)

    const { data: branches, isLoading, refetch } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const handleRowClick = (branch: any, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
            (e.target as HTMLElement).tagName.toLowerCase() === 'label'
        ) {
            return
        }
        setSelectedBranch(branch)
        setIsDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa chi nhánh này?')) {
            const result = await bulkDeleteBranches([id])
            if (!result.success) {
                toast.error('Lỗi khi xóa: ' + result.error)
            } else {
                toast.success('Đã xóa chi nhánh thành công')
                refetch()
            }
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return
        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} chi nhánh đã chọn?`)) {
            const result = await bulkDeleteBranches(selectedRows)
            if (!result.success) {
                toast.error('Lỗi khi xóa hàng loạt: ' + result.error)
            } else {
                toast.success(`Đã xóa thành công ${selectedRows.length} chi nhánh`)
                setSelectedRows([])
                refetch()
            }
        }
    }

    const exportToExcel = () => {
        if (!branches || branches.length === 0) return
        const exportData = filteredBranches?.map(b => ({
            'ID': b.id,
            'Tên Chi nhánh': b.name,
            'Tên viết tắt': b.short_name,
            'Địa chỉ': b.address,
            'Số điện thoại': b.phone,
            'Người đại diện': b.representative,
            'Ngân hàng': b.bank_name,
            'Số tài khoản': b.account_number,
            'Chủ tài khoản': b.account_holder,
            'Trạng thái': b.status === 'Active' ? 'Hoạt động' : 'Tạm dừng',
            'Ngày tạo': new Date(b.created_at).toLocaleDateString('vi-VN')
        }))

        const worksheet = XLSX.utils.json_to_sheet(exportData!)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Branches')
        XLSX.writeFile(workbook, `LadyFit_Branches_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Đã xuất dữ liệu Excel thành công')
    }

    const filteredBranches = branches?.filter(branch => {
        const matchesSearch =
            branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.address?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = filterStatus === 'all' || branch.status === filterStatus

        return matchesSearch && matchesStatus
    })

    const resetFilters = () => {
        setSearchTerm('')
        setFilterStatus('all')
    }

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedRows.length === (filteredBranches?.length || 0)) {
            setSelectedRows([])
        } else {
            setSelectedRows(filteredBranches?.map(b => b.id) || [])
        }
    }

    return (
        <div className="space-y-8 font-inter pb-10">
            <BranchDetailsSheet
                branch={selectedBranch}
                open={isDetailsOpen}
                onOpenChange={(open) => {
                    setIsDetailsOpen(open)
                    if (!open) setSelectedBranch(null)
                }}
                onSuccess={refetch}
            />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 uppercase">
                        <Building2 className="w-8 h-8 text-red-600" />
                        Chi nhánh
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight">Quản lý mạng lưới cơ sở Eva's Fit trên toàn quốc.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <AnimatePresence>
                        {selectedRows.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            >
                                <Button
                                    variant="ghost"
                                    onClick={handleBulkDelete}
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold px-4 h-11 rounded-xl"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Xóa ({selectedRows.length})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ImportBranchesDialog onSuccess={refetch} />

                    <Button
                        variant="ghost"
                        onClick={exportToExcel}
                        className="rounded-xl h-11 px-4 font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-600 dark:text-slate-300"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" />
                        Xuất Excel
                    </Button>

                    <Button
                        onClick={() => {
                            setSelectedBranch(null)
                            setIsDetailsOpen(true)
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-2xl px-6 h-12 font-semibold transition-all shadow-lg shadow-red-200 dark:shadow-none"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Thêm chi nhánh
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-slate-900 transition-all duration-300 py-0">
                <div className="py-1 px-1 sm:px-1.5 border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        {/* Search & Toggle Row */}
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    placeholder="Tìm kiếm chi nhánh..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 bg-white dark:bg-slate-800 border-none rounded-lg focus:ring-1 focus:ring-red-500 text-sm h-9 transition-all outline-none"
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
                                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                                            <SelectTrigger className="w-full lg:w-[180px] rounded-lg border-none h-9 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-red-500 shadow-none">
                                                <SelectValue placeholder="Trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                                <SelectItem value="Active">Đang kinh doanh</SelectItem>
                                                <SelectItem value="Inactive">Tạm dừng</SelectItem>
                                            </SelectContent>
                                        </Select>

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

            {/* Table Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-all duration-500">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent border-t-0">
                                <TableHead className="w-14 pl-8 h-9">
                                    <Checkbox
                                        checked={selectedRows.length === (filteredBranches?.length || 0) && (filteredBranches?.length || 0) > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-slate-300 dark:border-slate-700 data-[state=checked]:bg-slate-950 dark:data-[state=checked]:bg-red-600 data-[state=checked]:border-slate-950 dark:data-[state=checked]:border-red-600"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Tên chi nhánh</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Phụ trách & Liên hệ</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Địa chỉ</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9 text-center">Trạng thái</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9 text-right pr-10">Tùy chọn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-72 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-slate-100 border-t-red-500 rounded-full animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Building2 className="w-6 h-6 text-red-500/50" />
                                                </div>
                                            </div>
                                            <span className="text-slate-400 font-medium text-sm">Đang tải dữ liệu chi nhánh...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredBranches?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-72 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center">
                                                <Search className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                            </div>
                                            <p className="text-slate-400 text-sm font-medium">Không tìm thấy chi nhánh nào khớp với yêu cầu.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBranches?.map((branch) => (
                                    <TableRow
                                        key={branch.id}
                                        onClick={(e) => handleRowClick(branch, e)}
                                        className={cn(
                                            "border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group cursor-pointer",
                                            selectedRows.includes(branch.id) && "bg-red-50/20 dark:bg-red-950/10"
                                        )}
                                    >
                                        <TableCell className="pl-8 py-2">
                                            <Checkbox
                                                checked={selectedRows.includes(branch.id)}
                                                onCheckedChange={() => toggleRow(branch.id)}
                                                className="rounded-lg border-slate-300 dark:border-slate-700 data-[state=checked]:bg-slate-950 dark:data-[state=checked]:bg-red-600 data-[state=checked]:border-slate-950 dark:data-[state=checked]:border-red-600"
                                            />
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                                        {branch.name}
                                                    </span>
                                                    {branch.short_name && (
                                                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                            {branch.short_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-medium text-slate-400 tracking-wider">#{branch.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm font-medium">
                                                    <User className="w-3.5 h-3.5 text-slate-300" />
                                                    {branch.representative || '-'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                                    <Phone className="w-3 h-3" />
                                                    <span>{branch.phone || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium max-w-[280px] break-words">
                                                <MapPin className="w-3.5 h-3.5 text-red-500/30 shrink-0" />
                                                {branch.address || 'Chưa cập nhật'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider transition-all shadow-sm",
                                                    branch.status === 'Active'
                                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                                                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                                )}>
                                                    {branch.status === 'Active' ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52 rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 p-2">
                                                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Tùy chọn</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer gap-3 px-3 py-2.5 rounded-xl focus:bg-slate-50 dark:focus:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-red-500" /> Xem & Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-1 my-1" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(branch.id)}
                                                        className="text-rose-600 cursor-pointer gap-3 px-3 py-2.5 rounded-xl focus:bg-rose-50 dark:focus:bg-rose-950/30 font-semibold text-xs"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Xóa chi nhánh
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm border border-slate-50 dark:border-slate-800">
                        Hiển thị <span className="font-semibold text-slate-900 dark:text-white px-1">{filteredBranches?.length || 0}</span> trên tổng số {branches?.length || 0} chi nhánh
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg h-9 px-4 font-semibold text-xs border-slate-200 dark:border-slate-800 text-slate-400 bg-white dark:bg-slate-900 disabled:opacity-20 transition-all" disabled>
                            Trang trước
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg h-9 px-4 font-semibold text-xs border-slate-200 dark:border-slate-800 text-slate-400 bg-white dark:bg-slate-900 disabled:opacity-20 transition-all" disabled>
                            Trang tiếp
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
