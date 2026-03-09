'use client'

import * as React from 'react'
import { useQueryClient, useIsFetching } from '@tanstack/react-query'
import { RotateCcw, RefreshCw, Wifi } from 'lucide-react'
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
    const queryClient = useQueryClient()
    const isFetching = useIsFetching()
    const [lastSync, setLastSync] = React.useState(() => new Date())
    const [spinning, setSpinning] = React.useState(false)
    const relativeTime = useRelativeTime(lastSync)

    const handleHardRefresh = async () => {
        setSpinning(true)
        try {
            await queryClient.invalidateQueries()
            await queryClient.refetchQueries({ type: 'active' })
            setLastSync(new Date())
            toast.success('Đã đồng bộ dữ liệu mới nhất', { duration: 2000 })
        } finally {
            setTimeout(() => setSpinning(false), 800)
        }
    }

    const isLoading = isFetching > 0 || spinning

    return (
        <TooltipProvider>
            <div className="flex items-center gap-1">
                {/* Sync status label */}
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 select-none">
                    <span
                        className={cn(
                            'w-1.5 h-1.5 rounded-full transition-colors',
                            isLoading
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-emerald-400'
                        )}
                    />
                    {isLoading ? 'Đang đồng bộ...' : `Cập nhật ${relativeTime}`}
                </div>

                {/* Hard Refresh button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleHardRefresh}
                            disabled={isLoading}
                            className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full disabled:opacity-50 transition-all"
                        >
                            {isLoading ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <RotateCcw className="w-4 h-4" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                        Làm mới dữ liệu
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}
