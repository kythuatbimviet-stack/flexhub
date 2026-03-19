'use client'

import * as React from 'react'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Search,
    Clock,
    BadgeCheck,
    Package,
    Building2,
    CalendarClock,
    FileText,
    ArrowLeft,
    User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fetchContracts } from '@/app/actions/contracts'
import Link from 'next/link'
import { ContractDetailsSheet } from '@/components/contracts/contract-details-sheet'

export default function DueContractsPage() {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [tab, setTab] = React.useState('this-week')
    const [selectedContract, setSelectedContract] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)

    const { data: contracts = [], isLoading, refetch } = useQuery<any[]>({
        queryKey: ['contracts-all'],
        queryFn: async () => {
            const res = await fetchContracts()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: 5 * 60 * 1000,
    })

    const filteredContracts = React.useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const next7Days = new Date(today)
        next7Days.setDate(today.getDate() + 7)

        const next14Days = new Date(today)
        next14Days.setDate(today.getDate() + 14)

        const next30Days = new Date(today)
        next30Days.setDate(today.getDate() + 30)

        return (contracts ?? []).filter((c: any) => {
            if (!c.end_date) return false
            const endDate = new Date(c.end_date)
            endDate.setHours(0, 0, 0, 0)

            // Search filter
            if (searchTerm) {
                const q = searchTerm.toLowerCase()
                if (
                    !c.member_name?.toLowerCase().includes(q) &&
                    !c.id?.toLowerCase().includes(q)
                ) return false
            }

            // Tab filter
            if (tab === 'this-week') {
                return endDate >= today && endDate <= next7Days
            }
            if (tab === 'next-week') {
                return endDate > next7Days && endDate <= next14Days
            }
            if (tab === 'this-month') {
                return endDate >= today && endDate <= next30Days
            }
            return true
        })
    }, [contracts, tab, searchTerm])

    const counts = React.useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const next7 = new Date(today)
        next7.setDate(today.getDate() + 7)
        const next14 = new Date(today)
        next14.setDate(today.getDate() + 14)
        const next30 = new Date(today)
        next30.setDate(today.getDate() + 30)

        const cAll = contracts ?? []
        return {
            thisWeek: cAll.filter((c: any) => {
                const d = new Date(c.end_date); return d >= today && d <= next7
            }).length,
            nextWeek: cAll.filter((c: any) => {
                const d = new Date(c.end_date); return d > next7 && d <= next14
            }).length,
            thisMonth: cAll.filter((c: any) => {
                const d = new Date(c.end_date); return d >= today && d <= next30
            }).length,
        }
    }, [contracts])

    const getRemainingDays = (end_date: string) => {
        if (!end_date) return null
        const end = new Date(end_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diff = end.getTime() - today.getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return (
        <div className="space-y-6 font-inter pb-10">
            <ContractDetailsSheet
                contract={selectedContract} open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen} onSuccess={refetch}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-gray-100">
                            <Link href="/contracts">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <CalendarClock className="w-8 h-8 text-red-600" />
                            Hợp đồng đến hạn
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight ml-12">
                        Theo dõi các hợp đồng sắp hết hạn để kịp thời gia hạn.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-900 p-6">
                <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <TabsList className="bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl h-auto self-start">
                            <TabsTrigger value="this-week" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all flex items-center gap-2">
                                Tuần này
                                <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold", tab === 'this-week' ? "bg-red-50 text-red-600" : "bg-gray-200 text-gray-500")}>
                                    {counts.thisWeek}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="next-week" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all flex items-center gap-2">
                                Tuần tới
                                <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold", tab === 'next-week' ? "bg-red-50 text-red-600" : "bg-gray-200 text-gray-500")}>
                                    {counts.nextWeek}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="this-month" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all flex items-center gap-2">
                                Tháng tới
                                <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold", tab === 'this-month' ? "bg-red-50 text-red-600" : "bg-gray-200 text-gray-500")}>
                                    {counts.thisMonth}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative group max-w-sm w-full lg:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                            <input
                                placeholder="Tìm theo tên hội viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 h-10 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-none">
                                    <TableHead className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-6">Hội viên</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Dịch vụ</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Chi nhánh & PT</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Ngày hết hạn</TableHead>
                                    <TableHead className="text-right pr-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tùy chọn</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredContracts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-gray-200" />
                                                </div>
                                                <p className="text-gray-400 text-sm font-medium">Không có hợp đồng nào đến hạn trong giai đoạn này.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredContracts.map((contract: any) => {
                                        const remainingDays = getRemainingDays(contract.end_date)
                                        return (
                                            <TableRow key={contract.id} className="border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                            {contract.member_name}
                                                            <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">#{contract.id?.slice(-8)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1.5">
                                                            <Package className="w-3 h-3 text-gray-400" />
                                                            {contract.package_name}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">{contract.contract_type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                                                            <Building2 className="w-3 h-3 text-gray-400" />
                                                            {contract.branches?.name}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                                                            <User className="w-3 h-3" />
                                                            {contract.trainer_name || 'N/A'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                                            {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                                                        </span>
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-wider",
                                                            remainingDays !== null && remainingDays <= 3 ? "text-red-500" : "text-blue-500"
                                                        )}>
                                                            Còn {remainingDays} ngày
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button variant="ghost" size="icon"
                                                        onClick={() => { setSelectedContract(contract); setIsDetailsOpen(true) }}
                                                        className="w-9 h-9 rounded-xl hover:bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Tabs>
            </Card>
        </div>
    )
}
