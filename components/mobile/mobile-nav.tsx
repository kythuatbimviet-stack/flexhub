'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Activity,
    FileText,
    Menu,
    LogOut,
    Building2,
    Package,
    Settings,
    DollarSign,
    BanknoteArrowDown,
    TrendingUpDown
} from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { createClient } from '@/lib/supabase'

const mobileMainItems = [
    { name: 'Trang chủ', href: '/', icon: LayoutDashboard },
    { name: 'Khách hàng', href: '/clients', icon: Users },
    { name: 'Lộ trình', href: '/weight-tracking', icon: Activity },
    { name: 'Hợp đồng', href: '/contracts', icon: FileText },
]

const secondaryNavigation = [
    { name: 'Thu', href: '/revenue', icon: DollarSign },
    { name: 'Chi', href: '/expense', icon: BanknoteArrowDown },
    { name: 'Dòng tiền', href: '/cash-flow', icon: TrendingUpDown },
    { name: 'Chi nhánh', href: '/branches', icon: Building2 },
    { name: 'Nhân sự', href: '/users', icon: Users },
    { name: 'Gói tập', href: '/packages', icon: Package },
    { name: 'Tham số', href: '/config-params', icon: Settings },
]

export function MobileNav() {
    const pathname = usePathname()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-2 py-2 flex items-center justify-around shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
            {mobileMainItems.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-16",
                            isActive
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-500 dark:text-gray-400"
                        )}
                    >
                        <item.icon className={cn("w-6 h-6", isActive && "animate-in zoom-in-75 duration-300")} />
                        <span className="text-[10px] font-medium">{item.name}</span>
                    </Link>
                )
            })}

            <Sheet>
                <SheetTrigger asChild>
                    <button className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-500 dark:text-gray-400 min-w-16">
                        <Menu className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Thêm</span>
                    </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[32px] h-[70vh] border-none p-0 bg-white dark:bg-gray-950">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mt-3 mb-6" />
                    <SheetHeader className="px-6 pb-4">
                        <SheetTitle className="text-left text-lg font-bold">Danh mục quản lý</SheetTitle>
                    </SheetHeader>
                    <div className="px-6 py-2 overflow-y-auto max-h-[calc(70vh-100px)]">
                        <div className="grid grid-cols-3 gap-4 pb-12">
                            {secondaryNavigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border",
                                            isActive
                                                ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400"
                                                : "bg-gray-50 dark:bg-gray-900 border-transparent text-gray-700 dark:text-gray-300 active:scale-95"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-3 rounded-xl",
                                            isActive ? "bg-red-100 dark:bg-red-900/40" : "bg-white dark:bg-gray-800 shadow-sm"
                                        )}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-semibold text-center">{item.name}</span>
                                    </Link>
                                )
                            })}
                            <button
                                onClick={handleLogout}
                                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent text-gray-700 dark:text-gray-300 active:scale-95"
                            >
                                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                                    <LogOut className="w-6 h-6 text-gray-500" />
                                </div>
                                <span className="text-xs font-semibold text-center">Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
