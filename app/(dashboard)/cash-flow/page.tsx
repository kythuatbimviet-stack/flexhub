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
    TrendingUpDown,
    DollarSign,
    Banknote,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
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

export default function CashFlowPage() {
    const { data: cashFlowResult } = useQuery({
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
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    }

    return (
        <div className="flex flex-col gap-8 p-8 bg-gray-50/50 min-h-screen font-inter">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-950 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <TrendingUpDown className="text-white w-6 h-6" />
                        </div>
                        Dòng tiền Hệ thống
                    </h1>
                    <p className="text-gray-500 text-sm pl-1">Phân tích chuyên sâu về tình hình tài chính của toàn bộ chi nhánh.</p>
                </div>
            </div>

            {/* Total Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden relative group transition-all hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-transform group-hover:scale-110">
                        <ArrowUpRight className="w-24 h-24 text-emerald-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Tổng doanh thu</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600">{formatCurrency(totals.revenue)}</div>
                        <div className="flex items-center gap-1.5 mt-2 bg-emerald-50 w-fit px-2.5 py-1 rounded-full border border-emerald-100">
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-tighter">Dòng tiền vào</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden relative group transition-all hover:shadow-xl hover:shadow-rose-500/10 active:scale-[0.98]">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-transform group-hover:scale-110">
                        <ArrowDownRight className="w-24 h-24 text-rose-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Tổng chi phí</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-rose-600">{formatCurrency(totals.expense)}</div>
                        <div className="flex items-center gap-1.5 mt-2 bg-rose-50 w-fit px-2.5 py-1 rounded-full border border-rose-100">
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-tighter">Dòng tiền ra</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-sm bg-gray-950 overflow-hidden relative group transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98]">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent opacity-50" />
                    <CardHeader className="pb-2 relative z-10">
                        <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Lợi nhuận gộp</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className={cn("text-3xl font-black", totals.net >= 0 ? "text-indigo-400" : "text-rose-400")}>
                            {formatCurrency(totals.net)}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-2 font-medium">Báo cáo tổng kết toàn hệ thống</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/50 bg-white overflow-hidden p-8">
                    <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-gray-900">Doanh thu vs Chi phí</CardTitle>
                            <CardDescription className="text-sm">Biến động tài chính qua từng tháng</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `${val / 1000000}M`} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                                <Bar dataKey="revenue" name="Thu" fill="#059669" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="expense" name="Chi" fill="#e11d48" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/50 bg-white overflow-hidden p-8">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-xl font-bold text-gray-900">Chi nhánh hiệu quả</CardTitle>
                        <CardDescription className="text-sm">Phân bổ lợi nhuận theo từng địa điểm</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-6">
                            {branchData.sort((a, b) => b.net - a.net).map((branch, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-bold text-indigo-600">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{branch.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Thu: {formatCurrency(branch.revenue)}</span>
                                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">Chi: {formatCurrency(branch.expense)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-base font-black tracking-tight", branch.net >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                            {branch.net >= 0 ? "+" : ""}{formatCurrency(branch.net)}
                                        </p>
                                        <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000", branch.net >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                                                style={{ width: `${Math.min(100, Math.abs(branch.net) / (totals.revenue || 1) * 200)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
