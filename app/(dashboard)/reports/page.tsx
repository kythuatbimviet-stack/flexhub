'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    DollarSign,
    AlertCircle,
    Activity,
    Wallet,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    TrendingDown,
    Scale,
    LayoutGrid,
    Target,
    Zap,
    Briefcase,
    UserStar,
    UserCheck,
    Building2,
    PlusCircle,
    ChevronRight,
    Search,
    Filter,
    FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts'
import { fetchDashboardMetrics } from '@/app/actions/dashboard'
import { formatCurrency } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#0ea5e9', '#f43f5e']

export default function ReportsPage() {
    const [activeTab, setActiveTab] = React.useState('customers')
    const [startDate, setStartDate] = React.useState('')
    const [endDate, setEndDate] = React.useState('')
    const [branchId, setBranchId] = React.useState('all')

    const { data: metrics, isLoading, error: queryError, isError } = useQuery({
        queryKey: ['dashboard-metrics', startDate, endDate, branchId],
        queryFn: async () => {
            const res = await fetchDashboardMetrics({ startDate, endDate, branchId })
            if (!res.success) throw new Error(res.error)
            return res.data
        }
    })

    if (isError) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{queryError instanceof Error ? queryError.message : 'Đã có lỗi xảy ra khi tải số liệu dashboard.'}</p>
                    <Button 
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                    >
                        Thử lại
                    </Button>
                </div>
            </div>
        )
    }

    if (isLoading || !metrics) {
        return <DashboardSkeleton />
    }

    const summary = metrics.summary
    const customers = metrics.customers
    const routesData = metrics.registrationRoutes
    const routes = routesData?.counts || {}
    const contracts = metrics.contracts
    const debts = metrics.debts
    const finance = metrics.finance
    const topPerformers = metrics.topPerformers
    const branchOptions = finance?.branchMetrics || []

    const isFiltered = !!(startDate || endDate || (branchId && branchId !== 'all'))
    const periodLabel = isFiltered ? 'trong kỳ' : 'tháng này'

    // Dynamic Summary Stats Mapping
    const getTabStats = () => {
        switch (activeTab) {
            case 'customers':
                return [
                    { title: 'Tổng khách hàng', value: summary?.totalCustomers?.toLocaleString(), subValue: `${summary?.newThisMonth || 0} mới ${periodLabel}`, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50', trend: summary?.customerGrowthRate },
                    { title: 'Tỷ lệ hoạt động', value: `${(customers?.activeRate || 0).toFixed(1)}%`, subValue: 'Dựa trên trạng thái hội viên', icon: Activity, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
                    { title: 'Kênh dẫn đầu', value: customers?.topSource || 'N/A', subValue: 'Nguồn khách nhiều nhất', icon: ArrowUpRight, color: 'text-purple-600', bgColor: 'bg-purple-50' },
                    { title: 'Tăng trưởng kỳ', value: `+${summary?.newThisMonth || 0}`, subValue: `Hội viên mới ${periodLabel}`, icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-50' }
                ]
            case 'routes':
                return [
                    { title: 'Lộ trình phổ biến', value: routesData?.popularRoute || 'N/A', subValue: 'Nhiều người đăng ký nhất', icon: Scale, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
                    { title: 'Tổng loại gói', value: Object.keys(routes).length, subValue: 'Lộ trình đang kinh doanh', icon: LayoutGrid, color: 'text-sky-600', bgColor: 'bg-sky-50' },
                    { title: 'Trung bình/Ngày', value: '1.2h', subValue: 'Thời gian tập dự kiến', icon: Calendar, color: 'text-pink-600', bgColor: 'bg-pink-50' },
                    { title: 'Tỷ lệ hoàn thành', value: '92%', subValue: 'Hội viên theo đúng lịch', icon: UserCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50' }
                ]
            case 'contracts':
                return [
                    { title: 'Giá trị hợp đồng', value: formatCurrency(contracts?.totalValue || 0), subValue: `Tổng cộng ${periodLabel}`, icon: Briefcase, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { title: 'Hợp đồng mới', value: contracts?.newContractsCount || 0, subValue: `Ký ${periodLabel}`, icon: UserStar, color: 'text-teal-600', bgColor: 'bg-teal-50' },
                    { title: 'Sắp hết hạn', value: contracts?.expiringCount || 0, subValue: 'Trong 30 ngày tới', icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
                    { title: 'Đang hiệu lực', value: contracts?.statusCounts?.['Đang hiệu lực'] || 0, subValue: 'Hợp đồng active', icon: UserCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50' }
                ]
            case 'debts':
                return [
                    { title: 'Tổng công nợ', value: formatCurrency(debts?.totalAmount || 0), subValue: `Chưa thu ${periodLabel}`, icon: Wallet, color: 'text-red-600', bgColor: 'bg-red-50' },
                    { title: 'Khoản quá hạn', value: debts?.overdueCount || 0, subValue: 'Cần xử lý ngay', icon: AlertCircle, color: 'text-red-700', bgColor: 'bg-red-100', isOverdue: true },
                    { title: 'Tỷ lệ nợ', value: `${(debts?.debtRatio || 0).toFixed(1)}%`, subValue: 'Trên tổng doanh số', icon: TrendingDown, color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50' },
                    { title: 'Đã thu hồi', value: `${(debts?.recoveryRate || 0).toFixed(1)}%`, subValue: `Tính ${periodLabel}`, icon: Scale, color: 'text-emerald-600', bgColor: 'bg-emerald-50' }
                ]
            case 'revenue':
            case 'expenses':
            case 'cashflow':
                const isExpense = activeTab === 'expenses'
                const isCashflow = activeTab === 'cashflow'
                return [
                    { title: isExpense ? 'Tổng chi phí' : isCashflow ? 'Dòng tiền ròng' : 'Tổng doanh thu', value: formatCurrency(isExpense ? finance?.totalExpense : isCashflow ? summary?.netCashFlow : summary?.currentMonthRevenue), subValue: `Ghi nhận ${periodLabel}`, icon: DollarSign, color: isExpense ? 'text-red-600' : 'text-emerald-600', bgColor: isExpense ? 'bg-red-50' : 'bg-emerald-50' },
                    { title: 'Trung bình/Ngày', value: formatCurrency((isExpense ? finance?.totalExpense : summary?.currentMonthRevenue) / 30), subValue: 'Biến động hàng ngày', icon: Activity, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { title: 'Cơ sở tốt nhất', value: summary?.bestBranch || 'N/A', subValue: 'Mang lại lợi nhuận cao', icon: Building2, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
                    { title: 'Biến động kỳ', value: `${(summary?.revenueGrowthRate || 0).toFixed(1)}%`, subValue: 'So với kỳ trước', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50', trend: summary?.revenueGrowthRate }
                ]
            default:
                return []
        }
    }

    return (
        <div className="space-y-8 font-inter pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <LayoutDashboard className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 tracking-tight">Tổng quan Eva Fit ERP</h1>
                    </div>
                </div>
                
                {/* Global Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Database Status Debug Indicator */}
                    <div className="flex items-center gap-4 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">DB Status</span>
                            <div className="flex gap-3 text-[10px] font-bold text-gray-600 dark:text-gray-400">
                                <span title="Contracts" className="flex items-center gap-1">
                                    <FileText className="w-3 h-3 text-red-500" />
                                    {metrics?.counts?.contracts || 0}
                                </span>
                                <span title="Revenue" className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-emerald-500" />
                                    {metrics?.counts?.revenue || 0}
                                </span>
                                <span title="Debts" className="flex items-center gap-1">
                                    <Activity className="w-3 h-3 text-amber-500" />
                                    {metrics?.counts?.debts || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-semibold focus:ring-0 px-2 py-1 outline-none"
                        />
                        <span className="text-gray-300">-</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-semibold focus:ring-0 px-2 py-1 outline-none"
                        />
                    </div>

                    <Select value={branchId} onValueChange={setBranchId}>
                        <SelectTrigger className="w-[140px] h-9 rounded-xl text-[11px] font-semibold">
                            <SelectValue placeholder="Chi nhánh" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100">
                            <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                            {branchOptions.map((b: any) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" className="rounded-xl px-5 h-9 text-[11px] font-bold border-gray-200 dark:border-gray-800 transition-all hover:bg-gray-50 dark:hover:bg-gray-800">
                        <Calendar className="w-3.5 h-3.5 mr-2" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                {/* 1. Tabs List at the VERY TOP of content */}
                <ScrollArea className="w-full pb-2">
                    <TabsList className="inline-flex h-12 items-center justify-start rounded-2xl bg-gray-50/80 dark:bg-gray-900/50 p-1 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 shrink-0">
                        <TabsTrigger value="customers" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all">Khách hàng</TabsTrigger>
                        <TabsTrigger value="routes" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap">Lộ trình tăng cân</TabsTrigger>
                        <TabsTrigger value="contracts" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all">Hợp đồng</TabsTrigger>
                        <TabsTrigger value="debts" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all">Công nợ</TabsTrigger>
                        <TabsTrigger value="revenue" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all">Doanh thu</TabsTrigger>
                        <TabsTrigger value="expenses" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all">Chi phí</TabsTrigger>
                        <TabsTrigger value="cashflow" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all">Dòng tiền</TabsTrigger>
                    </TabsList>
                </ScrollArea>

                {/* 2. Dynamic Summary Stats - Changes with Tab */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {getTabStats().map((stat: any, idx) => (
                        <StatCard
                            key={idx}
                            title={stat.title}
                            value={stat.value}
                            subValue={stat.subValue}
                            icon={stat.icon}
                            color={stat.color}
                            bgColor={stat.bgColor}
                            trend={stat.trend}
                            isOverdue={stat.isOverdue}
                        />
                    ))}
                </div>

                {/* --- Tab Content: Khách hàng --- */}
                <TabsContent value="customers" className="space-y-6 focus-visible:outline-none">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <ChartCard title="Trạng thái khách hàng" description="Phân bổ hội viên theo hợp đồng">
                            <PieChartComponent data={Object.entries(customers?.statusCounts || {}).map(([name, value]) => ({ name, value }))} centerText={summary?.totalCustomers || 0} />
                        </ChartCard>
                        <ChartCard title="Nguồn khách hàng" description="Thống kê kênh tiếp cận">
                            <BarChartComponent data={Object.entries(customers?.sourceCounts || {}).map(([name, value]) => ({ name, value }))} dataKey="value" />
                        </ChartCard>
                        <ChartCard title="Tăng trưởng hội viên" description="Số lượng mới theo tháng">
                            <LineChartComponent data={finance?.monthlyTrends || []} dataKey="revenue" showValue={false} />
                        </ChartCard>
                    </div>
                </TabsContent>

                <TabsContent value="routes" className="space-y-6 focus-visible:outline-none">
                    <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-lg font-semibold dark:text-white">Lộ trình đăng ký</CardTitle>
                            <CardDescription className="text-xs text-gray-500">Phân bổ khách hàng theo mục tiêu/lộ trình tập luyện.</CardDescription>
                        </CardHeader>
                        <div className="h-[400px]">
                            <BarChartComponent 
                                data={Object.entries(routes).map(([name, value]) => ({ name, value })).sort((a:any,b:any) => (b.value as number) - (a.value as number))} 
                                dataKey="value" 
                                layout="vertical"
                            />
                        </div>
                    </Card>
                </TabsContent>

                {/* --- Tab Content: Hợp đồng --- */}
                <TabsContent value="contracts" className="space-y-6 focus-visible:outline-none">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="border-none shadow-sm rounded-3xl p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
                            <Briefcase className="w-8 h-8 mb-4 opacity-50" />
                            <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Tổng giá trị hợp đồng</p>
                            <h3 className="text-2xl font-bold mt-1">{formatCurrency(contracts?.totalValue || 0)}</h3>
                        </Card>
                        <ChartCard title="Tình trạng hợp đồng" description="Phân bổ theo trạng thái thực hiện" className="md:col-span-2">
                             <BarChartComponent data={Object.entries(contracts?.statusCounts || {}).map(([name, value]) => ({ name, value }))} dataKey="value" />
                        </ChartCard>
                    </div>
                </TabsContent>

                {/* --- Tab Content: Công nợ --- */}
                <TabsContent value="debts" className="space-y-6 focus-visible:outline-none">
                    <div className="grid gap-6 md:grid-cols-2">
                         <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg font-semibold dark:text-white">Trạng thái công nợ</CardTitle>
                            </CardHeader>
                            <PieChartComponent data={Object.entries(debts?.statusCounts || {}).map(([name, value]) => ({ name, value }))} centerText={debts?.overdueCount || 0} centerSubtext="Quá hạn" />
                        </Card>
                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg font-semibold dark:text-white">Tiêu điểm công nợ</CardTitle>
                            </CardHeader>
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">Cần thu ngay</p>
                                    <h4 className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(debts?.totalAmount || 0)}</h4>
                                </div>
                                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">Số khoản quá hạn</p>
                                    <h4 className="text-xl font-bold text-amber-700 dark:text-amber-300">{debts?.overdueCount || 0} hợp đồng</h4>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Tab Content: Doanh thu --- */}
                <TabsContent value="revenue" className="space-y-6 focus-visible:outline-none">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2 border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900">
                            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between mb-8">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-emerald-600">Xu hướng doanh thu</CardTitle>
                                    <CardDescription className="text-xs">Số liệu ghi nhận theo tháng</CardDescription>
                                </div>
                            </CardHeader>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={finance?.monthlyTrends || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v/1e6}M`} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98120" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900">
                            <CardHeader className="px-0 pt-0 mb-6">
                                <CardTitle className="text-sm font-semibold">Doanh thu chi nhánh</CardTitle>
                            </CardHeader>
                            <div className="space-y-4">
                                {(finance?.branchMetrics || []).map((b: any) => (
                                    <div key={b.id} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{b.name}</span>
                                        <span className="text-xs font-bold">{formatCurrency(b.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Tab Content: Chi phí --- */}
                <TabsContent value="expenses" className="space-y-6 focus-visible:outline-none">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2 border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900">
                            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between mb-8">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-red-600">Biến động chi phí</CardTitle>
                                    <CardDescription className="text-xs">Thống kê chi tiêu hệ thống</CardDescription>
                                </div>
                            </CardHeader>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={finance?.monthlyTrends || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v/1e6}M`} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef444420" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900">
                             <CardHeader className="px-0 pt-0 mb-6">
                                <CardTitle className="text-sm font-semibold">Chi phí chi nhánh</CardTitle>
                            </CardHeader>
                            <div className="space-y-4">
                                {(finance?.branchMetrics || []).map((b: any) => (
                                    <div key={b.id} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{b.name}</span>
                                        <span className="text-xs font-bold">{formatCurrency(b.expense)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Tab Content: Dòng tiền --- */}
                <TabsContent value="cashflow" className="space-y-6 focus-visible:outline-none">
                     <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2 border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900">
                             <CardHeader className="px-0 pt-0 mb-8">
                                <CardTitle className="text-lg font-semibold text-purple-600">So sánh Thu - Chi</CardTitle>
                                <CardDescription className="text-xs">Dòng tiền ròng hàng tháng</CardDescription>
                            </CardHeader>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={finance?.monthlyTrends || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v/1e6}M`} />
                                        <Tooltip />
                                        <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900">
                            <CardHeader className="px-0 pt-0 mb-8">
                                <CardTitle className="text-lg font-semibold">Phân tích lợi nhuận</CardTitle>
                            </CardHeader>
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100">
                                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">Tổng lợi nhuận (All-time)</p>
                                    <h4 className="text-2xl font-bold">{formatCurrency((finance?.totalRevenue || 0) - (finance?.totalExpense || 0))}</h4>
                                </div>
                                <div className="space-y-4">
                                     <p className="text-xs font-semibold text-gray-500">Chi nhánh hiệu quả nhất</p>
                                     {(finance?.branchMetrics || []).sort((a:any, b:any) => b.profit - a.profit).slice(0, 3).map((b:any, i:number) => (
                                         <div key={b.id} className="flex items-center gap-3">
                                             <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">{i+1}</div>
                                             <div className="flex-1">
                                                 <div className="flex justify-between text-xs mb-1">
                                                     <span className="font-medium">{b.name}</span>
                                                     <span className="font-bold">{formatCurrency(b.profit)}</span>
                                                 </div>
                                                 <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                                                     <div className="h-full bg-emerald-500" style={{ width: '70%' }} />
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                </div>
                            </div>
                        </Card>
                     </div>
                </TabsContent>
            </Tabs>

            {/* Top PTs Section (Always Visible or integrated) */}
            <div className="grid gap-6 md:grid-cols-2">
                 <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <CardTitle className="text-lg font-semibold dark:text-white">Top 5 PT Xuất sắc</CardTitle>
                            <CardDescription className="text-xs text-gray-500 mt-1">Dựa trên doanh số bán gói tập</CardDescription>
                        </div>
                        <UserStar className="w-5 h-5 text-gray-300" />
                    </div>
                     <div className="space-y-6">
                        {(topPerformers?.topPTs || []).map((pt: any, index: number) => (
                            <div key={pt.name} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-red-500 transition-colors">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none mb-1">{pt.name}</p>
                                        <div className="w-32 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(Number(pt.amount) / (Number(topPerformers?.topPTs?.[0]?.amount) || 1)) * 100}%` }}
                                                transition={{ duration: 1, delay: index * 0.1 }}
                                                className="h-full bg-red-500/80 rounded-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(pt.amount))}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}

function StatCard({ title, value, subValue, icon: Icon, color, bgColor, trend, isOverdue }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden group hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">{title}</CardTitle>
                    <div className={`${bgColor} ${color} p-2 rounded-xl`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] text-gray-500">{subValue}</p>
                        {trend !== undefined && (
                            <div className={`flex items-center text-[10px] font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                {Math.abs(trend).toFixed(1)}%
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function ChartCard({ title, description, children, className }: any) {
    return (
        <Card className={`border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 ${className}`}>
            <div className="mb-6">
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                <CardDescription className="text-[10px] text-gray-400">{description}</CardDescription>
            </div>
            <div className="h-[200px] w-full">{children}</div>
        </Card>
    )
}

function PieChartComponent({ data, centerText, centerSubtext = 'Tổng cộng' }: any) {
    return (
        <div className="h-full w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {data.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold leading-none">{centerText}</span>
                <span className="text-[9px] text-gray-400 font-medium uppercase mt-1">{centerSubtext}</span>
            </div>
        </div>
    )
}

function BarChartComponent({ data, dataKey, layout = 'horizontal' }: any) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout={layout} margin={{ left: layout === 'vertical' ? 40 : 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                {layout === 'horizontal' ? (
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                ) : (
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={80} />
                )}
                {layout === 'horizontal' ? <YAxis hide /> : <XAxis type="number" hide />}
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                <Bar dataKey={dataKey} fill="#ef4444" radius={layout === 'horizontal' ? [4, 4, 0, 0] : [0, 4, 4, 0]} barSize={layout === 'horizontal' ? 20 : 15} />
            </BarChart>
        </ResponsiveContainer>
    )
}

function LineChartComponent({ data, dataKey }: any) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                <Line type="monotone" dataKey={dataKey} stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} />
            </LineChart>
        </ResponsiveContainer>
    )
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-4">
            <div className="flex justify-between items-center"><Skeleton className="h-10 w-64" /><Skeleton className="h-10 w-32" /></div>
            <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
            <Skeleton className="h-12 w-full rounded-2xl" />
            <div className="grid gap-6 md:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-[300px] rounded-3xl" />)}</div>
        </div>
    )
}
