'use client'

import React from 'react'
import * as XLSX from 'xlsx'
import {
    LayoutGrid,
    FileDown,
    FileUp,
    Search,
    RotateCcw,
    Utensils,
    Package,
    Beef,
    Salad,
    Filter,
    Plus,
    Pencil,
    Trash2
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { fetchNutritionFoods, bulkDeleteNutritionFoods } from '@/app/actions/nutrition-foods'
import { cn } from '@/lib/utils'
import { NutritionFoodImportDialog } from '@/components/nutrition/nutrition-food-import-dialog'
import { NutritionFoodDialog } from '@/components/nutrition/nutrition-food-dialog'
import { deleteNutritionFood } from '@/app/actions/nutrition-foods'
import { toast } from 'sonner'
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function NutritionFoodsPage() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = React.useState('')
    const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
    const [isImportOpen, setIsImportOpen] = React.useState(false)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [selectedFood, setSelectedFood] = React.useState<any>(null)
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null)
    const [selectedIds, setSelectedIds] = React.useState<string[]>([])

    const { data: foods = [], isLoading } = useQuery<any[]>({
        queryKey: ['nutrition-foods'],
        queryFn: async () => {
            const res = await fetchNutritionFoods()
            if (!res.success) throw new Error(res.error)
            return res.data || []
        }
    })

    const categories = React.useMemo(() => {
        const cats = new Set(foods.map(f => f.food_group))
        return Array.from(cats).filter(Boolean).sort()
    }, [foods])

    const filteredFoods = React.useMemo(() => {
        return foods.filter(f => {
            const name = f.food_type?.toLowerCase() || ''
            const category = f.food_group?.toLowerCase() || ''
            const search = searchTerm.toLowerCase()
            const matchSearch = name.includes(search) || category.includes(search)
            const matchCategory = categoryFilter === 'all' || f.food_group === categoryFilter
            return matchSearch && matchCategory
        })
    }, [foods, searchTerm, categoryFilter])

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa thực phẩm "${name}"? Thao tác này không thể hoàn tác.`)) return
        
        setIsDeleting(id)
        try {
            const res = await deleteNutritionFood(id)
            if (res.success) {
                toast.success('Đã xóa thực phẩm thành công')
                queryClient.invalidateQueries({ queryKey: ['nutrition-foods'] })
            } else {
                toast.error('Lỗi khi xóa: ' + res.error)
            }
        } catch (error: any) {
            toast.error('Lỗi hệ thống: ' + error.message)
        } finally {
            setIsDeleting(null)
        }
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredFoods.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredFoods.map((f: any) => f.id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} thực phẩm đã chọn? Thao tác này không thể hoàn tác.`)) return
        
        try {
            const res = await bulkDeleteNutritionFoods(selectedIds)
            if (res.success) {
                toast.success(`Đã xóa ${selectedIds.length} thực phẩm thành công`)
                setSelectedIds([])
                queryClient.invalidateQueries({ queryKey: ['nutrition-foods'] })
            } else {
                toast.error(res.error)
            }
        } catch (error: any) {
            toast.error('Lỗi hệ thống khi xóa hàng loạt')
        }
    }

    const exportToExcel = () => {
        try {
            const dateStr = new Date().toISOString().slice(0, 10)
            const dataToExport = filteredFoods.length > 0 ? filteredFoods : foods

            if (dataToExport.length === 0) {
                // Xuất template mẫu — tên cột khớp với import parser
                const template = [{
                    'ID': 'uuid-hoac-de-trong-neu-tao-moi',
                    'Nhóm': 'Protein',
                    'Loại': 'Thịt gà bắt phiết',
                    'Protein': 31,
                    'Carb': 0,
                    'Fat': 3.6,
                    'Fiber': 0,
                    'Đơn vị': 'g',
                    'Hệ số chuyển đổi': 1,
                    'Ảnh': '',
                }]
                const ws = XLSX.utils.json_to_sheet(template)
                ws['!cols'] = [
                    { wch: 38 }, // ID
                    { wch: 16 }, // Nhóm
                    { wch: 28 }, // Loại
                    { wch: 10 }, // Protein
                    { wch: 10 }, // Carb
                    { wch: 10 }, // Fat
                    { wch: 10 }, // Fiber
                    { wch: 10 }, // Đơn vị
                    { wch: 18 }, // Hệ số chuyển đổi
                    { wch: 14 }, // Ảnh
                ]
                const wb = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(wb, ws, 'Template')
                XLSX.writeFile(wb, 'template_thu_vien_thuc_pham.xlsx')
                toast.success('Đã xuất file template mẫu')
                return
            }

            // Tên cột phải khớp chính xác với import mapping trong nutrition-food-import-dialog.tsx
            const data = dataToExport.map((f: any) => ({
                'ID': f.id || '',                               // dùng để upsert khi import lại
                'Nhóm': f.food_group || '',                    // row['Nhóm'] → food_group
                'Loại': f.food_type || '',                     // row['Loại'] → food_type
                'Protein': f.protein ?? 0,                     // row['Protein'] → protein
                'Carb': f.carbs ?? 0,                          // row['Carb'] → carbs
                'Fat': f.fat ?? 0,                             // row['Fat'] → fat
                'Fiber': f.fiber ?? 0,                         // row['Fiber'] → fiber
                'Đơn vị': f.unit || '',                        // row['Đơn vị'] → unit
                'Hệ số chuyển đổi': f.conversion_factor ?? 1, // row['Hệ số chuyển đổi'] → conversion_factor
                'Ảnh': '',                                     // base64 bị loại (vượt giới hạn 32767 ký tự/ô Excel)
            }))

            const ws = XLSX.utils.json_to_sheet(data)
            ws['!cols'] = [
                { wch: 38 }, // ID
                { wch: 16 }, // Nhóm
                { wch: 28 }, // Loại
                { wch: 10 }, // Protein
                { wch: 10 }, // Carb
                { wch: 10 }, // Fat
                { wch: 10 }, // Fiber
                { wch: 10 }, // Đơn vị
                { wch: 18 }, // Hệ số chuyển đổi
                { wch: 14 }, // Ảnh
            ]

            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'ThuVienThucPham')
            XLSX.writeFile(wb, `thu_vien_thuc_pham_${dateStr}.xlsx`)
            toast.success(`Đã xuất ${data.length} thực phẩm thành công`)
        } catch (err: any) {
            console.error('Export Excel error:', err)
            toast.error('Lỗi xuất Excel: ' + (err?.message || 'Không xác định'))
        }
    }

    return (
        <div suppressHydrationWarning className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-2 tracking-tight">
                        <LayoutGrid className="w-8 h-8 text-[#FD5771]" />
                        Thư viện thực phẩm
                    </h1>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">Danh mục thực phẩm và thành phần dinh dưỡng chuẩn (Protein, Carb, Fat, Fiber).</p>
                </div>
                <div className="flex items-center gap-3">
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
                            setSelectedFood(null)
                            setIsDialogOpen(true)
                        }}
                        className="bg-[#FD5771] hover:bg-[#E0485F] text-white rounded-xl h-11 px-6 shadow-lg shadow-red-100 dark:shadow-none transition-all active:scale-95 font-bold"
                    >
                        <Plus className="w-4.5 h-4.5 mr-2" />
                        Thêm thực phẩm
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                    title="Tổng số thực phẩm" 
                    value={foods.length.toString()} 
                    icon={Package} 
                    color="red"
                />
                <StatCard 
                    title="Nhóm thực phẩm" 
                    value={categories.length.toString()} 
                    icon={Salad} 
                    color="green"
                />
                <StatCard 
                    title="Thực phẩm giàu Đạm" 
                    value={foods.filter(f => (f.protein || 0) > 20).length.toString()} 
                    icon={Beef} 
                    color="blue"
                    description="Protein > 20g/100g"
                />
            </div>

            <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Tabs 
                        value={categoryFilter} 
                        onValueChange={setCategoryFilter}
                        className="w-full sm:w-auto"
                    >
                        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl h-11 flex-wrap sm:flex-nowrap">
                            <TabsTrigger 
                                value="all"
                                className="rounded-lg px-5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#FD5771] data-[state=active]:shadow-sm transition-all h-9"
                            >
                                Tất cả ({foods.length})
                            </TabsTrigger>
                            {categories.map(cat => {
                                const count = foods.filter(f => f.food_group === cat).length
                                return (
                                    <TabsTrigger 
                                        key={cat} 
                                        value={cat}
                                        className="rounded-lg px-5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#FD5771] data-[state=active]:shadow-sm transition-all h-9"
                                    >
                                        {cat} ({count})
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </Tabs>
                </div>

                <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 transition-all duration-300">
                    <div className="p-3 flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm tên thực phẩm..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-10 pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 text-sm focus-visible:ring-2 focus-visible:ring-red-500/20 shadow-none transition-all"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                    setSearchTerm('')
                                    setCategoryFilter('all')
                                }} 
                                className="h-10 w-10 border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex-1 min-w-[300px] flex items-center justify-between p-2.5 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-2 px-1">
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
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-50 dark:border-gray-800 hover:bg-transparent border-t-0">
                                <TableHead className="w-[40px] px-1 text-center h-11">
                                    <Checkbox
                                        checked={selectedIds.length === filteredFoods.length && filteredFoods.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded border-slate-300"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Ảnh</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Thực phẩm</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Nhóm</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">P (g)</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">F (g)</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">C (g)</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Fiber (g)</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Đơn vị</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Hệ số</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11 text-right pr-6">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-gray-400 text-sm">Đang tải dữ liệu...</TableCell>
                                </TableRow>
                            ) : filteredFoods.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-48 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                                                <Utensils className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                            </div>
                                            <p className="text-gray-400 text-sm font-medium">Không tìm thấy thực phẩm nào</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFoods.map((f: any) => (
                                    <TableRow key={f.id} className={cn("border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group", selectedIds.includes(f.id) && "bg-red-50/30 dark:bg-red-900/10")}>
                                        <TableCell className="px-1 text-center">
                                            <Checkbox
                                                checked={selectedIds.includes(f.id)}
                                                onCheckedChange={() => toggleSelect(f.id)}
                                                className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            />
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {f.image_base64 && f.image_base64.trim() !== '' ? (
                                                <img 
                                                    src={f.image_base64} 
                                                    alt={f.food_type} 
                                                    className="w-11 h-11 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800 transition-colors">
                                                    <Utensils className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedFood(f)
                                                    setIsDialogOpen(true)
                                                }}
                                                className="text-[14px] font-bold text-slate-900 dark:text-white hover:text-[#FD5771] transition-colors text-left"
                                            >
                                                {f.food_type}
                                            </button>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[12px] font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded-md">
                                                {f.food_group}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400">{f.protein}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[13px] font-bold text-orange-600 dark:text-orange-400">{f.fat}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{f.carbs}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[13px] font-bold text-slate-600 dark:text-slate-400">{f.fiber || 0}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[13px] font-medium text-slate-500">{f.unit}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[12px] font-mono font-medium text-slate-400 italic">
                                                {f.conversion_factor}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedFood(f)
                                                        setIsDialogOpen(true)
                                                    }}
                                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    disabled={isDeleting === f.id}
                                                    onClick={() => handleDelete(f.id, f.name)}
                                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

            <NutritionFoodImportDialog 
                open={isImportOpen} 
                onOpenChange={setIsImportOpen} 
            />

            <NutritionFoodDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={selectedFood}
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
