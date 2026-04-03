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
    const branchPersonnel = metrics.branchPersonnel
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
            case 'branch-pt':
                return [
                    { title: 'Số chi nhánh', value: branchPersonnel?.branches?.length || 0, subValue: 'Số cơ sở ghi nhận số liệu', icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { title: 'PT xuất sắc', value: branchPersonnel?.pts?.[0]?.name || 'N/A', subValue: 'Giảm cân nhiều nhất', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                    { title: 'Tổng giảm cân', value: `${(branchPersonnel?.branches?.reduce((acc: any, p: any) => acc + p.weightLoss, 0) || 0).toFixed(1)} kg`, subValue: `Toàn hệ thống ${periodLabel}`, icon: Scale, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
                    { title: 'Tăng trưởng kỳ', value: '8.4%', subValue: 'So với tháng trước', icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-50' }
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
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 tracking-tight">Tổng quan Eva's Fit ERP</h1>
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
                        <TabsTrigger value="customers" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all text-gray-900 dark:text-gray-100">Khách hàng</TabsTrigger>
                        <TabsTrigger value="routes" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap text-gray-900 dark:text-gray-100">Lộ trình tăng cân</TabsTrigger>
                        <TabsTrigger value="contracts" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all text-gray-900 dark:text-gray-100">Hợp đồng</TabsTrigger>
                        <TabsTrigger value="debts" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all text-gray-900 dark:text-gray-100">Công nợ</TabsTrigger>
                        <TabsTrigger value="revenue" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all text-gray-900 dark:text-gray-100">Doanh thu</TabsTrigger>
                        <TabsTrigger value="expenses" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all text-gray-900 dark:text-gray-100">Chi phí</TabsTrigger>
                        <TabsTrigger value="cashflow" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all text-gray-900 dark:text-gray-100">Dòng tiền</TabsTrigger>
                        <TabsTrigger value="branch-pt" className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all text-gray-900 dark:text-gray-100 whitespace-nowrap">Chi nhánh & Nhân sự</TabsTrigger>
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
                            <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">Lộ trình đăng ký</CardTitle>
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
                                <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">Trạng thái công nợ</CardTitle>
                            </CardHeader>
                            <PieChartComponent data={Object.entries(debts?.statusCounts || {}).map(([name, value]) => ({ name, value }))} centerText={debts?.overdueCount || 0} centerSubtext="Quá hạn" />
                        </Card>
                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">Tiêu điểm công nợ</CardTitle>
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
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900">
                             <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">Top Chi nhánh Doanh thu</CardTitle>
                            </CardHeader>
                            <div className="space-y-6">
                                {finance?.branchMetrics?.slice(0, 5).map((b: any, i: number) => (
                                    <div key={b.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                                            <span className="text-xs font-medium text-gray-900">{b.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-900">{formatCurrency(b.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Tab Content: Chi nhánh & Nhân sự --- */}
                <TabsContent value="branch-pt" className="space-y-8 focus-visible:outline-none">
                    <div className="grid gap-6 md:grid-cols-2">
                        <ChartCard title="Doanh thu theo Chi nhánh" description="So sánh tổng doanh thu giữa các cơ sở">
                            <BarChartComponent 
                                data={branchPersonnel?.branches.map((p: any) => ({ name: p.branchName, value: p.revenue }))} 
                                dataKey="value" 
                            />
                        </ChartCard>
                        <ChartCard title="Cân nặng giảm theo Chi nhánh" description="Tổng số cân nặng khách hàng đã giảm được trong tháng theo cơ sở">
                            <BarChartComponent 
                                data={branchPersonnel?.branches.map((p: any) => ({ name: p.branchName, value: p.weightLoss }))} 
                                dataKey="value"
                                color="#10b981"
                            />
                        </ChartCard>
                    </div>

                    <div className="grid gap-6 md:grid-cols-1">
                        <Card className="border-none shadow-sm rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Hiệu suất tìm kiếm Lead của Nhân sự</h3>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">Nguồn: Facebook, Tiktok, Outdoor, PR, Tự kiếm</p>
                                </div>
                                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                    <Target className="w-5 h-5 text-red-500" />
                                </div>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={branchPersonnel?.pts} layout="vertical" margin={{ left:60, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#000' }} width={100} />
                                        <Tooltip 
                                            cursor={{ fill: '#f8fafc' }} 
                                            contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '11px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 500 }} 
                                        />
                                        <Bar dataKey="leads.Facebook" stackId="a" fill="#2563eb" name="Facebook" barSize={18} radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="leads.tiktok" stackId="a" fill="#000000" name="TikTok" />
                                        <Bar dataKey="leads.Outdoor" stackId="a" fill="#10b981" name="Outdoor" />
                                        <Bar dataKey="leads.PR" stackId="a" fill="#f59e0b" name="PR" />
                                        <Bar dataKey="leads.Tự kiếm" stackId="a" fill="#ef4444" name="Tự kiếm" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-none shadow-sm rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tổng cân nặng giảm cho KH</h3>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">Thành tích PT trong tháng</p>
                                </div>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                    <Scale className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                            <div className="space-y-5">
                                {branchPersonnel?.pts.slice(0, 6).map((pt: any, i: number) => (
                                    <div key={pt.name} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-800 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">{i + 1}</div>
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{pt.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{pt.totalWeightLoss.toFixed(1)} <span className="text-[10px] font-medium text-gray-400">kg</span></span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="border-none shadow-sm rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Kỷ lục giảm cân (Năm)</h3>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">Mức giảm lớn nhất của 1 KH</p>
                                </div>
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                </div>
                            </div>
                            <div className="space-y-5">
                                {([...(branchPersonnel?.pts || [])])
                                    .sort((a: any, b: any) => b.maxWeightLoss - a.maxWeightLoss)
                                    .slice(0, 6)
                                    .map((pt: any, i: number) => (
                                    <div key={pt.name} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-xs font-bold text-yellow-700 border border-yellow-100 dark:border-yellow-900/30">{i + 1}</div>
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{pt.name}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">-{pt.maxWeightLoss.toFixed(1)} kg</span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Bestseller</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Top PTs Section (Always Visible or integrated) */}
            <div className="grid gap-6 md:grid-cols-2">
                 <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-semibold text-gray-900">Toàn bộ chi nhánh</CardTitle>
                        <CardDescription className="text-xs">Phân bổ doanh thu cụ thể theo địa điểm</CardDescription>
                    </CardHeader>
                    <div className="h-[300px]">
                        <BarChartComponent data={branchOptions} dataKey="revenue" />
                    </div>
                </Card>
                <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-semibold text-gray-900">Nhân sự xuất sắc</CardTitle>
                        <CardDescription className="text-xs">Top PT mang lại doanh thu cao nhất</CardDescription>
                    </CardHeader>
                    <div className="space-y-6">
                        {topPerformers?.topPTs?.map((pt: any, i: number) => (
                            <div key={pt.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                                    <span className="text-xs font-medium text-gray-900">{pt.name}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-900">{formatCurrency(pt.amount)}</span>
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
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1 font-inter">{value}</div>
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] text-gray-500 font-medium">{subValue}</p>
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
        <Card className={`border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 ${className}`}>
            <div className="mb-6">
                <CardTitle className="text-sm font-semibold text-gray-900">{title}</CardTitle>
                <CardDescription className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{description}</CardDescription>
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
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '11px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold leading-none text-gray-900">{centerText}</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{centerSubtext}</span>
            </div>
        </div>
    )
}

function BarChartComponent({ data, dataKey, layout = 'horizontal', color = '#ef4444' }: any) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout={layout} margin={{ left: layout === 'vertical' ? 40 : 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                {layout === 'horizontal' ? (
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#000', fontWeight: 500 }} />
                ) : (
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#000', fontWeight: 500 }} width={80} />
                )}
                {layout === 'horizontal' ? <YAxis hide /> : <XAxis type="number" hide />}
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '11px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 500 }} />
                <Bar dataKey={dataKey} fill={color} radius={layout === 'horizontal' ? [6, 6, 0, 0] : [0, 6, 6, 0]} barSize={layout === 'horizontal' ? 20 : 15} />
            </BarChart>
        </ResponsiveContainer>
    )
}

function LineChartComponent({ data, dataKey, showValue = true }: any) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#000', fontWeight: 500 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '11px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 500 }} />
                <Line type="monotone" dataKey={dataKey} stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
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
