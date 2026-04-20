'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchStaffBirthdays } from '@/app/actions/birthdays'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
    Cake, 
    Calendar, 
    Phone, 
    Mail,
    Search, 
    ChevronRight,
    Building2,
    Clock,
    UserCircle,
    ShieldCheck,
    Briefcase
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function StaffBirthdaysPage() {
    const [period, setPeriod] = React.useState<'week' | 'month'>('month')
    const [searchTerm, setSearchTerm] = React.useState('')

    const { data: result, isLoading } = useQuery({
        queryKey: ['staff-birthdays', period],
        queryFn: () => fetchStaffBirthdays(period)
    })

    const birthdays = React.useMemo(() => {
        const data = result?.data || []
        if (!searchTerm) return data
        return data.filter((s: any) => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.phone?.includes(searchTerm)
        )
    }, [result, searchTerm])

    return (
        <div className="space-y-8 pb-12 font-inter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                        <Cake className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Sinh nhật nhân sự</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Ghi nhận và tri ân đóng góp của đội ngũ Eva's Fit</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm tên, SĐT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all w-[240px] shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <Tabs value={period} onValueChange={(val: any) => setPeriod(val)} className="space-y-6">
                <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-2xl h-12 border border-slate-200/50 dark:border-slate-800/50">
                    <TabsTrigger 
                        value="month" 
                        className="rounded-xl px-6 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
                    >
                        <Calendar className="w-3.5 h-3.5 mr-2" />
                        Trong tháng này
                    </TabsTrigger>
                    <TabsTrigger 
                        value="week" 
                        className="rounded-xl px-6 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
                    >
                        <Clock className="w-3.5 h-3.5 mr-2" />
                        7 ngày tới
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={period} className="mt-0">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <Skeleton key={i} className="h-[220px] rounded-3xl" />
                            ))}
                        </div>
                    ) : birthdays.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {birthdays.map((staff: any, idx: number) => (
                                    <StaffBirthdayCard key={staff.id} person={staff} index={idx} />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Cake className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Không có sinh nhật nào</h3>
                            <p className="text-sm text-slate-500 max-w-[280px] mx-auto mt-2">Đội ngũ nhân sự không có sinh nhật nào trong khoảng thời gian này.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function StaffBirthdayCard({ person, index }: { person: any, index: number }) {
    const bday = new Date(person.dob)
    const today = new Date()
    const isToday = bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth()

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group"
        >
            <Card className={cn(
                "border-none shadow-sm dark:shadow-none rounded-[28px] overflow-hidden transition-all duration-300 bg-white dark:bg-slate-900 border-2",
                isToday ? "border-blue-100 dark:border-blue-900/30 ring-4 ring-blue-50 dark:ring-blue-900/10" : "border-slate-100 dark:border-slate-800"
            )}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                        <Avatar className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl shadow-blue-100 dark:shadow-blue-900/20">
                            <AvatarImage src={person.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-blue-600 text-white font-bold text-2xl">
                                {person.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 truncate uppercase tracking-tight">
                                {person.name}
                            </h3>
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mt-0.5">
                                {person.position || 'Nhân sự'}
                            </p>
                            {isToday && (
                                <div className="mt-1">
                                    <Badge className="bg-blue-600 text-[9px] h-4 py-0 font-bold">HAPPY BIRTHDAY!</Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ngày sinh</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {bday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Tuổi</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{person.age || '-'}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5 mb-6">
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                <Building2 className="w-3.5 h-3.5" />
                            </div>
                            {person.branches?.name || 'Chi nhánh -'}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                <Briefcase className="w-3.5 h-3.5" />
                            </div>
                            {person.department || 'Phòng ban -'}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <Button 
                            asChild
                            variant="ghost" 
                            size="sm"
                            className="flex-1 rounded-xl h-9 text-xs font-bold text-blue-600 hover:bg-blue-50"
                        >
                            <a href={`tel:${person.phone}`}>
                                <Phone className="w-3.5 h-3.5 mr-2" />
                                Gọi
                            </a>
                        </Button>
                        <Button 
                            asChild
                            variant="ghost" 
                            size="sm"
                            className="flex-1 rounded-xl h-9 text-xs font-bold text-slate-500 hover:bg-slate-50"
                        >
                            <a href={`mailto:${person.email}`}>
                                <Mail className="w-3.5 h-3.5 mr-2" />
                                Email
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
