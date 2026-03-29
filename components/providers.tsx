'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { get, set, del } from 'idb-keyval'

// IndexedDB persister — data survives F5 & browser restart
const idbPersister = createAsyncStoragePersister({
    storage: {
        getItem: (key) => get(key),
        setItem: (key, value) => set(key, value),
        removeItem: (key) => del(key),
    },
    key: 'gymcrm-cache-v1',
})

const FIVE_MINUTES = 5 * 60 * 1000

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Business data: 5 min stale. Individual queries can override.
                staleTime: FIVE_MINUTES,
                // Keep unused data in cache for 24h (survives navigation)
                gcTime: 24 * 60 * 60 * 1000,
                // Don't retry hard failures aggressively
                retry: 1,
                // Auto-refresh when user switches back to this tab
                refetchOnWindowFocus: true,
                // Auto-refresh when network reconnects (e.g. phone hotspot)
                refetchOnReconnect: true,
            },
        },
    })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always make a new client
        return makeQueryClient()
    }
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient()

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister: idbPersister,
                maxAge: 24 * 60 * 60 * 1000, // 24h max cache age
                buster: 'v3', // bumped — staleTime & refetch policy changed
            }}
        >
            <NextThemesProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </NextThemesProvider>
        </PersistQueryClientProvider>
    )
}
