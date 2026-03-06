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
    Users
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

    const clearFilters = () => {
        setSearchTerm('')
        setStatusFilter('all')
        setBranchFilter('all')
        setPtFilter('all')
        setRegTypeFilter('all')
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

    const filteredClients = clients?.filter(client => {
        const matchesSearch =
            client.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phone?.includes(searchTerm) ||
            client.id?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || client.status === statusFilter
        const matchesBranch = branchFilter === 'all' || client.branch_id === branchFilter
        const matchesPT = ptFilter === 'all' || client.pt_name === ptFilter
        const matchesRegType = regTypeFilter === 'all' || client.registration_type === regTypeFilter

        return matchesSearch && matchesStatus && matchesBranch && matchesPT && matchesRegType
    })

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
        if (!clients) return { total: 0, active: 0, pending: 0, paused: 0, stopped: 0 }
        return {
            total: clients.length,
            active: clients.filter((c: any) => c.status === 'Đang tập').length,
            pending: clients.filter((c: any) => c.status === 'Chốt đăng kí').length,
            paused: clients.filter((c: any) => c.status === 'Tạm dừng').length,
            stopped: clients.filter((c: any) => c.status === 'Đã nghỉ').length,
        }
    }, [clients])

    const StatusCard = ({ title, count, icon: Icon, colorClass }: any) => (
        <Card className={cn("p-4 border-none shadow-sm rounded-2xl flex flex-col gap-2 min-w-[140px]", colorClass)}>
            <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-white/20">
                    <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-2xl font-semibold text-white leading-none">{count}</span>
            </div>
            <span className="text-[10px] font-medium text-white/80 uppercase tracking-widest">{title}</span>
        </Card>
    )

    return (
        <div className="space-y-6 lg:space-y-8 max-w-[1600px] mx-auto font-inter px-1 sm:px-0">
            <ClientDetailsSheet
                client={selectedClient}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onSuccess={refetch}
            />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-2xl lg:text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-50">Quản lý Khách hàng</h1>
                    <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 font-medium">Theo dõi chỉ số, mục tiêu và lộ trình tập luyện của hội viên.</p>
                </div>
                <div className="flex items-center gap-2 lg:gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                    <AnimatePresence>
                        {selectedRows.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="hidden lg:block"
                            >
                                <Button
                                    variant="ghost"
                                    onClick={handleBulkDelete}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium px-4"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Xóa ({selectedRows.length})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex gap-2 min-w-max">
                        <ImportExcelClientDialog onSuccess={refetch} />
                        <Button
                            variant="ghost"
                            onClick={exportToExcel}
                            className="rounded-xl text-gray-600 dark:text-gray-300 font-medium h-10 lg:h-11 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-600 transition-all border border-gray-100 dark:border-gray-800"
                        >
                            <FileDown className="w-4 h-4 lg:w-4.5 lg:h-4.5 mr-2" />
                            <span className="text-xs lg:text-sm">Xuất Excel</span>
                        </Button>
                        <AddClientDialog onSuccess={refetch} />
                    </div>
                </div>
            </div>

            {/* Mobile Stats & Tabs Section */}
            <div className="lg:hidden space-y-6">
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    <StatusCard title="Tổng số" count={stats.total} icon={Users} colorClass="bg-gray-900 dark:bg-gray-800" />
                    <StatusCard title="Đang tập" count={stats.active} icon={Activity} colorClass="bg-green-600" />
                    <StatusCard title="Chốt ĐK" count={stats.pending} icon={TrendingUp} colorClass="bg-blue-600" />
                    <StatusCard title="Tạm dừng" count={stats.paused} icon={RotateCcw} colorClass="bg-amber-500" />
                    <StatusCard title="Đã nghỉ" count={stats.stopped} icon={Trash2} colorClass="bg-rose-500" />
                </div>

                <div className="space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                        <input
                            placeholder="Tìm kiếm hội viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-red-500 text-sm h-12 outline-none shadow-sm"
                        />
                    </div>

                    <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                        <TabsList className="w-full bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-2xl h-12 flex items-center justify-between border border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-hide">
                            <TabsTrigger value="all" className="flex-1 rounded-xl text-[10px] font-semibold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 h-10">Tất cả</TabsTrigger>
                            <TabsTrigger value="Chốt đăng kí" className="flex-1 rounded-xl text-[10px] font-semibold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 h-10 shrink-0">Chốt ĐK</TabsTrigger>
                            <TabsTrigger value="Đang tập" className="flex-1 rounded-xl text-[10px] font-semibold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 h-10 shrink-0">Đang tập</TabsTrigger>
                            <TabsTrigger value="Tạm dừng" className="flex-1 rounded-xl text-[10px] font-semibold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 h-10 shrink-0">Tạm dừng</TabsTrigger>
                            <TabsTrigger value="Đã nghỉ" className="flex-1 rounded-xl text-[10px] font-semibold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 h-10 shrink-0">Đã nghỉ</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="space-y-3 pb-24">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="p-4 rounded-3xl border-none shadow-sm animate-pulse bg-gray-50 dark:bg-gray-900 h-24" />
                        ))
                    ) : filteredClients?.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-gray-400 font-medium">Không tìm thấy hội viên nào</p>
                        </div>
                    ) : (
                        filteredClients?.map((client) => (
                            <motion.div
                                key={client.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={(e) => handleRowClick(client, e)}
                            >
                                <Card className="p-4 rounded-3xl border-none shadow-sm bg-white dark:bg-gray-900 active:scale-[0.98] transition-all group overflow-hidden relative">
                                    <div className={cn(
                                        "absolute top-0 left-0 w-1.5 h-full",
                                        client.status === 'Chốt đăng kí' && "bg-blue-500",
                                        client.status === 'Đang tập' && "bg-green-500",
                                        client.status === 'Tạm dừng' && "bg-amber-500",
                                        client.status === 'Đã nghỉ' && "bg-rose-500"
                                    )} />
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-gray-50">{client.member_name}</span>
                                                {client.status === 'Đang tập' && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] font-semibold text-red-600 dark:text-red-500 uppercase tracking-widest">{client.id}</span>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <Phone className="w-3 h-3" />
                                                    {client.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "border-none rounded-lg px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                                                    client.status === 'Chốt đăng kí' && "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                                                    client.status === 'Đang tập' && "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
                                                    client.status === 'Tạm dừng' && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                                                    client.status === 'Đã nghỉ' && "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                                                )}
                                            >
                                                {client.status}
                                            </Badge>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400">
                                            <Dumbbell className="w-3.5 h-3.5 text-red-600/30" />
                                            PT: <span className="text-gray-900 dark:text-gray-200">{client.pt_name || 'N/A'}</span>
                                        </div>
                                        <div className="text-[11px] font-medium text-gray-400">
                                            {client.weight ? `${client.weight}kg` : '-'} → {client.target_weight ? `${client.target_weight}kg` : '-'}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Desktop Table View */}
            <Card className="hidden lg:block border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[2rem] overflow-visible bg-white dark:bg-gray-900 transition-all duration-500">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-gray-800/20">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                            <input
                                placeholder="Tìm kiếm hội viên..."
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
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-700">
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="Chốt đăng kí">Chốt đăng kí</SelectItem>
                                    <SelectItem value="Đang tập">Đang tập</SelectItem>
                                    <SelectItem value="Tạm dừng">Tạm dừng</SelectItem>
                                    <SelectItem value="Đã nghỉ">Đã nghỉ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-44">
                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-red-500">
                                    <SelectValue placeholder="Chi nhánh" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-700">
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
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-700">
                                    <SelectItem value="all">Tất cả PT</SelectItem>
                                    {ptOptions.map((pt: string) => (
                                        <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-44">
                            <Select value={regTypeFilter} onValueChange={setRegTypeFilter}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-red-500">
                                    <SelectValue placeholder="Loại đăng ký" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 dark:border-gray-700">
                                    <SelectItem value="all">Tất cả loại hình</SelectItem>
                                    {regTypeOptions.map((type: string) => (
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
                                        checked={selectedRows.length === (filteredClients?.length || 0) && (filteredClients?.length || 0) > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-gray-300 dark:border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                    />
                                </TableHead>
                                <TableHead className="font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest text-[10px] py-6">Hội viên</TableHead>
                                <TableHead className="font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest text-[10px]">Liên hệ</TableHead>
                                <TableHead className="font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest text-[10px]">Chỉ số & PT</TableHead>
                                <TableHead className="font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest text-[10px]">Trạng thái</TableHead>
                                <TableHead className="font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest text-[10px] text-right pr-8">Tùy chọn</TableHead>
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
                                            <span className="text-gray-400 font-medium text-sm">Đang tải hồ sơ hội viên...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredClients?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center">
                                                <Search className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-gray-400 text-sm font-medium">Không tìm thấy hội viên nào khớp với yêu cầu.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients?.map((client) => (
                                    <TableRow
                                        key={client.id}
                                        onClick={(e) => handleRowClick(client, e)}
                                        className={cn(
                                            "border-gray-50 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-all group cursor-pointer",
                                            selectedRows.includes(client.id) && "bg-red-50/30 dark:bg-red-950/20"
                                        )}
                                    >
                                        <TableCell className="pl-6">
                                            <Checkbox
                                                checked={selectedRows.includes(client.id)}
                                                onCheckedChange={() => toggleRow(client.id)}
                                                className="rounded-lg border-gray-300 dark:border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            />
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-gray-50 flex items-center gap-2">
                                                    {client.member_name}
                                                    {client.status === 'Đang tập' && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                                                    )}
                                                </span>
                                                <span className="text-[10px] font-medium text-red-600 dark:text-red-500 uppercase tracking-widest mt-0.5 opacity-80">{client.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-sm font-medium">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                                    {client.phone || '-'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                                                    <Mail className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                                                    <span className="truncate max-w-[150px]">{client.email || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-[13px] font-medium">
                                                    <Dumbbell className="w-3.5 h-3.5 text-red-600/40" />
                                                    {client.pt_name || 'Chưa gán PT'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                                                    <Activity className="w-3.5 h-3.5 text-blue-500/40" />
                                                    <span>{client.weight ? `${client.weight}kg` : '-'} → {client.target_weight ? `${client.target_weight}kg` : '-'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "border-none rounded-xl px-3 py-1 text-[10px] font-medium uppercase tracking-widest shadow-sm",
                                                    client.status === 'Chốt đăng kí' && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200",
                                                    client.status === 'Đang tập' && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200",
                                                    client.status === 'Tạm dừng' && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
                                                    client.status === 'Đã nghỉ' && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                                )}
                                            >
                                                {client.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedClient(client)
                                                        setIsDetailsOpen(true)
                                                    }}
                                                    className="h-9 w-9 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 transition-all"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(client.id)}
                                                    className="h-9 w-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-6 border-t border-gray-50 dark:border-gray-800 bg-gray-50/10 dark:bg-gray-800/10 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                        Tổng cộng: {filteredClients?.length || 0} hội viên
                    </p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="rounded-xl h-10 px-6 font-medium text-xs text-gray-400 disabled:opacity-20 transition-all" disabled>
                            Trang trước
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl h-10 px-6 font-medium text-xs text-gray-400 disabled:opacity-20 transition-all" disabled>
                            Trang tiếp
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
