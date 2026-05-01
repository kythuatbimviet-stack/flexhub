'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Home,
    Users,
    Activity,
    FileText,
    Menu,
    LogOut,
    Building2,
    Package,
    Settings,
    BanknoteArrowDown,
    TrendingUpDown,
    HeartHandshake,
    UserStar,
    Cake,
    Calendar,
    Send,
    HandCoins,
    BanknoteArrowUp,
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
    UtensilsCrossed,
    Apple,
    ContrastIcon,
    SquareUser,
} from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet"
import { createClient } from '@/lib/supabase'
import { usePermissions } from '@/hooks/use-permissions'
import { doesNotMatch } from 'assert'

// ─── Bottom bar items (always visible) ────────────────────────────────────────

const mobileMainItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Khách hàng', href: '/clients', icon: Users },
    { name: 'Lộ trình', href: '/weight-tracking', icon: Activity },
    { name: 'Hợp đồng', href: '/contracts', icon: FileText },
]

// ─── "Thêm" sheet items — grouped by section ──────────────────────────────────

const secondaryNavigation = [
    // Khách hàng
    { name: 'Khách hàng', href: '/clients', icon: Users, section: 'member' },
    { name: 'Hợp đồng', href: '/contracts', icon: SquareUser, section: 'member' },
    { name: 'Zalo', href: '/zalo-users', icon: UserStar, section: 'member' },

    // Sổ SKĐT
    { name: 'Hồ sơ sức khỏe', href: '/health-profiles', icon: Heart, section: 'health' },
    { name: 'Thể trạng', href: '/physical-assessments', icon: Ruler, section: 'health' },
    { name: 'Đánh giá sai lệch', href: '/postural-assessments', icon: PersonStanding, section: 'health' },
    { name: 'InBody', href: '/inbody', icon: Scan, section: 'health' },

    // Kế hoạch
    { name: 'Lộ trình tập', href: '/training-roadmap', icon: Map, section: 'plan' },
    { name: 'Giáo án', href: '/training-plans', icon: Dumbbell, section: 'plan' },
    { name: 'Dinh dưỡng', href: '/nutrition-meal-plans', icon: Salad, section: 'plan' },

    // Thực tế
    { name: 'Kết quả tập', href: '/weight-tracking', icon: Scale, section: 'tracking' },
    { name: 'Tần suất tập', href: '/training-logs', icon: Clock, section: 'tracking' },

    // Thư viện
    { name: 'Thư viện giáo án', href: '/training-plans', icon: BookOpen, section: 'library' },
    { name: 'Danh mục bài tập', href: '/exercise-library', icon: ListChecks, section: 'library' },
    { name: 'Thực đơn', href: '/nutrition-designs', icon: UtensilsCrossed, section: 'library' },
    { name: 'Thực phẩm', href: '/nutrition-foods', icon: Apple, section: 'library' },

    // Lịch
    { name: 'Sinh nhật khách', href: '/calendar/client-birthdays', icon: Cake, section: 'calendar' },
    { name: 'Sinh nhật NV', href: '/calendar/staff-birthdays', icon: Calendar, section: 'calendar', adminOnly: true },

    // Tài chính
    { name: 'Thu', href: '/revenue', icon: BanknoteArrowUp, section: 'financial' },
    { name: 'Chi', href: '/expense', icon: BanknoteArrowDown, section: 'financial' },
    { name: 'Xác nhận TT', href: '/xntt-history', icon: Send, section: 'financial' },
    { name: 'Công nợ', href: '/debts', icon: HandCoins, section: 'financial' },
    { name: 'Dòng tiền', href: '/cash-flow', icon: TrendingUpDown, section: 'financial' },

    // Hệ thống
    { name: 'Chi nhánh', href: '/branches', icon: Building2, section: 'system' },
    { name: 'Nhân sự', href: '/users', icon: Users, section: 'system', adminOnly: true },
    { name: 'Gói tập', href: '/packages', icon: Package, section: 'system' },
    { name: 'Tham số', href: '/config-params', icon: Settings, section: 'system' },
    { name: 'Báo cáo', href: '/reports', icon: LayoutDashboard, section: 'system' },
]

const sectionLabels: Record<string, string> = {
    member: 'Khách hàng',
    health: 'Sổ SKĐT',
    plan: 'Kế hoạch',
    tracking: 'Thực tế',
    library: 'Thư viện',
    calendar: 'Lịch',
    financial: 'Tài chính',
    system: 'Hệ thống',
}

// Section order
const sectionOrder = ['member', 'health', 'plan', 'tracking', 'library', 'calendar', 'financial', 'system']

export function MobileNav() {
    const pathname = usePathname()
    const supabase = createClient()
    const { permissions, isAdmin, isCEO, isManager } = usePermissions()
    const isStaff = permissions.isStaffOnly

    const filteredSecondaryNav = secondaryNavigation.filter(item => {
        if ((item as any).adminOnly && !isAdmin && !isCEO && !isManager) return false
        if (isStaff && (item.section === 'financial' || item.section === 'system')) return false
        return true
    })

    const [open, setOpen] = React.useState(false)

    const handleLogout = async () => {
        setOpen(false)
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    const visibleSections = sectionOrder.filter(s =>
        filteredSecondaryNav.some(i => i.section === s)
    )

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-2 py-2 flex items-center justify-around shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
            {mobileMainItems.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-14",
                            isActive
                                ? "text-[#FD5771]"
                                : "text-gray-500 dark:text-gray-400"
                        )}
                    >
                        <item.icon className={cn("w-6 h-6", isActive && "animate-in zoom-in-75 duration-300")} />
                        <span className="text-[10px] font-medium">{item.name}</span>
                    </Link>
                )
            })}

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <button className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-500 dark:text-gray-400 min-w-14">
                        <Menu className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Thêm</span>
                    </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[28px] h-[88vh] border-none p-0 bg-white dark:bg-gray-950">
                    {/* Handle bar */}
                    <div className="w-10 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mt-3 mb-1" />

                    <SheetHeader className="px-5 pt-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <SheetTitle className="text-left text-base font-semibold text-black dark:text-white">
                            Danh mục quản lý
                        </SheetTitle>
                        <SheetDescription className="sr-only">
                            Menu điều hướng nhanh cho các tính năng quản lý trên điện thoại
                        </SheetDescription>
                    </SheetHeader>

                    <div className="overflow-y-auto h-[calc(88vh-80px)] px-4 pt-4 pb-8 space-y-5">
                        {visibleSections.map(section => {
                            const items = filteredSecondaryNav.filter(i => i.section === section)
                            return (
                                <div key={section}>
                                    <h3 className="text-[10px] font-bold text-black/30 dark:text-white/30 uppercase tracking-widest mb-2 px-1">
                                        {sectionLabels[section]}
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {items.map((item) => {
                                            const isActive = pathname === item.href
                                            return (
                                                <Link
                                                    key={item.name + item.href}
                                                    href={item.href}
                                                    onClick={() => setOpen(false)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all",
                                                        isActive
                                                            ? "bg-[#FD5771]/10 dark:bg-[#FD5771]/20 text-[#FD5771]"
                                                            : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 active:scale-95"
                                                    )}
                                                >
                                                    <item.icon className="w-5 h-5 shrink-0" />
                                                    <span className="text-[10px] font-medium text-center leading-tight">{item.name}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Divider + Logout */}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 active:scale-95 transition-all"
                            >
                                <LogOut className="w-4.5 h-4.5" />
                                <span className="text-sm font-medium">Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
