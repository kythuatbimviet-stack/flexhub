'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
    Plus, 
    Search, 
    FileDown, 
    FileUp, 
    MoreHorizontal, 
    Eye, 
    Pencil, 
    Trash2,
    HeartPulse,
    Filter,
    ExternalLink,
    ArrowUpDown,
    Calendar as CalendarIcon,
    Building2,
    Users as UsersIcon,
    ChevronDown,
    X as XIcon
} from 'lucide-react'
import { 
    format, 
    isWithinInterval, 
    startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth, 
    subWeeks, 
    addWeeks, 
    subMonths, 
    addMonths,
    parseISO,
    startOfDay,
    endOfDay
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'

import { fetchHealthProfiles, deleteHealthProfile, bulkDeleteHealthProfiles } from '@/app/actions/health-profiles'
import { fetchBranches } from '@/app/actions/branches'
import { HealthProfileDialog } from '@/components/health-profiles/health-profile-dialog'
import { ImportHealthDialog } from '@/components/health-profiles/import-health-dialog'
import { HealthProfileDetailsSheet } from '@/components/health-profiles/health-profile-details-sheet'
import { ClientDetailsSheet } from '@/components/clients/client-details-sheet'
import { cn } from '@/lib/utils'

export default function HealthProfilesPage() {
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = React.useState('')
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [importDialogOpen, setImportDialogOpen] = React.useState(false)
    const [selectedProfile, setSelectedProfile] = React.useState<any>(null)
    const [viewProfile, setViewProfile] = React.useState<any> (null)
    const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null)
    const [deleteId, setDeleteId] = React.useState<string | null>(null)
    const [selectedIds, setSelectedIds] = React.useState<string[]>([])

    // Filter states
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [ptFilter, setPtFilter] = React.useState('all')
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    })
    const [periodFilter, setPeriodFilter] = React.useState('all')
    const [showFilters, setShowFilters] = React.useState(false)

    const activeFiltersCount = React.useMemo(() => {
        let count = 0
        if (branchFilter !== 'all') count++
        if (ptFilter !== 'all') count++
        if (periodFilter !== 'all') count++
        return count
    }, [branchFilter, ptFilter, periodFilter])

    const { data: profiles = [], isLoading } = useQuery({
        queryKey: ['health-profiles'],
        queryFn: async () => {
            const res = await fetchHealthProfiles()
            return res.success ? res.data : []
        }
    })

    const deleteMutation = useMutation({
        mutationFn: deleteHealthProfile,
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Đã xóa hồ sơ sức khỏe')
                queryClient.invalidateQueries({ queryKey: ['health-profiles'] })
            } else {
                toast.error(res.error)
            }
            setDeleteId(null)
        }
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeleteHealthProfiles,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(`Đã xóa ${selectedIds.length} hồ sơ sức khỏe`)
                setSelectedIds([])
                queryClient.invalidateQueries({ queryKey: ['health-profiles'] })
            } else {
                toast.error(res.error)
            }
        }
    })

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredProfiles.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredProfiles.map((p: any) => p.id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} bản ghi đã chọn? Thao tác này không thể hoàn tác.`)) return
        bulkDeleteMutation.mutate(selectedIds)
    }

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: 30 * 60 * 1000
    })

    const ptOptions = React.useMemo(() => {
        return Array.from(new Set(profiles.map((p: any) => p.contracts?.trainer_name).filter(Boolean)))
    }, [profiles])

    const filteredProfiles = React.useMemo(() => {
        let result = profiles

        // Text Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter((p: any) => 
                p.contracts?.id?.toLowerCase().includes(q) ||
                p.contracts?.clients?.member_name?.toLowerCase().includes(q) ||
                p.contracts?.clients?.phone?.includes(q)
            )
        }

        // Branch Filter
        if (branchFilter !== 'all') {
            result = result.filter((p: any) => p.contracts?.branch_id === branchFilter)
        }

        // PT Filter
        if (ptFilter !== 'all') {
            result = result.filter((p: any) => p.contracts?.trainer_name === ptFilter)
        }

        // Time Filter
        const now = new Date()
        let startLimit: Date | null = null
        let endLimit: Date | null = null

        if (periodFilter !== 'all') {
            switch (periodFilter) {
                case 'this_week':
                    startLimit = startOfWeek(now, { weekStartsOn: 1 })
                    endLimit = endOfWeek(now, { weekStartsOn: 1 })
                    break
                case 'last_week':
                    startLimit = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
                    endLimit = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
                    break
                case 'next_week':
                    startLimit = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })
                    endLimit = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })
                    break
                case 'this_month':
                    startLimit = startOfMonth(now)
                    endLimit = endOfMonth(now)
                    break
                case 'last_month':
                    startLimit = startOfMonth(subMonths(now, 1))
                    endLimit = endOfMonth(subMonths(now, 1))
                    break
                case 'next_month':
                    startLimit = startOfMonth(addMonths(now, 1))
                    endLimit = endOfMonth(addMonths(now, 1))
                    break
                case 'custom':
                    startLimit = dateRange.from ? startOfDay(dateRange.from) : null
                    endLimit = dateRange.to ? endOfDay(dateRange.to) : null
                    break
            }
        }

        if (startLimit || endLimit) {
            result = result.filter((p: any) => {
                const createdAt = new Date(p.created_at)
                return (!startLimit || createdAt >= startLimit) && (!endLimit || createdAt <= endLimit)
            })
        }

        return result
    }, [profiles, searchQuery, branchFilter, ptFilter, periodFilter, dateRange])

    const stats = React.useMemo(() => {
        return {
            total: profiles.length,
            withMedical: profiles.filter((p: any) => 
                p.medical_cardiovascular || p.medical_blood_pressure || p.medical_diabetes || p.medical_asthma
            ).length,
            highBodyFat: profiles.filter((p: any) => p.body_fat && p.body_fat > 30).length
        }
    }, [profiles])

    const exportToExcel = () => {
        const dateStr = new Date().toISOString().slice(0, 10)
        if (filteredProfiles.length === 0) {
            // Xuất template mẫu
            const template = [{
                'Mã hợp đồng (*)': 'HD-001',
                'G\u1edbi t\u00ednh': 'Nam',
                'Chi\u1ec1u cao (cm)': 170,
                'C\u00e2n n\u1eb7ng (kg)': 72,
                'Tu\u1ed5i': 25,
                '% M\u1ee1 c\u01a1 th\u1ec3': 18.5,
                'Kinh nghi\u1ec7m': 'c\u00f3',
                'B\u1ee5ng (cm)': 80,
                'M\u00f4ng (cm)': 92,
                'Tim m\u1ea1ch': '',
                'Huy\u1ebft \u00e1p': '',
                'Ti\u1ec3u \u0111\u01b0\u1eddng': '',
            }]
            const ws = XLSX.utils.json_to_sheet(template)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Template')
            XLSX.writeFile(wb, `template_ho_so_suc_khoe.xlsx`)
            toast.success('Xu\u1ea5t file template m\u1eabu th\u00e0nh c\u00f4ng')
            return
        }
        const data = filteredProfiles.map((p: any) => ({
            'Ng\u00e0y t\u1ea1o': format(new Date(p.created_at), 'dd/MM/yyyy'),
            'M\u00e3 H\u0110': p.contract_id || '',
            'H\u1ecdc vi\u00ean': p.contracts?.clients?.member_name || '',
            'S\u0110T': p.contracts?.clients?.phone || '',
            'G\u1edbi t\u00ednh': p.gender || '',
            'Chi\u1ec1u cao (cm)': p.height || '',
            'C\u00e2n n\u1eb7ng (kg)': p.weight || '',
            '% M\u1ee1': p.body_fat || '',
            'Kinh nghi\u1ec7m': p.experience ? 'C\u00f3' : 'Kh\u00f4ng',
            'B\u1ee5ng (cm)': p.measurement_waist || '',
            'M\u00f4ng (cm)': p.measurement_hip || '',
            'Tim m\u1ea1ch': p.medical_cardiovascular || '',
            'Huy\u1ebft \u00e1p': p.medical_blood_pressure || '',
            'Ti\u1ec3u \u0111\u01b0\u1eddng': p.medical_diabetes || '',
            'Hen suy\u1ec5n': p.medical_asthma || '',
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'HoSoSucKhoe')
        XLSX.writeFile(wb, `ho_so_suc_khoe_${dateStr}.xlsx`)
        toast.success(`\u0110\u00e3 xu\u1ea5t ${data.length} h\u1ed3 s\u01a1`)
    }

    return (
        <div className="space-y-1.5 font-inter pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <HeartPulse className="w-8 h-8 text-red-600" />
                        HỒ SƠ SỨC KHỎE
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Theo dõi bệnh lý, thói quen và chỉ số sinh học của học viên.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setImportDialogOpen(true)} 
                                    className="rounded-xl font-bold w-11 h-11 p-0 border-dashed border-slate-300 hover:bg-slate-50 text-slate-600 shadow-sm"
                                >
                                    <FileUp className="w-5 h-5 text-blue-600" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="rounded-lg bg-blue-600 text-white border-none font-bold">
                                <p>Nhập Excel</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    onClick={exportToExcel}
                                    className="rounded-xl font-bold w-11 h-11 p-0 border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm"
                                >
                                    <FileDown className="w-5 h-5 text-emerald-600" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="rounded-lg bg-emerald-600 text-white border-none font-bold">
                                <p>Xuất Excel</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button onClick={() => { setSelectedProfile(null); setDialogOpen(true); }} className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 font-bold h-11 shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95">
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo hồ sơ mới
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
                <Card className="rounded-2xl border-none shadow-sm bg-blue-50 dark:bg-blue-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Tổng số hồ sơ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-blue-700 dark:text-blue-300">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-orange-50 dark:bg-orange-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Hội viên có bệnh lý</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-orange-700 dark:text-orange-300">{stats.withMedical}</div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-red-50 dark:bg-red-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Body Fat cao (&gt;30%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-700 dark:text-red-300">{stats.highBodyFat}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden mx-1">
                <CardHeader className="border-b bg-white dark:bg-slate-950 p-6">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3 flex-1">
                                <div className="relative w-full md:w-[300px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        placeholder="Tìm theo học viên..." 
                                        className="pl-10 h-10 bg-slate-50 border-none rounded-xl text-sm focus-visible:ring-red-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <Button 
                                    variant={showFilters ? "secondary" : "outline"}
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn(
                                        "h-10 rounded-xl gap-2 font-bold transition-all",
                                        showFilters ? "bg-slate-100 text-slate-900 border-slate-200" : "text-slate-500"
                                    )}
                                >
                                    <Filter className={cn("w-4 h-4", showFilters ? "text-red-600" : "text-slate-400")} />
                                    Bộ lọc
                                    {activeFiltersCount > 0 && (
                                        <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                                            {activeFiltersCount}
                                        </Badge>
                                    )}
                                </Button>

                                {showFilters && (
                                    <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="w-[160px]">
                                            <Select value={periodFilter} onValueChange={setPeriodFilter}>
                                                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none shadow-none text-xs font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                                                        <SelectValue placeholder="Thời gian" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                                    <SelectItem value="all">Tất cả thời gian</SelectItem>
                                                    <SelectItem value="this_week">Tuần này</SelectItem>
                                                    <SelectItem value="last_week">Tuần trước</SelectItem>
                                                    <SelectItem value="next_week">Tuần tới</SelectItem>
                                                    <SelectItem value="this_month">Tháng này</SelectItem>
                                                    <SelectItem value="last_month">Tháng trước</SelectItem>
                                                    <SelectItem value="next_month">Tháng tới</SelectItem>
                                                    <SelectItem value="custom">Tùy chọn...</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {periodFilter === 'custom' && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="h-10 rounded-xl bg-slate-50 border-none text-[11px] font-semibold gap-2">
                                                        <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                                                        {dateRange.from ? format(dateRange.from, "dd/MM") : 'Từ'} - {dateRange.to ? format(dateRange.to, "dd/MM") : 'Đến'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
                                                    <Calendar
                                                        mode="range"
                                                        selected={dateRange}
                                                        onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                                                        numberOfMonths={2}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}

                                        <div className="w-[160px]">
                                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none shadow-none text-xs font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-3.5 h-3.5 text-purple-500" />
                                                        <SelectValue placeholder="Chi nhánh" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                                    <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                                    {branches.map((b: any) => (
                                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="w-[180px]">
                                            <Select value={ptFilter} onValueChange={setPtFilter}>
                                                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none shadow-none text-xs font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <UsersIcon className="w-3.5 h-3.5 text-emerald-500" />
                                                        <SelectValue placeholder="Huấn luyện viên" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                                    <SelectItem value="all">Tất cả huấn luyện viên</SelectItem>
                                                    {ptOptions.map((pt: any) => (
                                                        <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                                {(activeFiltersCount > 0 || searchQuery) && (
                                    <Button 
                                        variant="outline" 
                                        className="rounded-xl h-10 px-4 text-slate-500 font-bold gap-2 border-slate-200 hover:bg-slate-50"
                                        onClick={() => {
                                            setSearchQuery(''); setBranchFilter('all'); setPtFilter('all');
                                            setPeriodFilter('all'); setDateRange({ from: undefined, to: undefined });
                                            setShowFilters(false);
                                        }}
                                    >
                                        <XIcon className="w-4 h-4" />
                                        Xóa lọc
                                    </Button>
                                )}
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={exportToExcel}><FileDown className="w-4 h-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-900 border-none text-white font-bold rounded-lg text-[10px]">Xuất Excel</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                        {selectedIds.length} đã chọn
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    className="h-8 text-[11px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 px-3"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    Xóa tất cả
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <TooltipProvider delayDuration={0}>
                        <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50">
                                <TableHead className="w-[40px] px-1 text-center">
                                    <Checkbox
                                        checked={selectedIds.length === filteredProfiles.length && filteredProfiles.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded border-slate-300"
                                    />
                                </TableHead>
                                <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">Ngày tạo</TableHead>
                                <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">Mã HĐ</TableHead>
                                <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">Học viên</TableHead>
                                <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">Chỉ số (H/W/BF)</TableHead>
                                <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">Số đo bụng/mông</TableHead>
                                <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">Bệnh lý</TableHead>
                                <TableHead className="font-bold py-4 pr-6 text-right text-xs uppercase tracking-wider">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-400">Đang tải dữ liệu...</TableCell></TableRow>
                            ) : filteredProfiles.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-400">Không tìm thấy hồ sơ nào.</TableCell></TableRow>
                            ) : filteredProfiles.map((p: any) => (
                                <TableRow key={p.id} className={cn("group hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0", selectedIds.includes(p.id) && "bg-red-50/30 dark:bg-red-900/10")}>
                                    <TableCell className="px-1 text-center">
                                        <Checkbox
                                            checked={selectedIds.includes(p.id)}
                                            onCheckedChange={() => toggleSelect(p.id)}
                                            className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                        />
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="text-sm font-medium">
                                            {(() => {
                                                try {
                                                    return p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy') : '---'
                                                } catch (e) {
                                                    return '---'
                                                }
                                            })()}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            {(() => {
                                                try {
                                                    return p.created_at ? format(new Date(p.created_at), 'HH:mm') : '--:--'
                                                } catch (e) {
                                                    return '--:--'
                                                }
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Badge variant="outline" className="rounded-lg font-mono text-[10px] bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-none">
                                            {p.contract_id?.split('-').pop() || '---'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div 
                                            className="cursor-pointer group/name inline-block" 
                                            onClick={() => setSelectedClientId(p.contracts?.client_id)}
                                        >
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover/name:text-red-600 group-hover/name:underline decoration-red-200 transition-colors uppercase tracking-tight">{p.contracts?.clients?.member_name || 'Học viên ẩn'}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium italic">
                                                {p.contracts?.clients?.phone || '---'}
                                                <ExternalLink className="w-3 h-3 opacity-0 group-hover/name:opacity-100 transition-all text-red-500" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div 
                                            className="flex items-center gap-2 cursor-pointer p-1 -m-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                            onClick={() => setViewProfile(p)}
                                        >
                                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">{p.height || '---'}</span>
                                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">{p.weight || '---'}</span>
                                            <span className="text-xs px-1.5 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded font-bold border border-red-100 dark:border-red-900/30">{p.body_fat ? `${p.body_fat}%` : '---'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                            Bụng: <span className="font-bold text-slate-900 dark:text-slate-200">{p.measurement_waist || '--'}</span> | Mông: <span className="font-bold text-slate-900 dark:text-slate-200">{p.measurement_hip || '--'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {p.medical_cardiovascular && <Badge variant="destructive" className="text-[9px] h-4">Tim mạch</Badge>}
                                            {p.medical_blood_pressure && <Badge variant="destructive" className="text-[9px] h-4">Huyết áp</Badge>}
                                            {p.medical_diabetes && <Badge variant="destructive" className="text-[9px] h-4">Tiểu đường</Badge>}
                                            {(!p.medical_cardiovascular && !p.medical_blood_pressure && !p.medical_diabetes) && <span className="text-xs text-slate-400 italic">Bình thường</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 pr-6 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-white"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl w-40">
                                                <DropdownMenuItem onClick={() => { setSelectedProfile(p); setDialogOpen(true); }} className="rounded-lg cursor-pointer">
                                                    <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Cập nhật
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-lg cursor-pointer text-red-600" onClick={() => setDeleteId(p.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa bản ghi
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TooltipProvider>
                </CardContent>
            </Card>

            <HealthProfileDialog 
                open={dialogOpen} 
                onOpenChange={setDialogOpen} 
                initialData={selectedProfile}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['health-profiles'] })}
            />

            <HealthProfileDetailsSheet 
                open={!!viewProfile}
                onOpenChange={(open) => !open && setViewProfile(null)}
                profile={viewProfile}
                onEdit={() => {
                    setSelectedProfile(viewProfile)
                    setViewProfile(null)
                    setDialogOpen(true)
                }}
                onClientClick={(clientId) => {
                    setSelectedClientId(clientId)
                }}
            />

            <ClientDetailsSheet 
                clientId={selectedClientId || ''}
                isOpen={!!selectedClientId}
                onClose={() => setSelectedClientId(null)}
            />

            <ImportHealthDialog 
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
            />

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa hồ sơ?</DialogTitle>
                        <DialogDescription>
                            Hành động này không thể hoàn tác. Hồ sơ sức khỏe này sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">Hủy</Button>
                        <Button 
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                        >
                            Tiếp tục xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
