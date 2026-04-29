'use client'

import React from 'react'
import * as XLSX from 'xlsx'
import {
    Plus,
    Apple,
    FileDown,
    FileUp,
    Search,
    Filter,
    RotateCcw,
    TrendingUp,
    Utensils,
    Scale,
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
import { fetchNutritionDesigns, bulkDeleteNutritionDesigns } from '@/app/actions/nutrition-actions'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { NutritionCalculatorDialog } from '@/components/nutrition/nutrition-calculator-dialog'
import { NutritionImportDialog } from '@/components/nutrition/nutrition-import-dialog'

export default function NutritionDesignsPage() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = React.useState('')
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [isImportOpen, setIsImportOpen] = React.useState(false)
    const [selectedDesign, setSelectedDesign] = React.useState<any>(null)
    const [selectedIds, setSelectedIds] = React.useState<string[]>([])

    const { data: designs = [], isLoading } = useQuery<any[]>({
        queryKey: ['nutrition-designs'],
        queryFn: async () => {
            const res = await fetchNutritionDesigns()
            if (!res.success) throw new Error(res.error)
            return res.data || []
        }
    })

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredDesigns.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredDesigns.map((d: any) => d.id))
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
            const res = await bulkDeleteNutritionDesigns(selectedIds)
            if (res.success) {
                toast.success(`Đã xóa ${selectedIds.length} bản ghi`)
                setSelectedIds([])
                queryClient.invalidateQueries({ queryKey: ['nutrition-designs'] })
            } else {
                toast.error(res.error)
            }
        } catch (error: any) {
            toast.error('Lỗi hệ thống khi xóa hàng loạt')
        }
    }

    const filteredDesigns = React.useMemo(() => {
        return designs.filter(d => {
            const memberName = d.clients?.member_name?.toLowerCase() || ''
            const phone = d.clients?.phone || ''
            const search = searchTerm.toLowerCase()
            return memberName.includes(search) || phone.includes(search)
        })
    }, [designs, searchTerm])

    const exportToExcel = () => {
        const dateStr = new Date().toISOString().slice(0, 10)
        if (filteredDesigns.length === 0) {
            const template = [{
                'T\u00ean kh\u00e1ch h\u00e0ng': 'Nguy\u1ec5n V\u0103n A',
                'C\u00e2n n\u1eb7ng (kg)': 72,
                '% M\u1ee1 c\u01a1 th\u1ec3': 18.5,
                'C\u1ea5p \u0111\u1ed9 ho\u1ea1t \u0111\u1ed9ng (1.2-1.9)': 1.375,
                '% Th\u1ea7m h\u1ee5t N\u0103ng L\u01b0\u1ee3ng': -15,
                'T\u1ed5ng Kcal/ng\u00e0y': 1850,
                'Protein (g)': 145,
                'Fat (g)': 65,
                'Carb (g)': 180,
                'Ng\u00e0y t\u1ea1o': dateStr,
            }]
            const ws = XLSX.utils.json_to_sheet(template)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Template')
            XLSX.writeFile(wb, 'template_thiet_ke_dinh_duong.xlsx')
            toast.success('\u0110\u00e3 xu\u1ea5t file template m\u1eabu')
            return
        }
        const data = filteredDesigns.map((d: any) => ({
            'Kh\u00e1ch h\u00e0ng': d.clients?.member_name || '',
            'S\u0110T': d.clients?.phone || '',
            'C\u00e2n n\u1eb7ng (kg)': d.weight || '',
            '% M\u1ee1': d.body_fat_used || '',
            'Kcal/ng\u00e0y': Math.round(d.daily_calorie_intake || 0),
            'Protein (g)': Math.round(d.protein_grams || 0),
            'Fat (g)': Math.round(d.fat_grams || 0),
            'Carb (g)': Math.round(d.carb_grams || 0),
            'M\u1ee5c ti\u00eau': d.energy_delta_percentage < 0 ? 'Gi\u1ea3m m\u1ee1' : d.energy_delta_percentage > 0 ? 'T\u0103ng c\u01a1' : 'Gi\u1eef c\u00e2n',
            '% Th\u0103ng/Th\u00e2m h\u1ee5t': d.energy_delta_percentage || 0,
            'Ng\u00e0y t\u1ea1o': format(new Date(d.created_at), 'dd/MM/yyyy'),
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'ThietKeDinhDuong')
        XLSX.writeFile(wb, `thiet_ke_dinh_duong_${dateStr}.xlsx`)
        toast.success(`\u0110\u00e3 xu\u1ea5t ${data.length} b\u1ea3n ghi`)
    }

    return (
        <div className="space-y-4 font-inter">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-2 tracking-tight">
                        <Apple className="w-8 h-8 text-[#FD5771]" />
                        Thiết kế dinh dưỡng
                    </h1>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">Tính toán Macro và thiết kế lộ trình dinh dưỡng tăng cơ/giảm mỡ khoa học.</p>
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
                            setSelectedDesign(null)
                            setIsAddOpen(true)
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-11 transition-colors shadow-lg shadow-red-200 dark:shadow-none font-bold"
                    >
                        <Plus className="w-4.5 h-4.5 mr-2" />
                        Thiết kế mới
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                    title="Tổng số phân tích" 
                    value={designs.length.toString()} 
                    icon={Scale} 
                    color="red"
                />
                <StatCard 
                    title="Mục tiêu Giảm mỡ" 
                    value={designs.filter(d => (d.energy_delta_percentage || 0) < 0).length.toString()} 
                    icon={TrendingUp} 
                    color="blue"
                    description="Thâm hụt năng lượng"
                />
                <StatCard 
                    title="Mục tiêu Tăng cơ" 
                    value={designs.filter(d => (d.energy_delta_percentage || 0) > 0).length.toString()} 
                    icon={Utensils} 
                    color="green"
                    description="Thặng dư năng lượng"
                />
            </div>

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
                                <TableHead className="w-[40px] px-1 text-center h-11">
                                    <Checkbox
                                        checked={selectedIds.length === filteredDesigns.length && filteredDesigns.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded border-slate-300"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider h-11">Khách hàng</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider h-11">Cân nặng / %BF</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider h-11">Daily Calories</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider h-11">Macro Targets</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider h-11">Mục tiêu</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider h-11 text-center">Ngày tạo</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider h-11 text-right pr-6">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-sm">Đang tải dữ liệu...</TableCell>
                                </TableRow>
                            ) : filteredDesigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                                                <Apple className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                            </div>
                                            <p className="text-gray-400 text-sm font-medium">Chưa có bản ghi thiết kế dinh dưỡng nào</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDesigns.map((d: any) => (
                                    <TableRow key={d.id} className={cn("border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group", selectedIds.includes(d.id) && "bg-red-50/30 dark:bg-red-900/10")}>
                                        <TableCell className="px-1 text-center">
                                            <Checkbox
                                                checked={selectedIds.includes(d.id)}
                                                onCheckedChange={() => toggleSelect(d.id)}
                                                className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            />
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-bold text-slate-900 dark:text-white">
                                                    {d.clients?.member_name || 'N/A'}
                                                </span>
                                                <span className="text-[12px] text-slate-500">{d.clients?.phone || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{d.weight} kg</span>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">{d.body_fat_used}% BF</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[14px] font-bold text-red-600 dark:text-red-400">
                                                {Math.round(d.daily_calorie_intake).toLocaleString()} kcal
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-blue-500 uppercase">P</span>
                                                    <span className="text-[12px] font-bold">{Math.round(d.protein_grams)}g</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-orange-500 uppercase">F</span>
                                                    <span className="text-[12px] font-bold">{Math.round(d.fat_grams)}g</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-emerald-500 uppercase">C</span>
                                                    <span className="text-[12px] font-bold">{Math.round(d.carb_grams)}g</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <GoalBadge delta={d.energy_delta_percentage} />
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                                                {format(new Date(d.created_at), 'dd/MM/yyyy')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-bold"
                                                onClick={() => {
                                                    setSelectedDesign(d)
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

            <NutritionCalculatorDialog 
                open={isAddOpen} 
                onOpenChange={setIsAddOpen} 
                initialData={selectedDesign}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['nutrition-designs'] })
                }}
            />
            <NutritionImportDialog 
                open={isImportOpen} 
                onOpenChange={setIsImportOpen} 
            />
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color, description }: { title: string, value: string, icon: any, color: 'red' | 'blue' | 'green', description?: string }) {
    const colors = {
        red: "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30",
        blue: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30",
        green: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
    }

    return (
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", colors[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{value}</span>
                        {description && <span className="text-[10px] font-bold text-slate-400">{description}</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function GoalBadge({ delta }: { delta: number }) {
    if (delta < 0) {
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">Giảm mỡ ({delta}%)</span>
    }
    if (delta > 0) {
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">Tăng cơ (+{delta}%)</span>
    }
    return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">Giữ cân (0%)</span>
}
