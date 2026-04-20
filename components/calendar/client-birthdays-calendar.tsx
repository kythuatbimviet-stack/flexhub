'use client'

import * as React from 'react'
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameDay, 
    isToday, 
    addMonths, 
    subMonths, 
    startOfQuarter, 
    endOfQuarter, 
    isSameMonth,
    addDays
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Cake, Phone, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ClientBirthdaysCalendarProps {
    data: any[]
}

type ViewMode = 'week' | 'month' | 'quarter'

export function ClientBirthdaysCalendar({ data }: ClientBirthdaysCalendarProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date())
    const [mode, setMode] = React.useState<ViewMode>('month')

    const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

    // Helpers to get birthdays for a specific day (ignoring year)
    const getBirthdaysForDay = (day: Date) => {
        return data.filter(person => {
            const dob = new Date(person.dob)
            return dob.getDate() === day.getDate() && dob.getMonth() === day.getMonth()
        })
    }

    const getDayColor = (dayIdx: number) => {
        const colors = [
            'bg-slate-50/50 dark:bg-slate-900/10',    // T2
            'bg-blue-50/30 dark:bg-blue-950/10',      // T3
            'bg-emerald-50/30 dark:bg-emerald-950/10', // T4
            'bg-violet-50/30 dark:bg-violet-950/10',   // T5
            'bg-amber-50/30 dark:bg-amber-950/10',    // T6
            'bg-rose-50/30 dark:bg-rose-950/10',       // T7
            'bg-red-50/40 dark:bg-red-950/20',        // CN
        ]
        return colors[dayIdx] || ''
    }

    const renderMonthGrid = (date: Date) => {
        const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
        const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
        const days = eachDayOfInterval({ start, end })

        return (
            <div className="flex flex-col h-full animate-in fade-in duration-500">
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
                    {daysOfWeek.map((day, idx) => (
                        <div 
                            key={day} 
                            className={cn(
                                "py-3 text-center text-[11px] font-bold text-black dark:text-white tracking-wider border-r border-gray-100 dark:border-gray-800 last:border-r-0",
                                getDayColor(idx)
                            )}
                        >
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-1">
                    {days.map((day, idx) => {
                        const dayBirthdays = getBirthdaysForDay(day)
                        const isCurrentMonth = isSameMonth(day, date)
                        return (
                            <div 
                                key={day.toISOString()} 
                                className={cn(
                                    "min-h-[100px] border-r border-b border-gray-50 dark:border-gray-800 p-2 transition-colors",
                                    !isCurrentMonth ? "bg-slate-50/20 dark:bg-slate-900/5 opacity-50" : getDayColor((day.getDay() + 6) % 7),
                                    isToday(day) && "bg-red-100/50 dark:bg-red-900/30 ring-1 ring-inset ring-red-200 dark:ring-red-800/50"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                                        isToday(day) ? "bg-red-600 text-white" : "text-black dark:text-white"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayBirthdays.length > 0 && <Cake className="w-3 h-3 text-red-500" />}
                                </div>
                                <div className="space-y-1">
                                    {dayBirthdays.slice(0, 3).map((person) => (
                                        <TooltipProvider key={person.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-lg border border-red-100 dark:border-red-900/30 cursor-pointer hover:bg-red-100 transition-all overflow-hidden group">
                                                        <Avatar className="w-4 h-4 rounded-md">
                                                            <AvatarImage src={person.avatar_url} />
                                                            <AvatarFallback className="text-[8px] bg-red-600 text-white">{person.member_name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 truncate">
                                                            {person.member_name.split(' ').pop()}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent 
                                                    className="p-0 border-none shadow-2xl rounded-[24px] bg-white dark:bg-slate-900 overflow-hidden w-72 animate-in zoom-in-95 duration-200"
                                                    side="top"
                                                    sideOffset={8}
                                                >
                                                    <div className="relative">
                                                        {/* Header Decor */}
                                                        <div className="absolute top-0 left-0 right-0 h-2 bg-red-600" />
                                                        
                                                        <div className="p-5">
                                                            <div className="flex items-center gap-4 mb-5">
                                                                <Avatar className="w-14 h-14 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg shadow-red-100 dark:shadow-none">
                                                                    <AvatarImage src={person.avatar_url} className="object-cover" />
                                                                    <AvatarFallback className="bg-red-600 text-white font-bold text-xl">
                                                                        {person.member_name.charAt(0)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-base font-bold text-black dark:text-white leading-tight mb-1 truncate">
                                                                        {person.member_name}
                                                                    </p>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                            {person.id}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-5">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-slate-500 font-medium">Số điện thoại:</span>
                                                                    <span className="text-black dark:text-white font-semibold">{person.phone}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-slate-500 font-medium">Ngày sinh:</span>
                                                                    <span className="text-red-600 dark:text-red-400 font-bold">
                                                                        {new Date(person.dob).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-slate-500 font-medium">Chi nhánh:</span>
                                                                    <span className="text-black dark:text-white font-semibold truncate max-w-[120px]">
                                                                        {person.branches?.name || 'Hệ thống'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2.5">
                                                                <Button 
                                                                    className="flex-1 h-11 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 dark:shadow-none" 
                                                                    onClick={() => window.open(`tel:${person.phone}`)}
                                                                >
                                                                    <Phone className="w-4 h-4 mr-2" /> Gọi điện
                                                                </Button>
                                                                <Button 
                                                                    variant="outline"
                                                                    className="flex-1 h-11 rounded-xl text-xs font-bold border-emerald-100 dark:border-emerald-900/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" 
                                                                    onClick={() => window.open(`https://zalo.me/${person.phone}`, '_blank')}
                                                                >
                                                                    <MessageSquare className="w-4 h-4 mr-2" /> Zalo
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                    {dayBirthdays.length > 3 && (
                                        <p className="text-[9px] text-slate-400 pl-1 font-medium italic">+{dayBirthdays.length - 3} người khác</p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderWeekGrid = () => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        const days = eachDayOfInterval({ start, end: addDays(start, 6) })

        return (
            <div className="grid grid-cols-1 md:grid-cols-7 h-full border-t border-gray-100">
                {days.map((day) => {
                    const dayBirthdays = getBirthdaysForDay(day)
                    return (
                        <div key={day.toISOString()} className={cn(
                            "min-h-[300px] border-r border-b border-gray-50 p-4 transition-all",
                            isToday(day) ? "bg-red-50/20 shadow-inner" : "bg-white"
                        )}>
                            <div className="text-center mb-6">
                                <p className="text-[10px] font-medium text-slate-950 dark:text-slate-400 tracking-widest mb-1">
                                    {format(day, 'EEEE', { locale: vi })}
                                </p>
                                <p className={cn(
                                    "text-2xl font-semibold w-10 h-10 flex items-center justify-center mx-auto rounded-xl",
                                    isToday(day) ? "bg-red-600 text-white" : "text-black dark:text-white"
                                )}>
                                    {format(day, 'd')}
                                </p>
                            </div>
                            <div className="space-y-3">
                                {dayBirthdays.map((person) => (
                                    <div key={person.id} className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <Avatar className="w-8 h-8 rounded-lg shadow-sm">
                                            <AvatarImage src={person.avatar_url} />
                                            <AvatarFallback>{person.member_name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-semibold text-black dark:text-white truncate leading-none mb-1">{person.member_name}</p>
                                            <p className="text-[9px] text-slate-950 dark:text-slate-400 font-medium">{person.pt_name || 'Hệ thống'}</p>
                                        </div>
                                    </div>
                                ))}
                                {dayBirthdays.length === 0 && (
                                    <div className="h-20 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl">
                                        <Clock className="w-4 h-4 text-slate-200" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderQuarterGrid = () => {
        const start = startOfQuarter(currentDate)
        const qMonths = [start, addMonths(start, 1), addMonths(start, 2)]

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-full overflow-y-auto">
                {qMonths.map((mDate) => (
                    <div key={mDate.toISOString()} className="flex flex-col">
                        <p className="text-sm font-semibold text-black dark:text-white tracking-tight mb-4 flex items-center gap-2">
                            Tháng {format(mDate, 'M')}
                            <span className="text-[10px] font-medium text-slate-950 dark:text-slate-400">({format(mDate, 'yyyy')})</span>
                        </p>
                        <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 flex-1">
                             <div className="grid grid-cols-7 gap-1 mb-2">
                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                                    <div key={d} className="text-[8px] font-bold text-slate-400 text-center">{d}</div>
                                ))}
                             </div>
                             <div className="grid grid-cols-7 gap-1">
                                {eachDayOfInterval({ 
                                    start: startOfWeek(startOfMonth(mDate), { weekStartsOn: 1 }), 
                                    end: endOfWeek(endOfMonth(mDate), { weekStartsOn: 1 }) 
                                }).map((day) => {
                                    const dayBirthdays = getBirthdaysForDay(day)
                                    const isTargetMonth = isSameMonth(day, mDate)
                                    return (
                                        <div key={day.toISOString()} className={cn(
                                            "aspect-square rounded flex flex-col items-center justify-center relative",
                                            !isTargetMonth ? "opacity-0" : "opacity-100",
                                            dayBirthdays.length > 0 ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" : "text-slate-400"
                                        )}>
                                            <span className="text-[9px] font-medium">{format(day, 'd')}</span>
                                            {dayBirthdays.length > 0 && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-600 rounded-full border border-white" />}
                                        </div>
                                    )
                                })}
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
         <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col min-h-[700px]">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {(['week', 'month', 'quarter'] as ViewMode[]).map((v) => (
                            <button
                                key={v}
                                onClick={() => setMode(v)}
                                className={cn(
                                    "px-4 py-1.5 text-[11px] font-semibold rounded-lg transition-all tracking-tight",
                                    mode === v ? "bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm" : "text-slate-950 dark:text-slate-400 hover:text-black dark:hover:text-white"
                                )}
                            >
                                {v === 'week' ? 'Tuần' : v === 'month' ? 'Tháng' : 'Quý'}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => {
                            if(mode === 'month') setCurrentDate(subMonths(currentDate, 1))
                            else if(mode === 'week') setCurrentDate(subDays(currentDate, 7))
                            else setCurrentDate(subMonths(currentDate, 3))
                        }}>
                             <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <p className="text-sm font-semibold text-black dark:text-white min-w-[140px] text-center tracking-tight">
                            {mode === 'month' ? format(currentDate, 'MMMM yyyy', { locale: vi }) : 
                             mode === 'week' ? `Tuần ${format(currentDate, 'w')} - ${format(currentDate, 'yyyy')}` :
                             `Quý ${Math.floor(currentDate.getMonth() / 3) + 1} - ${format(currentDate, 'yyyy')}`}
                        </p>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => {
                            if(mode === 'month') setCurrentDate(addMonths(currentDate, 1))
                            else if(mode === 'week') setCurrentDate(addDays(currentDate, 7))
                            else setCurrentDate(addMonths(currentDate, 3))
                        }}>
                             <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                {mode === 'month' && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-600"></div>
                             <span className="text-[10px] font-medium text-slate-950 dark:text-slate-400 tracking-tight">Hôm nay</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div>
                             <span className="text-[10px] font-medium text-slate-950 dark:text-slate-400 tracking-tight">Có sinh nhật</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Calendar Content */}
            <div className="flex-1 overflow-visible">
                {mode === 'month' && renderMonthGrid(currentDate)}
                {mode === 'week' && renderWeekGrid()}
                {mode === 'quarter' && renderQuarterGrid()}
            </div>
         </Card>
    )
}

function subDays(date: Date, days: number) {
    const res = new Date(date)
    res.setDate(res.getDate() - days)
    return res
}

function Clock({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
