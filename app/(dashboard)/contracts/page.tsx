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
        <div className="space-y-8 max-w-[1600px] mx-auto font-inter">
            <ContractDetailsSheet
                contract={selectedContract}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onSuccess={refetch}
            />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-50">Quản lý Hợp đồng</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Theo dõi và quản lý các hợp đồng dịch vụ của hội viên Lady Fit.</p>
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
                    <ImportExcelContractDialog onSuccess={refetch} />
                    <Button
                        variant="ghost"
                        onClick={exportToExcel}
                        className="rounded-xl text-gray-600 dark:text-gray-300 font-medium h-11 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-600 transition-all border border-gray-100 dark:border-gray-800"
                    >
                        <FileDown className="w-4.5 h-4.5 mr-2" />
                        Xuất Excel
                    </Button>
                    <AddContractDialog onSuccess={refetch} />
                </div>
            </div>

            <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[2rem] overflow-visible bg-white dark:bg-gray-900 transition-all duration-500">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-gray-800/20">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                            <input
                                placeholder="Tìm kiếm hợp đồng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm h-12 transition-all shadow-sm outline-none"
                            />
                        </div>

                        <div className="w-44">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-red-500">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-800">
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="Đang thực hiện">Đang thực hiện</SelectItem>
                                    <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
                                    <SelectItem value="Đã hủy">Đã hủy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-44">
                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-red-500">
                                    <SelectValue placeholder="Chi nhánh" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-800">
                                    <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                    {branches?.map((branch: any) => (
                                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-44">
                            <Select value={ptFilter} onValueChange={setPtFilter}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-red-500">
                                    <SelectValue placeholder="PT phụ trách" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-800">
                                    <SelectItem value="all">Tất cả PT</SelectItem>
                                    {ptOptions.map((pt: string) => (
                                        <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-44">
                            <Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-red-500">
                                    <SelectValue placeholder="Loại hợp đồng" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-800">
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    {typeOptions.map((type: string) => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="h-12 px-4 rounded-2xl text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-all"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Xóa bộ lọc
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                            <TableRow className="border-gray-100 dark:border-gray-800 hover:bg-transparent">
                                <TableHead className="w-14 pl-6">
                                    <Checkbox
                                        checked={selectedRows.length === (filteredContracts?.length || 0) && (filteredContracts?.length || 0) > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-gray-300 dark:border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                    />
                                </TableHead>
                                <TableHead className="font-medium text-gray-600 dark:text-gray-400 tracking-tight text-[11px] py-6">Hợp đồng & Hội viên</TableHead>
                                <TableHead className="font-medium text-gray-600 dark:text-gray-400 tracking-tight text-[11px]">Dịch vụ & Gói tập</TableHead>
                                <TableHead className="font-medium text-gray-600 dark:text-gray-400 tracking-tight text-[11px]">Giá trị & Thanh toán</TableHead>
                                <TableHead className="font-medium text-gray-600 dark:text-gray-400 tracking-tight text-[11px]">Chi nhánh & Ngày ký</TableHead>
                                <TableHead className="font-medium text-gray-600 dark:text-gray-400 tracking-tight text-[11px] text-right pr-8">Tùy chọn</TableHead>
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
                                            "border-gray-50 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-all group cursor-pointer",
                                            selectedRows.includes(contract.id) && "bg-red-50/30 dark:bg-red-950/20"
                                        )}
                                    >
                                        <TableCell className="pl-6">
                                            <Checkbox
                                                checked={selectedRows.includes(contract.id)}
                                                onCheckedChange={() => toggleRow(contract.id)}
                                                className="rounded-lg border-gray-300 dark:border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            />
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-gray-50 flex items-center gap-2 text-sm">
                                                    {contract.member_name}
                                                    <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />
                                                </span>
                                                <span className="text-[10px] font-medium text-red-600 dark:text-red-500 tracking-tight mt-0.5 opacity-80">{contract.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-sm font-medium">
                                                    <Package className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                                    {contract.package_name || 'Chưa chọn gói'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                                    <Clock className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                                                    {contract.contract_type || 'Dịch vụ'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-sm font-medium text-red-600">
                                                    {contract.total_amount ? Number(contract.total_amount).toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                                                </span>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-tight">
                                                    <CreditCard className="w-3 h-3" />
                                                    {contract.payment_method || 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-[13px] font-medium">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
                                                    {contract.branches?.name || 'Văn phòng'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {contract.start_date ? new Date(contract.start_date).toLocaleDateString('vi-VN') : '-'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-400 transition-colors">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-[1.25rem] border-gray-100 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-900 p-2 z-50">
                                                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-medium text-gray-400 tracking-tight">Thao tác</DropdownMenuLabel>
                                                    <DropdownMenuItem className="cursor-pointer gap-3 px-4 py-3 rounded-xl transition-all focus:bg-red-50 dark:focus:bg-red-950/30 text-gray-800 dark:text-gray-200 font-medium text-sm">
                                                        <Edit2 className="w-4 h-4 text-red-600" /> Xem chi tiết
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1 my-1" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(contract.id)}
                                                        className="text-red-600 cursor-pointer gap-3 px-4 py-3 rounded-xl transition-all focus:bg-red-50 dark:focus:bg-red-950/30 font-medium text-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Hủy hợp đồng
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

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 flex items-center justify-between">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-tight">
                        Tổng số: {filteredContracts?.length || 0} hợp đồng
                    </p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="rounded-xl h-10 px-6 font-medium text-xs text-gray-400 disabled:opacity-20 transition-all" disabled>
                            Trước
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl h-10 px-6 font-medium text-xs text-gray-400 disabled:opacity-20 transition-all" disabled>
                            Tiếp theo
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
