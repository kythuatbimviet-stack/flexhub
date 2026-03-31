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
    ChevronRight
} from 'lucide-react'
import { fetchClientWeightHistory, fetchClientTrainingLogs } from '@/app/actions/weight-tracking'
import { fetchLatestContractByClientId } from '@/app/actions/contracts'
import { useQuery } from '@tanstack/react-query'
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
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <SheetTitle className="text-[20px] font-semibold text-slate-900 dark:text-white leading-tight tracking-tight">Tiến trình thay đổi</SheetTitle>
                            <SheetDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {clientName} • Lịch sử & Xu hướng
                            </SheetDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <Tabs defaultValue="progress" className="w-full">
                        <div className="px-6 pt-2 pb-4 sticky top-0 z-10 bg-slate-50/80 dark:bg-gray-950/80 backdrop-blur-md">
                            <TabsList className="w-full bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-2xl h-12 border border-slate-200/50 dark:border-slate-800/50" variant="line">
                                <TabsTrigger value="progress" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-[14px] font-medium transition-all duration-300">Tiến trình chuyển hóa</TabsTrigger>
                                <TabsTrigger value="training" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-[14px] font-medium transition-all duration-300">Tần suất tập luyện</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="progress" className="p-6 pt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/5 rounded-full -mr-8 -mt-8 blur-xl group-hover:scale-150 transition-transform duration-700" />
                                    <p className="text-[12px] font-medium text-black dark:text-slate-100 mb-1">Ban đầu</p>
                                    <div className="flex items-end gap-1">
                                        <span className="text-2xl font-semibold text-black dark:text-white">{initialWeight || '-'}</span>
                                        <span className="text-[12px] font-medium text-black/60 mb-1">kg</span>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full -mr-8 -mt-8 blur-xl group-hover:scale-150 transition-transform duration-700" />
                                    <p className="text-[12px] font-medium text-black dark:text-slate-100 mb-1">Hiện tại</p>
                                    <div className="flex items-end gap-1">
                                        <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{currentWeight || '-'}</span>
                                        <span className="text-[12px] font-medium text-blue-500/60 mb-1">kg</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "p-4 rounded-3xl border shadow-sm relative overflow-hidden group transition-all",
                                    isWeightLoss 
                                        ? "bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50" 
                                        : "bg-orange-50/30 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/50"
                                )}>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-current/5 rounded-full -mr-8 -mt-8 blur-xl group-hover:scale-150 transition-transform duration-700" />
                                    <p className={cn(
                                        "text-[12px] font-medium mb-1",
                                        isWeightLoss ? "text-emerald-950" : "text-orange-950"
                                    )}>Thay đổi</p>
                                    <div className="flex items-center gap-1.5">
                                        {isWeightLoss ? <TrendingDown className="w-5 h-5 text-emerald-600" /> : <TrendingUp className="w-5 h-5 text-orange-600" />}
                                        <span className={cn(
                                            "text-2xl font-semibold",
                                            isWeightLoss ? "text-emerald-600" : "text-orange-600"
                                        )}>
                                            {weightChange ? (isWeightLoss ? weightChange : `+${weightChange}`) : '0'}
                                        </span>
                                        <span className={cn(
                                            "text-[12px] font-medium mt-1",
                                            isWeightLoss ? "text-emerald-400" : "text-orange-400"
                                        )}>kg</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "p-4 rounded-3xl border shadow-sm relative overflow-hidden group transition-all",
                                    isWeightLoss 
                                        ? "bg-blue-50/30 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/50" 
                                        : "bg-slate-50/30 border-slate-100 dark:bg-slate-950/10 dark:border-slate-900/50"
                                )}>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-current/5 rounded-full -mr-8 -mt-8 blur-xl group-hover:scale-150 transition-transform duration-700" />
                                    <p className={cn(
                                        "text-[12px] font-medium mb-1",
                                        isWeightLoss ? "text-blue-900" : "text-black"
                                    )}>Tốc độ</p>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className={cn("w-5 h-5", isWeightLoss ? "text-blue-600" : "text-black")} />
                                        <span className={cn(
                                            "text-2xl font-semibold",
                                            isWeightLoss ? "text-blue-600" : "text-black"
                                        )}>
                                            {weightLossSpeed}
                                        </span>
                                        <span className={cn(
                                            "text-[12px] font-medium mt-1",
                                            isWeightLoss ? "text-blue-400" : "text-black/60"
                                        )}>kg/tuần</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Section */}
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                            <TrendingUp className="w-4 h-4 text-black dark:text-slate-400" />
                                        </div>
                                        <h3 className="text-[15px] font-semibold text-black dark:text-white tracking-tight">Biểu đồ tiến trình</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                            <span className="text-[11px] font-medium text-black">Thực tế</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-0.5 bg-blue-500" />
                                            <span className="text-[11px] font-medium text-black">Mục tiêu</span>
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
                                                    tick={{ fontSize: 10, fill: '#000', fontWeight: 500 }}
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fill: '#000', fontWeight: 500 }}
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

                            {/* History Table Section */}
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                        <History className="w-4 h-4 text-black dark:text-slate-400" />
                                    </div>
                                    <h3 className="text-[15px] font-semibold text-black dark:text-white tracking-tight">Tiến trình chuyển hóa</h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                                <th className="px-6 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider">Ngày đo</th>
                                                <th className="px-4 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider text-center">Thực tế</th>
                                                <th className="px-4 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider text-center">Cần đạt</th>
                                                <th className="px-4 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider text-center">Chiều cao</th>
                                                <th className="px-6 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider text-right">Hẹn tiếp theo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {historyLoading ? (
                                                Array.from({ length: 3 }).map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-20" /></td>
                                                        <td className="px-4 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-12 mx-auto" /></td>
                                                        <td className="px-4 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-12 mx-auto" /></td>
                                                        <td className="px-4 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-12 mx-auto" /></td>
                                                        <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-20 ml-auto" /></td>
                                                    </tr>
                                                ))
                                            ) : history.length > 0 ? (
                                                history.map((record: any, idx: number) => (
                                                    <tr key={record.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-medium text-black dark:text-slate-100">
                                                                    {format(new Date(record.measurement_date), 'dd/MM/yyyy')}
                                                                </span>
                                                                {idx === 0 && (
                                                                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Mới nhất</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="text-[14px] font-medium text-emerald-600 dark:text-emerald-400">
                                                                {record.weight ? `${record.weight}kg` : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="text-[14px] font-medium text-blue-600 dark:text-blue-400">
                                                                {record.target_weight ? `${record.target_weight}kg` : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="text-[14px] font-medium text-purple-600 dark:text-purple-400">
                                                                {record.height ? `${record.height}cm` : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-[14px] font-medium text-black dark:text-slate-400">
                                                                {record.next_measurement_date ? format(new Date(record.next_measurement_date), 'dd/MM/yyyy') : '-'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-black dark:text-slate-400 text-sm italic font-medium">
                                                        Hội viên chưa có lịch sử đo lường
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="training" className="p-6 pt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Filter Section */}
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-black dark:text-slate-400" />
                                            </div>
                                            <h3 className="text-[15px] font-semibold text-black dark:text-white tracking-tight">Bộ lọc tập luyện</h3>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handlePresetRange('all')}
                                            className="text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                                        >
                                            Đặt lại
                                        </Button>
                                    </div>

                                    {/* Presets */}
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
                                                className="px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all bg-slate-50 dark:bg-slate-800 text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Date Inputs & Status Filter */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-black dark:text-slate-400 uppercase tracking-wider ml-1">Từ ngày</label>
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] font-medium text-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-black dark:text-slate-400 uppercase tracking-wider ml-1">Đến ngày</label>
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] font-medium text-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-black dark:text-slate-400 uppercase tracking-wider ml-1">Trạng thái</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] font-medium text-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
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

                            {/* Training Frequency Stats Cards */}
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                        <Activity className="w-4 h-4 text-black dark:text-slate-400" />
                                    </div>
                                    <h3 className="text-[15px] font-semibold text-black dark:text-white tracking-tight">Thống kê {(dateFrom || dateTo) && "trong khoảng lọc"}</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-6 relative z-10">
                                    <div className="flex flex-col items-center p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-3xl border border-emerald-100/50 dark:border-emerald-800/20">
                                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Tập (Y)</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{trainingLoading ? '-' : trainingStats.y}</span>
                                            <span className="text-[12px] font-medium text-emerald-500/60">ngày</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center p-4 bg-red-50/50 dark:bg-red-950/10 rounded-3xl border border-red-100/50 dark:border-red-800/20">
                                        <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Nghỉ (N)</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-red-600 dark:text-red-400">{trainingLoading ? '-' : trainingStats.n}</span>
                                            <span className="text-[12px] font-medium text-red-500/60">ngày</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center p-4 bg-orange-50/50 dark:bg-orange-950/10 rounded-3xl border border-orange-100/50 dark:border-orange-800/20">
                                        <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2">Tự tập (TĐ)</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{trainingLoading ? '-' : trainingStats.td}</span>
                                            <span className="text-[12px] font-medium text-orange-500/60">ngày</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Daily Training History Table */}
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                        <History className="w-4 h-4 text-black dark:text-slate-400" />
                                    </div>
                                    <h3 className="text-[15px] font-semibold text-black dark:text-white tracking-tight">Chi tiết lịch sử tập luyện</h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                                <th className="px-6 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider">Ngày</th>
                                                <th className="px-6 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider">Trạng thái</th>
                                                <th className="px-6 py-3 text-[11px] font-medium text-black dark:text-slate-300 tracking-wider text-right">Cập nhật lúc</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {trainingLoading ? (
                                                Array.from({ length: 3 }).map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24" /></td>
                                                        <td className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-16" /></td>
                                                        <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24 ml-auto" /></td>
                                                    </tr>
                                                ))
                                            ) : filteredTrainingLogs && filteredTrainingLogs.length > 0 ? (
                                                filteredTrainingLogs.map((log: any) => (
                                                    <tr key={log.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="text-[14px] font-medium text-black dark:text-slate-100">
                                                                {format(new Date(log.date), 'dd/MM/yyyy')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={cn(
                                                                "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase",
                                                                log.status === 'Y' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
                                                                log.status === 'N' && "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400",
                                                                log.status === 'TĐ' && "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400"
                                                            )}>
                                                                {log.status === 'Y' ? 'Tập' : log.status === 'N' ? 'Nghỉ' : 'Tự tập'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-[12px] font-medium text-black/60 dark:text-slate-400">
                                                                {log.updated_at ? format(new Date(log.updated_at), 'HH:mm dd/MM') : '-'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-12 text-center text-black dark:text-slate-400 text-sm italic font-medium">
                                                        Chưa có dữ liệu tập luyện trong khoảng lọc này
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </ScrollArea>

                <div className="p-4 bg-white dark:bg-gray-950 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full rounded-2xl h-12 font-semibold text-slate-900 border-2 hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                        Đóng lại
                    </Button>
                </div>

            </SheetContent>
        </Sheet>
    )
}
