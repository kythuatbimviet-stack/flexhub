'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    FileText,
    Package,
    BookOpen,
    Send,
    LogOut,
    Building2,
    UserStar,
    Settings,
    BanknoteArrowDown,
    TrendingUpDown,
    Activity,
    ChevronLeft,
    ChevronRight,
    HandCoins,
    BanknoteArrowUp,
    Home,
    HeartHandshake,
    Cake,
    Calendar,
    Heart,
    Ruler,
    PersonStanding,
    Scan,
    Map,
    Dumbbell,
    Salad,
    Scale,
    Clock,
    ListChecks,
    UtensilsCrossed,
    Apple,
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

// ─── Navigation sections ──────────────────────────────────────────────────────

const homeNavigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
]

const memberNavigation = [
    { name: 'Khách hàng', href: '/clients', icon: Users },
    { name: 'Hợp đồng', href: '/contracts', icon: FileText },
    { name: 'Zalo', href: '/zalo-users', icon: UserStar },
]

const healthNavigation = [
    { name: 'Hồ sơ sức khỏe', href: '/health-profiles', icon: Heart },
    { name: 'Thể trạng', href: '/physical-assessments', icon: Ruler },
    { name: 'Đánh giá sai lệch', href: '/postural-assessments', icon: PersonStanding },
    { name: 'InBody', href: '/inbody', icon: Scan },
]

const planNavigation = [
    { name: 'Lộ trình tập luyện', href: '/training-roadmap', icon: Map },
    { name: 'Giáo án tập luyện', href: '/training-plans', icon: Dumbbell },
    { name: 'Chế độ dinh dưỡng', href: '/nutrition-meal-plans', icon: Salad },
]

const trackingNavigation = [
    { name: 'Kết quả tập luyện', href: '/weight-tracking', icon: Scale },
    { name: 'Tần suất tập luyện', href: '/training-logs', icon: Clock },
]

const libraryNavigation = [
    { name: 'Thư viện giáo án', href: '/training-plans', icon: BookOpen },
    { name: 'Danh mục bài tập', href: '/exercise-library', icon: ListChecks },
    { name: 'Thực đơn', href: '/nutrition-designs', icon: UtensilsCrossed },
    { name: 'Thư viện thực phẩm', href: '/nutrition-foods', icon: Apple },
]

const calendarNavigation = [
    { name: 'Sinh nhật khách hàng', href: '/calendar/client-birthdays', icon: Cake },
    { name: 'Sinh nhật nhân sự', href: '/calendar/staff-birthdays', icon: Calendar },
]

const financialNavigation = [
    { name: 'Thu', href: '/revenue', icon: BanknoteArrowUp },
    { name: 'Xác nhận thanh toán', href: '/xntt-history', icon: Send },
    { name: 'Chi', href: '/expense', icon: BanknoteArrowDown },
    { name: 'Công nợ', href: '/debts', icon: HandCoins },
    { name: 'Dòng tiền', href: '/cash-flow', icon: TrendingUpDown },
]

const systemNavigation = [
    { name: 'Chi nhánh', href: '/branches', icon: Building2 },
    { name: 'Nhân sự', href: '/users', icon: Users },
    { name: 'Gói tập', href: '/packages', icon: Package },
    { name: 'Tham số', href: '/config-params', icon: Settings },
    { name: 'Báo cáo', href: '/reports', icon: LayoutDashboard },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface SidebarProps {
    isCollapsed: boolean
    onToggle: () => void
}

// ─── NavItem helper ───────────────────────────────────────────────────────────

function NavItem({
    item,
    isCollapsed,
    pathname,
}: {
    item: { name: string; href: string; icon: React.ElementType }
    isCollapsed: boolean
    pathname: string
}) {
    const isActive = pathname === item.href

    const content = (
        <Link
            href={item.href}
            className={cn(
                isActive
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'text-black/70 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                'group flex gap-x-3 rounded-xl p-2.5 text-sm leading-6 font-medium transition-all duration-200',
                isCollapsed && 'justify-center px-0'
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
            <li>
                <Tooltip>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-semibold text-xs py-1.5 px-3 rounded-lg shadow-xl border-none bg-slate-900 text-white">
                        {item.name}
                    </TooltipContent>
                </Tooltip>
            </li>
        )
    }

    return <li>{content}</li>
}

// ─── NavSection helper ────────────────────────────────────────────────────────

function NavSection({
    label,
    items,
    isCollapsed,
    pathname,
}: {
    label: string
    items: { name: string; href: string; icon: React.ElementType }[]
    isCollapsed: boolean
    pathname: string
}) {
    return (
        <li>
            {!isCollapsed ? (
                <div className="text-[10px] font-semibold leading-6 text-black/40 dark:text-gray-400 uppercase tracking-[0.1em] mb-2 px-2">
                    {label}
                </div>
            ) : (
                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 mb-3" />
            )}
            <ul role="list" className={cn('-mx-2 space-y-0.5', isCollapsed && 'mx-0')}>
                {items.map((item) => (
                    <NavItem key={item.name + item.href} item={item} isCollapsed={isCollapsed} pathname={pathname} />
                ))}
            </ul>
        </li>
    )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname()
    const supabase = createClient()
    const { user } = usePermissions()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <TooltipProvider delayDuration={0}>
            <div className={cn(
                'flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 pb-4 transition-all duration-300 font-inter relative',
                isCollapsed ? 'px-2' : 'px-6'
            )}>
                {/* Logo / Brand */}
                <div className={cn(
                    'flex h-16 shrink-0 items-center justify-between',
                    isCollapsed && 'justify-center'
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
                            <span className="font-semibold text-lg tracking-tight text-black dark:text-white transition-opacity duration-300">
                                Flex Hub <span className="text-red-600 dark:text-red-400 font-semibold text-[10px] ml-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/30 rounded-full tracking-wider">ERP</span>
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

                {/* Navigation */}
                <nav className="flex flex-1 flex-col mt-1">
                    <ul role="list" className="flex flex-1 flex-col gap-y-5">

                        {/* Home */}
                        <li>
                            <ul role="list" className={cn('-mx-2 space-y-0.5', isCollapsed && 'mx-0')}>
                                {homeNavigation.map((item) => (
                                    <NavItem key={item.name} item={item} isCollapsed={isCollapsed} pathname={pathname} />
                                ))}
                            </ul>
                        </li>

                        {/* Khách hàng */}
                        <NavSection label="Khách hàng" items={memberNavigation} isCollapsed={isCollapsed} pathname={pathname} />

                        {/* Sổ SKĐT */}
                        <NavSection label="Sổ SKĐT" items={healthNavigation} isCollapsed={isCollapsed} pathname={pathname} />

                        {/* Kế hoạch */}
                        <NavSection label="Kế hoạch" items={planNavigation} isCollapsed={isCollapsed} pathname={pathname} />

                        {/* Thực tế */}
                        <NavSection label="Thực tế" items={trackingNavigation} isCollapsed={isCollapsed} pathname={pathname} />

                        {/* Thư viện */}
                        <NavSection label="Thư viện" items={libraryNavigation} isCollapsed={isCollapsed} pathname={pathname} />

                        {/* Lịch */}
                        <NavSection label="Lịch" items={calendarNavigation} isCollapsed={isCollapsed} pathname={pathname} />

                        {/* Tài chính */}
                        <NavSection label="Tài chính" items={financialNavigation} isCollapsed={isCollapsed} pathname={pathname} />

                        {/* Hệ thống */}
                        <NavSection label="Hệ thống" items={systemNavigation} isCollapsed={isCollapsed} pathname={pathname} />

                        {/* Logout */}
                        <li className="mt-auto">
                            <button
                                onClick={handleLogout}
                                className={cn(
                                    'group -mx-2 flex gap-x-3 rounded-xl p-2.5 text-sm font-medium leading-6 text-black/70 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 w-full transition-all duration-200',
                                    isCollapsed && 'justify-center px-0 mx-0'
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
