'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
    FileText,
    Users,
    Megaphone,
    Wallet,
    ShoppingCart,
    Package,
    Settings,
    Search,
    Grid
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const apps = [
    {
        id: 'admin',
        title: 'Hành chính',
        description: 'Công văn, hợp đồng, văn thư lưu trữ.',
        icon: FileText,
        color: 'text-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
        id: 'hr',
        title: 'Nhân sự',
        description: 'Tuyển dụng, đào tạo, chấm công, lương.',
        icon: Users,
        color: 'text-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
        id: 'marketing',
        title: 'Marketing',
        description: 'Chiến dịch, khách hàng, báo cáo marketing.',
        icon: Megaphone,
        color: 'text-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
        id: 'finance',
        title: 'Tài chính',
        description: 'Kế toán, ngân sách, báo cáo tài chính.',
        icon: Wallet,
        color: 'text-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
        id: 'procurement',
        title: 'Mua hàng',
        description: 'Đặt hàng, nhà cung cấp, đấu thầu.',
        icon: ShoppingCart,
        color: 'text-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
        id: 'logistics',
        title: 'Kho vận',
        description: 'Tồn kho, xuất nhập kho, vận chuyển.',
        icon: Package,
        color: 'text-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-800/50'
    },
    {
        id: 'system',
        title: 'Hệ thống',
        description: 'Cấu hình, phân quyền, phòng ban.',
        icon: Settings,
        color: 'text-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-800/50'
    }
]

export default function AppStorePage() {
    const [searchQuery, setSearchQuery] = React.useState('')

    const filteredApps = apps.filter(app =>
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-10">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 relative overflow-hidden shadow-sm">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Kho Ứng dụng
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                            Truy cập nhanh tất cả các ứng dụng, công cụ và tài nguyên nghiệp vụ của doanh nghiệp bạn tại một nơi duy nhất.
                        </p>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Tìm kiếm ứng dụng..."
                            className="h-14 pl-12 pr-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-base shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6">
                <div className="flex items-center gap-3">
                    <Grid className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tất cả ứng dụng</h2>
                </div>
                <div className="text-sm text-gray-400 font-medium">
                    {filteredApps.length} mục
                </div>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredApps.map((app, index) => (
                    <motion.div
                        key={app.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.4 }}
                    >
                        <Card className="group relative bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 p-8 rounded-[28px] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer overflow-hidden text-center h-full flex flex-col items-center">
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 shadow-sm",
                                app.bg
                            )}>
                                <app.icon className={cn("w-8 h-8", app.color)} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 transition-colors group-hover:text-blue-500">
                                {app.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px]">
                                {app.description}
                            </p>

                            {/* Hover Backdrop Effect */}
                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.02] transition-colors pointer-events-none" />
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
