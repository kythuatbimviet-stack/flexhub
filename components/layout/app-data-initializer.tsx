'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { fetchAllConfigs } from '@/app/actions/config-params'
import { fetchClients } from '@/app/actions/clients'
import { fetchContracts } from '@/app/actions/contracts'
import { fetchBranches } from '@/app/actions/branches'
import { fetchZaloUsers } from '@/app/actions/zalo-users'

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
export function AppDataInitializer() {
    const queryClient = useQueryClient()
    const hasPrefetched = React.useRef(false)

    const prefetchAll = React.useCallback(async () => {
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: ['all-configs'],
                queryFn: async () => {
                    const res = await fetchAllConfigs()
                    return res.success ? res.data : {}
                },
                staleTime: Infinity,
            }),
            queryClient.prefetchQuery({
                queryKey: ['clients-all'],
                queryFn: async () => {
                    const res = await fetchClients()
                    return res.success ? (res.data ?? []) : []
                },
                staleTime: THIRTY_MINUTES,
            }),
            queryClient.prefetchQuery({
                queryKey: ['contracts-all'],
                queryFn: async () => {
                    const res = await fetchContracts()
                    return res.success ? (res.data ?? []) : []
                },
                staleTime: THIRTY_MINUTES,
            }),
            queryClient.prefetchQuery({
                queryKey: ['branches'],
                queryFn: async () => {
                    const res = await fetchBranches()
                    return res.success ? (res.data ?? []) : []
                },
                staleTime: Infinity,
            }),
            queryClient.prefetchQuery({
                queryKey: ['zalo-users-all'],
                queryFn: async () => {
                    const res = await fetchZaloUsers()
                    return res.success ? (res.data ?? []) : []
                },
                staleTime: THIRTY_MINUTES,
            }),
        ])
    }, [queryClient])

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
