'use client'

import * as React from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    TrendingUpDown,
    DollarSign,
    Banknote,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    Calendar as CalendarIcon,
    ArrowUpDown,
    Eye,
    CreditCard,
    History,
    Users,
    User,
    Filter,
    Search,
    X,
    ChevronDown,
    Loader2,
    Check
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchCashFlowData } from '@/app/actions/financial'
import { fetchBranches } from '@/app/actions/branches'
import { fetchClients } from '@/app/actions/clients'
import {
    addDays,
    subDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subMonths,
    format,
    isWithinInterval,
    parseISO,
} from 'date-fns'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    ScrollArea
} from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { RevenueDetailsSheet } from '@/components/financial/revenue-details-sheet'
import { ExpenseDetailsSheet } from '@/components/financial/expense-details-sheet'

export default function CashFlowPage() {
    const [viewingTransaction, setViewingTransaction] = React.useState<any>(null)
    const [revenueSheetOpen, setRevenueSheetOpen] = React.useState(false)
    const [expenseSheetOpen, setExpenseSheetOpen] = React.useState(false)

    // Filter States
    const [startDate, setStartDate] = React.useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = React.useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [branchId, setBranchId] = React.useState<string>('all')
    const [transactionType, setTransactionType] = React.useState<string>('all')
    const [paymentMethod, setPaymentMethod] = React.useState<string>('all')
    const [customerId, setCustomerId] = React.useState<string>('all')
    const [customerSearchTerm, setCustomerSearchTerm] = React.useState('')
    const [customerOpen, setCustomerOpen] = React.useState(false)
    const [isRefreshing, setIsRefreshing] = React.useState(false)

    const { data: cashFlowResult, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['cash-flow', startDate, endDate, branchId, paymentMethod, customerId],
        queryFn: async () => {
            const result = await fetchCashFlowData({
                startDate,
                endDate,
                branchId,
                paymentMethod,
                customerId
            })
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: clients } = useQuery({
        queryKey: ['clients-all'],
        queryFn: async () => {
            const result = await fetchClients()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const filteredClients = React.useMemo(() => {
        if (!clients) return []
        if (!customerSearchTerm) return clients
        const term = customerSearchTerm.toLowerCase()
        return clients.filter((c: any) => 
            c.member_name?.toLowerCase().includes(term) || 
            c.phone?.includes(term) ||
            c.id?.includes(term)
        )
    }, [clients, customerSearchTerm])

    const handleQuickFilter = (period: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'all') => {
        const now = new Date()
        let start = now
        let end = now

        if (period === 'all') {
            setStartDate('')
            setEndDate('')
            return
        }

        switch (period) {
            case 'thisWeek':
                start = startOfWeek(now, { weekStartsOn: 1 })
                end = endOfWeek(now, { weekStartsOn: 1 })
                break
            case 'lastWeek':
                const lastWeek = subDays(now, 7)
                start = startOfWeek(lastWeek, { weekStartsOn: 1 })
                end = endOfWeek(lastWeek, { weekStartsOn: 1 })
                break
            case 'thisMonth':
                start = startOfMonth(now)
                end = endOfMonth(now)
                break
            case 'lastMonth':
                const lastMonth = subMonths(now, 1)
                start = startOfMonth(lastMonth)
                end = endOfMonth(lastMonth)
                break
        }

        setStartDate(format(start, 'yyyy-MM-dd'))
        setEndDate(format(end, 'yyyy-MM-dd'))
    }

    const chartData = React.useMemo(() => {
        if (!cashFlowResult) return []

        const { revenue, expense } = cashFlowResult
        const months: Record<string, { month: string, revenue: number, expense: number, net: number }> = {}

        const processData = (items: any[], type: 'revenue' | 'expense') => {
            items.forEach(item => {
                const date = new Date(item.recorded_at)
                const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
                if (!months[monthKey]) {
                    months[monthKey] = { month: monthKey, revenue: 0, expense: 0, net: 0 }
                }
                months[monthKey][type] += item.amount
                months[monthKey].net = months[monthKey].revenue - months[monthKey].expense
            })
        }

        processData(revenue, 'revenue')
        processData(expense, 'expense')

        return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
    }, [cashFlowResult])

    const recentTransactions = React.useMemo(() => {
        if (!cashFlowResult) return []
        const revenue = cashFlowResult.revenue.map((r: any) => ({ ...r, type: 'revenue' }))
        const expense = cashFlowResult.expense.map((e: any) => ({ ...e, type: 'expense' }))
        
        let filtered = [...revenue, ...expense]

        if (transactionType === 'revenue') {
            filtered = revenue
        } else if (transactionType === 'expense') {
            filtered = expense
        }

        return filtered
            .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    }, [cashFlowResult, transactionType])

    const branchData = React.useMemo(() => {
        if (!cashFlowResult || !branches) return []

        const { revenue, expense } = cashFlowResult
        const branchStats: Record<string, { name: string, revenue: number, expense: number, net: number }> = {}

        branches.forEach((b: any) => {
            branchStats[b.id] = { name: b.name, revenue: 0, expense: 0, net: 0 }
        })

        revenue.forEach((item: any) => {
            if (branchStats[item.branch_id]) {
                branchStats[item.branch_id].revenue += item.amount
            }
        })

        expense.forEach((item: any) => {
            if (branchStats[item.branch_id]) {
                branchStats[item.branch_id].expense += item.amount
            }
        })

        return Object.values(branchStats).map(b => ({ ...b, net: b.revenue - b.expense }))
    }, [cashFlowResult, branches])

    const totals = React.useMemo(() => {
        if (!cashFlowResult) return { revenue: 0, expense: 0, net: 0 }
        
        const filteredRevenue = transactionType === 'expense' ? [] : cashFlowResult.revenue
        const filteredExpense = transactionType === 'revenue' ? [] : cashFlowResult.expense

        const revenue = filteredRevenue.reduce((sum: number, r: any) => sum + r.amount, 0)
        const expense = filteredExpense.reduce((sum: number, e: any) => sum + e.amount, 0)
        return { revenue, expense, net: revenue - expense }
    }, [cashFlowResult, transactionType])

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN').format(val)
    }

    const handleTransactionClick = (transaction: any) => {
        setViewingTransaction(transaction)
        if (transaction.type === 'revenue') {
            setRevenueSheetOpen(true)
        } else {
            setExpenseSheetOpen(true)
        }
    }

    return (
        <div className="p-4 sm:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen font-inter">
            {/* Header & Main Filters */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dòng tiền</h1>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Theo dõi và quản lý các giao dịch tài chính hệ thống</p>
                    </div>
                </div>

                {/* Combined Filter Bar - Apple Style */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Time Range Selector */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { label: 'Tất cả', id: 'all' },
                                { label: 'Tuần này', id: 'thisWeek' },
                                { label: 'Tuần trước', id: 'lastWeek' },
                                { label: 'Tháng này', id: 'thisMonth' },
                                { label: 'Tháng trước', id: 'lastMonth' }
                            ].map((p) => (
                                <Button
                                    key={p.id}
                                    variant="ghost"
                                    onClick={() => handleQuickFilter(p.id as any)}
                                    className={cn(
                                        "h-9 rounded-xl px-4 text-[13px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95",
                                        ((p.id === 'all' && !startDate) || (p.id !== 'all' && startDate === format(startOfMonth(new Date()), 'yyyy-MM-dd') && p.id === 'thisMonth')) && "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                                    )}
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 lg:ml-auto">
                           <div className="flex flex-col gap-1">
                               <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Từ ngày</label>
                               <Input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-9 w-[150px] rounded-xl border-slate-200 dark:border-slate-800 text-[13px] font-semibold focus:ring-slate-900" 
                                />
                           </div>
                           <div className="flex flex-col gap-1">
                               <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Đến ngày</label>
                               <Input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-9 w-[150px] rounded-xl border-slate-200 dark:border-slate-800 text-[13px] font-semibold focus:ring-slate-900" 
                                />
                           </div>
                        </div>
                    </div>

                    {/* Secondary Filters */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {/* Branch Filter */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-900 dark:text-slate-300 ml-1">Chi nhánh</label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] font-semibold">
                                    <SelectValue placeholder="Chọn chi nhánh" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                    {branches?.map((b: any) => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Transaction Type Filter */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-900 dark:text-slate-300 ml-1">Khoản Thu/Chi</label>
                            <Select value={transactionType} onValueChange={setTransactionType}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] font-semibold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">Tất cả khoản</SelectItem>
                                    <SelectItem value="revenue">Khoản thu (In)</SelectItem>
                                    <SelectItem value="expense">Khoản chi (Out)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                         {/* Payment Method Filter */}
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-900 dark:text-slate-300 ml-1">Hình thức</label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] font-semibold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">Tất cả hình thức</SelectItem>
                                    <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
                                    <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
                                    <SelectItem value="Thẻ">Thẻ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Customer Filter */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-900 dark:text-slate-300 ml-1">Khách hàng</label>
                            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={customerOpen}
                                        className="h-10 w-full rounded-xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] font-semibold justify-between px-3"
                                    >
                                        <span className="truncate">
                                            {customerId === 'all' ? 'Tất cả khách hàng' : 
                                             clients?.find((c: any) => c.id === customerId)?.member_name || 'Chọn khách hàng'}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl" align="start">
                                    <div className="p-3 border-b border-slate-50 dark:border-slate-800">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <Input
                                                placeholder="Tìm theo tên, SĐT..."
                                                value={customerSearchTerm}
                                                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                                className="h-9 pl-9 rounded-xl border-none bg-slate-50 dark:bg-slate-900 text-[13px] font-medium focus-visible:ring-0"
                                            />
                                        </div>
                                    </div>
                                    <ScrollArea className="h-72">
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    setCustomerId('all')
                                                    setCustomerOpen(false)
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-colors",
                                                    customerId === 'all' ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                )}
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center">
                                                    {customerId === 'all' && <Check className="w-3 h-3" />}
                                                </div>
                                                Tất cả khách hàng
                                            </button>
                                            {filteredClients?.slice(0, 50).map((c: any) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        setCustomerId(c.id)
                                                        setCustomerOpen(false)
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-colors mt-0.5",
                                                        customerId === c.id ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                    )}
                                                >
                                                    <div className="w-4 h-4 flex items-center justify-center">
                                                        {customerId === c.id && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <div className="flex flex-col items-start text-left truncate">
                                                        <span className="truncate">{c.member_name}</span>
                                                        <span className="text-[10px] opacity-70">{c.phone || 'Không có SĐT'}</span>
                                                    </div>
                                                </button>
                                            ))}
                                            {filteredClients?.length === 0 && (
                                                <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-xl m-2">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Không tìm thấy</p>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Refresh Button */}
                        <div className="flex items-end">
                            <Button
                                onClick={() => refetch()}
                                className="h-10 w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-semibold text-[13px] hover:opacity-90 active:scale-95 transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Filter className="w-4 h-4 mr-2" />}
                                Lọc dữ liệu
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative group p-5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                        <ArrowUpRight className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-300">Tổng doanh thu</p>
                        <div className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(totals.revenue)}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-600">
                            <ArrowUpRight className="w-3 h-3" />
                            Dòng tiền vào
                        </div>
                    </div>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative group p-5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                        <ArrowDownRight className="w-12 h-12 text-rose-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-300">Tổng chi phí</p>
                        <div className="text-2xl font-bold text-rose-600">
                            {formatCurrency(totals.expense)}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 w-fit px-2 py-0.5 rounded text-[10px] font-semibold text-rose-600">
                            <ArrowDownRight className="w-3 h-3" />
                            Dòng tiền ra
                        </div>
                    </div>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm bg-gray-950 overflow-hidden relative group p-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent opacity-50" />
                    <div className="space-y-1 relative z-10">
                        <p className="text-[11px] font-semibold text-slate-400">Lợi nhuận gộp</p>
                        <div className={cn("text-2xl font-bold tracking-tight", totals.net >= 0 ? "text-indigo-400" : "text-rose-400")}>
                            {formatCurrency(totals.net)}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-medium">Toàn bộ hệ thống</p>
                    </div>
                </Card>
            </div>

            {/* Main Content Area - Grid with Charts and Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Chart 1: Revenue vs Expense */}
                <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                    <CardHeader className="p-5 sm:p-7 border-b border-slate-50 dark:border-slate-800">
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <TrendingUpDown className="w-5 h-5 text-indigo-600" />
                            Biến động tài chính
                        </CardTitle>
                        <CardDescription className="text-[12px] font-medium text-slate-500 tracking-tight">So sánh thu chi qua từng tháng</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={(val) => `${val / 1000000}M`} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                                <Bar dataKey="revenue" name="Thu" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="expense" name="Chi" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Performance by Branch */}
                <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
                    <CardHeader className="p-5 sm:p-7 border-b border-slate-50 dark:border-slate-800">
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            Hiệu quả chi nhánh
                        </CardTitle>
                        <CardDescription className="text-[12px] font-medium text-slate-500 tracking-tight">Lợi nhuận ròng từng địa điểm</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-5 flex-1 overflow-y-auto max-h-[350px]">
                        <div className="space-y-3">
                            {branchData.sort((a, b) => b.net - a.net).map((branch, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-bold text-xs text-indigo-600">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{branch.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-medium text-emerald-600">Thu: {formatCurrency(branch.revenue)}</span>
                                                <span className="text-[10px] font-medium text-rose-600">Chi: {formatCurrency(branch.expense)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-sm font-bold tracking-tight", branch.net >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                            {branch.net >= 0 ? "+" : ""}{formatCurrency(branch.net)}
                                        </p>
                                        <div className="w-20 h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden ml-auto">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000", branch.net >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                                                style={{ width: `${Math.min(100, Math.abs(branch.net) / (Math.max(totals.revenue, 1)) * 200)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History Table */}
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                <CardHeader className="p-5 sm:p-7 border-b border-slate-50 dark:border-slate-800">
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-600" />
                        Giao dịch gần đây
                    </CardTitle>
                    <CardDescription className="text-[12px] font-medium text-slate-500 tracking-tight">Lịch sử thu chi mới nhất</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800 h-10 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                <TableHead className="w-32 pl-7">Ngày</TableHead>
                                <TableHead>Loại / ID</TableHead>
                                <TableHead>Diễn giải</TableHead>
                                <TableHead>Số tiền</TableHead>
                                <TableHead>Hình thức</TableHead>
                                <TableHead className="text-right pr-7">Chi nhánh</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTransactions.map((item: any) => (
                                <TableRow
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => handleTransactionClick(item)}
                                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-slate-100 dark:border-slate-800 transition-colors cursor-pointer"
                                >
                                    <TableCell className="py-3 pl-7 font-inter">
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-semibold text-slate-900 dark:text-white">
                                                {new Date(item.recorded_at).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium mt-0.5">Vừa ghi nhận</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "w-fit px-1.5 py-0.5 rounded text-[9px] font-bold mb-1",
                                                item.type === 'revenue' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" : "bg-rose-50 text-rose-600 dark:bg-rose-900/30"
                                            )}>
                                                {item.type === 'revenue' ? 'Khoản thu' : 'Khoản chi'}
                                            </span>
                                            <span className="text-[11px] font-semibold text-slate-400">#{item.id?.split('-')[0] || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[200px]">
                                            {item.description || 'Không có diễn giải'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className={cn(
                                            "text-[14px] font-bold tracking-tight",
                                            item.type === 'revenue' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                        )}>
                                            {item.type === 'revenue' ? '+' : '-'}{formatCurrency(item.amount)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{item.payment_method || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-right pr-7">
                                        <span className="text-[11px] font-semibold text-slate-900 dark:text-white">{item.branches?.name || 'Vãng lai'}</span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {recentTransactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <History className="w-8 h-8 text-gray-100" />
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Không có giao dịch</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {isError && (
                    <div className="p-10 text-center bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900/30 my-4">
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">Lỗi: {error instanceof Error ? error.message : 'Không thể tải dữ liệu'}</p>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold">
                            Thử lại
                        </Button>
                    </div>
                )}
            </Card>

            {/* Side Panels */}
            <AnimatePresence>
                {revenueSheetOpen && viewingTransaction && (
                    <RevenueDetailsSheet
                        revenue={viewingTransaction}
                        open={revenueSheetOpen}
                        onOpenChange={setRevenueSheetOpen}
                        onSuccess={refetch}
                    />
                )}
                {expenseSheetOpen && viewingTransaction && (
                    <ExpenseDetailsSheet
                        expense={viewingTransaction}
                        open={expenseSheetOpen}
                        onOpenChange={setExpenseSheetOpen}
                        onSuccess={refetch}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
