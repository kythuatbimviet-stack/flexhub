'use client'

import * as React from 'react'
import { LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'

export function UserMenu() {
    const supabase = createClient()

    const { data: user } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            return user
        }
    })

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    const initials = user?.email?.substring(0, 2).toUpperCase() || 'NV'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 flex items-center gap-2 pl-2 pr-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                    <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800 shadow-sm">
                        {initials}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900" align="end" forceMount>
                <DropdownMenuLabel className="font-normal px-3 py-3">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">
                            {user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1" />
                <div className="py-1">
                    <Link href="/profile">
                        <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:bg-gray-50 dark:focus:bg-gray-800 transition-colors cursor-pointer group">
                            <User className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                            <span>Hồ sơ cá nhân</span>
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:bg-gray-50 dark:focus:bg-gray-800 transition-colors cursor-pointer group">
                        <Settings className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                        <span>Cài đặt hệ thống</span>
                    </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1" />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-xl px-3 py-2.5 text-sm text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 transition-colors cursor-pointer group font-medium"
                >
                    <LogOut className="mr-3 h-4 w-4 text-red-500" />
                    <span>Đăng xuất</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
