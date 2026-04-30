'use client'

import React from 'react'
import {
    Activity,
    Search,
    RotateCcw,
    FileText,
    TrendingUp,
    TrendingDown,
    Printer,
    ArrowRight,
    Loader2,
    Plus,
    X,
    Filter,
    LayoutGrid,
    List,
    Pencil,
    Phone,
    Trash2,
    Info,
    Calendar,
    MoreHorizontal,
    User
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllInBodyRecords, deleteInBodyRecord, bulkDeleteInBodyRecords } from '@/app/actions/inbody-records'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { InBodyReportView } from '@/components/clients/inbody-report-view'
import { InBodySheet } from '@/components/inbody/inbody-sheet'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

function InBodyCard({ record, onView, onEdit, onDelete, isSelected, onSelect, isMounted }: { record: any, onView: (r: any) => void, onEdit: (r: any) => void, onDelete: (id: string) => void, isSelected: boolean, onSelect: (id: string) => void, isMounted: boolean }) {
    const client = record.clients
    const score = record.fitness_score || 0
    
    return (
        <Card className={cn(
            "group relative bg-white dark:bg-gray-900 border shadow-sm rounded-[24px] overflow-hidden flex flex-col h-full transition-all duration-300",
            isSelected ? "border-red-500 ring-1 ring-red-500 shadow-lg translate-y-[-4px]" : "border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1"
        )}>
            {/* Selection Checkbox */}
            <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(record.id)}
                    className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 bg-white"
                />
            </div>
            {/* Card Content Area - Clickable */}
            <button 
                onClick={() => onView(record)}
                className="flex-1 text-left p-6 focus:outline-none"
            >
                {/* Header: Avatar & Member Info */}
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="shrink-0 w-12 h-12 rounded-[16px] bg-red-500 flex items-center justify-center text-white text-[16px] font-bold shadow-lg shadow-red-100 dark:shadow-none">
                            {(client?.member_name || 'N')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white truncate leading-tight group-hover:text-red-600 transition-colors">
                                {client?.member_name || 'Hội viên chưa xác định'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-[12px] text-slate-500 font-medium">
                                    {isMounted ? format(new Date(record.recorded_at), 'dd/MM/yyyy') : '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div onClick={e => e.stopPropagation()} className="shrink-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-xl hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl w-40 p-1.5 shadow-xl border-slate-100">
                                <DropdownMenuItem
                                    className="rounded-xl cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 font-medium"
                                    onClick={() => onDelete(record.id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa bản ghi
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Info row */}
                <div className="flex items-center gap-2 mb-5">
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[12px] text-slate-600 dark:text-slate-400 font-bold tracking-tight">{client?.phone || '—'}</span>
                    </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 mb-5" />

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block opacity-70">Cân nặng</span>
                        <p className="text-[16px] font-black text-slate-900 dark:text-white leading-none">
                            {record.weight}<span className="text-[11px] font-medium ml-1 opacity-40">kg</span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block opacity-70">Tỷ lệ mỡ (PBF)</span>
                        <p className="text-[16px] font-black text-slate-900 dark:text-white leading-none">
                            {record.pbf}<span className="text-[11px] font-medium ml-1 opacity-40">%</span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block opacity-70">Cơ xương (SMM)</span>
                        <p className="text-[16px] font-black text-slate-900 dark:text-white leading-none">
                            {record.smm}<span className="text-[11px] font-medium ml-1 opacity-40">kg</span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block opacity-70">Điểm InBody</span>
                        <div className="flex items-center">
                            <span className={cn(
                                "text-[15px] font-black px-2.5 py-0.5 rounded-lg transition-colors shadow-sm",
                                score >= 80 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : 
                                score >= 70 ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" : 
                                "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                            )}>
                                {score}
                            </span>
                        </div>
                    </div>
                </div>
            </button>

            {/* Action Bar */}
            <div 
                className="px-6 py-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/20"
                onClick={e => e.stopPropagation()}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(record)}
                    className="flex-1 h-9 rounded-xl text-[12px] font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-gray-800 hover:text-red-600 hover:shadow-md border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all gap-2"
                >
                    <Info className="w-4 h-4 text-red-500" />
                    Xem báo cáo
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(record)}
                    className="flex-1 h-9 rounded-xl text-[12px] font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-gray-800 hover:text-black dark:hover:text-white hover:shadow-md border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all gap-2"
                >
                    <Pencil className="w-4 h-4 text-slate-400" />
                    Sửa
                </Button>
            </div>
        </Card>
    )
}

export default function InBodyManagementPage() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = React.useState('')
    const [selectedRecord, setSelectedRecord] = React.useState<any>(null)
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [recordToDelete, setRecordToDelete] = React.useState<string | null>(null)
    const [editingRecord, setEditingRecord] = React.useState<any>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [selectedIds, setSelectedIds] = React.useState<string[]>([])
    const [viewMode, setViewMode] = React.useState<'table' | 'card'>('card')
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const { data: records = [], isLoading } = useQuery<any[]>({
        queryKey: ['all-inbody-records'],
        queryFn: async () => {
            const res = await fetchAllInBodyRecords()
            if (!res.success) throw new Error(res.error)
            return res.data || []
        },
        staleTime: 0
    })

    const filteredRecords = React.useMemo(() => {
        return records.filter(r => {
            const memberName = r.clients?.member_name?.toLowerCase() || ''
            const phone = r.clients?.phone || ''
            const search = searchTerm.toLowerCase()
            return memberName.includes(search) || phone.includes(search)
        })
    }, [records, searchTerm])

    const handleDelete = async () => {
        if (!recordToDelete) return
        setIsDeleting(true)
        try {
            const res = await deleteInBodyRecord(recordToDelete)
            if (res.success) {
                toast.success('Đã xóa bản ghi thành công')
                queryClient.invalidateQueries({ queryKey: ['all-inbody-records'] })
            } else {
                toast.error('Lỗi khi xóa: ' + res.error)
            }
        } catch (err: any) {
            toast.error('Lỗi hệ thống khi xóa')
        } finally {
            setIsDeleting(false)
            setRecordToDelete(null)
        }
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredRecords.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredRecords.map((r: any) => r.id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} bản ghi đã chọn? Thao tác này không thể hoàn tác.`)) return
        
        try {
            const res = await bulkDeleteInBodyRecords(selectedIds)
            if (res.success) {
                toast.success(`Đã xóa ${selectedIds.length} bản ghi thành công`)
                setSelectedIds([])
                queryClient.invalidateQueries({ queryKey: ['all-inbody-records'] })
            } else {
                toast.error(res.error)
            }
        } catch (error: any) {
            toast.error('Lỗi hệ thống khi xóa hàng loạt')
        }
    }

    return (
        <div suppressHydrationWarning className="space-y-4 font-inter">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-xl sm:text-3xl font-bold text-black dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                             <Activity className="w-6 h-6 text-white" />
                        </div>
                        Quản lý InBody
                    </h1>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">Danh sách kết quả phân tích thành phần cơ thể chi tiết của hội viên.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={() => {
                            setEditingRecord(null)
                            setIsFormOpen(true)
                        }}
                        className="bg-black hover:bg-slate-800 text-white rounded-xl px-4 sm:px-8 h-10 sm:h-11 transition-all shadow-lg shadow-slate-200 font-bold flex items-center gap-2 active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5 shrink-0" />
                        <span className="hidden sm:inline">Thêm InBody mới</span>
                        <span className="sm:hidden">Thêm mới</span>
                    </Button>
                </div>
            </div>

            {/* Quick Filter & Stats Card */}
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 overflow-hidden">
                <div className="p-4 border-b border-slate-50 dark:border-slate-800/50 flex flex-col gap-4">
                    {/* Search row */}
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Tìm tên hội viên hoặc SĐT..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-11 pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-gray-950 text-sm focus-visible:ring-2 focus-visible:ring-red-500/20 shadow-none transition-all"
                        />
                    </div>
                    
                    {/* View toggle & Stats row */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex-1 sm:flex-initial">
                            <Button
                                variant={viewMode === 'card' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('card')}
                                className={cn(
                                    "flex-1 sm:flex-initial h-9 px-3 rounded-lg font-bold transition-all text-[12px]",
                                    viewMode === 'card' ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm" : "text-slate-400 dark:text-slate-500"
                                )}
                            >
                                <LayoutGrid className="w-4 h-4 mr-2 hidden sm:block" />
                                Lưới
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    "flex-1 sm:flex-initial h-9 px-3 rounded-lg font-bold transition-all text-[12px]",
                                    viewMode === 'table' ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm" : "text-slate-400 dark:text-slate-500"
                                )}
                            >
                                <List className="w-4 h-4 mr-2 hidden sm:block" />
                                Bảng
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setSearchTerm('')} 
                                className="h-11 w-11 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-1">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Tổng bản ghi</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{filteredRecords.length}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />
                        <div className="flex flex-col text-right">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Tháng này</span>
                            <span className="text-lg font-black text-red-600 dark:text-red-500 leading-none">
                                {isMounted ? records.filter(r => new Date(r.recorded_at).getMonth() === new Date().getMonth()).length : '—'}
                            </span>
                        </div>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                    {selectedIds.length} đã chọn
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

                {/* Mobile card list */}
                <div className="sm:hidden divide-y divide-slate-50 dark:divide-slate-800">
                    {isLoading ? (
                        <div className="py-16 flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải...</span>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3">
                            <Activity className="w-10 h-10 text-slate-200" />
                            <p className="text-slate-400 text-sm font-medium">Không tìm thấy bản ghi nào</p>
                        </div>
                    ) : (
                        filteredRecords.map((r: any) => (
                            <div key={r.id} className={cn("p-4 flex flex-col gap-4 border-b last:border-b-0 border-slate-50 transition-colors", selectedIds.includes(r.id) && "bg-red-50/30")}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={selectedIds.includes(r.id)}
                                            onCheckedChange={() => toggleSelect(r.id)}
                                            className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-slate-900">{r.clients?.member_name || 'N/A'}</span>
                                            <span className="text-[10px] text-slate-400">{isMounted ? format(new Date(r.recorded_at), 'dd/MM/yyyy HH:mm') : '—'}</span>
                                        </div>
                                    </div>
                                    <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                        Score: {r.fitness_score}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Cân nặng</span>
                                        <span className="text-[13px] font-bold text-slate-900 dark:text-white">{r.weight} <span className="text-[10px] opacity-40">kg</span></span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Tỷ lệ mỡ (PBF)</span>
                                        <span className="text-[13px] font-bold text-slate-900 dark:text-white">{r.pbf} <span className="text-[10px] opacity-40">%</span></span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Cơ xương (SMM)</span>
                                        <span className="text-[13px] font-bold text-slate-900 dark:text-white">{r.smm} <span className="text-[10px] opacity-40">kg</span></span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Điểm InBody</span>
                                        <span className={cn(
                                            "text-[13px] font-bold",
                                            r.fitness_score >= 80 ? "text-emerald-600 dark:text-emerald-400" : 
                                            r.fitness_score >= 70 ? "text-amber-600 dark:text-amber-400" : 
                                            "text-red-600 dark:text-red-400"
                                        )}>{r.fitness_score} <span className="text-[10px] opacity-40">pts</span></span>
                                    </div>
                                </div>

                                {/* Icon-based Actions */}
                                <div className="flex items-center gap-2 mt-1">
                                    <Button
                                        size="icon"
                                        className="flex-1 h-10 rounded-xl bg-black text-white hover:bg-slate-800 gap-2"
                                        onClick={() => setSelectedRecord(r)}
                                    >
                                        <Info className="w-4 h-4" />
                                        <span className="text-[11px] font-bold">Báo cáo</span>
                                    </Button>
                                    {r.clients?.phone && (
                                        <a href={`tel:${r.clients.phone}`} className="h-10 px-4 rounded-xl text-emerald-600 bg-emerald-50 border border-emerald-100 flex items-center justify-center transition-all active:scale-95">
                                            <Phone className="w-4 h-4" />
                                        </a>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl text-slate-600 bg-slate-50 border border-slate-200"
                                        onClick={() => {
                                            setEditingRecord(r)
                                            setIsFormOpen(true)
                                        }}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl text-red-500 bg-red-50/50 border border-red-100"
                                        onClick={() => setRecordToDelete(r.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop view: Toggle between Card Grid and Table */}
                <div className="hidden sm:block min-h-[400px]">
                    {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                                <Activity className="w-8 h-8 text-slate-200" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-900 dark:text-white font-bold">Không tìm thấy bản ghi nào</p>
                                <p className="text-slate-400 text-xs">Thử thay đổi từ khóa tìm kiếm.</p>
                            </div>
                        </div>
                    ) : viewMode === 'card' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-1">
                            {filteredRecords.map((r: any) => (
                                    <InBodyCard 
                                        key={r.id} 
                                        record={r} 
                                        onView={setSelectedRecord}
                                        onEdit={(record) => {
                                            setEditingRecord(record)
                                            setIsFormOpen(true)
                                        }}
                                        onDelete={setRecordToDelete}
                                        isSelected={selectedIds.includes(r.id)}
                                        onSelect={toggleSelect}
                                        isMounted={isMounted}
                                    />
                                ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-50 dark:border-slate-800 hover:bg-transparent">
                                        <TableHead className="w-[40px] px-1 text-center h-12">
                                            <Checkbox
                                                checked={selectedIds.length === filteredRecords.length && filteredRecords.length > 0}
                                                onCheckedChange={toggleSelectAll}
                                                className="rounded border-slate-300"
                                            />
                                        </TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest h-12">Hội viên</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest h-12">Chỉ số cơ thể</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest h-12">Đánh giá & Thời gian</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest h-12 text-right pr-6">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRecords.map((r: any) => (
                                        <TableRow key={r.id} className={cn("border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-all group", selectedIds.includes(r.id) && "bg-red-50/30 dark:bg-red-900/10")}>
                                            <TableCell className="px-1 text-center">
                                                <Checkbox
                                                    checked={selectedIds.includes(r.id)}
                                                    onCheckedChange={() => toggleSelect(r.id)}
                                                    className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                                />
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-semibold text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
                                                        {r.clients?.member_name || 'N/A'}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 italic">{r.clients?.phone || '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{r.weight}<span className="text-[11px] ml-1 font-medium opacity-50">kg</span></span>
                                                    <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                        <span>Mỡ: {r.pbf}%</span>
                                                        <span>Cơ: {r.smm}kg</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div className="h-full bg-red-500" style={{ width: `${Math.min(r.fitness_score, 100)}%` }} />
                                                        </div>
                                                        <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{r.fitness_score}<span className="text-[10px] ml-0.5 opacity-40">pts</span></span>
                                                    </div>
                                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize italic">
                                                        {isMounted ? format(new Date(r.recorded_at), 'dd/MM/yyyy — HH:mm') : '—'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-black hover:bg-slate-100 transition-all border border-slate-200/30"
                                                        onClick={() => setSelectedRecord(r)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <Info className="w-5 h-5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-black hover:bg-slate-100 transition-all border border-slate-200/30"
                                                        onClick={() => {
                                                            setEditingRecord(r)
                                                            setIsFormOpen(true)
                                                        }}
                                                        title="Sửa"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all sm:opacity-0 group-hover:opacity-100"
                                                        onClick={() => setRecordToDelete(r.id)}
                                                        title="Xóa"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </Card>

            <InBodySheet 
                open={isFormOpen} 
                onOpenChange={setIsFormOpen} 
                initialData={editingRecord}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['all-inbody-records'] })
                    setEditingRecord(null)
                }}
            />

            <Sheet open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
                <SheetContent 
                    side="right" 
                    resizable={isMounted && window.innerWidth >= 640} 
                    defaultWidth={isMounted && window.innerWidth < 640 ? undefined : 900} 
                    maxWidth={isMounted && window.innerWidth < 640 ? undefined : 1400}
                    showCloseButton={false}
                    className={cn(
                        "p-0 border-none shadow-2xl bg-slate-50 flex flex-col h-full gap-0 overflow-hidden",
                        isMounted && window.innerWidth < 640 ? "!w-full !max-w-full" : ""
                    )}
                >
                    <SheetHeader className="p-4 sm:px-8 bg-white border-b flex flex-row items-center justify-between shrink-0">
                        <SheetTitle className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-red-500 shrink-0" />
                            Chi tiết báo cáo InBody
                        </SheetTitle>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full h-10 w-10 shrink-0"
                            onClick={() => setSelectedRecord(null)}
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </Button>
                    </SheetHeader>
                    <ScrollArea className="flex-1 min-h-0">
                        {selectedRecord && (
                            <InBodyReportView 
                                data={selectedRecord} 
                                client={selectedRecord.clients} 
                                onEdit={() => {
                                    setEditingRecord(selectedRecord)
                                    setSelectedRecord(null)
                                    setIsFormOpen(true)
                                }}
                                onDelete={() => {
                                    setRecordToDelete(selectedRecord.id)
                                    setSelectedRecord(null)
                                }}
                            />
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* DELETE CONFIRMATION */}
            <Dialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
                <DialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900">Xác nhận xóa bản ghi?</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
                            Hành động này không thể hoàn tác. Bản ghi kết quả InBody của hội viên sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-8 gap-3 flex-row sm:justify-end">
                        <Button 
                            variant="ghost"
                            onClick={() => setRecordToDelete(null)}
                            className="rounded-xl h-11 px-6 font-bold border-slate-100 uppercase text-[11px] tracking-widest text-slate-400"
                        >
                            Hủy bỏ
                        </Button>
                        <Button 
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-xl h-11 px-8 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-100"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            XÁC NHẬN XÓA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
