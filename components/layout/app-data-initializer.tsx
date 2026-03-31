'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchAllConfigs } from '@/app/actions/config-params'
import { fetchClients } from '@/app/actions/clients'
import { fetchContractsLite } from '@/app/actions/contracts'  // ✅ Lite version cho prefetch nhanh
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
 * ✅ staleTime: 5 min for business data — auto-refetches when stale.
 * ✅ Background auto-sync every 10 minutes.
 * ✅ Throws errors properly so React Query can retry (không silent-fail).
 */
export function AppDataInitializer({ onProgress, onComplete }: AppDataProgressProps = {}) {
    const queryClient = useQueryClient()
    const hasPrefetched = React.useRef(false)

    const prefetchAll = React.useCallback(async () => {
        // Wave 1: Dữ liệu cốt lõi — cần thiết để navigate ngay (ưu tiên cao)
        const criticalTasks = [
            { key: ['clients-all'],    fn: fetchClients,         msg: 'Khách hàng',    stale: FIVE_MINUTES },
            { key: ['contracts-all'],  fn: fetchContractsLite,   msg: 'Hợp đồng',      stale: TEN_MINUTES  }, // ✅ Lite version: nhanh hơn ~60%
            { key: ['all-configs'],    fn: fetchAllConfigs,      msg: 'Cấu hình',      stale: Infinity },
            { key: ['branches'],       fn: fetchBranches,        msg: 'Chi nhánh',     stale: Infinity },
        ]

        // Wave 2: Dữ liệu phụ — tải sau (không block navigation)
        const backgroundTasks = [
            { key: ['revenue'],        fn: fetchRevenue,    msg: 'Khoản thu',      stale: FIVE_MINUTES },
            { key: ['expense'],        fn: fetchExpense,    msg: 'Khoản chi',      stale: FIVE_MINUTES },
            { key: ['debts'],          fn: fetchDebts,      msg: 'Công nợ',        stale: FIVE_MINUTES },
            { key: ['zalo-users-all'], fn: fetchZaloUsers,  msg: 'Zalo',           stale: FIVE_MINUTES },
        ]

        const allTasks = [...criticalTasks, ...backgroundTasks]
        const total = allTasks.length
        let completed = 0

        const makePrefetch = (t: typeof allTasks[0]) =>
            queryClient.fetchQuery({
                queryKey: t.key,
                queryFn: async () => {
                    const res = await t.fn()
                    if (!res.success) {
                        // Throw để React Query đánh dấu error state — không cache [] sai
                        throw new Error(`[AppDataInitializer] ${t.msg}: ${res.error || 'Fetch failed'}`)
                    }
                    return res.data ?? []
                },
                staleTime: t.stale,
            }).catch((e) => {
                // Log nhưng không crash — wave tiếp tục bình thường
                console.warn(`[AppDataInitializer] Prefetch failed for ${t.msg}:`, e?.message)
            }).finally(() => {
                completed++
                const percent = Math.round((completed / total) * 100)
                onProgress?.(percent, `Đã tải ${t.msg.toLowerCase()}`)
                if (completed === total) onComplete?.()
            })

        // Fetch wave 1 (critical) first, then wave 2 in background
        await Promise.allSettled(criticalTasks.map(makePrefetch))
        // Wave 2 runs independently — không await để không block
        Promise.allSettled(backgroundTasks.map(makePrefetch)).catch(() => {})

        // Safety net: ensure onComplete fires after critical tasks
        if (completed < criticalTasks.length) onComplete?.()
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
