'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    FileText,
    CheckCircle2,
    Trophy,
    BadgeCheck,
    Receipt
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
    Line,
    LabelList
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
import { fetchBranches } from '@/app/actions/branches'
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addWeeks,
    addMonths,
    subWeeks,
    subMonths,
    format as formatDateFns
} from 'date-fns'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#0ea5e9', '#f43f5e']

export default function ReportsPage() {
    const [activeTab, setActiveTab] = React.useState('customers')
    const [startDate, setStartDate] = React.useState('')
    const [endDate, setEndDate] = React.useState('')
    const [branchId, setBranchId] = React.useState('all')

    const { data: metrics, isLoading, isFetching, error: queryError, isError } = useQuery({
        queryKey: ['dashboard-metrics', startDate, endDate, branchId],
        queryFn: async () => {
            const res = await fetchDashboardMetrics({ startDate, endDate, branchId })
            if (!res.success) throw new Error(res.error)
            return res.data
        }
    })

    const { data: branchesList = [] } = useQuery({
        queryKey: ['branches-filter'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? (res.data || []) : []
        },
        staleTime: 3600000 // 1 hour
    })

    const handleQuickFilterChange = (filter: string) => {
        const now = new Date()
        let start: Date
        let end: Date

        switch (filter) {
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
            default:
                return
        }

        setStartDate(formatDateFns(start, 'yyyy-MM-dd'))
        setEndDate(formatDateFns(end, 'yyyy-MM-dd'))
    }

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
    const training = metrics.training
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
                    { title: 'Tần suất tập luyện', value: training?.totalSessions || 0, subValue: `Buổi tập ${periodLabel}`, icon: Activity, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { title: 'Đúng lịch (Y)', value: training?.statusCounts?.['Y'] || 0, subValue: 'Số buổi hoàn thành', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
                    { title: 'Tiến trình giảm cân', value: `${(branchPersonnel?.branches?.reduce((acc: any, p: any) => acc + p.weightLoss, 0) || 0).toFixed(1)} kg`, subValue: 'Tổng toàn hệ thống', icon: Scale, color: 'text-orange-600', bgColor: 'bg-orange-50' },
                    { title: 'Kỷ luật tập luyện', value: training?.totalSessions > 0 ? `${(((training?.statusCounts?.['Y'] || 0) / training?.totalSessions) * 100).toFixed(1)}%` : '0%', subValue: 'Tỷ lệ đi tập đúng', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
                ]
            case 'contracts':
                return [
                    { title: 'Tổng giá trị HĐ', value: formatCurrency(contracts?.totalValue || 0), subValue: `Tổng cộng ${contracts?.totalCount || 0} hợp đồng ${periodLabel}`, icon: Briefcase, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { title: 'Giá trị trung bình', value: formatCurrency(contracts?.acv || 0), subValue: 'Giá trị trung bình/HĐ', icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-50' },
                    { title: 'Đang hiệu lực', value: formatCurrency(contracts?.activeValue || 0), subValue: `${contracts?.activeCount || 0} hợp đồng active`, icon: BadgeCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
                    { title: 'Giá trị sắp hết hạn', value: formatCurrency(contracts?.expiringValue || 0), subValue: `${contracts?.expiringCount || 0} HĐ trong 30 ngày`, icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-50' }
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
                const isRevenue = activeTab === 'revenue'

                const baseStats = [
                    { title: isExpense ? 'Tổng chi phí' : isCashflow ? 'Dòng tiền ròng' : 'Tổng doanh thu', value: formatCurrency(isExpense ? finance?.totalExpense : isCashflow ? summary?.netCashFlow : summary?.currentMonthRevenue), subValue: `Ghi nhận ${periodLabel}`, icon: DollarSign, color: isExpense ? 'text-red-600' : 'text-emerald-600', bgColor: isExpense ? 'bg-red-50' : 'bg-emerald-50' },
                    { title: 'Trung bình/Ngày', value: formatCurrency((isExpense ? finance?.totalExpense : summary?.currentMonthRevenue) / 30), subValue: 'Biến động hàng ngày', icon: Activity, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { title: 'Cơ sở tốt nhất', value: summary?.bestBranch || 'N/A', subValue: 'Mang lại lợi nhuận cao', icon: Building2, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
                    { title: 'Biến động kỳ', value: `${(summary?.revenueGrowthRate || 0).toFixed(1)}%`, subValue: 'So với kỳ trước', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50', trend: summary?.revenueGrowthRate }
                ]

                if (isRevenue && branchPersonnel?.totalActualRevenue) {
                    // Chèn Doanh thu thực tế vào vị trí thứ 2
                    baseStats.splice(1, 0, {
                        title: 'Doanh thu thực tế',
                        value: formatCurrency(branchPersonnel.totalActualRevenue),
                        subValue: 'Sau khi trừ các khoản thuế',
                        icon: Target,
                        color: 'text-orange-600',
                        bgColor: 'bg-orange-50'
                    })
                }
                return baseStats
            case 'branch-pt':
                return [
                    { title: 'Số chi nhánh', value: branchPersonnel?.branches?.length || 0, subValue: 'Số cơ sở ghi nhận số liệu', icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { title: 'PT xuất sắc', value: branchPersonnel?.ptPerformance?.[0]?.name || 'N/A', subValue: 'Giảm cân nhiều nhất', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                    { title: 'Tổng giảm cân', value: `${(branchPersonnel?.branches?.reduce((acc: any, p: any) => acc + p.weightLoss, 0) || 0).toFixed(1)} kg`, subValue: `Toàn hệ thống ${periodLabel}`, icon: Scale, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
                    { title: 'Tăng trưởng kỳ', value: '8.4%', subValue: 'So với tháng trước', icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-50' }
                ]
            default:
                return []
        }
    }

    return (
        <div className="min-h-screen bg-transparent relative">
            <AnimatePresence>
                {isFetching && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-[9999]"
                    >
                        <motion.div
                            initial={{ width: "0%", opacity: 0 }}
                            animate={{ width: "100%", opacity: 1 }}
                            transition={{
                                width: { duration: 2, ease: "easeInOut" },
                                opacity: { duration: 0.3 }
                            }}
                            className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-8 font-inter pb-12">
                {/* Header Section */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2.5 bg-[#007AFF]/10 rounded-xl">
                                    <LayoutDashboard className="w-5 h-5 text-[#007AFF]" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Báo cáo tổng quan</h1>
                            </div>
                            <p className="text-[13px] text-gray-500 font-medium ml-12">Theo dõi chỉ số kinh doanh và hiệu suất hệ thống Eva's Fit ERP</p>
                        </div>

                    </div>

                    {/* Filter Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 p-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold focus:ring-0 px-1 py-0 outline-none w-24"
                            />
                            <span className="text-gray-300">→</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold focus:ring-0 px-1 py-0 outline-none w-24"
                            />
                        </div>

                        <Select onValueChange={handleQuickFilterChange}>
                            <SelectTrigger className="w-[180px] h-9 rounded-xl text-[11px] font-bold bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                <Filter className="w-3.5 h-3.5 mr-2 text-[#007AFF]" />
                                <SelectValue placeholder="Khoảng thời gian" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 shadow-xl">
                                <SelectItem value="this-week">Tuần này</SelectItem>
                                <SelectItem value="last-week">Tuần trước</SelectItem>
                                <SelectItem value="next-week">Tuần tới</SelectItem>
                                <SelectItem value="this-month">Tháng này</SelectItem>
                                <SelectItem value="last-month">Tháng trước</SelectItem>
                                <SelectItem value="next-month">Tháng tới</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={branchId} onValueChange={setBranchId}>
                            <SelectTrigger className="w-[200px] h-9 rounded-xl text-[11px] font-bold bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                <Building2 className="w-3.5 h-3.5 mr-2 text-[#007AFF]" />
                                <SelectValue placeholder="Tất cả chi nhánh" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 shadow-xl">
                                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                {branchesList.map((b: any) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    {/* 1. Tabs List at the VERY TOP of content */}
                    <div className="w-full overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        <TabsList className="inline-flex h-11 items-center justify-start rounded-xl bg-gray-100/80 dark:bg-gray-800/50 p-1 text-gray-500 border-none shrink-0 min-w-max shadow-inner">
                            <TabsTrigger value="customers" className="rounded-lg px-6 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-[#007AFF] data-[state=active]:shadow-md transition-all duration-200 text-gray-600 dark:text-gray-300">Khách hàng</TabsTrigger>
                            <TabsTrigger value="routes" className="rounded-lg px-6 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-[#007AFF] data-[state=active]:shadow-md transition-all duration-200 whitespace-nowrap text-gray-600 dark:text-gray-300">Tiến trình thay đổi</TabsTrigger>
                            <TabsTrigger value="contracts" className="rounded-lg px-6 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-[#007AFF] data-[state=active]:shadow-md transition-all duration-200 text-gray-600 dark:text-gray-300">Hợp đồng</TabsTrigger>
                            <TabsTrigger value="debts" className="rounded-lg px-6 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-[#007AFF] data-[state=active]:shadow-md transition-all duration-200 text-gray-600 dark:text-gray-300">Công nợ</TabsTrigger>
                            <TabsTrigger value="revenue" className="rounded-lg px-6 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-[#007AFF] data-[state=active]:shadow-md transition-all duration-200 text-gray-600 dark:text-gray-300">Doanh thu</TabsTrigger>
                            <TabsTrigger value="expenses" className="rounded-lg px-6 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-[#007AFF] data-[state=active]:shadow-md transition-all duration-200 text-gray-600 dark:text-gray-300">Chi phí</TabsTrigger>
                            <TabsTrigger value="cashflow" className="rounded-lg px-6 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-[#007AFF] data-[state=active]:shadow-md transition-all duration-200 text-gray-600 dark:text-gray-300">Dòng tiền</TabsTrigger>
{/* <TabsTrigger value="branch-pt" className="rounded-lg px-6 py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-[#007AFF] data-[state=active]:shadow-md transition-all duration-200 text-gray-600 dark:text-gray-300 whitespace-nowrap">Chi nhánh & Nhân sự</TabsTrigger> */}
                        </TabsList>
                    </div>

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
                        <div className="grid gap-6 md:grid-cols-2">
                            <ChartCard title="Tần suất tập luyện" description="Tỷ lệ trạng thái buổi tập (Y/N/TĐ)">
                                <PieChartComponent
                                    data={Object.entries(training?.statusCounts || {}).map(([name, value]) => ({ name, value }))}
                                    centerText={training?.totalSessions || 0}
                                    centerSubtext="Buổi tập"
                                />
                            </ChartCard>
                            <ChartCard title="Xu hướng tập luyện" description="Số lượng buổi tập theo ngày">
                                <BarChartComponent
                                    data={training?.trends || []}
                                    dataKey="value"
                                />
                            </ChartCard>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                                <CardHeader className="px-0 pt-0">
                                    <CardTitle className="text-lg font-semibold text-gray-900">Thái độ tập luyện (PT)</CardTitle>
                                    <CardDescription className="text-xs">Top 5 PT có tỷ lệ khách đi tập đúng lịch cao nhất</CardDescription>
                                </CardHeader>
                                <div className="space-y-6">
                                    {(training?.topConsistencyPTs || []).map((pt: any, i: number) => (
                                        <div key={pt.name} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-100 dark:border-indigo-900/30">{i + 1}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pt.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{pt.branchName}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-emerald-600">{pt.consistency.toFixed(1)}%</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{pt.totalSessions} buổi tập</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                                <CardHeader className="px-0 pt-0">
                                    <CardTitle className="text-lg font-semibold text-gray-900">Xu hướng cân nặng hệ thống</CardTitle>
                                    <CardDescription className="text-xs">Cân nặng trung bình của hội viên theo thời gian</CardDescription>
                                </CardHeader>
                                <div className="h-[250px]">
                                    <AreaChartComponent
                                        data={training?.weightTrends || []}
                                        dataKey="value"
                                        color="#f97316"
                                    />
                                </div>
                            </Card>
                        </div>

                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg font-semibold dark:text-white text-gray-900">Tiến trình thay đổi cân nặng theo Chi nhánh</CardTitle>
                                <CardDescription className="text-xs text-gray-500">Giảm cân tích lũy của từng cơ sở</CardDescription>
                            </CardHeader>
                            <div className="h-[400px]">
                                <BarChartComponent
                                    data={(branchPersonnel?.branches || []).map((b: any) => ({
                                        name: b.branchName,
                                        weightLoss: b.weightLoss
                                    }))}
                                    dataKey="weightLoss"
                                    layout="vertical"
                                    color="#f97316"
                                />
                            </div>
                        </Card>
                    </TabsContent>

                    {/* --- Tab Content: Hợp đồng --- */}
                    <TabsContent value="contracts" className="space-y-6 focus-visible:outline-none">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <ChartCard title="Cơ cấu giá trị (Status)" description="Giá trị hợp đồng theo trạng thái">
                                <PieChartComponent
                                    data={Object.entries(contracts?.valueByStatus || {}).map(([name, value]) => ({ name, value }))}
                                    centerText={formatCurrency(contracts?.totalValue || 0).split(',')[0].replace(/\./g, ',') + '...'}
                                    centerSubtext={`${contracts?.totalCount || 0} HĐ · Tổng VNĐ`}
                                />
                            </ChartCard>
                            <ChartCard title="Xu hướng ký hợp đồng" description="Giá trị hợp đồng gia tăng theo tháng">
                                <AreaChartComponent
                                    data={finance?.monthlyTrends || []}
                                    dataKey="contractValue"
                                    color="#8b5cf6"
                                    unit="đ"
                                    label="Giá trị HĐ"
                                    valueFormatter={(val: number) => formatCurrency(val)}
                                />
                            </ChartCard>
                            <ChartCard title="Phân bổ theo Gói tập" description="Top 10 gói tập mang lại doanh thu cao nhất">
                                <BarChartComponent
                                    data={(contracts?.packageDistribution || []).map((p: any) => ({ name: p.name, value: p.value }))}
                                    dataKey="value"
                                    layout="vertical"
                                    color="#6366f1"
                                />
                            </ChartCard>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                                <CardHeader className="px-0 pt-0">
                                    <CardTitle className="text-lg font-semibold text-gray-900">Tình trạng hợp đồng (Số lượng)</CardTitle>
                                    <CardDescription className="text-xs">Phân bổ số lượng hợp đồng theo trạng thái</CardDescription>
                                </CardHeader>
                                <div className="h-[300px]">
                                    <BarChartComponent
                                        data={Object.entries(contracts?.statusCounts || {}).map(([name, value]) => ({ name, value }))}
                                        dataKey="value"
                                        color="#3b82f6"
                                    />
                                </div>
                            </Card>
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                                <CardHeader className="px-0 pt-0">
                                    <CardTitle className="text-lg font-semibold text-gray-900">Chi tiết Gói tập & Doanh thu</CardTitle>
                                    <CardDescription className="text-xs">Hiệu suất kinh doanh của các gói dịch vụ</CardDescription>
                                </CardHeader>
                                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                    {(contracts?.packageDistribution || []).map((p: any, i: number) => (
                                        <div key={p.name} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-100 dark:border-slate-800">{i + 1}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{p.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{p.count} hợp đồng đã ký</span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-indigo-600">{formatCurrency(p.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 mt-6">
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                                <CardHeader className="px-0 pt-0">
                                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                        <BadgeCheck className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Hợp đồng active</span>
                                    </div>
                                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">DS Hợp đồng Đang hiệu lực</CardTitle>
                                    <CardDescription className="text-xs">Top 10 hợp đồng giá trị nhất hiện tại</CardDescription>
                                </CardHeader>
                                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 no-scrollbar mt-6">
                                    {(contracts?.activeList || []).map((h: any, i: number) => (
                                        <div key={h.id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-xs font-bold text-emerald-600 border border-emerald-100 dark:border-emerald-900/30">{i + 1}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[150px]">{h.clients?.member_name || 'Hội viên'}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{h.package_name || 'Gói tập'}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-emerald-600">{formatCurrency(h.total_amount || 0)}</span>
                                                <span className="text-[10px] text-gray-400 font-medium italic">Hết hạn: {h.end_date ? formatDateFns(new Date(h.end_date), 'dd/MM/yyyy') : 'N/A'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!contracts?.activeList || contracts.activeList.length === 0) && (
                                        <div className="text-center py-10 text-gray-400 text-xs italic">Không có dữ liệu hợp đồng active</div>
                                    )}
                                </div>
                            </Card>

                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                                <CardHeader className="px-0 pt-0">
                                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Hợp đồng hết hạn</span>
                                    </div>
                                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">DS Hợp đồng Sắp/Đã hết hạn</CardTitle>
                                    <CardDescription className="text-xs">Các hợp đồng cần gia hạn hoặc thanh lý</CardDescription>
                                </CardHeader>
                                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 no-scrollbar mt-6">
                                    {(contracts?.expiringList || []).map((h: any, i: number) => (
                                        <div key={h.id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-xs font-bold text-amber-600 border border-amber-100 dark:border-amber-900/30">{i + 1}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[150px]">{h.clients?.member_name || 'Hội viên'}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight line-clamp-1">{h.package_name || 'Gói tập'}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-1 ${h.status === 'Hết hạn HĐ' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {h.status}
                                                </span>
                                                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                                    Hết hạn: {h.end_date ? formatDateFns(new Date(h.end_date), 'dd/MM/yyyy') : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!contracts?.expiringList || contracts.expiringList.length === 0) && (
                                        <div className="text-center py-10 text-gray-400 text-xs italic">Không có dữ liệu hợp đồng hết hạn</div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* --- Tab Content: Công nợ --- */}
                    <TabsContent value="debts" className="space-y-6 focus-visible:outline-none">
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tổng nợ cần thu</p>
                                <h4 className="text-2xl font-bold text-red-600">{formatCurrency(debts?.totalAmount || 0)}</h4>
                                <p className="text-[10px] text-gray-400 mt-1">Chiếm {debts?.debtRatio?.toFixed(1) || 0}% tổng giá trị HĐ</p>
                            </Card>
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tỷ lệ thu hồi</p>
                                <h4 className="text-2xl font-bold text-emerald-600">{debts?.recoveryRate?.toFixed(1) || 0}%</h4>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-2">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${debts?.recoveryRate || 0}%` }}></div>
                                </div>
                            </Card>
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Khoản quá hạn</p>
                                <h4 className="text-2xl font-bold text-amber-600">{debts?.overdueCount || 0}</h4>
                                <p className="text-[10px] text-gray-400 mt-1">Cần ưu tiên xử lý ngay</p>
                            </Card>
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Mức độ rủi ro</p>
                                <h4 className={`text-2xl font-bold ${(debts?.debtRatio || 0) > 20 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {(debts?.debtRatio || 0) > 20 ? 'Cao' : 'Thấp'}
                                </h4>
                                <p className="text-[10px] text-gray-400 mt-1">Dựa trên tỷ lệ nợ/doanh thu</p>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <ChartCard title="Xu hướng phát sinh nợ" description="Giá trị nợ mới ghi nhận theo tháng">
                                <AreaChartComponent
                                    data={debts?.trends || []}
                                    dataKey="value"
                                    color="#ef4444"
                                    unit="đ"
                                    label="Số nợ mới"
                                    valueFormatter={(val: number) => formatCurrency(val)}
                                />
                            </ChartCard>
                            <ChartCard title="Cơ cấu nợ theo trạng thái" description="Tổng giá trị nợ phân theo tình trạng thanh toán">
                                <BarChartComponent
                                    data={Object.entries(debts?.valueByStatus || {}).map(([name, value]) => ({ name, value }))}
                                    dataKey="value"
                                    color="#f59e0b"
                                />
                            </ChartCard>
                        </div>

                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                            <CardHeader className="px-0 pt-0">
                                <div className="flex items-center gap-2 text-red-600 mb-1">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Chủ nợ tiêu biểu</span>
                                </div>
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Danh sách khách hàng nợ cần thu</CardTitle>
                                <CardDescription className="text-xs">Top 10 khách hàng có số dư nợ lớn nhất</CardDescription>
                            </CardHeader>
                            <div className="grid gap-4 md:grid-cols-2 mt-6">
                                {(debts?.topDebtors || []).map((d: any, i: number) => (
                                    <div key={d.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm border border-gray-100 dark:border-gray-800">{i + 1}</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{d.clients?.member_name || 'Hội viên'}</span>
                                                <span className={`text-[10px] font-bold uppercase ${d.status === 'Quá hạn' ? 'text-red-500' : 'text-amber-500'}`}>{d.status}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-red-600">{formatCurrency(d.remaining_amount || 0)}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">Đã trả: {formatCurrency(d.paid_amount || 0)}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!debts?.topDebtors || debts.topDebtors.length === 0) && (
                                    <div className="col-span-2 text-center py-10 text-gray-400 text-xs italic">Không có dữ liệu công nợ thỏa mãn</div>
                                )}
                            </div>
                        </Card>
                    </TabsContent>

                    {/* --- Tab Content: Doanh thu --- */}
                    <TabsContent value="revenue" className="space-y-6 focus-visible:outline-none">
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Doanh thu thực tế</p>
                                <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(finance?.totalActualRevenue || 0)}</h4>
                                {finance?.revenueGrowthRate !== undefined && (
                                    <div className={`flex items-center text-[10px] font-bold mt-1 ${finance.revenueGrowthRate >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {finance.revenueGrowthRate >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                        {Math.abs(finance.revenueGrowthRate).toFixed(1)}% so với tháng trước
                                    </div>
                                )}
                            </Card>
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tổng chi phí</p>
                                <h4 className="text-2xl font-bold text-red-500">{formatCurrency(finance?.totalExpense || 0)}</h4>
                                <p className="text-[10px] text-gray-400 mt-1">Chi phí vận hành và nhân sự</p>
                            </Card>
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Lợi nhuận ròng</p>
                                <h4 className="text-2xl font-bold text-indigo-600">{formatCurrency(finance?.totalProfit || 0)}</h4>
                                <p className="text-[10px] text-gray-400 mt-1">Sau khi trừ chi phí</p>
                            </Card>
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Biên lợi nhuận</p>
                                <h4 className="text-2xl font-bold text-slate-700 dark:text-slate-200">{finance?.profitMargin?.toFixed(1) || 0}%</h4>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-2">
                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, finance?.profitMargin || 0))}%` }}></div>
                                </div>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <ChartCard title="So sánh Thu - Chi" description="Tương quan doanh thu thực tế và chi phí vận hành">
                                <div className="h-full w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={finance?.monthlyTrends || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                            <YAxis hide />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 500 }}
                                                formatter={(val: number) => formatCurrency(val)}
                                            />
                                            <Bar dataKey="actualRevenue" name="Doanh thu" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                                            <Bar dataKey="expense" name="Chi phí" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                            <ChartCard title="Lợi nhuận theo Chi nhánh" description="So sánh hiệu suất lợi nhuận giữa các cơ sở">
                                <BarChartComponent
                                    data={(finance?.branchMetrics || []).map((b: any) => ({ name: b.name, value: b.profit }))}
                                    dataKey="value"
                                    color="#6366f1"
                                />
                            </ChartCard>
                        </div>

                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                            <CardHeader className="px-0 pt-0">
                                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Giao dịch tiêu biểu</span>
                                </div>
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Giao dịch Doanh thu cao nhất</CardTitle>
                                <CardDescription className="text-xs">Danh sách các khoản nạp có giá trị lớn</CardDescription>
                            </CardHeader>
                            <div className="grid gap-4 md:grid-cols-2 mt-6">
                                {(finance?.topTransactions || []).map((t: any, i: number) => (
                                    <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm border border-gray-100 dark:border-gray-800">{i + 1}</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[150px]">{t.clients?.member_name || 'Khách lẻ'}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{t.recorded_at ? formatDateFns(new Date(t.recorded_at), 'dd/MM/yyyy') : 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-emerald-600">{formatCurrency(t.amount || 0)}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{t.branches?.name || 'Chi nhánh'}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!finance?.topTransactions || finance.topTransactions.length === 0) && (
                                    <div className="col-span-2 text-center py-10 text-gray-400 text-xs italic">Không có dữ liệu giao dịch</div>
                                )}
                            </div>
                        </Card>
                    </TabsContent>
                    
                    {/* --- Tab Content: Chi phí --- */}
                    <TabsContent value="expenses" className="space-y-6 focus-visible:outline-none">
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tổng chi phí</p>
                                <h4 className="text-2xl font-bold text-red-600">{formatCurrency(finance?.totalExpense || 0)}</h4>
                                {finance?.expenseGrowthRate !== undefined && (
                                    <div className={`flex items-center text-[10px] font-bold mt-1 ${finance.expenseGrowthRate <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {finance.expenseGrowthRate <= 0 ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                                        {Math.abs(finance.expenseGrowthRate).toFixed(1)}% so với tháng trước
                                    </div>
                                )}
                            </Card>
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tỷ lệ chi/thu</p>
                                <h4 className="text-2xl font-bold text-amber-600">{finance?.expenseRatio?.toFixed(1) || 0}%</h4>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-2">
                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, finance?.expenseRatio || 0))}%` }}></div>
                                </div>
                            </Card>
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Chi phí TB/ngày</p>
                                <h4 className="text-2xl font-bold text-slate-700 dark:text-slate-200">{formatCurrency((finance?.totalExpense || 0) / 30)}</h4>
                                <p className="text-[10px] text-gray-400 mt-1">Dựa trên kỳ báo cáo 30 ngày</p>
                            </Card>
                            <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-6 bg-white dark:bg-gray-900 border border-gray-100 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Hệ số an toàn</p>
                                <h4 className={`text-2xl font-bold ${(finance?.expenseRatio || 0) < 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {(finance?.expenseRatio || 0) < 50 ? 'Tốt' : 'Cần tối ưu'}
                                </h4>
                                <p className="text-[10px] text-gray-400 mt-1">Dưới 50% doanh thu là lý tưởng</p>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <ChartCard title="Xu hướng chi phí" description="Biến động tổng mức chi tiêu theo tháng">
                                <AreaChartComponent
                                    data={finance?.monthlyTrends || []}
                                    dataKey="expense"
                                    color="#ef4444"
                                    unit="đ"
                                    label="Chi phí"
                                    valueFormatter={(val: number) => formatCurrency(val)}
                                />
                            </ChartCard>
                            <ChartCard title="Chi phí theo Chi nhánh" description="So sánh mức chi tiêu vận hành giữa các cơ sở">
                                <BarChartComponent
                                    data={(finance?.branchMetrics || []).map((b: any) => ({ name: b.name, value: b.expense }))}
                                    dataKey="value"
                                    color="#f59e0b"
                                />
                            </ChartCard>
                        </div>

                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                            <CardHeader className="px-0 pt-0">
                                <div className="flex items-center gap-2 text-red-600 mb-1">
                                    <Receipt className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Chi tiêu lớn</span>
                                </div>
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top 10 Khoản chi lớn nhất</CardTitle>
                                <CardDescription className="text-xs">Các danh mục chi phí cần lưu tâm</CardDescription>
                            </CardHeader>
                            <div className="grid gap-4 md:grid-cols-2 mt-6">
                                {(finance?.topExpenses || []).map((e: any, i: number) => (
                                    <div key={e.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm border border-gray-100 dark:border-gray-800">{i + 1}</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{e.description || 'Chi phí vận hành'}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{e.recorded_at ? formatDateFns(new Date(e.recorded_at), 'dd/MM/yyyy') : 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-red-600">{formatCurrency(e.amount || 0)}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{e.branches?.name || 'Chi nhánh'}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!finance?.topExpenses || finance.topExpenses.length === 0) && (
                                    <div className="col-span-2 text-center py-10 text-gray-400 text-xs italic">Không có dữ liệu chi phí</div>
                                )}
                            </div>
                        </Card>
                    </TabsContent>
                    
                    {/* --- Tab Content: Dòng tiền --- */}
                    <TabsContent value="cashflow" className="space-y-8 focus-visible:outline-none">
                        <div className="grid gap-6 md:grid-cols-2">
                            <ChartCard title="Biến động Dòng tiền ròng" description="Lợi nhuận ròng hàng tháng (Thu - Chi)">
                                <BarChartComponent
                                    data={(finance?.monthlyTrends || []).map((t: any) => ({ name: t.name, value: t.profit }))}
                                    dataKey="value"
                                    color="#10b981"
                                />
                            </ChartCard>
                            <ChartCard title="Cấu trúc dòng tiền" description="Tỷ trọng giữa Tổng thu nhập thực tế và Chi phí">
                                <PieChartComponent
                                    data={[
                                        { name: 'Tổng thu thực tế', value: finance?.totalActualRevenue || 0 },
                                        { name: 'Tổng chi phí', value: finance?.totalExpense || 0 }
                                    ]}
                                    centerText={formatCurrency(summary?.netCashFlow || 0).split(',')[0].replace(/\./g, ',') + '...'}
                                    centerSubtext="Dòng tiền ròng"
                                />
                            </ChartCard>
                        </div>

                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100">
                            <CardHeader className="px-0 pt-0">
                                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                    <Activity className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Lưu chuyển tiền tệ</span>
                                </div>
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Giao dịch ảnh hưởng dòng tiền lớn nhất</CardTitle>
                                <CardDescription className="text-xs">Top 10 các khoản thu/chi có giá trị cao nhất</CardDescription>
                            </CardHeader>
                            <div className="grid gap-4 md:grid-cols-2 mt-6">
                                {(finance?.cashFlowTransactions || []).map((t: any, i: number) => (
                                    <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center text-xs font-bold shadow-sm border border-gray-100 dark:border-gray-800">
                                                {t.amount > 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{t.description}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded ${t.type === 'revenue' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {t.type === 'revenue' ? 'Thu' : 'Chi'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{t.date ? formatDateFns(new Date(t.date), 'dd/MM/yyyy') : 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-sm font-bold ${t.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{t.branch || 'Hệ thống'}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!finance?.cashFlowTransactions || finance.cashFlowTransactions.length === 0) && (
                                    <div className="col-span-2 text-center py-10 text-gray-400 text-xs italic">Không có dữ liệu giao dịch</div>
                                )}
                            </div>
                        </Card>
                    </TabsContent>

                    {/* --- Tab Content: Chi nhánh & Nhân sự --- */}
                    {/* <TabsContent value="branch-pt" className="space-y-8 focus-visible:outline-none">
                        ...
                    </TabsContent> */}
                </Tabs>

                {activeTab !== 'routes' && activeTab !== 'expenses' && activeTab !== 'cashflow' && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Toàn bộ chi nhánh</CardTitle>
                                <CardDescription className="text-xs text-gray-500">Phân bổ doanh thu cụ thể theo địa điểm</CardDescription>
                            </CardHeader>
                            <div className="h-[300px]">
                                <BarChartComponent
                                    data={(branchPersonnel?.branches || []).map((b: any) => ({
                                        name: b.branchName,
                                        revenue: b.revenue
                                    }))}
                                    dataKey="revenue"
                                />
                            </div>
                        </Card>
                        <Card className="border-none shadow-sm dark:shadow-none rounded-3xl p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nhân sự xuất sắc</CardTitle>
                                <CardDescription className="text-xs text-gray-500">Top 5 PT mang lại doanh thu cao nhất</CardDescription>
                            </CardHeader>
                            <div className="space-y-6">
                                {(topPerformers?.topPTs || []).map((pt: any, i: number) => (
                                    <div key={pt.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-100 dark:border-indigo-900/30">#{i + 1}</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pt.name}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{pt.branchName}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(pt.amount)}</span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Bestseller</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({ title, value, subValue, icon: Icon, color, bgColor, trend }: any) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
            <Card className="border-none shadow-sm dark:shadow-none rounded-xl overflow-hidden group hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-100/50 dark:border-gray-800/50">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-[11px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">{title}</CardTitle>
                    <div className={`${bgColor} ${color} p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">{value}</div>
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] text-gray-500 font-medium line-clamp-1">{subValue}</p>
                        {trend !== undefined && (
                            <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trend >= 0 ? 'text-[#34C759] bg-[#34C759]/10' : 'text-[#FF3B30] bg-[#FF3B30]/10'}`}>
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
        <Card className={`border-none shadow-md dark:shadow-none rounded-2xl p-7 bg-white dark:bg-gray-900 border border-gray-100/50 dark:border-gray-800/50 ${className}`}>
            <div className="mb-7">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{title}</CardTitle>
                <CardDescription className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 opacity-80">{description}</CardDescription>
            </div>
            <div className="h-[200px] w-full">{children}</div>
        </Card>
    )
}

function PieChartComponent({ data, centerText, centerSubtext = 'Tổng cộng' }: any) {
    const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6']
    return (
        <div className="h-full w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                        {data.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 600 }} 
                        itemStyle={{ padding: '2px 0' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold leading-none text-gray-900 dark:text-gray-100 tracking-tight">{centerText}</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1.5 tracking-[0.1em]">{centerSubtext}</span>
            </div>
        </div>
    )
}

function BarChartComponent({ data, dataKey, layout = 'horizontal', color = '#007AFF' }: any) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout={layout} margin={{ left: layout === 'vertical' ? 40 : 0, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                {layout === 'horizontal' ? (
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={5} />
                ) : (
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} width={80} />
                )}
                {layout === 'horizontal' ? <YAxis hide /> : <XAxis type="number" hide />}
                <Tooltip
                    cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
                />
                <Bar dataKey={dataKey} fill={color} radius={layout === 'horizontal' ? [4, 4, 0, 0] : [0, 4, 4, 0]} barSize={layout === 'horizontal' ? 24 : 16}>
                    <LabelList
                        dataKey={dataKey}
                        position={layout === 'horizontal' ? "top" : "right"}
                        formatter={(val: any) => {
                            const num = Number(val) || 0
                            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
                            if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
                            return num
                        }}
                        style={{ fontSize: 10, fontWeight: 700, fill: '#64748b', opacity: 0.9 }}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}

function AreaChartComponent({ data, dataKey, color = '#007AFF', unit = 'kg', label = 'Cân nặng TB', valueFormatter }: any) {
    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`colorValue-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.3} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        dy={10}
                        tickFormatter={(val) => {
                            if (typeof val === 'string' && val.length <= 3) return val
                            try {
                                const d = new Date(val)
                                if (isNaN(d.getTime())) return val
                                return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                            }
                            catch { return val }
                        }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        domain={['auto', 'auto']}
                        width={45}
                        tickFormatter={(val) => {
                            if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`
                            if (val >= 1000) return `${(val / 1000).toFixed(0)}K`
                            return val
                        }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 600 }}
                        formatter={(val: any, name: any, entry: any) => {
                            const countLabel = entry?.payload?.contractCount !== undefined ? ` (${entry.payload.contractCount} HĐ)` : ''
                            const valueLabel = valueFormatter ? valueFormatter(Number(val) || 0) : `${(Number(val) || 0).toFixed(1)} ${unit}`
                            return [`${valueLabel}${countLabel}`, label]
                        }}
                    />
                    <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#colorValue-${dataKey})`} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

function LineChartComponent({ data, dataKey, color = '#007AFF' }: any) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={5} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: color }} />
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
