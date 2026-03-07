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
    RotateCcw
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getWeek, isToday, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { AddWeightDialog } from './add-weight-dialog'
import { EditWeightDialog } from './edit-weight-dialog'

interface WeightGanttViewProps {
    records: any[]
    clients: any[]
    contracts: any[]
    onSuccess?: () => void
}

export function WeightGanttView({ records, clients, contracts, onSuccess }: WeightGanttViewProps) {
    const [startDate, setStartDate] = React.useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-01'))
    const [endDate, setEndDate] = React.useState<string>(format(endOfMonth(addDays(new Date(), 30)), 'yyyy-MM-dd'))
    const [localRecords, setLocalRecords] = React.useState<any[]>(records)
    const [showTarget, setShowTarget] = React.useState(true)
    const [showActual, setShowActual] = React.useState(true)
    const [showHeight, setShowHeight] = React.useState(true)
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
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [editingRecord, setEditingRecord] = React.useState<any>(null)
    const [prefilledDate, setPrefilledDate] = React.useState<string | null>(null)

    const visibleCount = [showTarget, showActual, showHeight].filter(Boolean).length

    const toggleColumn = (col: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))
    }

    const getGridTemplate = () => {
        let cols = ['40px', '220px'] // STT, Name
        if (visibleColumns.branch) cols.push('100px')
        if (visibleColumns.pt) cols.push('80px')
        if (visibleColumns.time) cols.push('140px')
        if (visibleColumns.package) cols.push('100px')
        cols.push('80px') // Tiêu chí
        return cols.join(' ')
    }

    const getLeftPaneWidth = () => {
        let width = 40 + 220 + 80 // STT, Name, Criteria
        if (visibleColumns.branch) width += 100
        if (visibleColumns.pt) width += 80
        if (visibleColumns.time) width += 140
        if (visibleColumns.package) width += 100
        return `${width}px`
    }

    const toggleCriteria = (criteria: 'target' | 'actual' | 'height', val: boolean) => {
        if (!val && visibleCount === 1) {
            toast.error('Phải chọn ít nhất 1 tiêu chí hiển thị')
            return
        }
        if (criteria === 'target') setShowTarget(val)
        if (criteria === 'actual') setShowActual(val)
        if (criteria === 'height') setShowHeight(val)
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
            setEditingRecord(existing)
            setIsEditOpen(true)
        } else {
            setPrefilledDate(dateStr)
            setSelectedClientId(clientId)
            setSelectedDate(targetDate)
            setIsAddOpen(true)
        }
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
                                    branch: "Chi nhánh",
                                    pt: "PT",
                                    time: "Thời gian tập",
                                    package: "Loại gói"
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
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest px-4">Thông tin khách hàng</span>
                            </div>
                            <div className="flex-1">
                                {/* Months */}
                                <div className="flex h-5 border-b border-slate-100 dark:border-slate-800">
                                    {timelineHeader.months.map((m, i) => (
                                        <div
                                            key={i}
                                            className="h-full flex items-center justify-center border-r border-slate-200 dark:border-slate-800 text-[9px] font-bold text-blue-600 uppercase bg-blue-50 dark:bg-blue-900/30 shrink-0"
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
                                            className="h-full flex items-center justify-center border-r border-slate-200 dark:border-slate-800 text-[9px] font-bold text-slate-500 uppercase bg-slate-100/50 dark:bg-slate-800/50 shrink-0"
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
                                <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center px-2">Khách hàng</div>
                                {visibleColumns.branch && <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">Chi nhánh</div>}
                                {visibleColumns.pt && <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">PT</div>}
                                {visibleColumns.time && <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">Thời gian tập</div>}
                                {visibleColumns.package && <div className="border-r border-slate-200 dark:border-slate-800 h-full flex items-center justify-center">Loại gói</div>}
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
                                                "w-[50px] shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-[10px] gap-0.5",
                                                isFriday && "bg-amber-100/60 dark:bg-amber-900/40",
                                                isWeekend && "bg-rose-50/30 dark:bg-rose-900/10",
                                                isToday(day) && "bg-blue-100/50 dark:bg-blue-900/30"
                                            )}
                                        >
                                            <span className={cn("font-bold uppercase", isFriday ? "text-amber-700 dark:text-amber-500" : isWeekend ? "text-rose-500" : "text-slate-400")}>
                                                {format(day, 'EE', { locale: vi }).replace('Th ', 'T')}
                                            </span>
                                            <span className={cn("font-bold", isToday(day) ? "text-blue-600" : isFriday ? "text-amber-800 dark:text-amber-400" : "text-slate-700 dark:text-slate-200")}>
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
                                        <div className="border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400 font-medium">{idx + 1}</div>
                                        <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col items-start justify-center px-4 py-2 gap-1.5 overflow-hidden">
                                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate w-full">{client.member_name}</div>
                                            <div className="flex flex-col gap-0.5 w-full">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 whitespace-nowrap">
                                                    <span className="font-medium">SĐT:</span>
                                                    <span>{contract?.phone || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                    <span className="font-medium whitespace-nowrap">ĐC:</span>
                                                    <span className="truncate" title={contract?.member_address}>{contract?.member_address || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">H:</span>
                                                        <span>{contract?.initial_height ? `${contract.initial_height}cm` : '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">W:</span>
                                                        <span>{contract?.initial_weight ? `${contract.initial_weight}kg` : '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {visibleColumns.branch && <div className="border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-500 text-center px-2">{contract?.branches?.name || '-'}</div>}
                                        {visibleColumns.pt && <div className="border-r border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-500 text-center px-2">{contract?.trainer_name || '-'}</div>}
                                        {visibleColumns.time && (
                                            <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-[10px] text-slate-500 gap-0.5">
                                                <span>{contract?.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : '-'}</span>
                                                <span className="text-slate-300">|</span>
                                                <span>{contract?.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy') : '-'}</span>
                                            </div>
                                        )}
                                        {visibleColumns.package && (
                                            <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-[10px] text-slate-500 text-center px-2 gap-0.5">
                                                <div className="line-clamp-1 font-medium">{contract?.package_name || '-'}</div>
                                                {contract?.total_amount && (
                                                    <div className="font-bold text-blue-600 dark:text-blue-400">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.total_amount)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className={cn(
                                            "flex flex-col text-[9px] font-bold uppercase gap-0 p-0 overflow-hidden",
                                            isSelected ? "bg-transparent" : "bg-white dark:bg-slate-900"
                                        )}>
                                            {showTarget && (
                                                <div className="h-8 flex items-center justify-center border-b border-blue-100 bg-blue-50/50 text-blue-600 px-1">Cần đạt</div>
                                            )}
                                            {showActual && (
                                                <div className="h-8 flex items-center justify-center border-b border-emerald-100 bg-emerald-50/50 text-emerald-600 px-1">Thực tế</div>
                                            )}
                                            {showHeight && (
                                                <div className="h-8 flex items-center justify-center border-purple-100 bg-purple-50/50 text-purple-600 px-1">Chiều cao</div>
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
                                                    const isFriday = day.getDay() === 5
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                "w-[50px] shrink-0 border-r border-slate-100 dark:border-slate-800/50 flex items-center justify-center bg-blue-50/10 dark:bg-blue-900/5",
                                                                isFriday && "bg-amber-200/20 dark:bg-amber-900/30"
                                                            )}
                                                        >
                                                            {isSameDay(day, parseISO(startDate)) && client.latestContract?.target_weight && (
                                                                <span className="text-[10px] font-bold text-blue-500">{client.latestContract.target_weight}</span>
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
                                                            <span className={cn("text-[11px] font-semibold", isCellSelected ? "text-emerald-700 dark:text-emerald-300" : "text-emerald-600")}>
                                                                {record?.weight || '-'}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                        {showHeight && (
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
                                                                isCellSelected ? "bg-purple-500/20 ring-2 ring-purple-500 ring-inset z-10" : "hover:bg-purple-50/50 dark:hover:bg-purple-900/10",
                                                                isFriday && !isCellSelected && "bg-amber-200/20 dark:bg-amber-900/30"
                                                            )}
                                                            onClick={() => handleCellClick(client.id, day)}
                                                            onDoubleClick={() => handleOpenEdit(client.id, day)}
                                                        >
                                                            <span className={cn("text-[11px] font-semibold", isCellSelected ? "text-purple-700 dark:text-purple-300" : "text-purple-600")}>
                                                                {record?.height || '-'}
                                                            </span>
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
                            id="chk-height"
                            checked={showHeight}
                            onCheckedChange={(v) => toggleCriteria('height', !!v)}
                            className="w-4 h-4 border-slate-300"
                        />
                        <label htmlFor="chk-height" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">Chiều cao</label>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-8 border-l border-slate-200 dark:border-slate-800 pl-12 h-6">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 whitespace-nowrap">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-400 shadow-sm" />
                        <span>Cân cần đạt</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 whitespace-nowrap">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-400 shadow-sm" />
                        <span>Cân thực tế</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-purple-600 whitespace-nowrap">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-100 border border-purple-400 shadow-sm" />
                        <span>Chiều cao</span>
                    </div>
                </div>
            </div>

            <AddWeightDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                initialClientId={selectedClientId || undefined}
                initialDate={prefilledDate || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined)}
                onSuccess={() => {
                    onSuccess?.()
                    setIsAddOpen(false)
                }}
                clients={clients}
            />

            <EditWeightDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                record={editingRecord}
                onSuccess={() => {
                    onSuccess?.()
                    setIsEditOpen(false)
                }}
                clients={clients}
            />
        </div>
    )
}
