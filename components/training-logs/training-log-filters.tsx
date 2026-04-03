'use client'

import * as React from 'react'
import { Search, RotateCcw, Building2, UserCircle2, Calendar, ChevronDown } from 'lucide-react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface FiltersProps {
    branches: any[]
    pts: string[]
    branchFilter: string
    setBranchFilter: (v: string) => void
    ptFilter: string
    setPtFilter: (v: string) => void
    startDate: string
    setStartDate: (v: string) => void
    endDate: string
    setEndDate: (v: string) => void
    clientSearch: string
    setClientSearch: (v: string) => void
    onClear: () => void
    canViewAllBranches: boolean
}

const QUICK_DATE_OPTIONS = [
    { value: 'all', label: 'Tất cả thời gian' },
    { value: 'this-week', label: 'Tuần này' },
    { value: 'last-week', label: 'Tuần trước' },
    { value: 'this-month', label: 'Tháng này' },
    { value: 'last-month', label: 'Tháng trước' }
]

export function TrainingLogFilters({
    branches,
    pts,
    branchFilter,
    setBranchFilter,
    ptFilter,
    setPtFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    clientSearch,
    setClientSearch,
    onClear,
    canViewAllBranches
}: FiltersProps) {
    const [quickValue, setQuickValue] = React.useState('all')

    const handleQuickChange = (val: string) => {
        setQuickValue(val)
        let start = ''
        let end = ''

        switch (val) {
            case 'this-week':
                start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
                end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
                break
            case 'last-week':
                start = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd')
                end = format(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd')
                break
            case 'this-month':
                start = format(startOfMonth(new Date()), 'yyyy-MM-dd')
                end = format(endOfMonth(new Date()), 'yyyy-MM-dd')
                break
            case 'last-month':
                start = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
                end = format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
                break
            default:
                start = ''
                end = ''
        }
        setStartDate(start)
        setEndDate(end)
    }

    // Sync quickValue if dates change manually
    React.useEffect(() => {
        if (!startDate && !endDate) {
            if (quickValue !== 'all') setQuickValue('all')
            return
        }
        // If it's one of the ranges, we keep it, otherwise it's custom
        // For simplicity, we just check if it's NOT one of our predefined ranges
        // but we only care about syncing when "Clear" or "All" is hit.
    }, [startDate, endDate])

    const handleClear = () => {
        setQuickValue('all')
        onClear()
    }

    return (
        <div className="flex flex-wrap items-center gap-3 mb-1 bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            {/* Client Search */}
            <div className="flex-[2] min-w-[280px]">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                    <Input 
                        placeholder="Tìm kiếm tên khách hàng..." 
                        value={clientSearch} 
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-10 h-10 rounded-xl border-none bg-gray-50/50 dark:bg-gray-800/50 text-[13px] font-medium text-black dark:text-gray-200 focus:ring-red-500" 
                    />
                </div>
            </div>

            {/* Quick Date Select */}
            <div className="flex-1 min-w-[160px]">
                <Select value={quickValue} onValueChange={handleQuickChange}>
                    <SelectTrigger className="h-10 rounded-xl border-none bg-gray-50/50 dark:bg-gray-800/50 text-[13px] font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <SelectValue placeholder="Thời gian" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        {QUICK_DATE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-[13px] font-medium">
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Branch Filter */}
            <div className="flex-1 min-w-[180px]">
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="h-10 rounded-xl border-none bg-gray-50/50 dark:bg-gray-800/50 text-[13px] font-medium text-black dark:text-gray-200">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <SelectValue placeholder="Chọn chi nhánh" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="all" className="text-[13px] font-medium">Tất cả chi nhánh</SelectItem>
                        {branches.map(b => (
                            <SelectItem key={b.id} value={b.id} className="text-[13px] font-medium">{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* PT Filter */}
            <div className="flex-1 min-w-[200px]">
                <Select value={ptFilter} onValueChange={setPtFilter}>
                    <SelectTrigger className="h-10 rounded-xl border-none bg-gray-50/50 dark:bg-gray-800/50 text-[13px] font-medium text-black dark:text-gray-200">
                        <div className="flex items-center gap-2">
                            <UserCircle2 className="w-4 h-4 text-gray-400" />
                            <SelectValue placeholder="Chọn PT" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="all" className="text-[13px] font-medium">Tất cả PT</SelectItem>
                        {pts.map(pt => (
                            <SelectItem key={pt} value={pt} className="text-[13px] font-medium">{pt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 min-w-[320px]">
                <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-9 h-10 rounded-xl border-none bg-gray-50/50 dark:bg-gray-800/50 text-[12px] font-medium"
                    />
                </div>
                <span className="text-gray-300">→</span>
                <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-9 h-10 rounded-xl border-none bg-gray-50/50 dark:bg-gray-800/50 text-[12px] font-medium"
                    />
                </div>
            </div>

            {/* Clear Button */}
            <Button 
                variant="ghost" 
                onClick={handleClear}
                className="h-10 px-4 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium text-[13px] transition-all"
            >
                <RotateCcw className="w-4 h-4 mr-2" />
                Làm mới
            </Button>
        </div>
    )
}
