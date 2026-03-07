'use client'

import React from 'react'
import {
    Search,
    Filter,
    TrendingUp,
    Plus,
    Calendar,
    User,
    Edit2,
    Trash2,
    RotateCcw,
    FileDown,
    Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format, isWithinInterval, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { fetchWeightRecords, deleteWeightRecord } from '@/app/actions/weight-tracking'
import { fetchClients } from '@/app/actions/clients'
import { WeightChart } from '@/components/weight-tracking/weight-chart'
import { AddWeightDialog } from '@/components/weight-tracking/add-weight-dialog'
import { EditWeightDialog } from '@/components/weight-tracking/edit-weight-dialog'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function WeightTrackingPage() {
    const [selectedClientId, setSelectedClientId] = React.useState<string>('all')
    const [startDate, setStartDate] = React.useState<string>('')
    const [endDate, setEndDate] = React.useState<string>('')
    const [editingRecord, setEditingRecord] = React.useState<any>(null)
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)

    const { data: recordsResult, isLoading: isLoadingRecords, refetch: refetchRecords } = useQuery({
        queryKey: ['weight-records'],
        queryFn: () => fetchWeightRecords()
    })

    const { data: clientsResult } = useQuery({
        queryKey: ['clients-simple'],
        queryFn: () => fetchClients()
    })

    const records: any[] = (recordsResult?.success && recordsResult.data) ? recordsResult.data : []
    const clients: any[] = (clientsResult?.success && clientsResult.data) ? clientsResult.data : []
    const refetchAll = () => {
        refetchRecords()
    }

    const filteredRecords = React.useMemo(() => {
        return records.filter((record: any) => {
            const matchesClient = selectedClientId === 'all' || record.client_id === selectedClientId

            let matchesDate = true
            if (startDate || endDate) {
                const recordDate = parseISO(record.measurement_date)
                const start = startDate ? parseISO(startDate) : new Date(0)
                const end = endDate ? parseISO(endDate) : new Date()

                matchesDate = isWithinInterval(recordDate, { start, end })
            }

            return matchesClient && matchesDate
        })
    }, [records, selectedClientId, startDate, endDate])

    // Data for chart: only show if a specific client is selected
    const chartData = React.useMemo(() => {
        if (selectedClientId === 'all') return []
        return filteredRecords
    }, [filteredRecords, selectedClientId])

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
            const result = await deleteWeightRecord(id)
            if (result.success) {
                toast.success('Đã xóa bản ghi thành công')
                refetchRecords()
            } else {
                toast.error('Lỗi khi xóa: ' + result.error)
            }
        }
    }

    const exportToExcel = () => {
        const dataToExport = filteredRecords.map((r: any) => ({
            'Khách hàng': r.clients?.member_name || 'N/A',
            'Ngày đo': format(new Date(r.measurement_date), 'dd/MM/yyyy'),
            'Cân nặng (kg)': r.weight,
            'Số đo': r.measurements || '',
            'Ngày đo tiếp theo': r.next_measurement_date ? format(new Date(r.next_measurement_date), 'dd/MM/yyyy') : ''
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'WeightTracking')
        XLSX.writeFile(wb, 'lo_trinh_tang_can.xlsx')
        toast.success('Đã xuất file Excel')
    }

    const resetFilters = () => {
        setSelectedClientId('all')
        setStartDate('')
        setEndDate('')
        toast.info('Đã xóa bộ lọc')
    }

    return (
        <div className="space-y-1.5 max-w-[1600px] mx-auto font-inter pb-10">
            <EditWeightDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                record={editingRecord}
                onSuccess={refetchAll}
                clients={clients}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Activity className="w-8 h-8 text-red-500" />
                        Lộ trình tăng cân
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Theo dõi và quản lý cân nặng của khách hàng theo thời gian.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={exportToExcel}
                        className="rounded-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 h-11 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                        <FileDown className="w-4.5 h-4.5 mr-2" />
                        Xuất Excel
                    </Button>
                    <AddWeightDialog onSuccess={refetchAll} clients={clients} />
                </div>
            </div>

            {/* Optimized Compact Filter Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 transition-all duration-300 py-0">
                <div className="py-1 px-1 sm:px-1.5 border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-gray-800/20 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        {/* Search & Toggle Row */}
                        <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1">
                                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                    <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm px-3 shadow-none">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <SelectValue placeholder="Khách hàng" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                        <SelectItem value="all">Tất cả khách hàng</SelectItem>
                                        {clients?.map((client: any) => (
                                            <SelectItem key={client.id} value={client.id}>{client.member_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Mobile Filter Toggle */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={cn(
                                    "lg:hidden h-9 w-9 rounded-lg border-gray-200 dark:border-gray-800 transition-all",
                                    showMobileFilters ? "bg-red-50 text-red-600 border-red-200 shadow-sm" : "bg-white dark:bg-gray-800/50"
                                )}
                            >
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Filters Content */}
                        <AnimatePresence>
                            {(showMobileFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                                <motion.div
                                    initial={typeof window !== 'undefined' && window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden lg:overflow-visible lg:flex lg:flex-row lg:items-center gap-2"
                                >
                                    <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center pt-2 lg:pt-0">
                                        <div className="relative flex-1 lg:w-44">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="pl-10 h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm shadow-none"
                                            />
                                        </div>
                                        <div className="relative flex-1 lg:w-44">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="pl-10 h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 focus:ring-red-500 text-xs sm:text-sm shadow-none"
                                            />
                                        </div>

                                        <Button
                                            variant="ghost"
                                            onClick={resetFilters}
                                            className="h-9 px-3 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all shrink-0 col-span-2 lg:col-span-1 justify-center lg:w-auto"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2 lg:mr-0" />
                                            <span className="lg:hidden text-sm font-medium">Làm mới bộ lọc</span>
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Card>

            {selectedClientId !== 'all' && (
                <div className="px-1">
                    <WeightChart data={chartData} />
                </div>
            )}

            {/* Table Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white dark:bg-gray-900 transition-all duration-500">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-50 dark:border-gray-800 hover:bg-transparent border-t-0">
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 pl-6">Khách hàng</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Ngày đo</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Cân nặng</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">Tiếp theo</TableHead>
                                <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 text-right pr-8">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingRecords ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-gray-400 text-sm">Đang tải dữ liệu...</TableCell>
                                </TableRow>
                            ) : filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-gray-400 text-sm">Không có dữ liệu phù hợp</TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((record: any) => (
                                    <TableRow key={record.id} className="border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 group transition-colors">
                                        <TableCell className="py-2 pl-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-normal text-gray-900 dark:text-gray-100">{record.clients?.member_name}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">{record.client_id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                                            {format(new Date(record.measurement_date), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-[10px] font-medium uppercase tracking-widest bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                                                {record.weight} kg
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                                            {record.next_measurement_date ? format(new Date(record.next_measurement_date), 'dd/MM/yyyy') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingRecord(record)
                                                        setIsEditOpen(true)
                                                    }}
                                                    className="w-8 h-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(record.id)}
                                                    className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
