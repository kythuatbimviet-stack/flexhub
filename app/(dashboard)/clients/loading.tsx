import { Skeleton } from '@/components/ui/skeleton'

/**
 * Next.js loading.tsx for /clients route.
 * Shows a table skeleton that matches the exact layout of the clients page.
 */
export default function ClientsLoading() {
    return (
        <div className="space-y-3 font-inter pb-10 animate-pulse">
            {/* Page header */}
            <div className="flex justify-between items-center px-1 pt-1">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-72 rounded-lg" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-11 w-32 rounded-xl" />
                    <Skeleton className="h-11 w-36 rounded-xl" />
                </div>
            </div>

            {/* Status tabs */}
            <div className="flex gap-2 px-1 overflow-hidden">
                {[80, 64, 80, 72, 60].map((w, i) => (
                    <Skeleton key={i} className={`h-9 w-${w} rounded-lg flex-shrink-0`} style={{ width: w + 8 }} />
                ))}
            </div>

            {/* Filter bar */}
            <div className="rounded-xl bg-white dark:bg-gray-900 shadow-sm p-2">
                <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1 max-w-xs rounded-lg" />
                    <Skeleton className="h-9 w-44 rounded-lg" />
                    <Skeleton className="h-9 w-44 rounded-lg" />
                    <Skeleton className="h-9 w-44 rounded-lg" />
                    <Skeleton className="h-9 w-36 rounded-lg" />
                </div>
                <div className="flex items-center justify-between mt-2 px-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Skeleton className="h-4 w-24 rounded" />
                    <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-7 w-7 rounded-lg" />)}
                    </div>
                </div>
            </div>

            {/* Table skeleton */}
            <div className="rounded-xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-20 rounded ml-8" />
                    <Skeleton className="h-4 w-28 rounded ml-8" />
                    <Skeleton className="h-4 w-20 rounded ml-8" />
                    <Skeleton className="h-4 w-16 rounded ml-auto" />
                </div>
                {/* Table rows */}
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 dark:border-gray-800"
                        style={{ opacity: 1 - i * 0.07 }}
                    >
                        <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                        {/* Avatar + name */}
                        <div className="flex items-center gap-3 min-w-[160px]">
                            <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-28 rounded" />
                                <Skeleton className="h-3 w-16 rounded" />
                            </div>
                        </div>
                        {/* Contact */}
                        <div className="hidden md:block space-y-1.5 min-w-[140px] ml-8">
                            <Skeleton className="h-4 w-28 rounded" />
                            <Skeleton className="h-3 w-36 rounded" />
                        </div>
                        {/* PT & branch */}
                        <div className="hidden sm:block space-y-1.5 min-w-[140px] ml-8">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="h-3 w-20 rounded" />
                        </div>
                        {/* Metrics */}
                        <div className="hidden lg:block space-y-1.5 min-w-[140px] ml-8">
                            <Skeleton className="h-4 w-32 rounded" />
                            <Skeleton className="h-3 w-28 rounded" />
                        </div>
                        {/* Status badge */}
                        <Skeleton className="h-6 w-20 rounded-xl ml-auto" />
                        {/* Actions */}
                        <div className="flex gap-1 ml-4">
                            {[1,2,3,4].map(b => <Skeleton key={b} className="h-8 w-8 rounded-lg" />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
