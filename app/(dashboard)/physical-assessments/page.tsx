'use client'

import React from 'react'
import * as XLSX from 'xlsx'
import {
    Plus,
    ClipboardList,
    FileDown,
    FileUp,
    Search,
    Filter,
    RotateCcw,
    Trash2
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Input } from '@/components/ui/input'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchPhysicalAssessments, bulkDeletePhysicalAssessments } from '@/app/actions/physical-assessments'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { AssessmentSheet } from '@/components/physical-assessments/assessment-sheet'
import { ImportAssessmentDialog } from '@/components/physical-assessments/import-assessment-dialog'

export default function PhysicalAssessmentsPage() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = React.useState('')
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [isImportOpen, setIsImportOpen] = React.useState(false)
    const [selectedAssessment, setSelectedAssessment] = React.useState<any>(null)
    const [selectedIds, setSelectedIds] = React.useState<string[]>([])

    const { data: assessments = [], isLoading } = useQuery<any[]>({
        queryKey: ['physical-assessments'],
        queryFn: async () => {
            const res = await fetchPhysicalAssessments()
            if (!res.success) throw new Error(res.error)
            return res.data || []
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
        
        try {
            const res = await bulkDeletePhysicalAssessments(selectedIds)
            if (res.success) {
                toast.success(`Đã xóa ${selectedIds.length} bản ghi`)
                setSelectedIds([])
                queryClient.invalidateQueries({ queryKey: ['physical-assessments'] })
            } else {
                toast.error(res.error)
            }
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredAssessments = React.useMemo(() => {
        return assessments.filter(la => {
            const memberName = la.contracts?.clients?.member_name?.toLowerCase() || ''
            const phone = la.contracts?.clients?.phone || ''
            const search = searchTerm.toLowerCase()
            return memberName.includes(search) || phone.includes(search)
        })
    }, [assessments, searchTerm])

    const exportToExcel = () => {
        const dateStr = new Date().toISOString().slice(0, 10)
        if (filteredAssessments.length === 0) {
            const template = [{
                'ID H\u1ee3p \u0111\u1ed3ng (*)': 'HD-001',
                'T\u00ean kh\u00e1ch h\u00e0ng': 'Nguy\u1ec5n V\u0103n A',
                'C\u1ed5 h\u01b0\u1edbng tr\u01b0\u1edbc': '',
                'Vai kh\u00f4ng \u0111\u1ec1u': '',
                'Khum vai': '',
                'G\u00f9 l\u01b0ng': '',
                'V\u00f5ng l\u01b0ng': '',
                'X\u01b0\u01a1ng ch\u1eadu tr\u01b0\u1edbc': '',
                'X\u01b0\u01a1ng ch\u1eadu sau': '',
                'Ch\u1ee5m g\u1ed1i': '',
                'Ch\u00e2n v\u00f2ng ki\u1ec1ng': '',
                'Ghi ch\u00fa': '',
            }]
            const ws = XLSX.utils.json_to_sheet(template)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Template')
            XLSX.writeFile(wb, 'template_danh_gia_the_trang.xlsx')
            toast.success('Xu\u1ea5t file template m\u1eabu th\u00e0nh c\u00f4ng')
            return
        }
        const data = filteredAssessments.map((la: any) => ({
            'M\u00e3 H\u0110': la.contract_id || '',
            'Kh\u00e1ch h\u00e0ng': la.contracts?.clients?.member_name || '',
            'S\u0110T': la.contracts?.clients?.phone || '',
            'Ng\u00e0y t\u1ea1o': format(new Date(la.created_at), 'dd/MM/yyyy'),
            'C\u1ed5 h\u01b0\u1edbng tr\u01b0\u1edbc': la.neck_forward_head ? 'C\u00f3' : '',
            'Vai kh\u00f4ng \u0111\u1ec1u': la.shoulder_uneven ? 'C\u00f3' : '',
            'Khum vai': la.shoulder_rounded ? 'C\u00f3' : '',
            'G\u00f9 l\u01b0ng': la.back_kyphosis ? 'C\u00f3' : '',
            'V\u00f5ng l\u01b0ng': la.back_lordosis ? 'C\u00f3' : '',
            'X\u01b0\u01a1ng ch\u1eadu tr\u01b0\u1edbc': la.pelvis_anterior_tilt ? 'C\u00f3' : '',
            'X\u01b0\u01a1ng ch\u1eadu sau': la.pelvis_posterior_tilt ? 'C\u00f3' : '',
            'Ch\u1ee5m g\u1ed1i': la.knee_knock_knees ? 'C\u00f3' : '',
            'Ch\u00e2n v\u00f2ng ki\u1ec1ng': la.knee_bow_legs ? 'C\u00f3' : '',
            'B\u00e0n ch\u00e2n quay ng\u1eeda': la.foot_supination ? 'C\u00f3' : '',
            'B\u00e0n ch\u00e2n quay s\u1ea5p': la.foot_pronation ? 'C\u00f3' : '',
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'DanhGiaTheTrang')
        XLSX.writeFile(wb, `danh_gia_the_trang_${dateStr}.xlsx`)
        toast.success(`\u0110\u00e3 xu\u1ea5t ${data.length} b\u1ea3n ghi`)
    }

    return (
        <div className="space-y-4 font-inter">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-2 tracking-tight">
                        <ClipboardList className="w-8 h-8 text-[#FD5771]" />
                        Đánh giá thể trạng
                    </h1>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">Theo dõi chi tiết tình trạng cơ thể, tư thế và các chỉ số vận động.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                        onClick={() => {
                            setSelectedAssessment(null)
                            setIsAddOpen(true)
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-11 transition-colors shadow-lg shadow-red-200 dark:shadow-none font-bold"
                    >
                        <Plus className="w-4.5 h-4.5 mr-2" />
                        Thêm mới
                    </Button>
                </div>
            </div>

            <AssessmentSheet 
                open={isAddOpen} 
                onOpenChange={setIsAddOpen} 
                initialData={selectedAssessment} 
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['physical-assessments'] })
                }}
            />

            <ImportAssessmentDialog 
                open={isImportOpen} 
                onOpenChange={setIsImportOpen} 
            />

            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 transition-all duration-300">
                <div className="p-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm khách hàng hoặc mã HĐ..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-10 pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 text-sm focus-visible:ring-2 focus-visible:ring-red-500/20 shadow-none transition-all"
                            />
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSearchTerm('')} 
                            className="h-10 w-10 border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="mt-3 flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
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

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-50 dark:border-gray-800 hover:bg-transparent border-t-0">
                                <TableHead className="w-[40px] px-2 text-center h-11">
                                    <Checkbox
                                        checked={selectedIds.length === filteredAssessments.length && filteredAssessments.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded border-slate-300"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Khách hàng</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Hợp đồng</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Cổ/Vai</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Lưng/Hông</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Gối/Bàn chân</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11 text-center">Ngày đo</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11 text-right pr-6">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-sm">Đang tải dữ liệu...</TableCell>
                                </TableRow>
                            ) : filteredAssessments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                                                <ClipboardList className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                            </div>
                                            <p className="text-gray-400 text-sm font-medium">Chưa có bản ghi đánh giá thể trạng nào</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAssessments.map((la: any) => (
                                    <TableRow key={la.id} className={cn("border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group", selectedIds.includes(la.id) && "bg-red-50/30 dark:bg-red-900/10")}>
                                        <TableCell className="px-2 text-center">
                                            <Checkbox
                                                checked={selectedIds.includes(la.id)}
                                                onCheckedChange={() => toggleSelect(la.id)}
                                                className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            />
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-bold text-slate-900 dark:text-white">
                                                    {la.contracts?.clients?.member_name || 'N/A'}
                                                </span>
                                                <span className="text-[12px] text-slate-500">{la.contracts?.clients?.phone || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[13px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                                                {la.contract_id || 'N/A'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {la.neck_forward_head && <BadgeComponent label="Cổ hướng trước" />}
                                                {la.shoulder_uneven && <BadgeComponent label="Vai không đều" />}
                                                {la.shoulder_rounded && <BadgeComponent label="Khum vai" />}
                                                {!(la.neck_forward_head || la.shoulder_uneven || la.shoulder_rounded) && <span className="text-xs text-slate-400">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {la.back_kyphosis && <BadgeComponent label="Gù lưng" color="blue" />}
                                                {la.back_lordosis && <BadgeComponent label="Võng lưng" color="blue" />}
                                                {la.pelvis_anterior_tilt && <BadgeComponent label="Chậu trước" color="blue" />}
                                                {la.pelvis_posterior_tilt && <BadgeComponent label="Chậu sau" color="blue" />}
                                                {!(la.back_kyphosis || la.back_lordosis || la.pelvis_anterior_tilt || la.pelvis_posterior_tilt) && <span className="text-xs text-slate-400">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {la.knee_knock_knees && <BadgeComponent label="Chụm gối" color="green" />}
                                                {la.knee_bow_legs && <BadgeComponent label="Chân vòng kiềng" color="green" />}
                                                {la.foot_supination && <BadgeComponent label="Quay ngửa" color="green" />}
                                                {la.foot_pronation && <BadgeComponent label="Quay sấp" color="green" />}
                                                {!(la.knee_knock_knees || la.knee_bow_legs || la.foot_supination || la.foot_pronation) && <span className="text-xs text-slate-400">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                                                {format(new Date(la.created_at), 'dd/MM/yyyy')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-bold"
                                                onClick={() => {
                                                    setSelectedAssessment(la)
                                                    setIsAddOpen(true)
                                                }}
                                            >
                                                Chi tiết
                                            </Button>
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

function BadgeComponent({ label, color = 'red' }: { label: string, color?: 'red' | 'blue' | 'green' | 'orange' }) {
    const colors = {
        red: "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border-red-100 dark:border-red-900/30",
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
        green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 border-orange-100 dark:border-orange-900/30"
    }
    
    return (
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold border", colors[color])}>
            {label}
        </span>
    )
}
