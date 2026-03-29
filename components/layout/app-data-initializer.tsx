'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchAllConfigs } from '@/app/actions/config-params'
import { fetchClients } from '@/app/actions/clients'
import { fetchContracts } from '@/app/actions/contracts'
import { fetchBranches } from '@/app/actions/branches'
import { fetchZaloUsers } from '@/app/actions/zalo-users'
import { fetchRevenue, fetchExpense } from '@/app/actions/financial'
import { fetchDebts } from '@/app/actions/debts'

export interface AppDataProgressProps {
    onProgress?: (percent: number, message: string) => void
    onComplete?: () => void
}

const FIVE_MINUTES = 5 * 60 * 1000
const TEN_MINUTES = 10 * 60 * 1000

/**
 * AppDataInitializer — Renders nothing. Prefetches all critical data into
 * the React Query cache silently after login.
 *
 * ✅ No longer blocks the UI — layout renders immediately.
 * ✅ Data is served from IndexedDB cache on subsequent visits (near-instant).
 * ✅ staleTime: 5 min for business data — auto-refetches when stale.
 * ✅ Background auto-sync every 10 minutes.
 */
export function AppDataInitializer({ onProgress, onComplete }: AppDataProgressProps = {}) {
    const queryClient = useQueryClient()
    const hasPrefetched = React.useRef(false)

    const prefetchAll = React.useCallback(async () => {
        const tasks = [
            { key: ['clients-all'],    fn: fetchClients,    msg: 'Khách hàng',    stale: FIVE_MINUTES },
            { key: ['contracts-all'],  fn: fetchContracts,  msg: 'Hợp đồng',      stale: FIVE_MINUTES },
            { key: ['revenue'],        fn: fetchRevenue,    msg: 'Khoản thu',      stale: FIVE_MINUTES },
            { key: ['expense'],        fn: fetchExpense,    msg: 'Khoản chi',      stale: FIVE_MINUTES },
            { key: ['debts'],          fn: fetchDebts,      msg: 'Công nợ',        stale: FIVE_MINUTES },
            { key: ['zalo-users-all'], fn: fetchZaloUsers,  msg: 'Zalo',           stale: FIVE_MINUTES },
            { key: ['all-configs'],    fn: fetchAllConfigs, msg: 'Cấu hình',       stale: Infinity },
            { key: ['branches'],       fn: fetchBranches,   msg: 'Chi nhánh',      stale: Infinity },
        ]

        const total = tasks.length
        let completed = 0

        await Promise.allSettled(tasks.map(t =>
            queryClient.prefetchQuery({
                queryKey: t.key,
                queryFn: async () => {
                    try {
                        const res = await t.fn()
                        return res.success ? (res.data ?? []) : []
                    } catch (e) {
                        console.warn(`[AppDataInitializer] Prefetch failed for ${t.msg}:`, e)
                        return []
                    } finally {
                        completed++
                        const percent = Math.round((completed / total) * 100)
                        onProgress?.(percent, `Đã tải ${t.msg.toLowerCase()}`)
                        if (completed === total) onComplete?.()
                    }
                },
                staleTime: t.stale,
            })
        ))

        // Safety net: ensure onComplete fires even if some tasks errored silently
        if (completed < total) onComplete?.()
    }, [queryClient, onProgress, onComplete])

    // One-shot prefetch on mount
    React.useEffect(() => {
        if (hasPrefetched.current) return
        hasPrefetched.current = true
        prefetchAll()
    }, [prefetchAll])

    // Background auto-sync every 10 minutes (silent — no loading indicators shown)
    React.useEffect(() => {
        const interval = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: ['clients-all'] })
            queryClient.invalidateQueries({ queryKey: ['contracts-all'] })
            queryClient.invalidateQueries({ queryKey: ['revenue'] })
            queryClient.invalidateQueries({ queryKey: ['expense'] })
            queryClient.invalidateQueries({ queryKey: ['debts'] })
            queryClient.invalidateQueries({ queryKey: ['zalo-users-all'] })
        }, TEN_MINUTES)
        return () => clearInterval(interval)
    }, [queryClient])

    return null
}
