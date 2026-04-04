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
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
    Calendar, 
    ChevronDown, 
    ChevronLeft,
    ChevronRight, 
    CheckCircle2, 
    XCircle, 
    HelpCircle,
    Building2,
    Dumbbell
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { ClientLogDetails } from './client-log-details'

interface TableProps {
    data: any[]
    isLoading: boolean
    branches: any[]
    total: number
    page: number
    pageSize: number
    onPageChange: (page: number) => void
    startDate: string
    endDate: string
}

export function TrainingLogTable({ 
    data, 
    isLoading, 
    branches, 
    total, 
    page, 
    pageSize, 
    onPageChange,
    startDate,
    endDate
}: TableProps) {
    const [expandedClients, setExpandedClients] = React.useState<Set<string>>(new Set())

    const totalPages = Math.ceil(total / pageSize)

    const toggleExpand = (clientId: string) => {
        const newExpanded = new Set(expandedClients)
        if (newExpanded.has(clientId)) {
            newExpanded.delete(clientId)
        } else {
            newExpanded.add(clientId)
        }
        setExpandedClients(newExpanded)
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

    if (data.length === 0) {
        return (
            <Card className="border-none shadow-none rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col items-center gap-3 py-16">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-[14px] font-medium text-gray-400">Không tìm thấy dữ liệu tập luyện</p>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-0 hover:bg-transparent">
                            <TableHead className="w-12 h-11"></TableHead>
                            <TableHead className="text-[12px] font-medium text-slate-900 h-11 pl-4">Hội viên</TableHead>
                            <TableHead className="text-[12px] font-medium text-emerald-700 h-11 text-center">Đã tập</TableHead>
                            <TableHead className="text-[12px] font-medium text-red-700 h-11 text-center">Nghỉ tập</TableHead>
                            <TableHead className="text-[12px] font-medium text-orange-700 h-11 text-center">Tự tập</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((group) => {
                            const isExpanded = expandedClients.has(group.clientId)
                            return (
                                <React.Fragment key={group.clientId}>
                                    <TableRow 
                                        className={cn(
                                            "group border-gray-50 dark:border-gray-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer",
                                            isExpanded && "bg-slate-50/50 dark:bg-slate-800/50"
                                        )}
                                        onClick={() => toggleExpand(group.clientId)}
                                    >
                                        <TableCell className="w-12 py-4">
                                            <div className="flex justify-center items-center">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 pl-4">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-medium text-black dark:text-white line-clamp-1 capitalize">{group.client?.member_name || group.clientId}</span>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-[11px] text-slate-600 font-medium">PT: {group.client?.pt_name || 'N/A'}</span>
                                                    <span className="text-[11px] text-slate-400 font-medium">•</span>
                                                    <span className="text-[11px] text-slate-600 font-medium">{getBranchName(group.client?.branch_id)}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[16px] font-medium text-emerald-600">{group.stats.y}</span>
                                                <span className="text-[10px] font-medium text-emerald-500/60 tracking-wider">Buổi</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[16px] font-medium text-red-600">{group.stats.n}</span>
                                                <span className="text-[10px] font-medium text-red-500/60 tracking-wider">Buổi</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[16px] font-medium text-orange-600">{group.stats.td}</span>
                                                <span className="text-[10px] font-medium text-orange-500/60 tracking-wider">Buổi</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                    <TableRow className="hover:bg-transparent border-0 p-0 h-0">
                                        <TableCell colSpan={5} className="p-0 border-0">
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden bg-gray-50/50 dark:bg-gray-800/30"
                                                    >
                                                        <div className="p-4 sm:p-6 ml-12">
                                                            <ClientLogDetails 
                                                                clientId={group.clientId}
                                                                startDate={startDate}
                                                                endDate={endDate}
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <span className="text-[13px] font-medium text-slate-500">
                        Hiển thị {data.length} / {total} hội viên
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => onPageChange(page - 1)}
                            className="h-8 w-8 p-0 rounded-lg"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1 px-2">
                            <span className="text-[13px] font-bold text-red-600">{page}</span>
                            <span className="text-[13px] font-medium text-slate-400">/</span>
                            <span className="text-[13px] font-medium text-slate-600">{totalPages}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => onPageChange(page + 1)}
                            className="h-8 w-8 p-0 rounded-lg"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
