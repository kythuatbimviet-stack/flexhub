'use client'

import * as React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2, Bell, Search } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MobileNav } from '@/components/mobile/mobile-nav'
import { MobileHeader } from '@/components/mobile/mobile-header'
import Link from 'next/link'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [loading, setLoading] = React.useState(true)
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    // Load sidebar state from localStorage on mount
    React.useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed')
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true')
        }
    }, [])

    const toggleSidebar = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem('sidebar-collapsed', String(newState))
    }

    React.useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
            } else {
                setLoading(false)
            }
        }
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: any, session: any) => {
                if (!session) {
                    router.push('/login')
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [router, supabase.auth])

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            </div>
        )
    }

    const isAppStore = pathname === '/app-store'

    return (
        <div className="flex h-[100dvh] bg-[#F8FAFC] dark:bg-gray-900 overflow-hidden transition-colors duration-300 font-sans">
            <MobileNav />
            <div className={cn(
                "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out",
                isCollapsed ? "lg:w-20" : "lg:w-72"
            )}>
                <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
            </div>

            <div className={cn(
                "flex flex-col flex-1 h-full overflow-hidden transition-all duration-300 ease-in-out",
                isCollapsed ? "lg:pl-20" : "lg:pl-72"
            )}>
                <MobileHeader />
                <header className="hidden lg:flex sticky top-0 z-40 h-16 shrink-0 items-center gap-x-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 transition-colors duration-300">
                    <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <span className="text-white text-[10px] font-bold">ERP</span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight hidden sm:block">
                                    Nền Tảng ERP
                                </span>
                            </div>

                            <Link
                                href="/app-store"
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border border-transparent",
                                    isAppStore
                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-900/50"
                                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-700"
                                )}
                            >
                                <svg className="w-4 h-4 transition-transform group-hover:rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                </svg>
                                <span>Kho Ứng dụng</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hidden sm:flex">
                                    <Search className="w-5 h-5" />
                                </Button>

                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full relative">
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                                </Button>

                                <ThemeToggle />
                            </div>

                            <div className="h-6 w-px bg-gray-100 dark:bg-gray-800 mx-1 hidden sm:block" />

                            <UserMenu />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden py-6 lg:py-10">
                    <div className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
