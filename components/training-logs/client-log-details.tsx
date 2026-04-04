'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClientLogsInRange } from '@/app/actions/training-logs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClientLogDetailsProps {
    clientId: string
    startDate: string
    endDate: string
}

export function ClientLogDetails({ clientId, startDate, endDate }: ClientLogDetailsProps) {
    const { data: result, isLoading } = useQuery({
        queryKey: ['client-training-logs', clientId, startDate, endDate],
        queryFn: () => fetchClientLogsInRange(clientId, startDate, endDate),
        enabled: !!clientId
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center gap-2 py-8">
                <div className="w-6 h-6 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
                <p className="text-[12px] font-medium text-gray-500">Đang tải lịch sử...</p>
            </div>
        )
    }

    const logs = result?.data || []

    if (logs.length === 0) {
        return (
            <div className="py-8 text-center text-[13px] text-gray-400 font-medium">
                Không có dữ liệu trong khoảng thời gian này
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-0 hover:bg-transparent">
                        <TableHead className="w-12 h-10"></TableHead>
                        <TableHead className="text-[12px] font-medium text-slate-900 h-10">Ngày tập</TableHead>
                        <TableHead className="text-[12px] font-medium text-slate-900 h-10 text-center">Trạng thái</TableHead>
                        <TableHead className="text-[12px] font-medium text-slate-900 h-10 text-right pr-6">Cập nhật lúc</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log: any) => (
                        <TableRow key={log.id} className="border-gray-50 dark:border-gray-800 hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors">
                            <TableCell className="w-12 py-3 text-center">
                                {log.status === 'Y' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                ) : log.status === 'N' ? (
                                    <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                ) : (
                                    <HelpCircle className="w-4 h-4 text-orange-500 mx-auto" />
                                )}
                            </TableCell>
                            <TableCell className="font-medium text-black dark:text-gray-100 text-[13px] py-3">
                                <div className="flex flex-col">
                                    <span>{format(parseISO(log.date), 'dd/MM/yyyy')}</span>
                                    <span className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
                                        {format(parseISO(log.date), 'eeee', { locale: vi })}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center py-3 px-2">
                                <span className={cn(
                                    "text-[10px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap",
                                    log.status === 'Y' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30" : 
                                    log.status === 'N' ? "bg-red-50 text-red-700 dark:bg-red-950/30" : 
                                    "bg-orange-50 text-orange-700 dark:bg-orange-950/30"
                                )}>
                                    {log.status === 'Y' ? 'Đã tập' : log.status === 'N' ? 'Nghỉ tập' : 'Tự tập'}
                                </span>
                            </TableCell>
                            <TableCell className="text-right py-3 pr-6 text-slate-500 dark:text-gray-500 text-[11px] tracking-tight tabular-nums font-medium">
                                {log.updated_at ? format(parseISO(log.updated_at), 'HH:mm dd/MM/yyyy', { locale: vi }) : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
