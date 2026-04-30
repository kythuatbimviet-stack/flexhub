'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
    variant?: 'square' | 'horizontal' | 'auto'
    className?: string
    width?: number
    height?: number
    priority?: boolean
    isDashboard?: boolean
}

export function Logo({
    variant = 'auto',
    className,
    width,
    height,
    priority = false,
    isDashboard = false
}: LogoProps) {
    const { theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className={cn("bg-gray-100 animate-pulse rounded", className)} style={{ width, height }} />
    }

    const currentTheme = resolvedTheme || theme

    // Determine the logo source
    const getSrc = () => {
        // Dark Mode
        if (currentTheme === 'dark') {
            return isDashboard ? '/logo/logo_darkmode_only.png' : '/logo/logo_darkmode.png'
        }

        // Light Mode / Default
        if (variant === 'horizontal') {
            return '/logo/logo_ngang.png'
        }

        // Square or Auto in Light Mode
        if (isDashboard) {
            return '/logo/logo_vuong_only.png'
        }

        return '/logo/logo_vuong.png'
    }

    const src = getSrc()

    return (
        <div className={cn("relative flex items-center justify-center overflow-hidden", className)}>
            <Image
                key={src}
                src={src}
                alt="FlexHub Logo"
                width={width || 800}
                height={height || 800}
                className="max-w-full max-h-full object-contain"
                priority={priority}
                unoptimized
            />
        </div>
    )
}
