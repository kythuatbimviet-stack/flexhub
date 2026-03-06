'use client'

import * as React from 'react'
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    Mail,
    Phone,
    FileDown,
    Trash,
    CheckCircle2,
    Loader2,
    User,
    Activity,
    Dumbbell,
    RotateCcw,
    ChevronRight,
    TrendingUp,
    Users,
    Target
} from 'lucide-react'
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fetchClients, bulkDeleteClients } from '@/app/actions/clients'
import { fetchBranches } from '@/app/actions/branches'

import { AddClientDialog } from '@/components/clients/add-client-dialog'
import { ClientDetailsSheet } from '@/components/clients/client-details-sheet'
import { ImportExcelClientDialog } from '@/components/clients/import-excel-client-dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export default function ClientsPage() {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedClient, setSelectedClient] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)

    // Filter states
    const [statusFilter, setStatusFilter] = React.useState('all')
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [ptFilter, setPtFilter] = React.useState('all')
    const [regTypeFilter, setRegTypeFilter] = React.useState('all')
    const [sourceFilter, setSourceFilter] = React.useState('all')

    const clearFilters = () => {
        setSearchTerm('')
        setStatusFilter('all')
        setBranchFilter('all')
        setPtFilter('all')
        setRegTypeFilter('all')
        setSourceFilter('all')
        toast.info('Đã xóa tất cả bộ lọc')
    }

    const { data: clients, isLoading, refetch } = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            const result = await fetchClients()
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

    const handleRowClick = (client: any, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
            (e.target as HTMLElement).tagName.toLowerCase() === 'label'
        ) {
            return
        }
        setSelectedClient(client)
        setIsDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa hồ sơ khách hàng này?')) {
            const result = await bulkDeleteClients([id])
            if (!result.success) {
                toast.error('Lỗi khi xóa: ' + result.error)
            } else {
                toast.success('Đã xóa hồ sơ khách hàng thành công')
                refetch()
            }
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return

        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} hồ sơ đã chọn?`)) {
            const result = await bulkDeleteClients(selectedRows)

            if (!result.success) {
                toast.error('Lỗi khi xóa hàng loạt: ' + result.error)
            } else {
                toast.success(`Đã xóa thành công ${selectedRows.length} hồ sơ`)
                setSelectedRows([])
                refetch()
            }
        }
    }

    const exportToExcel = () => {
        const dataToExport = clients && clients.length > 0
            ? clients.map(c => ({
                'Mã KH': c.id,
                'Tên hội viên': c.member_name,
                'Số điện thoại': c.phone,
                'Email': c.email,
                'Trạng thái': c.status,
                'Chi nhánh': branches?.find((b: any) => b.id === c.branch_id)?.name || '',
                'PT Phụ trách': c.pt_name,
                'Cân nặng': c.weight,
                'Mục tiêu': c.goal,
                'Gói tập': c.registration_type,
                'Ngày tạo': new Date(c.created_at).toLocaleDateString('vi-VN')
            }))
            : [{ 'Thông báo': 'Danh sách trống' }]

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Clients')
        XLSX.writeFile(wb, 'ladyfit_clients_list.xlsx')
        toast.success('Đã xuất file Excel thành công')
    }

    // First, filter by everything EXCEPT status to get accurate counts for the tabs
    const baseFilteredClients = React.useMemo(() => {
        if (!clients) return []
        return clients.filter(client => {
            const matchesSearch =
                client.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone?.includes(searchTerm) ||
                client.id?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesBranch = branchFilter === 'all' || client.branch_id === branchFilter
            const matchesPT = ptFilter === 'all' || client.pt_name === ptFilter
            const matchesRegType = regTypeFilter === 'all' || client.registration_type === regTypeFilter
            const matchesSource = sourceFilter === 'all' || client.source === sourceFilter

            return matchesSearch && matchesBranch && matchesPT && matchesRegType && matchesSource
        })
    }, [clients, searchTerm, branchFilter, ptFilter, regTypeFilter, sourceFilter])

    // Then, filter by status for the table display
    const filteredClients = React.useMemo(() => {
        return statusFilter === 'all'
            ? baseFilteredClients
            : baseFilteredClients.filter(c => c.status === statusFilter)
    }, [baseFilteredClients, statusFilter])

    // Get unique values for filters
    const ptOptions = React.useMemo(() => {
        if (!clients) return []
        const pts = clients.map((c: any) => c.pt_name).filter(Boolean)
        return Array.from(new Set(pts))
    }, [clients])

    const regTypeOptions = React.useMemo(() => {
        if (!clients) return []
        const types = clients.map((c: any) => c.registration_type).filter(Boolean)
        return Array.from(new Set(types))
    }, [clients])

    const sourceOptions = React.useMemo(() => {
        if (!clients) return []
        const sources = clients.map((c: any) => c.source).filter(Boolean)
        return Array.from(new Set(sources))
    }, [clients])

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedRows.length === (filteredClients?.length || 0)) {
            setSelectedRows([])
        } else {
            setSelectedRows(filteredClients?.map(c => c.id) || [])
        }
    }

    const stats = React.useMemo(() => {
        return {
            total: baseFilteredClients.length,
            active: baseFilteredClients.filter((c: any) => c.status === 'Đang tập').length,
            pending: baseFilteredClients.filter((c: any) => c.status === 'Chốt đăng kí').length,
            paused: baseFilteredClients.filter((c: any) => c.status === 'Tạm dừng').length,
            stopped: baseFilteredClients.filter((c: any) => c.status === 'Đã nghỉ').length,
        }
    }, [baseFilteredClients])

    return (
        <div className="space-y-1.5 max-w-[1600px] mx-auto font-inter pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Users className="w-8 h-8 text-red-500" />
                        Khách hàng
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Quản lý và theo dõi thông tin hội viên chi tiết.</p>
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
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium px-4 h-11 rounded-xl border border-red-100 dark:border-red-900/30"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Xóa ({selectedRows.length})</span>
                                    <span className="sm:hidden">{selectedRows.length}</span>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex gap-2">
                        <ImportExcelClientDialog onSuccess={refetch} />
                        <Button
                            variant="ghost"
                            onClick={exportToExcel}
                            className="rounded-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 h-11 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                            <FileDown className="w-4.5 h-4.5 mr-2" />
                            <span className="hidden sm:inline">Xuất Excel</span>
                        </Button>
                        <AddClientDialog onSuccess={refetch} />
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="bg-transparent h-auto p-0 flex flex-nowrap overflow-x-auto no-scrollbar gap-1 px-1 mb-1 w-full justify-start">
                    {[
                        { label: 'Tất cả', value: 'all', count: stats.total, color: 'text-gray-600', bg: 'bg-gray-100' },
                        { label: 'Đang tập', value: 'Đang tập', count: stats.active, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Chốt ĐK', value: 'Chốt đăng kí', count: stats.pending, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Tạm dừng', value: 'Tạm dừng', count: stats.paused, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Đã nghỉ', value: 'Đã nghỉ', count: stats.stopped, color: 'text-rose-600', bg: 'bg-rose-50' },
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className={cn(
                                "flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm border-none",
                                statusFilter === tab.value ? tab.color : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {tab.label}
                            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-bold", tab.bg, tab.color)}>
                                {tab.count}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Optimized Compact Filter Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 transition-all duration-300">
                <div className="py-0 px-1 sm:px-1.5 border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-gray-800/20 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        {/* Search Input */}
                        <div className="relative group flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                            <Input
                                placeholder="Tìm tên, SĐT..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-sm"
                            />
                        </div>

                        {/* Filters Grid: Balanced on mobile, fixed-width on desktop */}
                        <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center">
                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm lg:w-44 px-3">
                                    <SelectValue placeholder="Chi nhánh" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                    <SelectItem value="all">Tất cả Chi nhánh</SelectItem>
                                    {branches?.map((b: any) => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={ptFilter} onValueChange={setPtFilter}>
                                <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm lg:w-44 px-3">
                                    <SelectValue placeholder="PT" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                    <SelectItem value="all">Tất cả PT</SelectItem>
                                    {ptOptions.map(pt => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select value={regTypeFilter} onValueChange={setRegTypeFilter}>
                                <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm lg:w-44 px-3">
                                    <SelectValue placeholder="Gói tập" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                    <SelectItem value="all">Tất cả Gói tập</SelectItem>
                                    {regTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm lg:w-44 px-3">
                                    <SelectValue placeholder="Nguồn khách" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                    <SelectItem value="all">Tất cả Nguồn</SelectItem>
                                    {sourceOptions.map(source => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reset Button */}
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="h-9 px-3 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all shrink-0"
                            title="Làm mới"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="lg:hidden ml-2 text-sm">Làm mới</span>
                        </Button>
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
                                        checked={selectedRows.length === (filteredClients?.length || 0) && (filteredClients?.length || 0) > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-gray-300 dark:border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-gray-500 h-9">Hội viên</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-gray-500 h-9 hidden md:table-cell">Liên hệ</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-gray-500 h-9 hidden sm:table-cell">Chỉ số & PT</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-gray-500 h-9 hidden lg:table-cell">Gói tập</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-gray-500 h-9">Trạng thái</TableHead>
                                <TableHead className="text-right pr-8 text-[11px] font-medium text-gray-400 dark:text-gray-500 h-9">Tùy chọn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-400 text-sm">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" />
                                        <p className="mt-2">Đang tải dữ liệu...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredClients?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-400 text-sm">
                                        Không tìm thấy hội viên nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients?.map((client) => (
                                    <TableRow
                                        key={client.id}
                                        onClick={(e) => handleRowClick(client, e)}
                                        className={cn(
                                            "border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer group transition-colors",
                                            selectedRows.includes(client.id) && "bg-red-50/30 dark:bg-red-950/20"
                                        )}
                                    >
                                        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedRows.includes(client.id)}
                                                onCheckedChange={() => toggleRow(client.id)}
                                                className="rounded-lg"
                                            />
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-normal text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                    {client.member_name}
                                                    {client.status === 'Đang tập' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">{client.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    {client.phone || '-'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                    <Mail className="w-3 h-3" />
                                                    {client.email || 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Dumbbell className="w-3 h-3 text-red-500/20" />
                                                    {client.pt_name || 'Chưa gán PT'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                    <Activity className="w-3 h-3" />
                                                    {client.weight ? `${client.weight}kg` : '-'} → {client.target_weight ? `${client.target_weight}kg` : '-'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                <Target className="w-3 h-3 text-red-500/20" />
                                                {client.registration_type || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "border-none rounded-xl px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-widest",
                                                    client.status === 'Chốt đăng kí' && "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30",
                                                    client.status === 'Đang tập' && "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 border border-green-100 dark:border-green-900/30",
                                                    client.status === 'Tạm dừng' && "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30",
                                                    client.status === 'Đã nghỉ' && "bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400"
                                                )}
                                            >
                                                {client.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setIsDetailsOpen(true); }}
                                                    className="w-8 h-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
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
            </Card>

            <ClientDetailsSheet
                client={selectedClient}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onSuccess={refetch}
            />
        </div>
    )
}
