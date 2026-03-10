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
    Calendar,
    ArrowUpDown,
    Eye,
    CreditCard,
    History
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchCashFlowData } from '@/app/actions/financial'
import { fetchBranches } from '@/app/actions/branches'
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

    const { data: cashFlowResult, refetch } = useQuery({
        queryKey: ['cash-flow'],
        queryFn: async () => {
            const result = await fetchCashFlowData()
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
        return [...revenue, ...expense]
            .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
            .slice(0, 10)
    }, [cashFlowResult])

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
        const revenue = cashFlowResult.revenue.reduce((sum: number, r: any) => sum + r.amount, 0)
        const expense = cashFlowResult.expense.reduce((sum: number, e: any) => sum + e.amount, 0)
        return { revenue, expense, net: revenue - expense }
    }, [cashFlowResult])

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
        <div className="space-y-1.5 font-inter pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <TrendingUpDown className="w-8 h-8 text-indigo-600" />
                        Dòng tiền
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Phân tích tình hình tài chính hệ thống.</p>
                </div>
            </div>

            {/* Total Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-1">
                <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative group p-5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                        <ArrowUpRight className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng doanh thu</p>
                        <div className="text-2xl font-black text-emerald-600">
                            {formatCurrency(totals.revenue)}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2 py-0.5 rounded text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng chi phí</p>
                        <div className="text-2xl font-black text-rose-600">
                            {formatCurrency(totals.expense)}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 w-fit px-2 py-0.5 rounded text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                            <ArrowDownRight className="w-3 h-3" />
                            Dòng tiền ra
                        </div>
                    </div>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm bg-gray-950 overflow-hidden relative group p-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent opacity-50" />
                    <div className="space-y-1 relative z-10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lợi nhuận gộp</p>
                        <div className={cn("text-2xl font-black tracking-tight", totals.net >= 0 ? "text-indigo-400" : "text-rose-400")}>
                            {formatCurrency(totals.net)}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Toàn bộ hệ thống</p>
                    </div>
                </Card>
            </div>

            {/* Main Content Area - Grid with Charts and Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Chart 1: Revenue vs Expense */}
                <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                    <CardHeader className="p-5 sm:p-7 border-b border-gray-50 dark:border-gray-800">
                        <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <TrendingUpDown className="w-5 h-5 text-indigo-600" />
                            Biến động tài chính
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-gray-400 uppercase tracking-widest">So sánh thu chi qua từng tháng</CardDescription>
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
                    <CardHeader className="p-5 sm:p-7 border-b border-gray-50 dark:border-gray-800">
                        <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            Hiệu quả chi nhánh
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-gray-400 uppercase tracking-widest">Lợi nhuận ròng từng địa điểm</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-5 flex-1 overflow-y-auto max-h-[350px]">
                        <div className="space-y-3">
                            {branchData.sort((a, b) => b.net - a.net).map((branch, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center font-black text-xs text-indigo-600">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-[11px] sm:text-xs font-black text-gray-900 dark:text-gray-100">{branch.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Thu: {formatCurrency(branch.revenue)}</span>
                                                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">Chi: {formatCurrency(branch.expense)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-xs sm:text-sm font-black tracking-tight", branch.net >= 0 ? "text-emerald-600" : "text-rose-600")}>
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
                <CardHeader className="p-5 sm:p-7 border-b border-gray-50 dark:border-gray-800">
                    <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-600" />
                        Giao dịch gần đây
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-gray-400 uppercase tracking-widest">Lịch sử thu chi mới nhất</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-100/50 dark:border-gray-800/50 h-10 uppercase tracking-wider text-[11px] font-medium text-gray-400">
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
                                    className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 border-gray-100/50 dark:border-gray-800/50 transition-colors cursor-pointer"
                                >
                                    <TableCell className="py-3 pl-7 font-inter">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                {new Date(item.recorded_at).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter mt-0.5">Ghi nhận</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "w-fit px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-1",
                                                item.type === 'revenue' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" : "bg-rose-50 text-rose-600 dark:bg-rose-900/30"
                                            )}>
                                                {item.type === 'revenue' ? 'Khoản thu' : 'Khoản chi'}
                                            </span>
                                            <span className="text-[11px] font-black text-gray-400 tracking-tight">#{item.id?.split('-')[0] || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 line-clamp-1 max-w-[200px]">
                                            {item.description || 'Không có diễn giải'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className={cn(
                                            "text-sm font-black tracking-tight",
                                            item.type === 'revenue' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                        )}>
                                            {item.type === 'revenue' ? '+' : '-'}{formatCurrency(item.amount)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-3 h-3 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">{item.payment_method || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-right pr-7">
                                        <span className="text-[11px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">{item.branches?.name || 'Vãng lai'}</span>
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
            </Card>

            {/* Side Panels */}
            {viewingTransaction?.type === 'revenue' && (
                <RevenueDetailsSheet
                    revenue={viewingTransaction}
                    open={revenueSheetOpen}
                    onOpenChange={setRevenueSheetOpen}
                    onSuccess={refetch}
                />
            )}
            {viewingTransaction?.type === 'expense' && (
                <ExpenseDetailsSheet
                    expense={viewingTransaction}
                    open={expenseSheetOpen}
                    onOpenChange={setExpenseSheetOpen}
                    onSuccess={refetch}
                />
            )}
        </div>
    )
}
