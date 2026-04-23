'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClientBirthdays } from '@/app/actions/birthdays'
import { fetchBranches } from '@/app/actions/branches'
import { fetchClientFilterOptions } from '@/app/actions/clients'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
    Cake, 
    Calendar as CalendarIcon, 
    Phone, 
    MessageSquare, 
    Search, 
    Filter,
    Building2,
    RotateCcw,
    ChevronDown,
    User,
    Clock,
    LayoutGrid,
    List,
    Calendar as CalendarIconLucide
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    format, 
    startOfWeek, 
    endOfWeek, 
    addWeeks, 
    subWeeks, 
    startOfMonth, 
    endOfMonth, 
    addMonths, 
    subMonths, 
    startOfQuarter, 
    endOfQuarter 
} from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/use-permissions'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Sub-components
import { ClientBirthdaysTable } from '@/components/calendar/client-birthdays-table'
import { ClientBirthdaysCalendar } from '@/components/calendar/client-birthdays-calendar'

const ONE_HOUR = 3600000

export default function ClientBirthdaysPage() {
    const { isAdmin, isCEO, isManager, isBranchManager } = usePermissions()
    
    const [searchTerm, setSearchTerm] = React.useState('')
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [ptFilter, setPtFilter] = React.useState('all')
    const [quickDateFilter, setQuickDateFilter] = React.useState('this-month')
    const [startDate, setStartDate] = React.useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = React.useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'))
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)
    const [viewMode, setViewMode] = React.useState('grid')

    // Data queries
    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: ONE_HOUR
    })

    const { data: filterOptions } = useQuery({
        queryKey: ['client-filter-options'],
        queryFn: fetchClientFilterOptions,
        staleTime: ONE_HOUR,
    })

    const { data: result, isLoading } = useQuery({
        queryKey: ['client-birthdays', startDate, endDate],
        queryFn: () => fetchClientBirthdays(startDate, endDate)
    })

    const handleQuickDateChange = (value: string) => {
        setQuickDateFilter(value)
        if (value === 'all') {
            setStartDate('')
            setEndDate('')
            return
        }

        const now = new Date()
        let start = new Date()
        let end = new Date()

        switch (value) {
            case 'this-week':
                start = startOfWeek(now, { weekStartsOn: 1 })
                end = endOfWeek(now, { weekStartsOn: 1 })
                break
            case 'last-week':
                const lastWeek = subWeeks(now, 1)
                start = startOfWeek(lastWeek, { weekStartsOn: 1 })
                end = endOfWeek(lastWeek, { weekStartsOn: 1 })
                break
            case 'next-week':
                const nextWeek = addWeeks(now, 1)
                start = startOfWeek(nextWeek, { weekStartsOn: 1 })
                end = endOfWeek(nextWeek, { weekStartsOn: 1 })
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
            case 'next-month':
                const nextMonth = addMonths(now, 1)
                start = startOfMonth(nextMonth)
                end = endOfMonth(nextMonth)
                break
            case 'this-quarter':
                start = startOfQuarter(now)
                end = endOfQuarter(now)
                break
        }

        setStartDate(format(start, 'yyyy-MM-dd'))
        setEndDate(format(end, 'yyyy-MM-dd'))
    }

    const clearFilters = () => {
        setSearchTerm('')
        setBranchFilter('all')
        setPtFilter('all')
        handleQuickDateChange('this-month')
        toast.info('Đã xóa tất cả bộ lọc')
    }

    const pts = React.useMemo(() => {
        const rawPts = filterOptions?.data?.pts || []
        if (branchFilter === 'all') return Array.from(new Set(rawPts.map((p: any) => p.name)))
        return Array.from(new Set(rawPts.filter((p: any) => p.branch_id === branchFilter).map((p: any) => p.name)))
    }, [filterOptions, branchFilter])

    const birthdays = React.useMemo(() => {
        let data = result?.data || []
        if (branchFilter !== 'all') data = data.filter((c: any) => c.branch_id === branchFilter)
        if (ptFilter !== 'all') data = data.filter((c: any) => c.pt_name?.toLowerCase() === ptFilter.toLowerCase())
        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            data = data.filter((c: any) => 
                c.member_name.toLowerCase().includes(q) ||
                c.phone?.includes(searchTerm) ||
                c.id?.toLowerCase().includes(q)
            )
        }
        return data
    }, [result, searchTerm, branchFilter, ptFilter])

    return (
        <div className="space-y-4 pb-12 font-inter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                        <Cake className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold text-black dark:text-white tracking-tight">Sinh nhật khách hàng</h1>
                        <p className="text-sm text-slate-900 dark:text-slate-400 font-normal">Theo dõi và gửi lời chúc đến hội viên của Eva's Fit</p>
                    </div>
                </div>

                {/* View Switcher Tabs UI */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                    {[
                        { id: 'grid', label: 'Lưới', icon: LayoutGrid },
                        { id: 'table', label: 'Bảng', icon: List },
                        { id: 'calendar', label: 'Lịch', icon: CalendarIconLucide }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all",
                                viewMode === mode.id 
                                    ? "bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm" 
                                    : "text-slate-500 hover:text-black dark:hover:text-white"
                            )}
                        >
                            <mode.icon className="w-4 h-4" />
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="border-none shadow-sm rounded-2xl overflow-visible bg-white dark:bg-gray-900 py-0">
                <div className="py-2 px-2 bg-gray-50/10 dark:bg-gray-800/20 rounded-2xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                <Input
                                    placeholder="Tìm tên, SĐT, mã..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-10 rounded-xl border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-sm"
                                />
                            </div>
                            <Button variant="outline" onClick={clearFilters} className="h-10 px-4 rounded-xl text-black dark:text-white border-gray-100 dark:border-gray-800 flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" />
                                <span className="hidden sm:inline text-xs font-medium tracking-wide">Làm mới</span>
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setShowMobileFilters(!showMobileFilters)} className={cn("lg:hidden h-10 w-10 rounded-xl border-gray-200", showMobileFilters ? "bg-red-50" : "bg-white")}>
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>

                        <AnimatePresence>
                            {(showMobileFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                                <motion.div initial={false} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden lg:overflow-visible lg:flex lg:flex-row lg:items-center gap-2">
                                    <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center pt-2 lg:pt-0">
                                        <div className="flex flex-row gap-2">
                                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                                <SelectTrigger className="h-10 rounded-xl border-gray-100 bg-white w-full lg:w-44 text-sm font-medium">
                                                    <SelectValue placeholder="Chi nhánh" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100">
                                                    <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                                    {branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>

                                            {(isAdmin || isCEO || isManager || isBranchManager) && (
                                                <Select value={ptFilter} onValueChange={setPtFilter}>
                                                    <SelectTrigger className="h-10 rounded-xl border-gray-100 bg-white w-full lg:w-44 text-sm font-medium">
                                                        <SelectValue placeholder="PT phụ trách" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-gray-100">
                                                        <SelectItem value="all">Tất cả PT</SelectItem>
                                                        {pts.map((pt: any) => <SelectItem key={pt} value={pt}>{pt}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Select value={quickDateFilter} onValueChange={handleQuickDateChange}>
                                                <SelectTrigger className="h-10 rounded-xl border-gray-100 bg-white lg:w-44 text-sm font-medium">
                                                    <SelectValue placeholder="Thời gian" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100">
                                                    <SelectItem value="all">Tất cả thời gian</SelectItem>
                                                    <SelectItem value="this-week">Tuần này</SelectItem>
                                                    <SelectItem value="last-week">Tuần trước</SelectItem>
                                                    <SelectItem value="next-week">Tuần tới</SelectItem>
                                                    <SelectItem value="this-month">Tháng này</SelectItem>
                                                    <SelectItem value="last-month">Tháng trước</SelectItem>
                                                    <SelectItem value="next-month">Tháng tới</SelectItem>
                                                    <SelectItem value="this-quarter">Quý này</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <div className="flex items-center gap-1.5">
                                                <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setQuickDateFilter('') }} className="h-10 rounded-xl border-gray-100 bg-white text-xs px-2 w-[135px]" />
                                                <span className="text-gray-400 text-xs">-</span>
                                                <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setQuickDateFilter('') }} className="h-10 rounded-xl border-gray-100 bg-white text-xs px-2 w-[135px]" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Card>

            {/* Content Area */}
            <div className="pt-2">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-[210px] rounded-[32px]" />)}
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {birthdays.map((client: any, idx: number) => <BirthdayCard key={client.id} person={client} index={idx} />)}
                                </AnimatePresence>
                            </div>
                        )}
                        {viewMode === 'table' && <ClientBirthdaysTable data={birthdays} />}
                        {viewMode === 'calendar' && <ClientBirthdaysCalendar data={birthdays} />}

                        {birthdays.length === 0 && (
                            <div className="bg-white dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] p-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <Cake className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-medium text-black dark:text-white tracking-tight">Không tìm thấy sinh nhật nào</h3>
                                <p className="text-sm text-slate-900 dark:text-slate-400 max-w-[320px] mx-auto mt-2">Vui lòng điều chỉnh lại bộ lọc hoặc khoảng thời gian tìm kiếm.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function BirthdayCard({ person, index }: { person: any, index: number }) {
    const bday = new Date(person.dob)
    const today = new Date()
    const isToday = bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth()

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group">
            <Card className={cn("border-none shadow-sm dark:shadow-none rounded-[32px] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-900 border-2", isToday ? "border-red-200 dark:border-red-900/30 ring-4 ring-red-50 dark:ring-red-900/10" : "border-transparent")}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-5 relative">
                        <Avatar className="w-16 h-16 rounded-[20px] border-4 border-white dark:border-slate-800 shadow-xl shadow-red-100 dark:shadow-none">
                            <AvatarImage src={person.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold text-2xl">{person.member_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-black dark:text-white leading-tight truncate">{person.member_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-medium text-slate-950 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{person.id}</span>
                                {isToday && <Badge className="bg-red-600 text-[10px] hover:bg-red-600 h-5 px-1.5 font-medium">Hôm nay</Badge>}
                            </div>
                        </div>
                        
                        {/* More prominent birthday date */}
                        <div className="text-right flex flex-col items-end">
                            <p className="text-[10px] font-medium text-slate-950 dark:text-slate-400 mb-0.5">Sinh nhật</p>
                            <p className={cn(
                                "text-2xl font-bold tracking-tighter leading-none",
                                isToday ? "text-red-600" : "text-black dark:text-white"
                            )}>
                                {format(bday, 'dd/MM')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl mb-6">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-950 font-normal tracking-tight">Chi nhánh:</span>
                            <span className="text-black dark:text-white font-medium truncate max-w-[150px] text-right">{person.branches?.name || 'Hệ thống'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-950 font-normal tracking-tight">PT phụ trách:</span>
                            <span className="text-black dark:text-white font-medium truncate max-w-[150px] text-right">{person.pt_name || '-'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" className="flex-1 rounded-xl h-10 text-xs font-semibold border-slate-100 dark:border-slate-800 hover:bg-slate-50 gap-2 shadow-sm text-black dark:text-white">
                            <a href={`tel:${person.phone}`}><Phone className="w-3.5 h-3.5 text-blue-500" /> Gọi điện</a>
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs font-semibold border-slate-100 dark:border-slate-800 hover:bg-slate-50 gap-2 shadow-sm text-black dark:text-white" onClick={() => window.open(`https://zalo.me/${person.phone}`, '_blank')}>
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Zalo
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
