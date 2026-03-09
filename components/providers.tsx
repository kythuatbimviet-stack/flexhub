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

// Config tables: Infinity. Business data: 30 mins.
// Individual queries can override via their own staleTime.
const BUSINESS_DATA_KEYS = ['clients-all', 'contracts-all']

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Default: Infinity for ref/config data
                staleTime: Infinity,
                // Keep unused data in cache for 24h
                gcTime: 24 * 60 * 60 * 1000,
                // Don't retry hard failures aggressively
                retry: 1,
                // Don't refetch when window refocuses (manual control only)
                refetchOnWindowFocus: false,
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
        // Business data uses 30 min staleTime — set after init
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
                buster: 'v2', // bumped to clear stale cache from previous format
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
