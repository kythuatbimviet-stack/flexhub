'use client'

import * as React from 'react'
import { Bell, Search, RefreshCw } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

export function MobileHeader() {
    return (
        <header className="lg:hidden sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 transition-all">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg shadow-gray-100 dark:shadow-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <Logo
                        variant="square"
                        isDashboard
                        className="w-7 h-7"
                    />
                </div>
                <span className="font-semibold text-lg tracking-tight text-gray-900 dark:text-white">
                    Flex Hub
                </span>
            </div>

            <div className="flex items-center gap-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full"
                    onClick={() => window.location.reload()}
                >
                    <RefreshCw className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FD5771] rounded-full border-2 border-white dark:border-gray-900"></span>
                </Button>
                <ThemeToggle />
                <div className="ml-1">
                    <UserMenu />
                </div>
            </div>
        </header>
    )
}
