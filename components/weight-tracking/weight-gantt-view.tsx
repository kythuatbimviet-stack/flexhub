'use client'

import React from 'react'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Users,
    Activity,
    Target,
    Ruler,
    Search,
    Filter,
    ArrowRight,
    Settings2,
    Check,
    Edit3,
    User,
    Building2,
    Package,
    RotateCcw,
    Flag
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getWeek, isToday, parseISO, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { AddWeightDialog } from './add-weight-dialog'
import { WeightDetailsSheet } from './weight-details-sheet'
import { WeightHistoryPanel } from './weight-history-panel'
import { fetchTrainingLogs, upsertTrainingStatus } from '@/app/actions/weight-tracking'

interface WeightGanttViewProps {
    records: any[]
    clients: any[]
    contracts: any[]
    onSuccess?: () => void
}

export function WeightGanttView({ records, clients, contracts, onSuccess }: WeightGanttViewProps) {
    const queryClient = useQueryClient()
    const [startDate, setStartDate] = React.useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-01'))
    const [endDate, setEndDate] = React.useState<string>(format(endOfMonth(addDays(new Date(), 30)), 'yyyy-MM-dd'))
    const [localRecords, setLocalRecords] = React.useState<any[]>(records)
    const [showTarget, setShowTarget] = React.useState(true)
    const [showActual, setShowActual] = React.useState(true)
    const [showTraining, setShowTraining] = React.useState(true)
    const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null)
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
    const [visibleColumns, setVisibleColumns] = React.useState({
        branch: true,
        pt: true,
        time: true,
        package: true
    })

    // Filters
    const [filterBranch, setFilterBranch] = React.useState<string>("all")
    const [filterPT, setFilterPT] = React.useState<string>("all")
    const [filterPackage, setFilterPackage] = React.useState<string>("all")
    const [searchTerm, setSearchTerm] = React.useState<string>("")

    // Dialog state
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [selectedRecord, setSelectedRecord] = React.useState<any>(null)
    const [prefilledDate, setPrefilledDate] = React.useState<string | null>(null)

    // History Panel State
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
    const [historyClientId, setHistoryClientId] = React.useState<string | null>(null)
    const [historyClientName, setHistoryClientName] = React.useState<string | null>(null)

    const { data: trainingLogs = [] } = useQuery({
        queryKey: ['training-logs', startDate, endDate],
        queryFn: async () => {
            const res = await fetchTrainingLogs(startDate, endDate)
            return res.success ? res.data : []
        }
    })

    const visibleCount = [showTarget, showActual, showTraining].filter(Boolean).length

    const toggleColumn = (col: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))
    }

    const getGridTemplate = () => {
        let cols = ['40px'] // STT
        if (visibleColumns.pt) cols.push('80px')
        cols.push('220px') // Khách hàng
        if (visibleColumns.time) cols.push('140px')
        if (visibleColumns.package) cols.push('100px')
        if (visibleColumns.branch) cols.push('100px')
        cols.push('80px') // Tiêu chí
        return cols.join(' ')
    }

    const getLeftPaneWidth = () => {
        let width = 40 + 220 + 80 // STT, Khách hàng, Criteria
        if (visibleColumns.pt) width += 80
        if (visibleColumns.time) width += 140
        if (visibleColumns.package) width += 100
        if (visibleColumns.branch) width += 100
        return `${width}px`
    }

    const toggleCriteria = (criteria: 'target' | 'actual' | 'height' | 'training', val: boolean) => {
        if (!val && visibleCount === 1) {
            toast.error('Phải chọn ít nhất 1 tiêu chí hiển thị')
            return
        }
        if (criteria === 'target') setShowTarget(val)
        if (criteria === 'actual') setShowActual(val)
        if (criteria === 'actual') setShowActual(val)
        if (criteria === 'training') setShowTraining(val)
    }

    const handleUpdateStatus = async (status: 'Y' | 'N' | 'TĐ' | null) => {
        if (!selectedClientId || !selectedDate) return
        
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            const res = await upsertTrainingStatus(selectedClientId, dateStr, status)
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['training-logs'] })
                queryClient.invalidateQueries({ queryKey: ['client-training-logs', selectedClientId] })
                queryClient.invalidateQueries({ queryKey: ['training-logs-report'] })
                toast.success('Đã cập nhật trạng thái tập luyện')
            } else {
                toast.error(res.error || 'Lỗi khi cập nhật')
            }
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    React.useEffect(() => {
        setLocalRecords(records)
    }, [records])

    // Generate timeline days
    const days = React.useMemo(() => {
        try {
            return eachDayOfInterval({
                start: parseISO(startDate),
                end: parseISO(endDate)
            })
        } catch (e) {
            return []
        }
    }, [startDate, endDate])

    // Group days by week and month for header
    const timelineHeader = React.useMemo(() => {
        const months: { month: string; days: Date[] }[] = []
        const weeks: { weekNum: number; days: Date[] }[] = []

        days.forEach(day => {
            const m = format(day, 'MM/yyyy')
            const w = getWeek(day)

            const existingMonth = months.find(item => item.month === m)
            if (existingMonth) existingMonth.days.push(day)
            else months.push({ month: m, days: [day] })

            const existingWeek = weeks.find(item => item.weekNum === w)
            if (existingWeek) existingWeek.days.push(day)
            else weeks.push({ weekNum: w, days: [day] })
        })
        return { months, weeks }
    }, [days])

    // Filter options
    const branchOptions = React.useMemo(() => {
        const branches = new Set(contracts.map(c => c.facility_name).filter(Boolean))
        return Array.from(branches).sort()
    }, [contracts])

    const ptOptions = React.useMemo(() => {
        const pts = new Set(contracts.map(c => c.trainer_name).filter(Boolean))
        return Array.from(pts).sort()
    }, [contracts])

    const packageOptions = React.useMemo(() => {
        const pkgs = new Set(contracts.map(c => c.registration_type).filter(Boolean))
        return Array.from(pkgs).sort()
    }, [contracts])

    // Get active clients based on contracts and apply filters
    const activeClients = React.useMemo(() => {
        return clients
            .filter(c => contracts.some(con => con.client_id === c.id))
            .map(client => {
                // Find the latest contract for this client
                const clientContracts = contracts
                    .filter(con => con.client_id === client.id)
                    .sort((a, b) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime())

                return {
                    ...client,
                    latestContract: clientContracts[0]
                }
            })
            .filter(client => {
                const contract = client.latestContract
                if (!contract) return false

                if (filterBranch !== "all" && contract.facility_name !== filterBranch) return false
                if (filterPT !== "all" && contract.trainer_name !== filterPT) return false
                if (filterPackage !== "all" && contract.registration_type !== filterPackage) return false

                if (searchTerm) {
                    const search = searchTerm.toLowerCase().trim()
                    const nameMatch = client.member_name?.toLowerCase().includes(search)
                    const phoneMatch = client.phone?.includes(search)
                    if (!nameMatch && !phoneMatch) return false
                }

                return true
            })
    }, [clients, contracts, filterBranch, filterPT, filterPackage, searchTerm])

    const handleOpenEdit = (clientId: string, date?: Date | null) => {
        const targetDate = date || selectedDate || new Date()
        const dateStr = format(targetDate, 'yyyy-MM-dd')

        // Find existing record for this client and date
        const existing = records.find(r =>
            r.client_id === clientId &&
            isSameDay(new Date(r.measurement_date), parseISO(dateStr))
        )

        if (existing) {
            setSelectedRecord(existing)
            setIsDetailsOpen(true)
        } else {
            setPrefilledDate(dateStr)
            setSelectedClientId(clientId)
            setSelectedDate(targetDate)
            setIsAddOpen(true)
        }
    }

    const handleClientNameClick = (client: any) => {
        setHistoryClientId(client.id)
        setHistoryClientName(client.member_name)
        setIsHistoryOpen(true)
    }


    const handleCellClick = (clientId: string, date: Date) => {
        if (selectedClientId === clientId && selectedDate && isSameDay(selectedDate, date)) {
            setSelectedClientId(null)
            setSelectedDate(null)
        } else {
            setSelectedClientId(clientId)
            setSelectedDate(date)
        }
    }

    const handleRowClick = (clientId: string) => {
        if (selectedClientId === clientId && !selectedDate) {
            setSelectedClientId(null)
        } else {
            setSelectedClientId(clientId)
            setSelectedDate(null)
        }
    }

    const handleResetFilters = () => {
        setFilterBranch("all")
        setFilterPT("all")
        setFilterPackage("all")
        setSearchTerm("")
        setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-01'))
        setEndDate(format(endOfMonth(addDays(new Date(), 30)), 'yyyy-MM-dd'))
        toast.success('Đã đặt lại bộ lọc')
    }

    return (
        <div className="flex flex-col h-full gap-1 font-inter bg-white dark:bg-slate-950/20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                            placeholder="Tìm khách hàng..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-9 w-48 pl-9 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <Input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="h-7 w-32 border-none bg-transparent shadow-none p-0 text-xs focus-visible:ring-0"
                        />
                        <span className="text-slate-300">|</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="h-7 w-32 border-none bg-transparent shadow-none p-0 text-xs focus-visible:ring-0"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={filterBranch} onValueChange={setFilterBranch}>
                            <SelectTrigger className="h-9 w-48 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs shadow-none">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <SelectValue placeholder="Chi nhánh" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                {branchOptions.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterPT} onValueChange={setFilterPT}>
                            <SelectTrigger className="h-9 w-48 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs shadow-none">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <SelectValue placeholder="PT" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                <SelectItem value="all">Tất cả PT</SelectItem>
                                {ptOptions.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterPackage} onValueChange={setFilterPackage}>
                            <SelectTrigger className="h-9 w-56 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs shadow-none">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <SelectValue placeholder="Gói tập" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                <SelectItem value="all">Tất cả gói tập</SelectItem>
                                {packageOptions.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(filterBranch !== "all" || filterPT !== "all" || filterPackage !== "all" || searchTerm !== "") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Đặt lại bộ lọc"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <AnimatePresence>
                        {selectedClientId && selectedDate && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-1.5 mr-2 pr-4 border-r border-slate-200 dark:border-slate-800"
                            >
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Tần suất:</span>
                                <TooltipProvider>
                                    <div className="flex items-center gap-1.5">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    size="sm" 
                                                    className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs p-0 shadow-sm transition-transform active:scale-95"
                                                    onClick={() => handleUpdateStatus('Y')}
                                                >
                                                    Y
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-emerald-600 text-white border-none text-[11px] font-medium">
                                                Y (Tập): Hiển thị màu xanh
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    size="sm" 
                                                    className="h-8 w-8 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs p-0 shadow-sm transition-transform active:scale-95"
                                                    onClick={() => handleUpdateStatus('N')}
                                                >
                                                    N
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-rose-600 text-white border-none text-[11px] font-medium">
                                                N (Nghỉ): Hiển thị màu đỏ
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    size="sm" 
                                                    className="h-8 w-10 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs p-0 shadow-sm transition-transform active:scale-95"
                                                    onClick={() => handleUpdateStatus('TĐ')}
                                                >
                                                    TĐ
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-amber-600 text-white border-none text-[11px] font-medium">
                                                TĐ (Tự tập): Hiển thị màu cam
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TooltipProvider>
                                <Button 
                                    variant="ghost"
                                    size="sm" 
                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 p-0"
                                    onClick={() => handleUpdateStatus(null)}
                                    title="Xóa trạng thái"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!selectedClientId || !selectedDate}
                        onClick={() => handleOpenEdit(selectedClientId!, selectedDate || undefined)}
                        className="h-8 gap-2 text-xs border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-all"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Chỉnh sửa</span>
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                                <Settings2 className="w-3.5 h-3.5" />
                                <span>Tùy chỉnh cột</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                            <div className="space-y-1">
                                <h4 className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Cột hiển thị</h4>
                                {Object.entries({
                                    pt: "PT",
                                    time: "Thời gian tập",
                                    package: "Loại gói",
                                    branch: "Chi nhánh"
                                }).map(([key, label]) => (
                                    <div
                                        key={key}
                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md cursor-pointer group"
                                        onClick={() => toggleColumn(key as any)}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            visibleColumns[key as keyof typeof visibleColumns]
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "border-slate-300 dark:border-slate-700"
                                        )}>
                                            {visibleColumns[key as keyof typeof visibleColumns] && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Unified Scroll Container */}
            <div className="flex-1 overflow-auto bg-grid-slate-100 dark:bg-grid-slate-900/50 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                <div className="min-w-max relative flex flex-col">
                    {/* Header Row (Sticky Top) */}
                    <div className="sticky top-0 z-40 bg-white dark:bg-slate-950 flex flex-col">
                        {/* Top Toolbar Header Intersection */}
                        <div className="flex">
                            <div className="sticky left-0 z-50 bg-slate-100 dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-800 h-10 flex items-center justify-center shrink-0" style={{ width: getLeftPaneWidth() }}>
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-100 uppercase tracking-widest px-4">Thông tin khách hàng</span>
                            </div>
                            <div className="flex-1">
                                {/* Months */}
                                <div className="flex h-5 border-b border-slate-100 dark:border-slate-800">
                                    {timelineHeader.months.map((m, i) => (
                                        <div
                                            key={i}
                                            className="h-full flex items-center justify-center border-r border-slate-200 dark:border-slate-700 text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50/80 dark:bg-blue-900/40 shrink-0"
                                            style={{ width: `${m.days.length * 50}px` }}
                                        >
                                            Tháng {m.month}
                                        </div>
                                    ))}
                                </div>
                                {/* Weeks */}
                                <div className="flex h-5 border-b border-slate-100 dark:border-slate-800">
                                    {timelineHeader.weeks.map((w, i) => (
                                        <div
                                            key={i}
                                            className="h-full flex items-center justify-center border-r border-slate-200 dark:border-slate-700 text-[9px] font-bold text-slate-500 dark:text-slate-200 uppercase bg-slate-100/80 dark:bg-slate-800/60 shrink-0"
                                            style={{ width: `${w.days.length * 50}px` }}
                                        >
                                            Tuần {w.weekNum}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sub Header (Column Titles) */}
                        <div className="flex">
                            <div
                                className="sticky left-0 z-50 bg-slate-50 dark:bg-slate-800/50 border-b border-r border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase h-12 items-center shrink-0"
                                style={{ display: 'grid', gridTemplateColumns: getGridTemplate(), width: getLeftPaneWidth() }}
                            >
                                <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">STT</div>
                                {visibleColumns.pt && <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">PT</div>}
                                <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center px-2">Khách hàng</div>
                                {visibleColumns.time && <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">Thời gian tập</div>}
                                {visibleColumns.package && <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">Loại gói</div>}
                                {visibleColumns.branch && <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">Chi nhánh</div>}
                                <div className="h-full flex items-center justify-center">Tiêu chí</div>
                            </div>
                            <div className="flex h-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                {days.map((day, i) => {
                                    const isFriday = day.getDay() === 5
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "w-[50px] shrink-0 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-[10px] gap-0.5",
                                                isFriday && "bg-amber-100/60 dark:bg-amber-900/40",
                                                isWeekend && "bg-rose-50/30 dark:bg-rose-900/20",
                                                isToday(day) && "bg-blue-100/50 dark:bg-blue-900/40"
                                            )}
                                        >
                                            <span className={cn("font-bold uppercase", isFriday ? "text-amber-700 dark:text-amber-500" : isWeekend ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500")}>
                                                {format(day, 'EE', { locale: vi }).replace('Th ', 'T')}
                                            </span>
                                            <span className={cn("font-bold", isToday(day) ? "text-blue-600 dark:text-blue-400" : isFriday ? "text-amber-800 dark:text-amber-400" : "text-slate-700 dark:text-slate-200")}>
                                                {format(day, 'dd/MM')}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Data Rows */}
                    <div className="flex flex-col relative">
                        {activeClients.map((client, idx) => {
                            const contract = client.latestContract
                            const isSelected = selectedClientId === client.id
                            const clientRecords = localRecords.filter(r => r.client_id === client.id)
                            const plannedDates = new Set(
                                clientRecords
                                    .map(r => r.next_measurement_date ? r.next_measurement_date.split('T')[0] : null)
                                    .filter(Boolean)
                            )

                            return (
                                <div key={client.id} className="flex group transition-colors duration-200">
                                    {/* Left Content (Sticky Column) */}
                                    <div
                                        className={cn(
                                            "sticky left-0 z-30 border-r border-b border-slate-200 dark:border-slate-800 shrink-0 font-inter transition-colors duration-200",
                                            isSelected ? "bg-blue-600/15 dark:bg-blue-600/25" : "bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50"
                                        )}
                                        style={{ display: 'grid', gridTemplateColumns: getGridTemplate(), width: getLeftPaneWidth(), minHeight: `${visibleCount * 32}px` }}
                                        onClick={() => handleRowClick(client.id)}
                                    >
                                        <div className="border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400 dark:text-slate-300 font-medium">{idx + 1}</div>
                                        {visibleColumns.pt && <div className="border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-500 dark:text-slate-300 text-center px-2">{contract?.trainer_name || '-'}</div>}
                                        <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col items-start justify-center px-4 py-2 gap-1.5 overflow-hidden">
                                            <div 
                                                className="font-bold text-xs text-slate-900 dark:text-blue-400 truncate w-full cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 hover:underline transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClientNameClick(client);
                                                }}
                                            >
                                                {client.member_name}
                                            </div>
                                            <div className="flex flex-col gap-0.5 w-full">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-300 whitespace-nowrap">
                                                    <span className="font-medium">SĐT:</span>
                                                    <span>{contract?.phone || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-300">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">W:</span>
                                                        <span>{contract?.initial_weight ? `${contract.initial_weight}kg` : '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">T:</span>
                                                        <span>{contract?.target_weight ? `${contract.target_weight}kg` : '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {visibleColumns.time && (
                                            <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-[10px] text-slate-500 dark:text-slate-300 gap-0.5">
                                                <span>{contract?.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : '-'}</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                                    {contract?.end_date && (
                                                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-50 text-red-600 dark:bg-red-900/30">
                                                            {differenceInDays(new Date(contract.end_date), new Date()) > 0 
                                                                ? `Còn ${differenceInDays(new Date(contract.end_date), new Date())} ngày` 
                                                                : "Hết hạn"}
                                                        </span>
                                                    )}
                                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                                </div>
                                                <span>{contract?.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy') : '-'}</span>
                                            </div>
                                        )}
                                        {visibleColumns.package && (
                                            <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-[10px] text-slate-500 dark:text-slate-200 text-center px-2 gap-0.5">
                                                <div className="line-clamp-1 font-medium">{contract?.package_name || '-'}</div>
                                                {contract?.total_amount && (
                                                    <div className="font-bold text-blue-600 dark:text-blue-400">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.total_amount)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {visibleColumns.branch && <div className="border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-500 dark:text-slate-300 text-center px-2">{contract?.branches?.name || '-'}</div>}
                                        <div className={cn(
                                            "flex flex-col text-[9px] font-bold uppercase gap-0 p-0 overflow-hidden",
                                            isSelected ? "bg-transparent" : "bg-white dark:bg-slate-900"
                                        )}>
                                            {showTarget && (
                                                <div className="h-8 flex items-center justify-center border-b border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1">Cần đạt</div>
                                            )}
                                            {showActual && (
                                                <div className="h-8 flex items-center justify-center border-b border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1">Thực tế</div>
                                            )}
                                            {showTraining && (
                                                <div className="h-8 flex items-center justify-center border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-1">Tần suất</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Content (Timeline Row Data) */}
                                    <div
                                        className={cn(
                                            "flex flex-col border-b border-slate-200 dark:border-slate-800 transition-colors duration-200",
                                            isSelected ? "bg-blue-600/5 dark:bg-blue-600/10" : "group-hover:bg-slate-50/30"
                                        )}
                                    >
                                        {showTarget && (
                                            <div className="h-8 flex">
                                                {days.map((day, i) => {
                                                    const record = clientRecords.find(r => isSameDay(new Date(r.measurement_date), day))
                                                    const isCellSelected = isSelected && selectedDate && isSameDay(selectedDate, day)
                                                    const isFriday = day.getDay() === 5
                                                    
                                                    // Show record target weight if it exists, otherwise baseline on start date
                                                    const displayTarget = record?.target_weight || (isSameDay(day, parseISO(startDate)) ? client.latestContract?.target_weight : null)
                                                    
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                "w-[50px] shrink-0 border-r border-slate-100 dark:border-slate-800/50 flex items-center justify-center cursor-pointer transition-all duration-200",
                                                                isCellSelected ? "bg-blue-500/20 ring-2 ring-blue-500 ring-inset z-10" : "bg-blue-50/10 dark:bg-blue-400/5 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                                                                isFriday && !isCellSelected && "bg-amber-200/20 dark:bg-amber-900/30"
                                                            )}
                                                            onClick={() => handleCellClick(client.id, day)}
                                                            onDoubleClick={() => handleOpenEdit(client.id, day)}
                                                        >
                                                            {displayTarget && (
                                                                <span className={cn("text-[10px] font-bold", isCellSelected ? "text-blue-700 dark:text-blue-300" : "text-blue-500 dark:text-blue-400")}>
                                                                    {displayTarget}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                        {showActual && (
                                            <div className="h-8 flex">
                                                {days.map((day, i) => {
                                                    const record = clientRecords.find(r => isSameDay(new Date(r.measurement_date), day))
                                                    const isCellSelected = isSelected && selectedDate && isSameDay(selectedDate, day)
                                                    const isFriday = day.getDay() === 5
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                "w-[50px] shrink-0 border-r border-slate-100 dark:border-slate-800/50 flex items-center justify-center cursor-pointer transition-all duration-200",
                                                                isCellSelected ? "bg-emerald-500/20 ring-2 ring-emerald-500 ring-inset z-10" : "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10",
                                                                isFriday && !isCellSelected && "bg-amber-200/20 dark:bg-amber-900/30"
                                                            )}
                                                            onClick={() => handleCellClick(client.id, day)}
                                                            onDoubleClick={() => handleOpenEdit(client.id, day)}
                                                        >
                                                            <span className={cn("text-[11px] font-semibold", isCellSelected ? "text-emerald-700 dark:text-emerald-300" : "text-emerald-600 dark:text-emerald-400")}>
                                                                {record?.weight ? record.weight : (
                                                                    plannedDates.has(format(day, 'yyyy-MM-dd')) ? (() => {
                                                                        const sourceRecord = clientRecords.find(r => 
                                                                            r.next_measurement_date && 
                                                                            isSameDay(parseISO(r.next_measurement_date), day)
                                                                        )
                                                                        if (!sourceRecord) return null
                                                                        return (
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <motion.div
                                                                                            initial={{ scale: 0.5, opacity: 0 }}
                                                                                            animate={{ scale: 1, opacity: 1 }}
                                                                                            className="text-amber-500 cursor-help"
                                                                                        >
                                                                                            <Flag className="w-3.5 h-3.5 fill-amber-500" />
                                                                                        </motion.div>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent side="top" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 rounded-[20px] p-4 shadow-2xl min-w-[240px] z-[100] font-inter border-2">
                                                                                        <div className="space-y-3">
                                                                                            {/* Name Header */}
                                                                                            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                                                                                                <span className="font-medium text-[13px] text-slate-950 dark:text-white">{client.member_name}</span>
                                                                                                <span className="text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-950/30 px-2 py-0.5 rounded-full font-medium tracking-tight uppercase">LỊCH HẸN</span>
                                                                                            </div>

                                                                                            {/* Weight Indices */}
                                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                                <div className="flex flex-col gap-0.5">
                                                                                                    <span className="text-[10px] text-slate-400 font-medium">Lần đo trước đó</span>
                                                                                                    <span className="text-sm font-medium text-slate-950 dark:text-emerald-400 leading-tight">{sourceRecord.weight} kg</span>
                                                                                                </div>
                                                                                                <div className="flex flex-col gap-0.5">
                                                                                                    <span className="text-[10px] text-slate-400 font-medium">Mục tiêu</span>
                                                                                                    <span className="text-sm font-medium text-slate-950 dark:text-blue-400 leading-tight">{sourceRecord.target_weight || '-'} kg</span>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Date */}
                                                                                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                                                                                <span className="text-slate-400 font-medium tracking-tight">Ngày cân gần nhất</span>
                                                                                                <span className="text-slate-950 dark:text-slate-200 font-medium">{format(parseISO(sourceRecord.measurement_date), 'dd/MM/yyyy')}</span>
                                                                                            </div>

                                                                                            {/* Notes */}
                                                                                            {sourceRecord.measurements && (
                                                                                                <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 mt-1">
                                                                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                                                                        <Activity className="w-3 h-3 text-slate-400" />
                                                                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Ghi chú chuyên môn</span>
                                                                                                    </div>
                                                                                                    <p className="text-[11px] font-medium text-slate-950 dark:text-slate-300 leading-relaxed italic">
                                                                                                        "{sourceRecord.measurements}"
                                                                                                    </p>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )
                                                                    })() : '-'
                                                                )}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                        {showTraining && (
                                            <div className="h-8 flex">
                                                {days.map((day, i) => {
                                                    const log = trainingLogs.find(l => l.client_id === client.id && isSameDay(new Date(l.date), day))
                                                    const isCellSelected = isSelected && selectedDate && isSameDay(selectedDate, day)
                                                    const isFriday = day.getDay() === 5
                                                    
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                "w-[50px] shrink-0 border-r border-slate-100 dark:border-slate-800/50 flex items-center justify-center cursor-pointer transition-all duration-200",
                                                                isCellSelected ? "bg-slate-500/20 ring-2 ring-slate-500 ring-inset z-10" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/10",
                                                                isFriday && !isCellSelected && "bg-amber-200/20 dark:bg-amber-900/30"
                                                            )}
                                                            onClick={() => handleCellClick(client.id, day)}
                                                        >
                                                            {log?.status && (
                                                                <span className={cn(
                                                                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                                                                    log.status === 'Y' && "bg-emerald-500 text-white",
                                                                    log.status === 'N' && "bg-rose-500 text-white",
                                                                    log.status === 'TĐ' && "bg-amber-500 text-white",
                                                                )}>
                                                                    {log.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {/* Today Vertical Line */}
                        {days.findIndex(d => isToday(d)) !== -1 && (
                            <div
                                className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none"
                                style={{ left: `calc(${getLeftPaneWidth()} + ${days.findIndex(d => isToday(d)) * 50 + 25}px)` }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Footer Area - Moved Checkboxes & Legend Here */}
            <div className="mt-auto px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-12">
                {/* Visibility Toggles */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5 cursor-pointer">
                        <Checkbox
                            id="chk-target"
                            checked={showTarget}
                            onCheckedChange={(v) => toggleCriteria('target', !!v)}
                            className="w-4 h-4 border-slate-300"
                        />
                        <label htmlFor="chk-target" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">Cân cần đạt</label>
                    </div>
                    <div className="flex items-center gap-2.5 cursor-pointer">
                        <Checkbox
                            id="chk-actual"
                            checked={showActual}
                            onCheckedChange={(v) => toggleCriteria('actual', !!v)}
                            className="w-4 h-4 border-slate-300"
                        />
                        <label htmlFor="chk-actual" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">Cân thực tế</label>
                    </div>
                    <div className="flex items-center gap-2.5 cursor-pointer">
                        <Checkbox
                            id="chk-training"
                            checked={showTraining}
                            onCheckedChange={(v) => toggleCriteria('training', !!v)}
                            className="w-4 h-4 border-slate-300"
                        />
                        <label htmlFor="chk-training" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">Tần suất tập</label>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-8 border-l border-slate-200 dark:border-slate-800 pl-12 h-6">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-400 shadow-sm" />
                        <span>Cân cần đạt</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900 border border-emerald-400 shadow-sm" />
                        <span>Cân thực tế</span>
                    </div>
                </div>
            </div>

            <AddWeightDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                initialClientId={selectedClientId || undefined}
                initialDate={prefilledDate || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['client-weight-history'] })
                    queryClient.invalidateQueries({ queryKey: ['latest-weight'] })
                    onSuccess?.()
                    setIsAddOpen(false)
                }}
                clients={clients}
            />

            <WeightDetailsSheet
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                record={selectedRecord}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['client-weight-history'] })
                    queryClient.invalidateQueries({ queryKey: ['latest-weight'] })
                    onSuccess?.()
                    setIsDetailsOpen(false)
                }}
                clients={clients}
            />

            <WeightHistoryPanel
                clientId={historyClientId}
                clientName={historyClientName}
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
            />

        </div>
    )
}
