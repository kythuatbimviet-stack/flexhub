'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Users,
    FileText,
    Activity,
    UserStar,
    BanknoteArrowUp,
    BanknoteArrowDown,
    HandCoins,
    TrendingUpDown,
    Building2,
    Package,
    Settings,
    Tags,
    LayoutDashboard,
    ChevronRight,
    ArrowRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

const featureGroups = [
    {
        title: 'Quản lý hội viên',
        description: 'Quản lý khách hàng, hợp đồng và lộ trình tập luyện.',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-100 dark:border-blue-800',
        features: [
            { name: 'Khách hàng', href: '/clients', icon: Users, desc: 'Danh sách và thông tin chi tiết hội viên' },
            { name: 'Hợp đồng', href: '/contracts', icon: FileText, desc: 'Quản lý các bản đăng ký và gói tập' },
            { name: 'Lộ trình', href: '/weight-tracking', icon: Activity, desc: 'Theo dõi cân nặng và chỉ số cơ thể' },
            { name: 'Zalo', href: '/zalo-users', icon: UserStar, desc: 'Kết nối và chăm sóc khách hàng qua Zalo' },
        ]
    },
    {
        title: 'Tài chính',
        description: 'Theo dõi dòng tiền, doanh thu, chi phí và công nợ.',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-100 dark:border-emerald-800',
        features: [
            { name: 'Thu', href: '/revenue', icon: BanknoteArrowUp, desc: 'Ghi nhận các khoản thu hệ thống' },
            { name: 'Chi', href: '/expense', icon: BanknoteArrowDown, desc: 'Quản lý chi tiêu và vận hành' },
            { name: 'Công nợ', href: '/debts', icon: HandCoins, desc: 'Theo dõi các khoản phải thu/trả' },
            { name: 'Dòng tiền', href: '/cash-flow', icon: TrendingUpDown, desc: 'Phân tích biến động tiền mặt' },
        ]
    },
    {
        title: 'Hệ thống',
        description: 'Cấu hình chi nhánh, nhân sự và các tham số phần mềm.',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-100 dark:border-amber-800',
        features: [
            { name: 'Chi nhánh', href: '/branches', icon: Building2, desc: 'Quản lý các cơ sở phòng tập' },
            { name: 'Nhân sự', href: '/users', icon: Users, desc: 'Phân quyền và quản lý tài khoản' },
            { name: 'Gói tập', href: '/packages', icon: Package, desc: 'Thiết lập các gói dịch vụ tập luyện' },
            { name: 'Tham số', href: '/config-params', icon: Settings, desc: 'Cấu hình các hằng số hệ thống' },
            // { name: 'Mẫu HĐ', href: '/contract-template', icon: FileText, desc: 'Thiết kế mẫu in hợp đồng' },
            // { name: 'Placeholder', href: '/contract-template?tab=placeholders', icon: Tags, desc: 'Cài đặt nhãn dữ liệu động' },
        ]
    }
]

export default function DashboardPage() {
    const supabase = createClient()
    const { data: user } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            return user
        }
    })

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Chào buổi sáng'
        if (hour < 14) return 'Chào buổi trưa'
        if (hour < 18) return 'Chào buổi chiều'
        return 'Chào buổi tối'
    }

    const userName = user?.user_metadata?.full_name || 'Admin'

    return (
        <div className="space-y-12 font-inter pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FD5771] to-[#E5485D] p-6 md:p-10 text-white shadow-2xl shadow-[#FD5771]/20">
                <div className="relative z-10 max-w-2xl">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl md:text-4xl font-bold tracking-tight mb-4"
                    >
                        {getGreeting()}, {userName}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/80 text-base md:text-lg leading-relaxed mb-6"
                    >
                        Truy cập nhanh các tính năng và quản lý mọi hoạt động của phòng tập một cách hiệu quả nhất.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link href="/reports">
                            <button className="flex items-center gap-2 bg-white text-[#FD5771] px-5 py-2.5 rounded-2xl font-bold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl text-sm">
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Xem báo cáo phân tích</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </motion.div>
                </div>
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
            </div>

            {/* Desktop View: Categorized Sections */}
            <div className="hidden md:block space-y-12">
                {featureGroups.map((group, groupIdx) => (
                    <section key={groupIdx} className="space-y-6">
                        <div className="flex items-end justify-between px-2">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                    <span className={cn("inline-block w-2 h-8 rounded-full", group.bgColor.split(' ')[0])} />
                                    {group.title}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-1 ml-5">{group.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {group.features.map((feature, featureIdx) => (
                                <Link key={featureIdx} href={feature.href}>
                                    <motion.div 
                                        whileHover={{ y: -5 }}
                                        className="h-full"
                                    >
                                        <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl p-6 bg-white dark:bg-gray-900 group relative overflow-hidden">
                                            <div className={cn("p-4 rounded-2xl w-fit mb-4 transition-colors", group.bgColor)}>
                                                <feature.icon className={cn("w-6 h-6", group.color)} />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#FD5771] transition-colors">
                                                {feature.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                                {feature.desc}
                                            </p>
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="w-5 h-5 text-gray-300" />
                                            </div>
                                        </Card>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* Mobile View: App-style Grid */}
            <div className="md:hidden space-y-8">
                {featureGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-4">
                            {group.title}
                        </h3>
                        <div className="grid grid-cols-4 gap-y-6">
                            {group.features.map((feature, featureIdx) => (
                                <Link key={featureIdx} href={feature.href} className="flex flex-col items-center gap-2">
                                    <motion.div 
                                        whileTap={{ scale: 0.9 }}
                                        className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg active:shadow-inner transition-all",
                                            "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-xl", group.bgColor)}>
                                            <feature.icon className={cn("w-7 h-7", group.color)} />
                                        </div>
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 text-center px-1 whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                        {feature.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

