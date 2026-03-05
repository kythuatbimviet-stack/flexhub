'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
    TrendingUp,
    Users,
    ShoppingCart,
    ArrowUpRight,
    Plus,
    DollarSign,
    Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'

const data = [
    { name: 'Jan', revenue: 2700 },
    { name: 'Feb', revenue: 2100 },
    { name: 'Mar', revenue: 2400 },
    { name: 'Apr', revenue: 3100 },
    { name: 'May', revenue: 2200 },
    { name: 'Jun', revenue: 2800 },
    { name: 'Jul', revenue: 3500 },
]

const stats = [
    {
        title: 'Total Revenue',
        value: '$3.000.000',
        change: '+20.1% from last month',
        icon: DollarSign,
        color: 'bg-blue-100 text-blue-600',
    },
    {
        title: 'Expected Profit',
        value: '$2.500.000',
        change: '+15% from last month',
        icon: TrendingUp,
        color: 'bg-indigo-100 text-indigo-600',
    },
    {
        title: 'Active Customers',
        value: '1,245',
        change: '+180 new customers',
        icon: Users,
        color: 'bg-sky-100 text-sky-600',
    },
    {
        title: 'Pending Orders',
        value: '45',
        change: '12 require immediate action',
        icon: ShoppingCart,
        color: 'bg-slate-100 text-slate-600',
    },
]

const recentActivity = [
    {
        id: 1,
        type: 'order',
        title: 'Order #1024 shipped',
        time: '2 hours ago',
        icon: ShoppingCart,
        color: 'text-blue-500 bg-blue-50',
    },
    {
        id: 2,
        type: 'customer',
        title: 'New customer registered',
        time: '4 hours ago',
        icon: Users,
        color: 'text-emerald-500 bg-emerald-50',
    },
    {
        id: 3,
        type: 'inventory',
        title: 'Inventory low alert',
        time: '5 hours ago',
        icon: Activity,
        color: 'text-amber-500 bg-amber-50',
    },
    {
        id: 4,
        type: 'payment',
        title: 'Payment received',
        time: '1 day ago',
        icon: DollarSign,
        color: 'text-purple-500 bg-purple-50',
    },
]

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your business metrics.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden group hover:shadow-md dark:hover:bg-gray-800/50 bg-white dark:bg-gray-900 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</CardTitle>
                                <div className={`${stat.color} p-2 rounded-lg transition-transform group-hover:scale-110 dark:opacity-80`}>
                                    <stat.icon className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center">
                                    <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" />
                                    {stat.change}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-none shadow-sm dark:shadow-none rounded-2xl p-6 bg-white dark:bg-gray-900 transition-colors duration-300">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Overview</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:opacity-10" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--tooltip-bg, #fff)',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        color: 'var(--tooltip-text, #000)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="border-none shadow-sm dark:shadow-none rounded-2xl p-6 bg-white dark:bg-gray-900 transition-colors duration-300">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                        <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 p-0 h-auto">
                            View All
                        </Button>
                    </div>
                    <div className="space-y-6">
                        {recentActivity.map((activity, index) => (
                            <div key={activity.id} className="flex gap-4">
                                <div className={`${activity.color} h-10 w-10 shrink-0 rounded-full flex items-center justify-center dark:opacity-80`}>
                                    <activity.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">
                                        {activity.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}
