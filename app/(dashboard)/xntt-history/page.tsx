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
    Trash2
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
import { ScrollArea } from '@/components/ui/scroll-area'

export default function XnttHistoryPage() {
    const [searchQuery, setSearchQuery] = React.useState('')
    const [statusFilter, setStatusFilter] = React.useState('all')
    const [viewingLog, setViewingLog] = React.useState<any>(null)
    const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)
    const [resendingId, setResendingId] = React.useState<string | null>(null)

    const queryClient = useQueryClient()
    const { data: historyData, isLoading, refetch } = useQuery({
        queryKey: ['xntt-history'],
        queryFn: async () => {
            const result = await fetchXnttHistory()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const filteredHistory = React.useMemo(() => {
        if (!historyData) return []
        return historyData.filter((item: any) => {
            const matchesSearch =
                item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.clients?.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.contract_id?.toLowerCase().includes(searchQuery.toLowerCase())
            
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter
            
            return matchesSearch && matchesStatus
        })
    }, [historyData, searchQuery, statusFilter])

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
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50/50 min-h-screen font-inter">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Send className="w-6 h-6 text-red-600" />
                        Lịch sử Xác nhận thanh toán
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Theo dõi trạng thái gửi email xác nhận cho khách hàng
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-white rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng lượt gửi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{historyData?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Thành công</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {historyData?.filter((i: any) => i.status === 'done').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-red-500 uppercase tracking-widest">Thất bại</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {historyData?.filter((i: any) => i.status === 'error').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm bg-white rounded-2xl">
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
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 pl-6">Thời gian</TableHead>
                            <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4">Khách hàng / HĐ</TableHead>
                            <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4">Số tiền / HTTT</TableHead>
                            <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4">Email nhận</TableHead>
                            <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4">Trạng thái</TableHead>
                            <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-4 text-right pr-6">Thao tác</TableHead>
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
                                        className="group border-slate-50 hover:bg-slate-50/50 transition-colors"
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
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                                                    {item.clients?.member_name || 'Khách vãng lai'}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-bold bg-slate-100 w-fit px-1.5 rounded">
                                                    {item.contract_id || 'N/A'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-emerald-600">
                                                    {Number(item.amount || 0).toLocaleString()} ₫
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-medium">
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
                                        <TableCell className="py-4">
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit text-[11px] font-bold",
                                                item.status === 'done' ? "bg-emerald-50 text-emerald-600" :
                                                item.status === 'error' ? "bg-red-50 text-red-600" :
                                                "bg-amber-50 text-amber-600"
                                            )}>
                                                {getStatusIcon(item.status)}
                                                {getStatusText(item.status)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600"
                                                    onClick={() => {
                                                        setViewingLog(item)
                                                        setDetailDialogOpen(true)
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

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden border-none rounded-3xl font-inter">
                    <DialogHeader className="p-6 bg-slate-50/80 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                <Mail className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-slate-900">Chi tiết Email xác nhận</DialogTitle>
                                <DialogDescription className="text-xs font-medium text-slate-500 mt-0.5">
                                    Nội dung đã gửi cho khách: {viewingLog?.email}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-hidden p-6 bg-white">
                        <div className="mb-6 space-y-3">
                           <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiêu đề</p>
                                    <p className="font-semibold text-slate-700">{viewingLog?.subject}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã giao dịch</p>
                                    <p className="font-semibold text-slate-700">{viewingLog?.revenue_id || viewingLog?.contract_id}</p>
                                </div>
                           </div>
                        </div>

                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nội dung HTML</p>
                        <ScrollArea className="h-[45vh] border rounded-2xl p-4 bg-slate-50/30">
                            {viewingLog?.html_body ? (
                                <div 
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: viewingLog.html_body }} 
                                />
                            ) : (
                                <div className="text-center py-10 text-slate-400 text-sm italic">
                                    Không có dữ liệu hiển thị
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end shrink-0">
                        <Button
                            variant="default"
                            onClick={() => setDetailDialogOpen(false)}
                            className="rounded-xl px-6 bg-slate-900 text-white"
                        >
                            Đóng
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
