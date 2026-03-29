import { Skeleton } from '@/components/ui/skeleton'

/**
 * Next.js App Router loading.tsx
 * Auto-shown during page navigation & initial hydration.
 * Matches the visual layout of the dashboard content area.
 */
export default function DashboardLoading() {
    return (
        <div className="space-y-10 font-inter pb-20 animate-pulse">
            {/* Hero skeleton */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-400/30 to-red-500/20 p-8 md:p-10">
                <div className="space-y-4 max-w-xl">
                    <Skeleton className="h-9 w-64 rounded-xl bg-white/20" />
                    <Skeleton className="h-5 w-96 rounded-lg bg-white/15" />
                    <Skeleton className="h-5 w-72 rounded-lg bg-white/15" />
                    <Skeleton className="h-10 w-44 rounded-2xl bg-white/20 mt-4" />
                </div>
            </div>

            {/* Section skeletons */}
            {[1, 2, 3].map((group) => (
                <div key={group} className="space-y-5">
                    {/* Section header */}
                    <div className="flex items-center gap-3 px-2">
                        <Skeleton className="w-2 h-8 rounded-full" />
                        <Skeleton className="h-7 w-48 rounded-lg" />
                    </div>
                    {/* Cards grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map((card) => (
                            <div
                                key={card}
                                className="rounded-3xl p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4"
                            >
                                <Skeleton className="h-14 w-14 rounded-2xl" />
                                <Skeleton className="h-5 w-24 rounded-lg" />
                                <Skeleton className="h-4 w-full rounded-md" />
                                <Skeleton className="h-4 w-3/4 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
