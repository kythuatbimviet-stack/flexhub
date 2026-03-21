'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchAllConfigs } from '@/app/actions/config-params'
import { fetchClients } from '@/app/actions/clients'
import { fetchContracts } from '@/app/actions/contracts'
import { fetchBranches } from '@/app/actions/branches'
import { fetchZaloUsers } from '@/app/actions/zalo-users'

export interface AppDataProgressProps {
    onProgress?: (percent: number, message: string) => void
    onComplete?: () => void
}

const THIRTY_MINUTES = 30 * 60 * 1000

/**
 * AppDataInitializer — Renders nothing, but prefetches all critical data into the
 * React Query cache immediately after login.
 *
 * Data is only fetched if:
 *   1. It is not already present in the cache (cold start or first load), OR
 *   2. The cache has expired (older than 30 min for business data, Infinity for configs)
 *
 * Background auto-sync runs every 30 minutes silently.
 */
export function AppDataInitializer({ onProgress, onComplete }: AppDataProgressProps) {
    const queryClient = useQueryClient()
    const hasPrefetched = React.useRef(false)

    const prefetchAll = React.useCallback(async () => {
        let completed = 0
        const total = 5

        const trackProgress = (message: string) => {
            completed++
            const percent = Math.round((completed / total) * 100)
            onProgress?.(percent, message)
            if (completed === total) {
                onComplete?.()
            }
        }

        const tasks = [
            { key: ['all-configs'], fn: fetchAllConfigs, msg: 'Cấu hình hệ thống', stale: Infinity },
            { key: ['branches'], fn: fetchBranches, msg: 'Danh sách chi nhánh', stale: Infinity },
            { key: ['clients-all'], fn: fetchClients, msg: 'Dữ liệu khách hàng', stale: THIRTY_MINUTES },
            { key: ['contracts-all'], fn: fetchContracts, msg: 'Dữ liệu hợp đồng', stale: THIRTY_MINUTES },
            { key: ['zalo-users-all'], fn: fetchZaloUsers, msg: 'Dữ liệu Zalo', stale: THIRTY_MINUTES },
        ]

        try {
            // Start all prefetches in parallel for maximum speed
            await Promise.allSettled(tasks.map(t => 
                queryClient.prefetchQuery({
                    queryKey: t.key,
                    queryFn: async () => {
                        try {
                            const res = await t.fn()
                            trackProgress(`Đã tải xong ${t.msg.toLowerCase()}`)
                            return res.success ? (res.data ?? []) : []
                        } catch (e) {
                            console.error(`Prefetch error for ${t.msg}:`, e)
                            trackProgress(`Bỏ qua ${t.msg.toLowerCase()} (có lỗi)`)
                            return []
                        }
                    },
                    staleTime: t.stale,
                })
            ))
        } catch (error) {
            console.error('Critical error during prefetch:', error)
        } finally {
            // Safety: Ensure we always finish initialization even if some tasks failed to report progress
            if (completed < total) {
                onComplete?.()
            }
        }
    }, [queryClient, onProgress, onComplete])

    // Initial load on mount
    React.useEffect(() => {
        if (hasPrefetched.current) return
        hasPrefetched.current = true
        prefetchAll()
    }, [prefetchAll])

    // Background auto-sync every 30 minutes (silent — no loading indicators shown)
    React.useEffect(() => {
        const interval = setInterval(() => {
            // Invalidate business data only (configs stay Infinity)
            queryClient.invalidateQueries({ queryKey: ['clients-all'] })
            queryClient.invalidateQueries({ queryKey: ['contracts-all'] })
            queryClient.invalidateQueries({ queryKey: ['zalo-users-all'] })
        }, THIRTY_MINUTES)
        return () => clearInterval(interval)
    }, [queryClient])

    return null
}
