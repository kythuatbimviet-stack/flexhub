'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    LayoutGrid,
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
    Activity,
    ChevronLeft,
    ChevronRight,
    Search,
    HandCoins,
    BanknoteArrowUp,
    Tags,
    Home,
    Cloud
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Logo } from '@/components/ui/logo'

const mainNavigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Khách hàng', href: '/clients', icon: Users },
    { name: 'Hợp đồng', href: '/contracts', icon: FileText },
    { name: 'Tiến trình thay đổi', href: '/weight-tracking', icon: Activity },
    { name: 'Zalo', href: '/zalo-users', icon: UserStar },
]

const financialNavigation = [
    { name: 'Thu', href: '/revenue', icon: BanknoteArrowUp },
    { name: 'Chi', href: '/expense', icon: BanknoteArrowDown },
    { name: 'Công nợ', href: '/debts', icon: HandCoins },
    { name: 'Dòng tiền', href: '/cash-flow', icon: TrendingUpDown },
]

const systemNavigation = [
    { name: 'Chi nhánh', href: '/branches', icon: Building2 },
    { name: 'Nhân sự', href: '/users', icon: Users, adminOnly: true },
    { name: 'Gói tập', href: '/packages', icon: Package },
    { name: 'Tham số', href: '/config-params', icon: Settings },
    { name: 'Báo cáo', href: '/reports', icon: LayoutDashboard },
]

interface SidebarProps {
    isCollapsed: boolean
    onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname()
    const supabase = createClient()
    const { permissions, isAdmin, isCEO, isManager, isStaff, isLoading } = usePermissions()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    if (isLoading) return null

    // Filter navigation based on permissions
    const visibleFinancial = permissions.isStaffOnly ? [] : financialNavigation
    const visibleSystem = systemNavigation.filter(item => {
        if (item.adminOnly && !isAdmin) return false
        if (permissions.isStaffOnly) return false // Staff don't see any system items
        return true
    })

    return (
        <TooltipProvider delayDuration={0}>
            <div className={cn(
                "flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 pb-4 transition-all duration-300 font-inter relative",
                isCollapsed ? "px-2" : "px-6"
            )}>
                <div className={cn(
                    "flex h-16 shrink-0 items-center justify-between",
                    isCollapsed && "justify-center"
                )}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                            <Link href="/">
                                <div className="h-9 w-9 relative group">
                                    <div className="absolute -inset-1.5 bg-[#FD5771]/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                    <div className="relative h-9 w-9 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg shadow-[#FD5771]/10 border border-gray-100 dark:border-gray-800 overflow-hidden">
                                        <Logo
                                            variant="square"
                                            isDashboard
                                            className="w-7 h-7"
                                            priority
                                        />
                                    </div>
                                </div>
                            </Link>
                        </div>
                        {!isCollapsed && (
                            <span className="font-semibold text-lg tracking-tight text-gray-950 dark:text-white transition-opacity duration-300">
                                Eva's Fit <span className="text-red-600 dark:text-red-400 font-semibold text-[10px] ml-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/30 rounded-full tracking-wider">ERP</span>
                            </span>
                        )}
                    </div>

                    {!isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="h-8 w-8 rounded-lg text-gray-400 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {isCollapsed && (
                    <div className="flex justify-center mb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="h-9 w-9 rounded-xl text-gray-400 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-gray-50 dark:border-gray-800"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                )}

                <nav className="flex flex-1 flex-col mt-2">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                            <ul role="list" className={cn("-mx-2 space-y-1", isCollapsed && "mx-0")}>
                                {mainNavigation.map((item) => {
                                    const isActive = pathname === item.href
                                    const content = (
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                isActive
                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                    : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                                'group flex gap-x-3 rounded-xl p-2.5 text-sm leading-6 font-semibold transition-all duration-200',
                                                isCollapsed && "justify-center px-0"
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    isActive
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400',
                                                    'h-5 w-5 shrink-0 transition-colors duration-200'
                                                )}
                                                aria-hidden="true"
                                            />
                                            {!isCollapsed && <span>{item.name}</span>}
                                        </Link>
                                    )

                                    if (isCollapsed) {
                                        return (
                                            <li key={item.name}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        {content}
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="font-semibold text-xs py-1.5 px-3 rounded-lg shadow-xl border-none bg-slate-900 text-white">
                                                        {item.name}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </li>
                                        )
                                    }

                                    return <li key={item.name}>{content}</li>
                                })}
                            </ul>
                        </li>

                        {visibleFinancial.length > 0 && (
                            <li>
                                {!isCollapsed ? (
                                    <div className="text-[10px] font-bold leading-6 text-gray-400 dark:text-gray-300 uppercase tracking-[0.2em] mb-2 px-2">Tài chính</div>
                                ) : (
                                    <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 mb-4" />
                                )}
                                <ul role="list" className={cn("-mx-2 space-y-1", isCollapsed && "mx-0")}>
                                    {visibleFinancial.map((item) => {
                                        const isActive = pathname === item.href
                                        const content = (
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    isActive
                                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                        : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                                    'group flex gap-x-3 rounded-xl p-2.5 text-sm leading-6 font-semibold transition-all duration-200',
                                                    isCollapsed && "justify-center px-0"
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        isActive
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400',
                                                        'h-5 w-5 shrink-0 transition-colors duration-200'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {!isCollapsed && <span>{item.name}</span>}
                                            </Link>
                                        )

                                        if (isCollapsed) {
                                            return (
                                                <li key={item.name}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            {content}
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="font-semibold text-xs py-1.5 px-3 rounded-lg shadow-xl border-none bg-slate-900 text-white">
                                                            {item.name}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </li>
                                            )
                                        }

                                        return <li key={item.name}>{content}</li>
                                    })}
                                </ul>
                            </li>
                        )}

                        {visibleSystem.length > 0 && (
                            <li>
                                {!isCollapsed ? (
                                    <div className="text-[10px] font-bold leading-6 text-gray-400 dark:text-gray-300 uppercase tracking-[0.2em] mb-2 px-2">Hệ thống</div>
                                ) : (
                                    <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 mb-4" />
                                )}
                                <ul role="list" className={cn("-mx-2 space-y-1", isCollapsed && "mx-0")}>
                                    {visibleSystem.map((item) => {
                                        const isActive = pathname === item.href
                                        const content = (
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    isActive
                                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                        : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                                    'group flex gap-x-3 rounded-xl p-2.5 text-sm leading-6 font-semibold transition-all duration-200',
                                                    isCollapsed && "justify-center px-0"
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        isActive
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400',
                                                        'h-5 w-5 shrink-0 transition-colors duration-200'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {!isCollapsed && <span>{item.name}</span>}
                                            </Link>
                                        )

                                        if (isCollapsed) {
                                            return (
                                                <li key={item.name}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            {content}
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="font-semibold text-xs py-1.5 px-3 rounded-lg shadow-xl border-none bg-slate-900 text-white">
                                                            {item.name}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </li>
                                            )
                                        }

                                        return <li key={item.name}>{content}</li>
                                    })}
                                </ul>
                            </li>
                        )}

                        <li className="mt-auto">
                            <button
                                onClick={handleLogout}
                                className={cn(
                                    "group -mx-2 flex gap-x-3 rounded-xl p-2.5 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 w-full transition-all duration-200",
                                    isCollapsed && "justify-center px-0 mx-0"
                                )}
                            >
                                <LogOut
                                    className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-red-600 transition-colors duration-200"
                                    aria-hidden="true"
                                />
                                {!isCollapsed && <span>Đăng xuất</span>}
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </TooltipProvider>
    )
}
