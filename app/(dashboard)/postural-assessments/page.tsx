'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
import { 
    Plus, 
    Search, 
    ClipboardList, 
    RotateCcw,
    Calendar,
    User,
    MoreHorizontal,
    Trash2,
    Pencil,
    Phone,
    FileDown,
    FileUp,
    LayoutGrid,
    LayoutList,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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

import { fetchPosturalAssessments, deletePosturalAssessment, bulkDeletePosturalAssessments, type PosturalAssessment } from '@/app/actions/postural-assessments'
import { PosturalAssessmentSheet } from '@/components/physical-assessments/postural-assessment-sheet'
import { ImportPosturalDialog } from '@/components/postural-assessments/import-postural-dialog'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'

type ViewMode = 'table' | 'card'

// ── helpers ──────────────────────────────────────────────────────────────────

function getIssues(a: PosturalAssessment) {
    const issues: { label: string; color: 'red' | 'blue' | 'orange' | 'green' | 'purple' }[] = []
    if (a.forward_head || a.head_tilt_rotation) issues.push({ label: 'Đầu / Cổ', color: 'red' })
    if (a.uneven_shoulders || a.rounded_shoulders || a.kyphosis || a.lordosis) issues.push({ label: 'Vai / Lưng', color: 'blue' })
    if (a.pelvic_tilt_anterior || a.pelvic_tilt_posterior) issues.push({ label: 'Chậu', color: 'orange' })
    if (a.knee_valgus || a.knee_varus || a.knee_hyperextension) issues.push({ label: 'Gối', color: 'green' })
    if (a.pronation || a.supination) issues.push({ label: 'Bàn chân', color: 'purple' })
    return issues
}

const SECTION_CHECKS = [
    {
        label: 'Đầu & Cổ',
        color: 'red' as const,
        keys: ['forward_head', 'head_tilt_rotation'] as (keyof PosturalAssessment)[],
        items: ['Đầu hướng trước', 'Nghiêng/Xoay'],
    },
    {
        label: 'Vai & Lưng',
        color: 'blue' as const,
        keys: ['uneven_shoulders', 'rounded_shoulders', 'kyphosis', 'lordosis'] as (keyof PosturalAssessment)[],
        items: ['Vai không đều', 'Khum vai', 'Gù lưng', 'Võng lưng'],
    },
    {
        label: 'Chậu',
        color: 'orange' as const,
        keys: ['pelvic_tilt_anterior', 'pelvic_tilt_posterior'] as (keyof PosturalAssessment)[],
        items: ['Nghiêng trước', 'Nghiêng sau'],
    },
    {
        label: 'Gối',
        color: 'green' as const,
        keys: ['knee_valgus', 'knee_varus', 'knee_hyperextension'] as (keyof PosturalAssessment)[],
        items: ['Valgus', 'Varus', 'Duỗi quá mức'],
    },
    {
        label: 'Bàn chân',
        color: 'purple' as const,
        keys: ['pronation', 'supination'] as (keyof PosturalAssessment)[],
        items: ['Pronation', 'Supination'],
    },
]

const BADGE_VARIANTS = {
    red: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    orange: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
}

const SECTION_BG = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    green: 'bg-emerald-500',
    purple: 'bg-purple-500',
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ label, color = 'red' }: { label: string; color?: keyof typeof BADGE_VARIANTS }) {
    return (
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-tight border', BADGE_VARIANTS[color])}>
            {label}
        </span>
    )
}

function AssessmentCard({
    assessment,
    onEdit,
    onDelete,
    isSelected,
    onSelect,
}: {
    assessment: PosturalAssessment
    onEdit: (a: PosturalAssessment) => void
    onDelete: (id: string) => void
    isSelected: boolean
    onSelect: (id: string) => void
}) {
    const issues = getIssues(assessment)
    const isHealthy = issues.length === 0
    const phone = assessment.client?.phone

    return (
        <div className={cn(
            "group relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5",
            isSelected ? "border-red-500 ring-1 ring-red-500" : "border-black/[0.07] dark:border-white/[0.07]"
        )}>

            {/* Selection Checkbox */}
            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(assessment.id!)}
                    className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 bg-white"
                />
            </div>

            {/* Top stripe */}
            <div className={cn('h-[3px] w-full', isHealthy ? 'bg-emerald-500' : 'bg-[#FD5771]')} />

            {/* ── Clickable body — opens sheet ── */}
            <button
                type="button"
                onClick={() => onEdit(assessment)}
                className="w-full text-left p-4 block focus:outline-none"
            >
                {/* Header: avatar + name + date */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className={cn(
                            'shrink-0 w-10 h-10 rounded-[9px] flex items-center justify-center text-white text-[14px] font-semibold',
                            isHealthy ? 'bg-emerald-500' : 'bg-[#FD5771]'
                        )}>
                            {(assessment.client?.member_name || 'N')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-black dark:text-white truncate leading-tight">
                                {assessment.client?.member_name || 'N/A'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-3 h-3 text-black/30 dark:text-white/30 shrink-0" />
                                <span className="text-[11px] text-black/45 dark:text-white/45 font-normal">
                                    {format(new Date(assessment.assessment_date), 'dd/MM/yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Delete menu — stop click bubbling to card */}
                    <div onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 rounded-lg hover:bg-red-50 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 sm:flex transition-opacity"
                                >
                                    <MoreHorizontal className="h-4 w-4 text-black/40" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-36">
                                <DropdownMenuItem
                                    className="rounded-lg cursor-pointer text-red-600"
                                    onClick={() => onDelete(assessment.id!)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa bản ghi
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* PT row */}
                <div className="flex items-center gap-1.5 mb-3">
                    <User className="w-3 h-3 text-black/25 dark:text-white/25 shrink-0" />
                    <span className="text-[11px] text-black/40 dark:text-white/40 font-normal truncate">{assessment.pt_id}</span>
                </div>

                {/* Divider */}
                <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] mb-3" />

                {/* Problem chips */}
                {isHealthy ? (
                    <div className="flex items-center gap-1.5 py-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-[12px] text-emerald-600 dark:text-emerald-400 font-normal">Không phát hiện sai lệch</span>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {issues.map((issue) => (
                            <span
                                key={issue.label}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-[#C0392B] border border-red-100 dark:bg-red-950/25 dark:text-red-400 dark:border-red-900/30"
                            >
                                {issue.label}
                            </span>
                        ))}
                    </div>
                )}
            </button>

            {/* ── Action bar — stop propagation so buttons don't trigger card click ── */}
            <div
                className="px-4 py-2.5 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center gap-2"
                onClick={e => e.stopPropagation()}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(assessment)}
                    className="flex-1 h-8 rounded-lg text-[12px] font-medium text-black dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.05] gap-1.5"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Sửa
                </Button>
                {phone ? (
                    <a
                        href={`tel:${phone}`}
                        className="flex-1 h-8 rounded-lg text-[12px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        Gọi
                    </a>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="flex-1 h-8 rounded-lg text-[12px] font-medium text-black/25 gap-1.5"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        Gọi
                    </Button>
                )}
            </div>
        </div>
    )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function PosturalAssessmentsPage() {
    const queryClient = useQueryClient()
    const { isStaff } = usePermissions()

    const [searchTerm, setSearchTerm] = React.useState('')
    const [viewMode, setViewMode] = React.useState<ViewMode>('card')
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [isImportOpen, setIsImportOpen] = React.useState(false)
    const [selectedAssessment, setSelectedAssessment] = React.useState<PosturalAssessment | null>(null)
    const [selectedClient, setSelectedClient] = React.useState<{ id: string; name: string } | null>(null)
    const [selectedIds, setSelectedIds] = React.useState<string[]>([])

    const { data: assessments = [], isLoading } = useQuery({
        queryKey: ['postural-assessments-all'],
        queryFn: async () => {
            const res = await fetchPosturalAssessments()
            if (!res.success) throw new Error(res.error)
            return res.data || []
        },
    })

    const deleteMutation = useMutation({
        mutationFn: deletePosturalAssessment,
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Đã xóa bản ghi đánh giá')
                queryClient.invalidateQueries({ queryKey: ['postural-assessments-all'] })
            } else {
                toast.error(res.error)
            }
        },
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeletePosturalAssessments,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(`Đã xóa ${selectedIds.length} bản ghi đánh giá`)
                setSelectedIds([])
                queryClient.invalidateQueries({ queryKey: ['postural-assessments-all'] })
            } else {
                toast.error(res.error)
            }
        }
    })

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredAssessments.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredAssessments.map((a: any) => a.id))
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

    const filteredAssessments = assessments.filter(
        (a) =>
            a.client?.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.pt_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddNew = () => {
        setSelectedAssessment(null)
        setSelectedClient(null)
        setIsSheetOpen(true)
    }

    const handleEdit = (assessment: PosturalAssessment) => {
        setSelectedAssessment(assessment)
        setSelectedClient({ id: assessment.client_id, name: assessment.client?.member_name || '' })
        setIsSheetOpen(true)
    }

    const exportToExcel = () => {
        const dateStr = new Date().toISOString().slice(0, 10)
        if (assessments.length === 0) {
            const template = [{ 'Hội viên': 'Nguyễn Văn A', 'Ngày đánh giá (dd/MM/yyyy)': '19/04/2025', 'PT thực hiện': 'pt@flexhub.com', 'Cổ hướng trước': '', 'Kyphosis': '', 'Vai tò': '', 'Nghịch trước (APT)': '', 'Nghịch sau (PPT)': '', 'Gối chụm (Valgus)': '', 'Gối vòng (Varus)': '', 'Ghi chú': '' }]
            const ws = XLSX.utils.json_to_sheet(template)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Template')
            XLSX.writeFile(wb, 'template_danh_gia_sai_lech.xlsx')
            toast.success('Đã xuất file template mẫu')
            return
        }
        const data = assessments.map((a: any) => ({
            'Hội viên': a.client?.member_name || '',
            'Ngày đánh giá': format(new Date(a.assessment_date), 'dd/MM/yyyy'),
            'PT': a.pt_id || '',
            'Cổ hướng trước': a.forward_head ? 'Có' : '',
            'Kyphosis': a.kyphosis ? 'Có' : '',
            'Vai tò': a.rounded_shoulders ? 'Có' : '',
            'APT': a.pelvic_tilt_anterior ? 'Có' : '',
            'PPT': a.pelvic_tilt_posterior ? 'Có' : '',
            'Valgus': a.knee_valgus ? 'Có' : '',
            'Varus': a.knee_varus ? 'Có' : '',
            'Ghi chú': a.notes || '',
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'DanhGiaSaiLech')
        XLSX.writeFile(wb, `danh_gia_sai_lech_${dateStr}.xlsx`)
        toast.success(`Đã xuất ${data.length} bản ghi`)
    }

    return (
        <div className="space-y-6 font-inter pb-10">
            <ImportPosturalDialog
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['postural-assessments-all'] })}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 tracking-tight">
                        <ClipboardList className="w-8 h-8 text-[#FD5771]" />
                        Đánh giá sai lệch
                    </h1>
                    <p className="text-sm text-slate-800 dark:text-slate-300 font-normal tracking-tight">
                        Theo dõi và phân tích các sai lệch tư thế, chuỗi kinetic chain của hội viên.
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <Button
                        variant="ghost"
                        onClick={() => setIsImportOpen(true)}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-gray-300 h-11 px-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all font-bold"
                    >
                        <FileUp className="w-4 h-4 mr-2 text-blue-600" />
                        Nhập Excel
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={exportToExcel}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-gray-300 h-11 px-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all font-bold"
                    >
                        <FileDown className="w-4 h-4 mr-2 text-emerald-600" />
                        Xuất Excel
                    </Button>
                    <Button
                        onClick={handleAddNew}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 font-bold h-11 shadow-sm transition-all active:scale-95 w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo đánh giá mới
                    </Button>
                </div>
            </div>

            {/* Sheet editor */}
            <PosturalAssessmentSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                clientId={selectedClient?.id}
                clientName={selectedClient?.name}
                ptEmail={''}
                initialData={selectedAssessment}
            />

            {/* Toolbar */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                    {/* Search */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm đánh giá..."
                                className="pl-10 h-10 bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-xl text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSearchTerm('')}
                            className="rounded-xl h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
                        <button
                            onClick={() => setViewMode('card')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all',
                                viewMode === 'card'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            )}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Card</span>
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all',
                                viewMode === 'table'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            )}
                        >
                            <LayoutList className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Bảng</span>
                        </button>
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
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

                {/* ── CARD VIEW ─────────────────────────────────────────── */}
                {viewMode === 'card' && (
                    <div className="p-4 sm:p-6">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : filteredAssessments.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-20 opacity-20">
                                <ClipboardList className="w-14 h-14" />
                                <p className="text-xs font-bold uppercase tracking-widest">Chưa có bản ghi nào</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredAssessments.map((a) => (
                                    <AssessmentCard
                                        key={a.id}
                                        assessment={a}
                                        onEdit={handleEdit}
                                        onDelete={(id) => deleteMutation.mutate(id)}
                                        isSelected={selectedIds.includes(a.id!)}
                                        onSelect={toggleSelect}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TABLE VIEW ────────────────────────────────────────── */}
                {viewMode === 'table' && (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 dark:bg-slate-800/20 hover:bg-transparent">
                                    <TableHead className="w-[40px] px-1 text-center h-12">
                                        <Checkbox
                                            checked={selectedIds.length === filteredAssessments.length && filteredAssessments.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            className="rounded border-slate-300"
                                        />
                                    </TableHead>
                                    <TableHead className="text-[12px] font-semibold text-slate-900 dark:text-slate-300 tracking-tight h-12 uppercase">Hội viên</TableHead>
                                    <TableHead className="text-[12px] font-semibold text-slate-900 dark:text-slate-300 tracking-tight h-12 uppercase">Ngày đánh giá</TableHead>
                                    <TableHead className="text-[12px] font-semibold text-slate-900 dark:text-slate-300 tracking-tight h-12 uppercase">PT thực hiện</TableHead>
                                    <TableHead className="text-[12px] font-semibold text-slate-900 dark:text-slate-300 tracking-tight h-12 uppercase">Tình trạng mẫu</TableHead>
                                    <TableHead className="text-[12px] font-semibold text-slate-900 dark:text-slate-300 tracking-tight h-12 text-right pr-6 uppercase">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">
                                            Đang tải dữ liệu...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredAssessments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <ClipboardList className="w-12 h-12" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Chưa có bản ghi nào</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAssessments.map((a) => (
                                        <TableRow key={a.id} className={cn("group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors", selectedIds.includes(a.id!) && "bg-red-50/30 dark:bg-red-900/10")}>
                                            <TableCell className="px-1 text-center">
                                                <Checkbox
                                                    checked={selectedIds.includes(a.id!)}
                                                    onCheckedChange={() => toggleSelect(a.id!)}
                                                    className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                                />
                                            </TableCell>
                                            <TableCell className="py-4 font-bold text-slate-900 dark:text-white">
                                                {a.client?.member_name || 'N/A'}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    <Calendar className="w-3.5 h-3.5 text-red-500/70" />
                                                    {format(new Date(a.assessment_date), 'dd/MM/yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    <User className="w-3.5 h-3.5 text-red-500/70" />
                                                    {a.pt_id}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {getIssues(a).length === 0 ? (
                                                        <span className="text-[11px] font-bold text-slate-300 dark:text-slate-500 italic uppercase">Bình thường</span>
                                                    ) : (
                                                        getIssues(a).map((issue) => (
                                                            <StatusBadge key={issue.label} label={issue.label} color={issue.color} />
                                                        ))
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl w-40">
                                                        <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => handleEdit(a)}>
                                                            <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Chi tiết
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="rounded-lg cursor-pointer text-red-600 font-medium"
                                                            onClick={() => deleteMutation.mutate(a.id!)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Xóa bản ghi
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    )
}
