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
    RotateCcw,
    Eye,
    Send,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    Calendar,
    Mail,
    Trash2,
    Plus,
    User
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchXnttHistory, resendXnttAction, deleteXnttHistory } from '@/app/actions/xntt'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { XnttCreateSheet } from '@/components/financial/xntt-create-sheet'
import { ClientDetailsSheet } from '@/components/clients/client-details-sheet'
import { ContractDetailsSheet } from '@/components/contracts/contract-details-sheet'
import { fetchClientById } from '@/app/actions/clients'
import { fetchContractById } from '@/app/actions/contracts'
import { Loader2 } from 'lucide-react'

export default function XnttHistoryPage() {
    const [searchQuery, setSearchQuery] = React.useState('')
    const [statusFilter, setStatusFilter] = React.useState('all')
    const [viewingLog, setViewingLog] = React.useState<any>(null)
    const [detailSheetOpen, setDetailSheetOpen] = React.useState(false)
    const [resendingId, setResendingId] = React.useState<string | null>(null)
    const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false)

    // State cho Client Detail Sheet
    const [selectedClient, setSelectedClient] = React.useState<any>(null)
    const [isClientSheetOpen, setIsClientSheetOpen] = React.useState(false)
    const [loadingClient, setLoadingClient] = React.useState(false)

    // State cho Contract Detail Sheet
    const [selectedContract, setSelectedContract] = React.useState<any>(null)
    const [isContractSheetOpen, setIsContractSheetOpen] = React.useState(false)
    const [loadingContract, setLoadingContract] = React.useState(false)

    const queryClient = useQueryClient()
    const { data: historyData, isLoading, refetch } = useQuery({
        queryKey: ['xntt-history'],
        queryFn: async () => {
            const result = await fetchXnttHistory()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    })

    const filteredHistory = React.useMemo(() => {
        if (!historyData) return []
        return historyData.filter((item: any) => {
            const matchesSearch =
                item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.clients?.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.contracts?.package_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.contract_id?.toLowerCase().includes(searchQuery.toLowerCase())
            
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter
            
            return matchesSearch && matchesStatus
        })
    }, [historyData, searchQuery, statusFilter])

    const stats = React.useMemo(() => {
        if (!historyData) return { total: 0, uniqueContracts: 0, cash: 0, transfer: 0, card: 0 }
        
        return historyData.reduce((acc: any, item: any) => {
            acc.total++
            if (item.payment_method === 'Tiền mặt') acc.cash++
            if (item.payment_method === 'Chuyển khoản') acc.transfer++
            if (item.payment_method === 'Quẹt thẻ') acc.card++
            return acc
        }, { total: 0, uniqueContracts: new Set(historyData.map((i: any) => i.contract_id).filter(Boolean)).size, cash: 0, transfer: 0, card: 0 })
    }, [historyData])

    const handleResend = async (id: string) => {
        setResendingId(id)
        try {
            const result = await resendXnttAction(id)
            if (result.success) {
                toast.success('Đã tạo lệnh gửi lại thành công!')
                refetch()
            } else {
                toast.error('Lỗi khi gửi lại: ' + result.error)
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setResendingId(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này khỏi lịch sử?')) return
        try {
            const result = await deleteXnttHistory(id)
            if (result.success) {
                toast.success('Đã xóa bản ghi')
                refetch()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleOpenClientDetail = async (id: string) => {
        if (!id) return
        setLoadingClient(true)
        try {
            const res = await fetchClientById(id)
            if (res.success) {
                setSelectedClient(res.data)
                setIsClientSheetOpen(true)
            } else {
                toast.error('Không tìm thấy thông tin học viên')
            }
        } catch (error) {
            toast.error('Lỗi khi lấy thông tin học viên')
        } finally {
            setLoadingClient(false)
        }
    }

    const handleOpenContractDetail = async (id: string) => {
        if (!id || id.toString().startsWith('MANUAL')) return
        setLoadingContract(true)
        try {
            const res = await fetchContractById(id)
            if (res.success) {
                setSelectedContract(res.data)
                setIsContractSheetOpen(true)
            } else {
                toast.error('Không tìm thấy thông tin hợp đồng')
            }
        } catch (error) {
            toast.error('Lỗi khi lấy thông tin hợp đồng')
        } finally {
            setLoadingContract(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />
            default:
                return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'done':
                return 'Thành công'
            case 'error':
                return 'Lỗi gửi'
            default:
                return 'Đang chờ'
        }
    }

    return (
        <div className="space-y-1.5 font-inter pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Send className="w-6 h-6 text-red-600" />
                        Lịch sử Xác nhận thanh toán
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Theo dõi trạng thái gửi email xác nhận cho khách hàng
                    </p>
                </div>
                <Button 
                    onClick={() => setIsCreateSheetOpen(true)}
                    className="rounded-2xl bg-black hover:opacity-90 text-white shadow-xl shadow-slate-200 px-6 h-12 font-medium"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm mới
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-1">
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng lượt gửi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Tổng hợp đồng</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-blue-600">{stats.uniqueContracts}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Tiền mặt</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-emerald-600">{stats.cash}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Chuyển khoản</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-violet-600">{stats.transfer}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Quẹt thẻ</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-amber-600">{stats.card}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm bg-white rounded-2xl px-1">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm theo tên khách, email hoặc mã HĐ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-red-500"
                            />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[160px] rounded-xl border-slate-100 bg-slate-50/50">
                                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="done">Thành công</SelectItem>
                                    <SelectItem value="pending">Đang chờ</SelectItem>
                                    <SelectItem value="error">Lỗi gửi</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery('')
                                    setStatusFilter('all')
                                }}
                                className="rounded-xl border-slate-100 text-slate-500 hover:bg-slate-50"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Làm mới
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden min-h-[400px] px-1">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-gray-100 dark:border-gray-800 h-10 uppercase tracking-wider text-[11px] font-medium">
                            <TableHead className="text-gray-400 py-4 pl-6">Thời gian</TableHead>
                            <TableHead className="text-gray-400 py-4">Học viên</TableHead>
                            <TableHead className="text-gray-400 py-4">Hợp đồng</TableHead>
                            <TableHead className="text-gray-400 py-4">Thanh toán</TableHead>
                            <TableHead className="text-gray-400 py-4">Email nhận</TableHead>
                            <TableHead className="text-gray-400 py-4">Trạng thái</TableHead>
                            <TableHead className="text-gray-400 py-4 text-right pr-6 w-[120px]">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">
                                        Đang tải dữ liệu...
                                    </TableCell>
                                </TableRow>
                            ) : filteredHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">
                                        Không tìm thấy lịch sử phù hợp
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredHistory.map((item: any) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={item.id}
                                        className="group border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                    >
                                        <TableCell className="py-4 pl-6">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-semibold text-slate-900">
                                                    {format(new Date(item.created_at), 'dd/MM/yyyy')}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-medium">
                                                    {format(new Date(item.created_at), 'HH:mm')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-[10px] uppercase">
                                                    {item.clients?.member_name?.charAt(0) || <User className="w-3 h-3" />}
                                                </div>
                                                <div 
                                                    className="flex flex-col cursor-pointer group/item"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleOpenClientDetail(item.client_id)
                                                    }}
                                                >
                                                    <span className={cn(
                                                        "text-sm font-bold text-gray-900 dark:text-gray-100 group-hover/item:text-blue-600 transition-colors uppercase",
                                                        loadingClient && "opacity-50"
                                                    )}>
                                                        {item.clients?.member_name || 'Khách vãng lai'}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        {item.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div 
                                                className="flex flex-col cursor-pointer group/item w-fit"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleOpenContractDetail(item.contract_id)
                                                }}
                                            >
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-blue-600 truncate max-w-[150px]">
                                                    {item.contracts?.package_name || 'Gói tập thủ công'}
                                                </span>
                                                <span className={cn(
                                                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 dark:bg-red-950/30 uppercase mt-0.5 group-hover/item:bg-red-100 transition-colors",
                                                    loadingContract && "opacity-50"
                                                )}>
                                                    {item.contract_id || 'N/A'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div 
                                                className="flex flex-col cursor-pointer group/item w-fit"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setViewingLog(item)
                                                    setDetailSheetOpen(true)
                                                }}
                                            >
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 group-hover/item:opacity-80 transition-opacity">
                                                    {Number(item.amount || 0).toLocaleString()} ₫
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                    {item.payment_method}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2 text-[13px] text-slate-600 font-medium">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                {item.email}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit",
                                                item.status === 'done' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" :
                                                item.status === 'error' ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30" :
                                                "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                                            )}>
                                                {getStatusIcon(item.status)}
                                                {getStatusText(item.status)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                                                    onClick={() => {
                                                        setViewingLog(item)
                                                        setDetailSheetOpen(true)
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {item.status === 'error' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                                                        disabled={resendingId === item.id}
                                                        onClick={() => handleResend(item.id)}
                                                    >
                                                        <RotateCcw className={cn("w-4 h-4", resendingId === item.id && "animate-spin")} />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </Card>

            {/* Detail Sheet (Converted from Dialog) */}
            <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-2xl border-none p-0 flex flex-col h-full bg-slate-50 font-inter overflow-hidden">
                    <SheetHeader className="p-6 bg-white border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold text-slate-900">Chi tiết Xác nhận thanh toán</SheetTitle>
                                <SheetDescription className="text-xs text-slate-500 font-medium">Mã giao dịch: <span className="font-mono font-bold text-slate-900">{viewingLog?.id}</span></SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-6">
                            {/* Summary Card */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học viên</p>
                                        <p className="text-sm font-bold text-slate-900 uppercase">{viewingLog?.clients?.member_name || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hợp đồng</p>
                                        <p className="text-sm font-bold text-red-600 uppercase">{viewingLog?.contract_id || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số tiền</p>
                                        <p className="text-sm font-bold text-emerald-600">{Number(viewingLog?.amount || 0).toLocaleString()} ₫</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hình thức</p>
                                        <p className="text-sm font-bold text-slate-900">{viewingLog?.payment_method || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-[13px] text-slate-600 font-medium">
                                            {viewingLog?.created_at && format(new Date(viewingLog.created_at), 'dd/MM/yyyy HH:mm')}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
                                        viewingLog?.status === 'done' ? "bg-emerald-50 text-emerald-600" :
                                        viewingLog?.status === 'error' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                    )}>
                                        {viewingLog?.status === 'done' ? 'Thành công' : viewingLog?.status === 'error' ? 'Thất bại' : 'Đang xử lý'}
                                    </div>
                                </div>
                            </div>

                            {/* Email Content Preview */}
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    Nội dung email
                                </h4>
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase w-16">Chủ đề:</span>
                                            <span className="text-[13px] font-bold text-slate-700">{viewingLog?.subject}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase w-16">Đến:</span>
                                            <span className="text-[13px] font-medium text-blue-600">{viewingLog?.email}</span>
                                        </div>
                                    </div>
                                    <div className="p-0 overflow-auto max-h-[500px]">
                                        {viewingLog?.html_body ? (
                                            <iframe
                                                srcDoc={viewingLog.html_body}
                                                className="w-full border-none h-[800px]"
                                                title="Email Preview"
                                            />
                                        ) : (
                                            <div className="p-10 text-center text-slate-400 text-sm italic">Không có nội dung hiển thị</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    
                    <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                        <Button variant="outline" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider" onClick={() => setDetailSheetOpen(false)}>Đóng</Button>
                        <Button 
                            className="bg-black hover:bg-slate-800 text-white rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider gap-2 shadow-lg"
                            disabled={resendingId === viewingLog?.id}
                            onClick={() => handleResend(viewingLog?.id)}
                        >
                            {resendingId === viewingLog?.id ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Gửi lại
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Client Details Sheet */}
            <ClientDetailsSheet
                client={selectedClient}
                open={isClientSheetOpen}
                onOpenChange={setIsClientSheetOpen}
                onSuccess={() => refetch()}
            />

            {/* Contract Details Sheet */}
            <ContractDetailsSheet
                contract={selectedContract}
                open={isContractSheetOpen}
                onOpenChange={setIsContractSheetOpen}
                onSuccess={() => refetch()}
            />

            <XnttCreateSheet 
                open={isCreateSheetOpen}
                onOpenChange={setIsCreateSheetOpen}
                onSuccess={() => refetch()}
            />
        </div>
    )
}
