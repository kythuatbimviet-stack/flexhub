'use client'

import * as React from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    Scale,
    Calendar,
    TrendingUp,
    TrendingDown,
    History,
    Activity,
    X,
    Target,
    Ruler,
    Clock,
    ChevronRight,
    Pencil,
    Trash2,
    Loader2
} from 'lucide-react'
import { 
    fetchClientWeightHistory, 
    fetchClientTrainingLogs, 
    deleteWeightRecord, 
    upsertTrainingStatus 
} from '@/app/actions/weight-tracking'
import { fetchLatestContractByClientId } from '@/app/actions/contracts'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EditWeightDialog } from './edit-weight-dialog'
import { EditTrainingDialog } from './edit-training-dialog'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { 
    format, 
    differenceInDays, 
    startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth, 
    subWeeks, 
    subMonths, 
    isWithinInterval, 
    parseISO,
    isSameDay
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    Line,
    LineChart
} from 'recharts'

interface WeightHistoryPanelProps {
    clientId: string | null
    clientName: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function WeightHistoryPanel({ clientId, clientName, open, onOpenChange }: WeightHistoryPanelProps) {
    // Fetch History
    const { data: historyResult, isLoading: historyLoading } = useQuery({
        queryKey: ['client-weight-history', clientId],
        queryFn: async () => {
            if (!clientId) return []
            const res = await fetchClientWeightHistory(clientId)
            if (!res.success) throw new Error(res.error)
            return res.data || []
        },
        enabled: !!clientId && open,
    })

    // Fetch Latest Contract for Initial Metrics
    const { data: contractResult, isLoading: contractLoading } = useQuery({
        queryKey: ['client-latest-contract', clientId],
        queryFn: async () => {
            if (!clientId) return null
            const res = await fetchLatestContractByClientId(clientId)
            if (!res.success) throw new Error(res.error)
            return res.data || null
        },
        enabled: !!clientId && open,
    })

    // Fetch Training Logs
    const { data: trainingLogs, isLoading: trainingLoading } = useQuery({
        queryKey: ['client-training-logs', clientId],
        queryFn: async () => {
            if (!clientId) return []
            const res = await fetchClientTrainingLogs(clientId)
            if (!res.success) throw new Error(res.error)
            return res.data || []
        },
        enabled: !!clientId && open,
    })

    // Filter States
    const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
    const [dateFrom, setDateFrom] = React.useState<string>('')
    const [dateTo, setDateTo] = React.useState<string>('')
    const queryClient = useQueryClient()

    // Edit/Delete States
    const [editingWeight, setEditingWeight] = React.useState<any>(null)
    const [isWeightEditOpen, setIsWeightEditOpen] = React.useState(false)
    const [editingTraining, setEditingTraining] = React.useState<any>(null)
    const [isTrainingEditOpen, setIsTrainingEditOpen] = React.useState(false)
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string, type: 'weight' | 'training', date?: string, clientId?: string } | null>(null)
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)

    // Reset filters when clientId or open state changes to ensure data consistency
    React.useEffect(() => {
        if (open) {
            setStatusFilter('ALL')
            setDateFrom('')
            setDateTo('')
        }
    }, [open, clientId])

    const handleDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            if (deleteTarget.type === 'weight') {
                const res = await deleteWeightRecord(deleteTarget.id)
                if (!res.success) throw new Error(res.error)
                toast.success('Xóa bản ghi cân nặng thành công')
            } else {
                if (!deleteTarget.clientId || !deleteTarget.date) throw new Error('Thiếu thông tin xóa')
                const res = await upsertTrainingStatus(deleteTarget.clientId, deleteTarget.date, null)
                if (!res.success) throw new Error(res.error)
                toast.success('Xóa lịch tập thành công')
            }
            
            // Refetch data
            queryClient.invalidateQueries({ queryKey: ['client-weight-history'] })
            queryClient.invalidateQueries({ queryKey: ['client-training-logs'] })
            queryClient.invalidateQueries({ queryKey: ['training-logs'] })
            queryClient.invalidateQueries({ queryKey: ['training-logs-report'] })
            setIsDeleteOpen(false)
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi xóa dữ liệu')
        } finally {
            setIsDeleting(false)
        }
    }

    const handlePresetRange = (preset: string) => {
        const now = new Date()
        let start: Date | null = null
        let end: Date | null = null

        switch (preset) {
            case 'this-week':
                start = startOfWeek(now, { weekStartsOn: 1 })
                end = endOfWeek(now, { weekStartsOn: 1 })
                break
            case 'last-week':
                const lastWeek = subWeeks(now, 1)
                start = startOfWeek(lastWeek, { weekStartsOn: 1 })
                end = endOfWeek(lastWeek, { weekStartsOn: 1 })
                break
            case 'this-month':
                start = startOfMonth(now)
                end = endOfMonth(now)
                break
            case 'last-month':
                const lastMonth = subMonths(now, 1)
                start = startOfMonth(lastMonth)
                end = endOfMonth(lastMonth)
                break
            case 'all':
                setDateFrom('')
                setDateTo('')
                return
        }

        if (start && end) {
            setDateFrom(format(start, 'yyyy-MM-dd'))
            setDateTo(format(end, 'yyyy-MM-dd'))
        }
    }

    const filteredTrainingLogs = React.useMemo(() => {
        let logs = trainingLogs || []

        // Status Filter
        if (statusFilter !== 'ALL') {
            logs = logs.filter((l: any) => l.status === statusFilter)
        }

        // Date Filter
        if (dateFrom || dateTo) {
            logs = logs.filter((l: any) => {
                const logDate = parseISO(l.date)
                if (dateFrom && dateTo) {
                    return isWithinInterval(logDate, {
                        start: parseISO(dateFrom),
                        end: parseISO(dateTo)
                    }) || isSameDay(logDate, parseISO(dateFrom)) || isSameDay(logDate, parseISO(dateTo))
                }
                if (dateFrom) return logDate >= parseISO(dateFrom) || isSameDay(logDate, parseISO(dateFrom))
                if (dateTo) return logDate <= parseISO(dateTo) || isSameDay(logDate, parseISO(dateTo))
                return true
            })
        }

        return logs
    }, [trainingLogs, statusFilter, dateFrom, dateTo])

    const trainingStats = React.useMemo(() => {
        const logs = filteredTrainingLogs
        return {
            y: logs.filter((l: any) => l.status === 'Y').length,
            n: logs.filter((l: any) => l.status === 'N').length,
            td: logs.filter((l: any) => l.status === 'TĐ').length,
        }
    }, [filteredTrainingLogs])

    const history = historyResult || []
    const latestContract = contractResult || null

    // Calculate current weight vs initial weight
    const initialWeight = latestContract?.initial_weight || (history.length > 0 ? history[history.length - 1].weight : null)
    const currentWeight = history.length > 0 ? history[0].weight : (latestContract?.initial_weight || null)
    const weightChange = initialWeight && currentWeight ? (currentWeight - initialWeight).toFixed(1) : null
    const isWeightLoss = weightChange ? parseFloat(weightChange) < 0 : false

    // Calculate Weight Loss Speed (kg/week)
    const startDate = latestContract?.start_date ? new Date(latestContract.start_date) : (history.length > 0 ? new Date(history[history.length - 1].measurement_date) : null)
    const currentDate = history.length > 0 ? new Date(history[0].measurement_date) : new Date()
    const daysDiff = startDate ? differenceInDays(currentDate, startDate) : 0
    const weeksDiff = daysDiff / 7
    const weightLossSpeed = (initialWeight && currentWeight && weeksDiff > 0) 
        ? Math.abs((initialWeight - currentWeight) / weeksDiff).toFixed(2) 
        : "0.00"

    // Prepare Chart Data (Oldest to Newest)
    const chartData = React.useMemo(() => {
        if (history.length === 0) return []
        return [...history]
            .reverse()
            .map((item: any) => ({
                date: format(new Date(item.measurement_date), 'dd/MM', { locale: vi }),
                fullDate: format(new Date(item.measurement_date), 'dd/MM/yyyy', { locale: vi }),
                weight: parseFloat(item.weight) || 0,
                target: parseFloat(item.target_weight) || parseFloat(latestContract?.target_weight) || null,
            }))
    }, [history, latestContract])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent 
                side="right" 
                showCloseButton={false}
                className="w-full sm:max-w-[600px] border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-gray-950 font-inter"
            >
                <Tabs defaultValue="progress" className="w-full flex flex-col h-full">
                    {/* Unified Sticky Header & Navigation */}
                    <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 transition-all duration-300">
                        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <SheetTitle className="text-[17px] sm:text-[19px] font-semibold text-black dark:text-white leading-tight">Tiến trình thay đổi</SheetTitle>
                                    <SheetDescription className="text-[11px] sm:text-xs font-medium text-slate-900 dark:text-slate-200">
                                        {clientName}
                                    </SheetDescription>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="rounded-full w-9 h-9 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </Button>
                        </div>

                        {/* Modern Segmented Control Navigation */}
                        <div className="px-4 sm:px-6 pb-2">
                            <TabsList className="w-full bg-slate-100/70 dark:bg-slate-900/70 p-1.5 rounded-2xl h-[52px] border border-slate-200/50 dark:border-slate-800/50">
                                <TabsTrigger 
                                    value="progress" 
                                    className="rounded-xl flex-1 h-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-black dark:data-[state=active]:text-white text-[13px] sm:text-[14px] font-semibold text-slate-600 hover:text-black transition-all duration-300"
                                >
                                    Tiến trình chuyển hóa
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="training" 
                                    className="rounded-xl flex-1 h-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-black dark:data-[state=active]:text-white text-[13px] sm:text-[14px] font-semibold text-slate-600 hover:text-black transition-all duration-300"
                                >
                                    Tần suất tập luyện
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 bg-slate-50/30 dark:bg-gray-950/30">

                        <TabsContent value="progress" className="p-4 sm:p-6 space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
                            {/* Summary Cards - Grid Adjusted for Mobile */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
                                    <p className="text-[12px] font-medium text-slate-900 dark:text-slate-300 mb-3">Ban đầu</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-semibold text-black dark:text-white tracking-tight">{initialWeight || '-'}</span>
                                        <span className="text-[14px] font-medium text-slate-500">kg</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100/50 dark:border-slate-800/50 shadow-sm">
                                    <p className="text-[12px] font-medium text-blue-600 dark:text-blue-400 mb-3">Hiện tại</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-semibold text-blue-600 dark:text-blue-400 tracking-tight">{currentWeight || '-'}</span>
                                        <span className="text-[14px] font-medium text-blue-500/60">kg</span>
                                    </div>
                                </div>

                                <div className={cn(
                                    "p-5 rounded-[24px] border shadow-sm",
                                    isWeightLoss 
                                        ? "bg-emerald-50/30 border-emerald-100/50 dark:bg-emerald-950/10 dark:border-emerald-900/30" 
                                        : "bg-orange-50/30 border-orange-100/50 dark:bg-orange-950/10 dark:border-orange-900/30"
                                )}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <p className={cn(
                                            "text-[12px] font-medium",
                                            isWeightLoss ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400"
                                        )}>Thay đổi</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isWeightLoss ? <TrendingDown className="w-5 h-5 text-emerald-500" /> : <TrendingUp className="w-5 h-5 text-orange-500" />}
                                        <span className={cn(
                                            "text-3xl font-semibold tracking-tight",
                                            isWeightLoss ? "text-emerald-600" : "text-orange-600"
                                        )}>
                                            {weightChange ? (isWeightLoss ? weightChange : `+${weightChange}`) : '0'}
                                        </span>
                                        <span className={cn(
                                            "text-[14px] font-medium",
                                            isWeightLoss ? "text-emerald-500/60" : "text-orange-500/60"
                                        )}>kg</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50/30 dark:bg-blue-950/10 p-5 rounded-[24px] border border-blue-100/50 dark:border-blue-900/30 shadow-sm">
                                    <p className="text-[12px] font-medium text-blue-700 dark:text-blue-400 mb-3">Tốc độ</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-semibold text-blue-600 dark:text-blue-400 tracking-tight">
                                            {weightLossSpeed}
                                        </span>
                                        <span className="text-[14px] font-medium text-blue-500/60">kg/tuần</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-slate-400" />
                                        <h3 className="text-[15px] font-semibold text-black dark:text-white">Biểu đồ tiến trình</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                            <span className="text-[12px] font-medium text-slate-900 dark:text-slate-300">Thực tế</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-0.5 border-t-2 border-dashed border-blue-500" />
                                            <span className="text-[12px] font-medium text-slate-900 dark:text-slate-300">Mục tiêu</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[250px] w-full">
                                    {historyLoading ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                        </div>
                                    ) : chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorWeightHistory" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 9, fill: '#000', fontWeight: 500 }}
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 9, fill: '#000', fontWeight: 500 }}
                                                    domain={['dataMin - 2', 'dataMax + 2']}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid #f1f5f9',
                                                        borderRadius: '16px',
                                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
                                                        padding: '12px'
                                                    }}
                                                    itemStyle={{ fontSize: '13px', fontWeight: 600, padding: '2px 0' }}
                                                    labelStyle={{ color: '#000', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}
                                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="weight"
                                                    name="Cân nặng"
                                                    stroke="#10b981"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorWeightHistory)"
                                                    animationDuration={1500}
                                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="target"
                                                    name="Mục tiêu"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    strokeDasharray="4 4"
                                                    dot={false}
                                                    animationDuration={1500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-black dark:text-slate-400 text-sm italic font-medium">
                                            Không đủ dữ liệu để hiển thị biểu đồ
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* History Section - Enhanced Spacing */}
                            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2">
                                    <History className="w-5 h-5 text-slate-400" />
                                    <h3 className="text-[16px] font-bold text-black dark:text-white tracking-tight">Tiến trình chuyển hóa</h3>
                                </div>

                                <div className="hidden sm:block overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                    <table className="w-full text-left border-collapse min-w-[550px]">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                                <th className="px-6 py-4 text-[12px] font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">Ngày đo</th>
                                                <th className="px-4 py-4 text-[12px] font-medium text-slate-900 dark:text-slate-200 text-center whitespace-nowrap">Thực tế</th>
                                                <th className="px-4 py-4 text-[12px] font-medium text-slate-900 dark:text-slate-200 text-center whitespace-nowrap">Cần đạt</th>
                                                <th className="px-6 py-4 text-[12px] font-medium text-slate-900 dark:text-slate-200 text-right whitespace-nowrap">Hẹn tiếp theo</th>
                                                <th className="px-6 py-4 text-[12px] font-medium text-slate-900 dark:text-slate-200 text-right whitespace-nowrap">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {historyLoading ? (
                                                Array.from({ length: 3 }).map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24" /></td>
                                                        <td className="px-4 py-5 space-y-2">
                                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-12 mx-auto" />
                                                        </td>
                                                        <td className="px-4 py-5 whitespace-nowrap"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-12 mx-auto" /></td>
                                                        <td className="px-4 py-5 whitespace-nowrap"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-12 mx-auto" /></td>
                                                        <td className="px-6 py-5 text-right"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24 ml-auto" /></td>
                                                    </tr>
                                                ))
                                            ) : history.length > 0 ? (
                                                history.map((record: any, idx: number) => (
                                                    <tr key={record.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300">
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-semibold text-black dark:text-white">
                                                                    {format(new Date(record.measurement_date), 'dd/MM/yyyy')}
                                                                </span>
                                                                {idx === 0 && (
                                                                    <span className="text-[10px] font-bold text-emerald-500 mt-0.5">MỚI NHẤT</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-5 text-center">
                                                            <span className="text-[15px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                {record.weight ? `${record.weight}kg` : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-5 text-center">
                                                            <span className="text-[15px] font-semibold text-blue-600 dark:text-blue-400">
                                                                {record.target_weight ? `${record.target_weight}kg` : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <span className="text-[14px] font-medium text-slate-900 dark:text-slate-200">
                                                                {record.next_measurement_date ? format(new Date(record.next_measurement_date), 'dd/MM/yyyy') : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setEditingWeight(record)
                                                                        setIsWeightEditOpen(true)
                                                                    }}
                                                                    className="w-8 h-8 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setDeleteTarget({ id: record.id, type: 'weight' })
                                                                        setIsDeleteOpen(true)
                                                                    }}
                                                                    className="w-8 h-8 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500 text-sm italic font-medium">
                                                        Chưa có dữ liệu lịch sử đo lường
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View: Card List - Redesigned */}
                                <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                    {historyLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="p-6 animate-pulse space-y-4">
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-1/3" />
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                                                    <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                                                    <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                                                </div>
                                            </div>
                                        ))
                                    ) : history.length > 0 ? (
                                        history.map((record: any, idx: number) => (
                                            <div key={record.id} className="p-6 space-y-5 bg-white dark:bg-slate-900 border-none">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[15px] font-bold text-black dark:text-white leading-none">
                                                            {format(new Date(record.measurement_date), 'dd/MM/yyyy')}
                                                        </span>
                                                        {idx === 0 && (
                                                            <span className="text-[10px] font-bold text-emerald-500">MỚI NHẤT</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditingWeight(record)
                                                                setIsWeightEditOpen(true)
                                                            }}
                                                            className="w-8 h-8 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setDeleteTarget({ id: record.id, type: 'weight' })
                                                                setIsDeleteOpen(true)
                                                            }}
                                                            className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-[22px] flex flex-col items-center border border-emerald-100/50 dark:border-emerald-900/30">
                                                        <span className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest mb-1.5">Cân nặng</span>
                                                        <span className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                                                            {record.weight ? `${record.weight}kg` : '-'}
                                                        </span>
                                                    </div>
                                                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3.5 rounded-[22px] flex flex-col items-center border border-blue-100/50 dark:border-blue-900/30">
                                                        <span className="text-[9px] font-bold text-blue-600/60 uppercase tracking-widest mb-1.5">Mục tiêu</span>
                                                        <span className="text-[16px] font-bold text-blue-600 dark:text-blue-400 leading-none">
                                                            {record.target_weight ? `${record.target_weight}kg` : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm italic font-medium">
                                            Chưa có dữ liệu đo lường
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="training" className="p-4 sm:p-6 space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
                            {/* Filter Section - Redesigned to match sample */}
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-slate-400" />
                                            <h3 className="text-[16px] font-semibold text-black dark:text-white leading-tight">Bộ lọc tập luyện</h3>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handlePresetRange('all')}
                                            className="text-[12px] font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50/50 transition-colors"
                                        >
                                            Đặt lại
                                        </Button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'all', label: 'Tất cả' },
                                            { id: 'this-week', label: 'Tuần này' },
                                            { id: 'last-week', label: 'Tuần trước' },
                                            { id: 'this-month', label: 'Tháng này' },
                                            { id: 'last-month', label: 'Tháng trước' },
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => handlePresetRange(p.id)}
                                                className="px-4 py-2 rounded-xl text-[12px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-transparent shadow-sm"
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-medium text-slate-900 dark:text-slate-300 ml-1">TỪ NGÀY</label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={dateFrom}
                                                    onChange={(e) => setDateFrom(e.target.value)}
                                                    className="w-full h-11 px-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] font-medium text-black dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-medium text-slate-900 dark:text-slate-300 ml-1">ĐẾN NGÀY</label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={dateTo}
                                                    onChange={(e) => setDateTo(e.target.value)}
                                                    className="w-full h-11 px-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] font-medium text-black dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 col-span-2 lg:col-span-1">
                                            <label className="text-[11px] font-medium text-slate-900 dark:text-slate-300 ml-1">TRẠNG THÁI</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full h-11 px-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] font-medium text-black dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="ALL">Tất cả trạng thái</option>
                                                <option value="Y">Tập (Y)</option>
                                                <option value="N">Nghỉ (N)</option>
                                                <option value="TĐ">Tự tập (TĐ)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Training Frequency Stats Widget */}
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <Activity className="w-5 h-5 text-slate-400" />
                                    <h3 className="text-[16px] font-bold text-black dark:text-white leading-tight">Thống kê</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-3 relative">
                                    <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-[20px] border border-emerald-100/50">
                                        <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 mb-3">TẬP (Y)</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-semibold text-emerald-600 tracking-tighter">{trainingStats.y}</span>
                                            <span className="text-[13px] font-medium text-emerald-600/60">ngày</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center justify-center p-4 bg-red-50/50 dark:bg-red-950/10 rounded-[20px] border border-red-100/50">
                                        <span className="text-[11px] font-medium text-red-800 dark:text-red-300 mb-3">NGHỈ (N)</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-semibold text-red-600 tracking-tighter">{trainingStats.n}</span>
                                            <span className="text-[13px] font-medium text-red-600/60">ngày</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-4 bg-orange-50/50 dark:bg-orange-950/10 rounded-[20px] border border-orange-100/50">
                                        <span className="text-[11px] font-medium text-orange-800 dark:text-orange-300 mb-3">TỰ TẬP (TĐ)</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-semibold text-orange-600 tracking-tighter">{trainingStats.td}</span>
                                            <span className="text-[13px] font-medium text-orange-600/60">ngày</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Daily Training History Table */}
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2">
                                    <History className="w-5 h-5 text-slate-400" />
                                    <h3 className="text-[16px] font-bold text-black dark:text-white tracking-tight">Chi tiết lịch sử tập luyện</h3>
                                </div>

                                <div className="hidden sm:block overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                    <table className="w-full text-left border-collapse min-w-[400px]">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                                <th className="px-5 sm:px-6 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider">Ngày</th>
                                                <th className="px-4 sm:px-5 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider">Trạng thái</th>
                                                <th className="px-5 sm:px-6 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider text-right">Cập nhật</th>
                                                <th className="px-5 sm:px-6 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {trainingLoading ? (
                                                Array.from({ length: 3 }).map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24" /></td>
                                                        <td className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-16 mx-auto" /></td>
                                                        <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24 ml-auto" /></td>
                                                    </tr>
                                                ))
                                            ) : filteredTrainingLogs && filteredTrainingLogs.length > 0 ? (
                                                filteredTrainingLogs.map((log: any) => (
                                                    <tr key={log.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-5 sm:px-6 py-5">
                                                            <span className="text-[15px] font-bold text-black dark:text-slate-100 whitespace-nowrap">
                                                                {format(new Date(log.date), 'dd/MM/yyyy')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 sm:px-5 py-5 text-center">
                                                            <span className={cn(
                                                                "text-[12px] font-bold uppercase",
                                                                log.status === 'Y' && "text-emerald-500",
                                                                log.status === 'N' && "text-red-500",
                                                                log.status === 'TĐ' && "text-orange-500"
                                                            )}>
                                                                {log.status === 'Y' ? 'TẬP' : log.status === 'N' ? 'NGHỈ' : 'TỰ TẬP'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 sm:px-6 py-5 text-right font-medium text-slate-400 tabular-nums">
                                                            {log.updated_at ? format(new Date(log.updated_at), 'HH:mm dd/MM') : '-'}
                                                        </td>
                                                        <td className="px-5 sm:px-6 py-5 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setEditingTraining(log)
                                                                        setIsTrainingEditOpen(true)
                                                                    }}
                                                                    className="w-8 h-8 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setDeleteTarget({ id: log.id, type: 'training', date: log.date, clientId: log.client_id })
                                                                        setIsDeleteOpen(true)
                                                                    }}
                                                                    className="w-8 h-8 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500 text-sm italic font-medium">
                                                        Chưa có dữ liệu tập luyện trong khoảng này
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                    {trainingLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="p-6 animate-pulse flex items-center justify-between">
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24" />
                                                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl w-24" />
                                            </div>
                                        ))
                                    ) : filteredTrainingLogs && filteredTrainingLogs.length > 0 ? (
                                        filteredTrainingLogs.map((log: any) => (
                                            <div key={log.id} className="p-5 flex items-center justify-between bg-white dark:bg-slate-900 border-none">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[15px] font-bold text-black dark:text-white">
                                                        {format(new Date(log.date), 'dd/MM/yyyy')}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                                                        {log.updated_at ? format(new Date(log.updated_at), 'HH:mm dd/MM') : '-'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "text-[12px] font-bold uppercase",
                                                        log.status === 'Y' && "text-emerald-500",
                                                        log.status === 'N' && "text-red-500",
                                                        log.status === 'TĐ' && "text-orange-500"
                                                    )}>
                                                        {log.status === 'Y' ? 'TẬP' : log.status === 'N' ? 'NGHỈ' : 'TỰ TẬP'}
                                                    </span>
                                                    <div className="flex items-center gap-1 border-l pl-3 border-slate-100">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditingTraining(log)
                                                                setIsTrainingEditOpen(true)
                                                            }}
                                                            className="w-8 h-8 rounded-full hover:bg-blue-50 text-slate-400"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setDeleteTarget({ id: log.id, type: 'training', date: log.date, clientId: log.client_id })
                                                                setIsDeleteOpen(true)
                                                            }}
                                                            className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-400"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm italic font-medium">
                                            Không có dữ liệu tập luyện
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>

                    <div className="p-4 bg-white dark:bg-gray-950 border-t border-slate-100 dark:border-slate-800 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full rounded-2xl h-12 font-bold text-slate-900 dark:text-white border-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95"
                        >
                            Đóng lại
                        </Button>
                    </div>
                </Tabs>
            </SheetContent>

            {/* Dialogs Integration */}
            {clientId && clientName && editingWeight && (
                <EditWeightDialog
                    open={isWeightEditOpen}
                    onOpenChange={setIsWeightEditOpen}
                    record={editingWeight}
                    clients={[{ id: clientId, member_name: clientName }]}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['client-weight-history'] })
                        queryClient.invalidateQueries({ queryKey: ['client-latest-contract'] })
                    }}
                />
            )}

            {editingTraining && (
                <EditTrainingDialog
                    open={isTrainingEditOpen}
                    onOpenChange={setIsTrainingEditOpen}
                    record={editingTraining}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['client-training-logs'] })
                        queryClient.invalidateQueries({ queryKey: ['training-logs'] })
                        queryClient.invalidateQueries({ queryKey: ['training-logs-report'] })
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl bg-white dark:bg-gray-900 p-8">
                    <DialogHeader className="items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Xác nhận xóa dữ liệu?
                            </DialogTitle>
                            <DialogDescription className="text-gray-500 dark:text-gray-400">
                                Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bản ghi này?
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isDeleting}
                            className="flex-1 rounded-2xl h-12 font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 rounded-2xl h-12 bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg shadow-red-500/20"
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang xóa...
                                </div>
                            ) : 'Đồng ý xóa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Sheet>
    )
}
