'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'

interface LogoLoadingProps {
    className?: string
    size?: number
}

export function LogoLoading({ className, size = 60 }: LogoLoadingProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-4 py-12", className)}>
            <div className="relative">
                {/* Outer pulse ring */}
                <div className="absolute inset-0 rounded-full bg-[#FD5771]/20 animate-ping duration-[2000ms]" />

                {/* Logo container */}
                <div className="relative bg-white dark:bg-gray-900 rounded-full p-2 shadow-xl border border-gray-100 dark:border-gray-800 animate-pulse">
                    <Logo
                        variant="square"
                        isDashboard
                        className="object-contain"
                        width={size}
                        height={size}
                        priority
                    />
                </div>
            </div>

            <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FD5771] animate-pulse">
                    Eva's Fit
                </span>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FD5771] animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FD5771] animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FD5771] animate-bounce" />
                </div>
            </div>
        </div>
    )
}
