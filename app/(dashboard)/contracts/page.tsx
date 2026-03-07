'use client'

import * as React from 'react'
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    FileText,
    User,
    Calendar,
    Building2,
    CreditCard,
    Trash,
    Clock,
    BadgeCheck,
    Package,
    RotateCcw,
    FileDown,
    FileUp
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
import { useQuery } from '@tanstack/react-query'
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

export default function ContractsPage() {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedContract, setSelectedContract] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)

    // Filter states
    const [statusFilter, setStatusFilter] = React.useState('all')
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [ptFilter, setPtFilter] = React.useState('all')
    const [contractTypeFilter, setContractTypeFilter] = React.useState('all')
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)

    const clearFilters = () => {
        setSearchTerm('')
        setStatusFilter('all')
        setBranchFilter('all')
        setPtFilter('all')
        setContractTypeFilter('all')
        toast.info('Đã xóa tất cả bộ lọc')
    }

    const { data: contracts, isLoading, refetch } = useQuery({
        queryKey: ['contracts'],
        queryFn: async () => {
            const result = await fetchContracts()
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

    const handleRowClick = (contract: any, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
            (e.target as HTMLElement).tagName.toLowerCase() === 'label'
        ) {
            return
        }
        setSelectedContract(contract)
        setIsDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
            const result = await bulkDeleteContracts([id])
            if (!result.success) {
                toast.error('Lỗi khi xóa: ' + result.error)
            } else {
                toast.success('Đã xóa hợp đồng thành công')
                refetch()
            }
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return

        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} hợp đồng đã chọn?`)) {
            const result = await bulkDeleteContracts(selectedRows)

            if (!result.success) {
                toast.error('Lỗi khi xóa hàng loạt: ' + result.error)
            } else {
                toast.success(`Đã xóa thành công ${selectedRows.length} hợp đồng`)
                setSelectedRows([])
                refetch()
            }
        }
    }

    const exportToExcel = () => {
        if (!filteredContracts || filteredContracts.length === 0) {
            toast.error('Không có dữ liệu để xuất')
            return
        }

        const data = filteredContracts.map(c => ({
            'Mã HĐ': c.id,
            'Khách hàng': c.member_name,
            'Số điện thoại': c.phone,
            'Email': c.email,
            'Gói tập': c.package_name,
            'Loại hợp đồng': c.contract_type,
            'Tổng tiền': c.total_amount,
            'Phương thức': c.payment_method,
            'Chi nhánh': c.branches?.name || '',
            'PT phụ trách': c.trainer_name,
            'Ngày ký': c.start_date ? new Date(c.start_date).toLocaleDateString('vi-VN') : '',
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Contracts')
        XLSX.writeFile(wb, `Contracts_Export_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Đã xuất file Excel thành công')
    }

    const filteredContracts = contracts?.filter(contract => {
        const matchesSearch =
            contract.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contract.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contract.package_name?.toLowerCase().includes(searchTerm.toLowerCase())

        // Status filter (logic might need adjustment based on how status is stored)
        const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
        const matchesBranch = branchFilter === 'all' || contract.branch_id === branchFilter
        const matchesPT = ptFilter === 'all' || contract.trainer_name === ptFilter
        const matchesType = contractTypeFilter === 'all' || contract.contract_type === contractTypeFilter

        return matchesSearch && matchesStatus && matchesBranch && matchesPT && matchesType
    })

    // Unique PT options for filter
    const ptOptions = React.useMemo(() => {
        if (!contracts) return []
        const pts = contracts.map((c: any) => c.trainer_name).filter(Boolean)
        return Array.from(new Set(pts))
    }, [contracts])

    // Unique Contract Type options for filter
    const typeOptions = React.useMemo(() => {
        if (!contracts) return []
        const types = contracts.map((c: any) => c.contract_type).filter(Boolean)
        return Array.from(new Set(types))
    }, [contracts])

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedRows.length === (filteredContracts?.length || 0)) {
            setSelectedRows([])
        } else {
            setSelectedRows(filteredContracts?.map(c => c.id) || [])
        }
    }

    return (
        <div className="space-y-1.5 font-inter pb-10">
            <ContractDetailsSheet
                contract={selectedContract}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onSuccess={refetch}
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
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            >
                                <Button
                                    variant="ghost"
                                    onClick={handleBulkDelete}
                                    className="text-red-700 hover:text-red-800 hover:bg-red-50 font-medium px-4"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Xóa ({selectedRows.length})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex gap-2">
                        <ImportExcelContractDialog onSuccess={refetch} />
                        <Button
                            variant="ghost"
                            onClick={exportToExcel}
                            className="rounded-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 h-11 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                            <FileDown className="w-4.5 h-4.5 mr-2" />
                            <span className="hidden sm:inline">Xuất Excel</span>
                        </Button>
                        <AddContractDialog onSuccess={refetch} />
                    </div>
                </div>
            </div>

            {/* Optimized Compact Filter Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 transition-all duration-300 py-0">
                <div className="py-1 px-1 sm:px-1.5 border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-gray-800/20 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        {/* Search & Toggle Row */}
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                <input
                                    placeholder="Tìm kiếm hợp đồng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-sm outline-none"
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
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
                                                <SelectValue placeholder="Trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                                <SelectItem value="Đang thực hiện">Đang thực hiện</SelectItem>
                                                <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
                                                <SelectItem value="Đã hủy">Đã hủy</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
                                                <SelectValue placeholder="Chi nhánh" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                                {branches?.map((branch: any) => (
                                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={ptFilter} onValueChange={setPtFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
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
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
                                                <SelectValue placeholder="Loại hợp đồng" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả loại</SelectItem>
                                                {typeOptions.map((type: string) => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="ghost"
                                            onClick={clearFilters}
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
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white dark:bg-gray-900 transition-all duration-500">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-50 dark:border-gray-800 hover:bg-transparent border-t-0">
                                <TableHead className="w-12 pl-6 h-9">
                                    <Checkbox
                                        checked={selectedRows.length === (filteredContracts?.length || 0) && (filteredContracts?.length || 0) > 0}
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
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 border-4 border-red-50 border-t-red-600 rounded-full animate-spin" />
                                            </div>
                                            <span className="text-gray-400 font-medium text-sm">Đang tải danh sách hợp đồng...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredContracts?.length === 0 ? (
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
                                filteredContracts?.map((contract) => (
                                    <TableRow
                                        key={contract.id}
                                        onClick={(e) => handleRowClick(contract, e)}
                                        className={cn(
                                            "border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer group transition-colors",
                                            selectedRows.includes(contract.id) && "bg-red-50/30 dark:bg-red-950/20"
                                        )}
                                    >
                                        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedRows.includes(contract.id)}
                                                onCheckedChange={() => toggleRow(contract.id)}
                                                className="rounded-lg"
                                            />
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedContract(contract); setIsDetailsOpen(true); }}
                                                    className="w-8 h-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(contract.id); }}
                                                    className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600"
                                                >
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

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-tight">
                        Tổng số: {filteredContracts?.length || 0} hợp đồng
                    </p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="rounded-lg h-9 px-4 font-medium text-xs text-gray-400 disabled:opacity-20 transition-all border border-gray-100 dark:border-gray-800" disabled>
                            Trước
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-lg h-9 px-4 font-medium text-xs text-gray-400 disabled:opacity-20 transition-all border border-gray-100 dark:border-gray-800" disabled>
                            Tiếp theo
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
