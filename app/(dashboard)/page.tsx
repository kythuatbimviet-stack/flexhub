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
    LayoutDashboard,
    ChevronRight,
    ArrowRight,
    Cake,
    Calendar,
    HeartHandshake,
    Send,
    Heart,
    Ruler,
    PersonStanding,
    Scan,
    Map,
    Dumbbell,
    Salad,
    Scale,
    Clock,
    BookOpen,
    ListChecks,
    Apple,
    UtensilsCrossed,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'

const featureGroups = [
    {
        id: 'member-management',
        title: 'Quản lý hội viên',
        description: 'Quản lý khách hàng, hợp đồng và tương tác Zalo.',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-100 dark:border-blue-800',
        gradient: 'from-blue-500/10 to-blue-600/5',
        accentColor: '#3B82F6',
        features: [
            { name: 'Khách hàng', href: '/clients', icon: Users, desc: 'Danh sách và thông tin chi tiết hội viên' },
            { name: 'Hợp đồng', href: '/contracts', icon: FileText, desc: 'Quản lý các bản đăng ký và gói tập' },
            { name: 'Zalo', href: '/zalo-users', icon: UserStar, desc: 'Kết nối và chăm sóc khách hàng qua Zalo' },
        ]
    },
    {
        id: 'health-book',
        title: 'Sổ sức khỏe điện tử',
        description: 'Theo dõi chỉ số sinh trắc học và đánh giá thể trạng.',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50 dark:bg-rose-900/20',
        borderColor: 'border-rose-100 dark:border-rose-800',
        gradient: 'from-rose-500/10 to-rose-600/5',
        accentColor: '#F43F5E',
        features: [
            { name: 'Hồ sơ sức khỏe', href: '/health-profiles', icon: Heart, desc: 'Thông tin bệnh lý và lịch sử y tế' },
            { name: 'Thể trạng', href: '/physical-assessments', icon: Ruler, desc: 'Chỉ số hình thể và số đo các vòng' },
            { name: 'Đánh giá sai lệch', href: '/postural-assessments', icon: PersonStanding, desc: 'Kiểm tra tư thế và chuyển động' },
            { name: 'InBody', href: '/inbody', icon: Scan, desc: 'Phân tích thành phần cơ thể chi tiết' },
        ]
    },
    {
        id: 'training-plan',
        title: 'Kế hoạch & Tập luyện',
        description: 'Thiết kế lộ trình và giáo án tập luyện chuyên nghiệp.',
        color: 'text-violet-600',
        bgColor: 'bg-violet-50 dark:bg-violet-900/20',
        borderColor: 'border-violet-100 dark:border-violet-800',
        gradient: 'from-violet-500/10 to-violet-600/5',
        accentColor: '#7C3AED',
        features: [
            { name: 'Lộ trình', href: '/training-roadmap', icon: Map, desc: 'Xây dựng mục tiêu và giai đoạn tập' },
            { name: 'Giáo án', href: '/training-plans', icon: Dumbbell, desc: 'Thiết kế bài tập và cường độ' },
            { name: 'Dinh dưỡng', href: '/nutrition-meal-plans', icon: Salad, desc: 'Thiết kế thực đơn và năng lượng' },
        ]
    },
    {
        id: 'tracking',
        title: 'Theo dõi & Kết quả',
        description: 'Ghi nhận thực tế tập luyện và biến động chỉ số.',
        color: 'text-teal-600',
        bgColor: 'bg-teal-50 dark:bg-teal-900/20',
        borderColor: 'border-teal-100 dark:border-teal-800',
        gradient: 'from-teal-500/10 to-teal-600/5',
        accentColor: '#0D9488',
        features: [
            { name: 'Kết quả', href: '/weight-tracking', icon: Scale, desc: 'Theo dõi cân nặng và sự thay đổi' },
            { name: 'Tần suất', href: '/training-logs', icon: Clock, desc: 'Lịch sử đi tập và mức độ chăm chỉ' },
        ]
    },
    {
        id: 'library',
        title: 'Thư viện',
        description: 'Kho tài nguyên mẫu bài tập và thực đơn dinh dưỡng.',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-100 dark:border-amber-800',
        gradient: 'from-amber-500/10 to-amber-600/5',
        accentColor: '#D97706',
        features: [
            { name: 'Thư viện giáo án', href: '/training-plans', icon: BookOpen, desc: 'Thư viện bài tập mẫu chuyên sâu' },
            { name: 'Danh mục bài tập', href: '/exercise-library', icon: ListChecks, desc: 'Quản lý danh sách các bài tập mẫu' },
            { name: 'Thực đơn mẫu', href: '/nutrition-designs', icon: UtensilsCrossed, desc: 'Thư viện mẫu thực đơn dinh dưỡng' },
            { name: 'Thực phẩm', href: '/nutrition-foods', icon: Apple, desc: 'Tra cứu calo và thành phần thực phẩm' },
        ]
    },
    {
        id: 'calendar',
        title: 'Lịch',
        description: 'Theo dõi sinh nhật khách hàng và nhân sự trong hệ thống.',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50 dark:bg-pink-900/20',
        borderColor: 'border-pink-100 dark:border-pink-800',
        gradient: 'from-pink-500/10 to-pink-600/5',
        accentColor: '#EC4899',
        features: [
            { name: 'Sinh nhật khách hàng', href: '/calendar/client-birthdays', icon: Cake, desc: 'Danh sách khách hàng sinh nhật trong tháng' },
            { name: 'Sinh nhật nhân sự', href: '/calendar/staff-birthdays', icon: Calendar, desc: 'Danh sách nhân sự sinh nhật trong tháng', adminOnly: true },
        ]
    },
    {
        id: 'financial',
        title: 'Tài chính',
        description: 'Theo dõi dòng tiền, doanh thu, chi phí và công nợ.',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-100 dark:border-emerald-800',
        gradient: 'from-emerald-500/10 to-emerald-600/5',
        accentColor: '#10B981',
        features: [
            { name: 'Thu', href: '/revenue', icon: BanknoteArrowUp, desc: 'Ghi nhận các khoản thu hệ thống' },
            { name: 'Xác nhận thanh toán', href: '/xntt-history', icon: Send, desc: 'Lịch sử xác nhận thanh toán' },
            { name: 'Chi', href: '/expense', icon: BanknoteArrowDown, desc: 'Quản lý chi tiêu và vận hành' },
            { name: 'Công nợ', href: '/debts', icon: HandCoins, desc: 'Theo dõi các khoản phải thu/trả' },
            { name: 'Dòng tiền', href: '/cash-flow', icon: TrendingUpDown, desc: 'Phân tích biến động tiền mặt' },
        ]
    },
    {
        id: 'system',
        title: 'Hệ thống',
        description: 'Cấu hình chi nhánh, nhân sự và các tham số phần mềm.',
        color: 'text-slate-600',
        bgColor: 'bg-slate-50 dark:bg-slate-900/20',
        borderColor: 'border-slate-100 dark:border-slate-800',
        gradient: 'from-slate-500/10 to-slate-600/5',
        accentColor: '#64748B',
        features: [
            { name: 'Chi nhánh', href: '/branches', icon: Building2, desc: 'Quản lý các cơ sở phòng tập' },
            { name: 'Nhân sự', href: '/users', icon: Users, desc: 'Phân quyền và quản lý tài khoản' },
            { name: 'Gói tập', href: '/packages', icon: Package, desc: 'Thiết lập các gói dịch vụ tập luyện' },
            { name: 'Tham số', href: '/config-params', icon: Settings, desc: 'Cấu hình các hằng số hệ thống' },
            { name: 'Báo cáo', href: '/reports', icon: LayoutDashboard, desc: 'Hệ thống báo cáo và phân tích' },
        ]
    }
]

function DashboardSkeleton() {
    return (
        <div className="space-y-12 font-inter pb-20 animate-pulse">
            {/* Hero skeleton */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-400/20 to-red-500/10 dark:from-red-900/30 dark:to-red-800/20 p-8 md:p-10">
                <div className="space-y-4 max-w-xl">
                    <div className="h-9 w-56 rounded-xl bg-gray-200 dark:bg-gray-700" />
                    <div className="h-5 w-80 rounded-lg bg-gray-100 dark:bg-gray-800" />
                    <div className="h-5 w-64 rounded-lg bg-gray-100 dark:bg-gray-800" />
                    <div className="h-10 w-44 rounded-2xl bg-gray-200 dark:bg-gray-700 mt-2" />
                </div>
            </div>
            {/* Cards skeleton — 2 groups */}
            {[1, 2].map((g) => (
                <div key={g} className="space-y-5">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-2 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-7 w-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map((c) => (
                            <div key={c} className="rounded-3xl p-6 bg-white dark:bg-gray-900 shadow-sm space-y-4 border border-gray-100 dark:border-gray-800">
                                <div className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-gray-800" />
                                <div className="h-5 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
                                <div className="h-4 w-full rounded-md bg-gray-100 dark:bg-gray-800" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function DashboardPage() {
    const { user, permissions, isLoading, isAdmin, isCEO, isManager } = usePermissions()

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Chào buổi sáng'
        if (hour < 14) return 'Chào buổi trưa'
        if (hour < 18) return 'Chào buổi chiều'
        return 'Chào buổi tối'
    }

    const getGreetingEmoji = () => {
        const hour = new Date().getHours()
        if (hour < 12) return '☀️'
        if (hour < 14) return '🌤️'
        if (hour < 18) return '🌅'
        return '🌙'
    }

    const userName = user?.name || 'Admin'
    const isStaff = permissions.isStaffOnly

    // Full access: all users see all feature groups
    const visibleGroups = featureGroups

    return (
        <div className="space-y-12 font-inter pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FD5771] via-[#E5485D] to-[#c93148] p-6 md:p-10 text-white shadow-2xl shadow-[#FD5771]/25">
                <div className="relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mb-3"
                    >
                        <span className="text-2xl">{getGreetingEmoji()}</span>
                        <span className="text-white/70 text-sm font-medium tracking-wide uppercase">
                            Flex Hub ERP
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="text-2xl md:text-4xl font-bold tracking-tight mb-3"
                    >
                        {getGreeting()}, <span className="text-white/90">{userName}</span> 👋
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/80 text-base md:text-lg leading-relaxed mb-6 max-w-lg"
                    >
                        Truy cập nhanh các tính năng và quản lý mọi hoạt động của phòng tập một cách hiệu quả nhất.
                    </motion.p>

                    {!isStaff && (
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
                    )}
                </div>
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-72 h-72 bg-black/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute top-1/2 right-16 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Desktop View: Categorized Sections */}
            <div className="hidden md:block space-y-14">
                {visibleGroups.map((group, groupIdx) => (
                    <motion.section
                        key={groupIdx}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIdx * 0.05 + 0.1 }}
                        className="space-y-5"
                    >
                        <div className="flex items-end justify-between px-1">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                    <span
                                        className="inline-block w-1.5 h-7 rounded-full"
                                        style={{ backgroundColor: group.accentColor }}
                                    />
                                    {group.title}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-1 ml-5 text-sm">{group.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {group.features.map((feature, featureIdx) => (
                                <Link key={featureIdx} href={feature.href}>
                                    <motion.div
                                        whileHover={{ y: -4, scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        className="h-full"
                                    >
                                        <Card className="h-full border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl p-5 bg-white dark:bg-gray-900 group relative overflow-hidden cursor-pointer">
                                            {/* Subtle gradient overlay on hover */}
                                            <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                                                style={{ background: `linear-gradient(135deg, ${group.accentColor}08, ${group.accentColor}04)` }}
                                            />
                                            <div className="relative z-10">
                                                <div className={cn("p-3 rounded-xl w-fit mb-3 transition-all duration-300 group-hover:scale-110", group.bgColor)}>
                                                    <feature.icon className={cn("w-5 h-5", group.color)} />
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-[#FD5771] transition-colors duration-200">
                                                    {feature.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                                    {feature.desc}
                                                </p>
                                            </div>
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                            </div>
                                        </Card>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.section>
                ))}
            </div>

            {/* Mobile View: App-style Grid */}
            <div className="md:hidden space-y-8">
                {visibleGroups.map((group, groupIdx) => (
                    <motion.div
                        key={groupIdx}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIdx * 0.05 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2 px-1">
                            <span
                                className="inline-block w-1 h-4 rounded-full"
                                style={{ backgroundColor: group.accentColor }}
                            />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                {group.title}
                            </h3>
                        </div>
                        <div className="grid grid-cols-4 gap-y-6">
                            {group.features.map((feature, featureIdx) => (
                                <Link key={featureIdx} href={feature.href} className="flex flex-col items-center gap-2">
                                    <motion.div
                                        whileTap={{ scale: 0.88 }}
                                        className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-md active:shadow-inner transition-all",
                                            "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-xl", group.bgColor)}>
                                            <feature.icon className={cn("w-6 h-6", group.color)} />
                                        </div>
                                    </motion.div>
                                    <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 text-center px-1 whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                        {feature.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
