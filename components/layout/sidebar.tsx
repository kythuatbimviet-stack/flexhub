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
    LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Categories', href: '/categories', icon: Layers },
    { name: 'Items (Master)', href: '/items', icon: Box },
    { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
    { name: 'Inventory', href: '/inventory', icon: ClipboardList },
    { name: 'Quotations', href: '/quotations', icon: FileText },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Packages', href: '/packages', icon: Package },
    { name: 'Sample Catalogues', href: '/samples/catalogues', icon: BookOpen },
    { name: 'Sample Requests', href: '/samples/requests', icon: Send },
]

export function Sidebar() {
    const pathname = usePathname()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 pb-4 transition-colors duration-300">
            <div className="flex h-16 shrink-0 items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-white text-[10px] font-bold">ERP</span>
                </div>
                <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
                    Lumina <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm ml-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded-full">Admin</span>
                </span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                isActive
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200'
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    isActive
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400',
                                                    'h-6 w-6 shrink-0 transition-colors duration-200'
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
                            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] w-full transition-all duration-200"
                        >
                            <LogOut
                                className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-[#D4AF37] transition-colors duration-200"
                                aria-hidden="true"
                            />
                            Logout
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
