'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Layers,
    Box,
    Warehouse,
    ClipboardList,
    FileText,
    ShoppingCart,
    Package,
    BookOpen,
    Send,
    LogOut,
    Building2,
    UserStar,
    Settings,
    DollarSign,
    BanknoteArrowDown,
    TrendingUpDown,
    Activity
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const mainNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Khách hàng', href: '/clients', icon: Users },
    { name: 'Lộ trình tăng cân', href: '/weight-tracking', icon: Activity },
    { name: 'Hợp đồng', href: '/contracts', icon: FileText },
    { name: 'Zalo', href: '/zalo-users', icon: UserStar },

    // { name: 'Categories', href: '/categories', icon: Layers },
    // { name: 'Items (Master)', href: '/items', icon: Box },
    // { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
    // { name: 'Inventory', href: '/inventory', icon: ClipboardList },
    // { name: 'Quotations', href: '/quotations', icon: FileText },
    // { name: 'Orders', href: '/orders', icon: ShoppingCart },
    // { name: 'Sample Catalogues', href: '/samples/catalogues', icon: BookOpen },
    // { name: 'Sample Requests', href: '/samples/requests', icon: Send },
]

const financialNavigation = [
    { name: 'Thu', href: '/revenue', icon: DollarSign },
    { name: 'Chi', href: '/expense', icon: BanknoteArrowDown },
    { name: 'Dòng tiền', href: '/cash-flow', icon: TrendingUpDown },
]

const systemNavigation = [
    { name: 'Chi nhánh', href: '/branches', icon: Building2 },
    { name: 'Nhân sự', href: '/users', icon: Users },
    { name: 'Gói tập', href: '/packages', icon: Package },
    { name: 'Cài đặt', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 pb-4 transition-colors duration-300 font-inter">
            <div className="flex h-16 shrink-0 items-center gap-3">
                <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                    <span className="text-white text-[10px] font-bold">LF</span>
                </div>
                <span className="font-bold text-lg tracking-tight text-gray-950 dark:text-white">
                    Lady Fit <span className="text-red-600 dark:text-red-400 font-bold text-[10px] ml-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/30 rounded-full uppercase tracking-wider">ERP</span>
                </span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {mainNavigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                isActive
                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                    : 'text-gray-700 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                                'group flex gap-x-3 rounded-xl p-2.5 text-sm leading-6 font-semibold transition-all duration-200'
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    isActive
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400',
                                                    'h-5 w-5 shrink-0 transition-colors duration-200'
                                                )}
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </li>

                    <li>
                        <div className="text-[10px] font-bold leading-6 text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-2">Tài chính</div>
                        <ul role="list" className="-mx-2 space-y-1">
                            {financialNavigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                isActive
                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                    : 'text-gray-700 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                                'group flex gap-x-3 rounded-xl p-2.5 text-sm leading-6 font-semibold transition-all duration-200'
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    isActive
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400',
                                                    'h-5 w-5 shrink-0 transition-colors duration-200'
                                                )}
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </li>

                    <li>
                        <div className="text-[10px] font-bold leading-6 text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-2">Hệ thống</div>
                        <ul role="list" className="-mx-2 space-y-1">
                            {systemNavigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                isActive
                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                    : 'text-gray-700 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                                'group flex gap-x-3 rounded-xl p-2.5 text-sm leading-6 font-semibold transition-all duration-200'
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    isActive
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400',
                                                    'h-5 w-5 shrink-0 transition-colors duration-200'
                                                )}
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </li>

                    <li className="mt-auto">
                        <button
                            onClick={handleLogout}
                            className="group -mx-2 flex gap-x-3 rounded-xl p-2.5 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 w-full transition-all duration-200"
                        >
                            <LogOut
                                className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-red-600 transition-colors duration-200"
                                aria-hidden="true"
                            />
                            Đăng xuất
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
