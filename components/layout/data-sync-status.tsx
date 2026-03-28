'use client'

import * as React from 'react'
import { useQueryClient, useIsFetching } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { RotateCcw, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

function useRelativeTime(date: Date) {
    const [label, setLabel] = React.useState('')

    React.useEffect(() => {
        const update = () => {
            const diff = Math.floor((Date.now() - date.getTime()) / 1000)
            if (diff < 60) setLabel('vừa xong')
            else if (diff < 3600) setLabel(`${Math.floor(diff / 60)} phút trước`)
            else if (diff < 86400) setLabel(`${Math.floor(diff / 3600)} giờ trước`)
            else setLabel(date.toLocaleDateString('vi-VN'))
        }
        update()
        const id = setInterval(update, 60_000)
        return () => clearInterval(id)
    }, [date])

    return label
}

export function DataSyncStatus() {
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const isFetching = useIsFetching()
    const [lastSync, setLastSync] = React.useState(() => new Date())
    const [spinning, setSpinning] = React.useState(false)
    const [isRefreshing, setIsRefreshing] = React.useState(false)
    const relativeTime = useRelativeTime(lastSync)

    const handleHardRefresh = async () => {
        setIsRefreshing(true)
        setSpinning(true)
        const startTime = performance.now()
        try {
            // 1. Determine which queries to refresh based on current page
            // Logic: we only refresh what's relevant to the current tab
            const paths = pathname.split('/')
            const currentRoute = paths[paths.length - 1] || 'dashboard'

            let targetKeys: string[][] = []
            let targetLabel = 'toàn bộ dữ liệu'

            switch (currentRoute) {
                case 'clients':
                    targetKeys = [['clients-all'], ['clients-page']]
                    targetLabel = 'dữ liệu Khách hàng'
                    break
                case 'contracts':
                    targetKeys = [['contracts-all']]
                    targetLabel = 'dữ liệu Hợp đồng'
                    break
                case 'revenue':
                    targetKeys = [['revenue']]
                    targetLabel = 'dữ liệu Khoản thu'
                    break
                case 'expense':
                    targetKeys = [['expense']]
                    targetLabel = 'dữ liệu Khoản chi'
                    break
                case 'debts':
                    targetKeys = [['debts']]
                    targetLabel = 'dữ liệu Công nợ'
                    break
                case 'zalo-users':
                    targetKeys = [['zalo-users-all']]
                    targetLabel = 'dữ liệu Zalo'
                    break
                case 'dashboard':
                case '':
                    targetKeys = [['dashboard-metrics'], ['revenue'], ['expense'], ['contracts-all']]
                    targetLabel = 'dữ liệu Tổng quan'
                    break
                default:
                    // For other pages, just refresh the core business caches
                    targetKeys = [['clients-all'], ['contracts-all'], ['revenue'], ['expense'], ['debts']]
                    targetLabel = 'nghiệp vụ cơ bản'
            }

            // 2. Invalidate and refetch ONLY the targets
            if (targetKeys.length > 0) {
                await Promise.allSettled(
                    targetKeys.map(key => queryClient.refetchQueries({ queryKey: key, type: 'active' }))
                )
            } else {
                // Fallback to active queries if no targets found
                await queryClient.refetchQueries({ type: 'active' })
            }

            const durationSeconds = ((performance.now() - startTime) / 1000).toFixed(2)
            setLastSync(new Date())
            toast.success(`Đã hoàn tất đồng bộ (${durationSeconds}s)`, {
                duration: 2500
            })
        } catch (error) {
            console.error('Refresh error:', error)
            toast.error('Lỗi khi đồng bộ dữ liệu')
        } finally {
            setIsRefreshing(false)
            setTimeout(() => setSpinning(false), 800)
        }
    }

    // isLoading for the pulsing dot (any fetch)
    const isGlobalFetching = isFetching > 0
    // isLoading for the manual refresh action (text and button state)
    const isManualLoading = isRefreshing || spinning

    return (
        <TooltipProvider>
            <div className="flex items-center gap-1">
                {/* Sync status label */}
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 select-none">
                    <span
                        className={cn(
                            'w-1.5 h-1.5 rounded-full transition-colors',
                            isGlobalFetching
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-emerald-400'
                        )}
                    />
                    {isManualLoading ? (isRefreshing ? 'Đang ưu tiên đồng bộ...' : 'Đang đồng bộ...') : `Cập nhật ${relativeTime}`}
                </div>

                {/* Hard Refresh button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleHardRefresh}
                            disabled={isRefreshing}
                            className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full disabled:opacity-50 transition-all"
                        >
                            {isManualLoading ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                            ) : (
                                <RotateCcw className="w-4 h-4" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                        Làm mới dữ liệu (Ưu tiên khách hàng & tài chính)
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}
