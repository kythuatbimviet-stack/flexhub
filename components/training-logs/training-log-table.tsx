'use client'

import * as React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Calendar, User, Building2, Dumbbell } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

interface TableProps {
    data: any[]
    isLoading: boolean
    branches: any[]
}

export function TrainingLogTable({ data, isLoading, branches }: TableProps) {
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Y':
                return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30'
            case 'N':
                return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30'
            case 'TĐ':
                return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/30'
            default:
                return 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-400'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Y': return 'Tập với PT'
            case 'N': return 'Nghỉ tập'
            case 'TĐ': return 'Tự tập'
            default: return status
        }
    }

    const getBranchName = (id: string) => {
        return branches.find(b => b.id === id)?.name || id
    }

    if (isLoading) {
        return (
            <Card className="border-none shadow-none rounded-2xl overflow-hidden bg-white dark:bg-gray-900 h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
                    <p className="text-[13px] font-medium text-gray-500">Đang tải dữ liệu...</p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="border-none shadow-none rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/30 dark:bg-gray-800/20 hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                            <TableHead className="w-[140px] text-[11px] font-medium text-gray-400 uppercase tracking-wider pl-6 py-4">Ngày tập</TableHead>
                            <TableHead className="w-[120px] text-[11px] font-medium text-gray-400 uppercase tracking-wider">Mã KH</TableHead>
                            <TableHead className="min-w-[180px] text-[11px] font-medium text-gray-400 uppercase tracking-wider">Hội viên</TableHead>
                            <TableHead className="min-w-[150px] text-[11px] font-medium text-gray-400 uppercase tracking-wider">Chi nhánh / PT</TableHead>
                            <TableHead className="text-[11px] font-medium text-gray-400 uppercase tracking-wider text-center">Trạng thái</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                                            <Calendar className="w-8 h-8 text-gray-200" />
                                        </div>
                                        <p className="text-[14px] font-medium text-gray-400">Không tìm thấy dữ liệu tập luyện</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((log) => (
                                <TableRow key={log.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-medium text-black dark:text-gray-100">
                                                {format(parseISO(log.date), 'dd/MM/yyyy')}
                                            </span>
                                            <span className="text-[11px] text-gray-500 capitalize">
                                                {format(parseISO(log.date), 'eeee', { locale: vi })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-[12px] font-mono text-red-600 dark:text-red-500 font-medium tracking-tight">
                                            {log.client_id}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-medium text-black dark:text-gray-100 leading-tight">
                                                {log.client?.member_name || 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3 h-3 text-gray-400" />
                                                <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                                    {getBranchName(log.client?.branch_id)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Dumbbell className="w-3 h-3 text-red-500" />
                                                <span className="text-[11px] font-medium text-gray-500">
                                                    PT: {log.client?.pt_name || 'Chưa gán'}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={cn("px-3 py-1 rounded-xl text-[11px] font-medium border-none", getStatusStyles(log.status))}>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                                {getStatusLabel(log.status)}
                                            </div>
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    )
}
