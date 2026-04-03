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

interface TableProps {
    data: any[]
    isLoading: boolean
    branches: any[]
}

export function TrainingLogTable({ data, isLoading, branches }: TableProps) {
    const [expandedClients, setExpandedClients] = React.useState<Set<string>>(new Set())

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
                                                                    {group.logs.map((log: any) => (
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
    )
}
