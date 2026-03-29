'use client'

import * as React from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Ultra-thin top progress bar that fires on every route change.
 * Mimics the classic NProgress style used by GitHub and Linear.
 */
export function NavigationProgress() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [progress, setProgress] = React.useState(0)
    const [visible, setVisible] = React.useState(false)
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

    const startProgress = React.useCallback(() => {
        setProgress(0)
        setVisible(true)

        let current = 0
        intervalRef.current = setInterval(() => {
            // Simulate trickle: accelerates then slows as it approaches 90%
            current += current < 30 ? 8 : current < 60 ? 4 : current < 80 ? 2 : 0.5
            if (current >= 90) {
                clearInterval(intervalRef.current!)
                current = 90
            }
            setProgress(current)
        }, 80)
    }, [])

    const completeProgress = React.useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setProgress(100)
        timerRef.current = setTimeout(() => {
            setVisible(false)
            setProgress(0)
        }, 400)
    }, [])

    // Trigger on route change
    React.useEffect(() => {
        startProgress()
        // Route is "done" when the component re-renders with new path
        const done = setTimeout(completeProgress, 100)
        return () => {
            clearTimeout(done)
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [pathname, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!visible) return null

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none"
            aria-hidden="true"
        >
            <div
                className="h-full bg-gradient-to-r from-[#FD5771] via-red-400 to-orange-400 shadow-[0_0_8px_rgba(253,87,113,0.6)] transition-all ease-out"
                style={{
                    width: `${progress}%`,
                    transitionDuration: progress === 100 ? '200ms' : '80ms',
                }}
            />
            {/* Glowing tip */}
            <div
                className="absolute top-0 right-0 h-[2.5px] w-24 bg-gradient-to-l from-white/60 to-transparent"
                style={{ right: `${100 - progress}%` }}
            />
        </div>
    )
}
