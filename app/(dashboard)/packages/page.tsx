'use client'

import * as React from 'react'
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    Package,
    Building2,
    DollarSign,
    Calendar,
    Trash,
    FileSpreadsheet,
    XCircle,
    TrendingUp,
    Clock,
    AlertCircle,
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'
import { fetchMemberships, bulkDeleteMemberships } from '@/app/actions/memberships'
import { fetchBranches } from '@/app/actions/branches'

import { MembershipDetailsSheet } from '@/components/memberships/membership-details-sheet'
import { ImportMembershipsDialog } from '@/components/memberships/import-memberships-dialog'

export default function PackagesPage() {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [filterBranch, setFilterBranch] = React.useState('all')
    const [filterType, setFilterType] = React.useState('all')
    const [filterTrainer, setFilterTrainer] = React.useState('all')
    const [filterDuration, setFilterDuration] = React.useState('all')
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedPkg, setSelectedPkg] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)

    const { data: packages, isLoading, refetch, isError, error } = useQuery({
        queryKey: ['memberships'],
        queryFn: async () => {
            const result = await fetchMemberships()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? res.data : []
        }
    })

    if (isError) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6 font-inter">
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/20 rounded-[2.5rem] flex items-center justify-center text-rose-600">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lỗi tải dữ liệu</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        {(error as any)?.message || 'Đã xảy ra lỗi không xác định khi kết nối với máy chủ.'}
                    </p>
                </div>
                <Button
                    onClick={() => refetch()}
                    className="rounded-xl px-10 bg-slate-950 dark:bg-red-600 font-bold"
                >
                    Thử lại ngay
                </Button>
            </div>
        )
    }

    const handleRowClick = (pkg: any, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
            (e.target as HTMLElement).tagName.toLowerCase() === 'label'
        ) {
            return
        }
        setSelectedPkg(pkg)
        setIsDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa gói tập này?')) {
            const result = await bulkDeleteMemberships([id])
            if (!result.success) {
                toast.error('Lỗi khi xóa: ' + result.error)
            } else {
                toast.success('Đã xóa gói tập thành công')
                refetch()
            }
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return
        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} gói tập đã chọn?`)) {
            const result = await bulkDeleteMemberships(selectedRows)
            if (!result.success) {
                toast.error('Lỗi khi xóa hàng loạt: ' + result.error)
            } else {
                toast.success(`Đã xóa thành công ${selectedRows.length} gói tập`)
                setSelectedRows([])
                refetch()
            }
        }
    }

    const exportToExcel = () => {
        if (!packages || packages.length === 0) return
        const exportData = filteredPackages?.map(p => ({
            'Mã Gói': p.id,
            'Tên Gói tập': p.package_name,
            'Chi nhánh': p.branches?.name || 'Toàn hệ thống',
            'Hình thức tập': p.package_type,
            'Huấn luyện viên': p.trainer_type,
            'Giá niêm yết': p.unit_price,
            'Giá ưu đãi': p.discounted_price,
            'Thời hạn (Ngày)': p.duration_days,
            'Ngày tạo': new Date(p.created_at).toLocaleDateString('vi-VN')
        }))

        const worksheet = XLSX.utils.json_to_sheet(exportData!)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Packages')
        XLSX.writeFile(workbook, `LadyFit_Packages_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Đã xuất dữ liệu Excel thành công')
    }

    const filteredPackages = packages?.filter(pkg => {
        const matchesSearch =
            pkg.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.id?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesBranch = filterBranch === 'all' || pkg.branch_id === filterBranch
        const matchesType = filterType === 'all' || pkg.package_type === filterType
        const matchesTrainer = filterTrainer === 'all' || pkg.trainer_type === filterTrainer
        const matchesDuration = filterDuration === 'all' || (pkg.duration_days !== null && pkg.duration_days !== undefined && pkg.duration_days.toString() === filterDuration)

        return matchesSearch && matchesBranch && matchesType && matchesTrainer && matchesDuration
    })

    const resetFilters = () => {
        setSearchTerm('')
        setFilterBranch('all')
        setFilterType('all')
        setFilterTrainer('all')
        setFilterDuration('all')
    }

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedRows.length === (filteredPackages?.length || 0)) {
            setSelectedRows([])
        } else {
            setSelectedRows(filteredPackages?.map(p => p.id) || [])
        }
    }

    return (
        <div className="space-y-1.5 font-inter pb-10">
            <MembershipDetailsSheet
                pkg={selectedPkg}
                open={isDetailsOpen}
                onOpenChange={(open) => {
                    setIsDetailsOpen(open)
                    if (!open) setSelectedPkg(null)
                }}
                onSuccess={refetch}
            />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 uppercase">
                        <Package className="w-8 h-8 text-red-600" />
                        Gói tập
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight">Danh mục các gói dịch vụ Eva's Fit.</p>
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
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold px-4 rounded-xl h-11 transition-all"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Xóa ({selectedRows.length})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ImportMembershipsDialog onSuccess={refetch} />

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
                            setSelectedPkg(null)
                            setIsDetailsOpen(true)
                        }}
                        className="bg-slate-950 dark:bg-red-600 hover:bg-black dark:hover:bg-red-700 text-white rounded-2xl px-6 h-12 font-semibold transition-all shadow-xl active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Thêm gói tập
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <Tabs value={filterBranch} onValueChange={setFilterBranch} className="w-full">
                    <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-none">
                        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 h-12 inline-flex min-w-max">
                            <TabsTrigger 
                                value="all" 
                                className="rounded-xl px-6 font-semibold text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all h-full"
                            >
                                Tất cả gói tập
                            </TabsTrigger>
                            {branches?.map((branch: any) => (
                                <TabsTrigger 
                                    key={branch.id} 
                                    value={branch.id}
                                    className="rounded-xl px-6 font-semibold text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all h-full"
                                >
                                    {branch.short_name || branch.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </Tabs>

                <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-slate-900 transition-all duration-300 py-0">
                    <div className="py-1 px-1 sm:px-1.5 border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        {/* Search & Toggle Row */}
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    placeholder="Tìm theo tên hoặc mã gói tập..."
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
                                        <Select value={filterType} onValueChange={setFilterType}>
                                            <SelectTrigger className="w-full lg:w-[160px] rounded-lg border-none h-9 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-1 focus:ring-red-500 shadow-none">
                                                <SelectValue placeholder="Hình thức" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 font-inter">
                                                <SelectItem value="all">Tất cả hình thức</SelectItem>
                                                <SelectItem value="Offline">Offline</SelectItem>
                                                <SelectItem value="Online">Online</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={filterTrainer} onValueChange={setFilterTrainer}>
                                            <SelectTrigger className="w-full lg:w-[170px] rounded-lg border-none h-9 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-1 focus:ring-red-500 shadow-none">
                                                <SelectValue placeholder="Huấn luyện viên" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 font-inter">
                                                <SelectItem value="all">Tất cả huấn luyện viên</SelectItem>
                                                <SelectItem value="Kèm PT">Kèm PT</SelectItem>
                                                <SelectItem value="Không kèm PT">Không kèm PT</SelectItem>
                                                <SelectItem value="Tự do">Tự do</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={filterDuration} onValueChange={setFilterDuration}>
                                            <SelectTrigger className="w-full lg:w-[150px] rounded-lg border-none h-9 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-1 focus:ring-red-500 shadow-none">
                                                <SelectValue placeholder="Thời hạn" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 font-inter">
                                                <SelectItem value="all">Tất cả thời hạn</SelectItem>
                                                <SelectItem value="30">30 ngày</SelectItem>
                                                <SelectItem value="90">90 ngày</SelectItem>
                                                <SelectItem value="180">180 ngày</SelectItem>
                                                <SelectItem value="365">365 ngày</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="ghost"
                                            onClick={resetFilters}
                                            className="h-9 px-3 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all shrink-0 col-span-2 lg:col-span-1 justify-center lg:w-auto"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2 lg:mr-0" />
                                            <span className="lg:hidden text-sm font-semibold">Làm mới bộ lọc</span>
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
                                        checked={selectedRows.length === (filteredPackages?.length || 0) && (filteredPackages?.length || 0) > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-slate-300 dark:border-slate-700 data-[state=checked]:bg-slate-950 dark:data-[state=checked]:bg-red-600 data-[state=checked]:border-slate-950 dark:data-[state=checked]:border-red-600"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Gói tập & Mã</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Chi nhánh</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9">Phân loại</TableHead>
                                <TableHead className="text-[11px] font-medium text-slate-400 dark:text-blue-300 h-9 text-right">Giá niêm yết</TableHead>
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
                                                    <Package className="w-6 h-6 text-red-500/50" />
                                                </div>
                                            </div>
                                            <span className="text-slate-400 font-medium text-sm">Đang tải danh sách gói tập...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPackages?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-72 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center">
                                                <Search className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                            </div>
                                            <p className="text-slate-400 text-sm font-medium">Không tìm thấy gói tập nào khớp với yêu cầu.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPackages?.map((pkg) => (
                                    <TableRow
                                        key={pkg.id}
                                        onClick={(e) => handleRowClick(pkg, e)}
                                        className={cn(
                                            "border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group cursor-pointer",
                                            selectedRows.includes(pkg.id) && "bg-red-50/20 dark:bg-red-950/10"
                                        )}
                                    >
                                        <TableCell className="pl-8 py-2">
                                            <Checkbox
                                                checked={selectedRows.includes(pkg.id)}
                                                onCheckedChange={() => toggleRow(pkg.id)}
                                                className="rounded-lg border-slate-300 dark:border-slate-700 data-[state=checked]:bg-slate-950 dark:data-[state=checked]:bg-red-600 data-[state=checked]:border-slate-950 dark:data-[state=checked]:border-red-600"
                                            />
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-slate-900 dark:text-white text-[15px]">
                                                    {pkg.package_name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-slate-400 tracking-wider">#{pkg.id}</span>
                                                    {pkg.duration_days && (
                                                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <Clock className="w-2.5 h-2.5" />
                                                            {pkg.duration_days} ngày
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                                <Building2 className="w-3.5 h-3.5 text-slate-300" />
                                                {pkg.branches?.name || 'Toàn hệ thống'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                                    {pkg.package_type}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-medium italic">
                                                    {pkg.trainer_type || 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.unit_price)}
                                                </span>
                                                {pkg.discounted_price && (
                                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        Ưu đãi: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.discounted_price)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52 rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 p-2 font-inter">
                                                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Tùy chọn</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer gap-3 px-3 py-2.5 rounded-xl focus:bg-slate-50 dark:focus:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-red-500" /> Xem & Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-1 my-1" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(pkg.id)}
                                                        className="text-rose-600 cursor-pointer gap-3 px-3 py-2.5 rounded-xl focus:bg-rose-50 dark:focus:bg-rose-950/30 font-semibold text-xs"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Xóa gói tập
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
                        Tổng cộng: {filteredPackages?.length || 0} gói tập
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
        </div>
    )
}
