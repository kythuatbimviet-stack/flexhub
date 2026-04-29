'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
    Plus, 
    Search, 
    FileUp,
    FileDown,
    MoreHorizontal, 
    Pencil, 
    Trash2,
    UtensilsCrossed,
    ArrowRight,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
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

import { fetchMealPlans, deleteMealPlan, bulkDeleteMealPlans } from '@/app/actions/nutrition-meal-plans'
import { MealPlanDialog } from '@/components/nutrition/meal-plan-dialog'
import { MealPlanImportDialog } from '@/components/nutrition/meal-plan-import-dialog'

export default function MealPlansPage() {
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = React.useState('')
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [importDialogOpen, setImportDialogOpen] = React.useState(false)
    const [deleteId, setDeleteId] = React.useState<string | null>(null)
    const [expandedPlan, setExpandedPlan] = React.useState<string | null>(null)
    const [selectedIds, setSelectedIds] = React.useState<string[]>([])

    const { data: plans = [], isLoading } = useQuery({
        queryKey: ['nutrition-meal-plans'],
        queryFn: async () => {
            const res = await fetchMealPlans()
            return res.success ? res.data : []
        }
    })

    const deleteMutation = useMutation({
        mutationFn: deleteMealPlan,
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Đã xóa kế hoạch dinh dưỡng')
                queryClient.invalidateQueries({ queryKey: ['nutrition-meal-plans'] })
            } else {
                toast.error(res.error)
            }
            setDeleteId(null)
        }
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeleteMealPlans,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(`Đã xóa ${selectedIds.length} thực đơn thành công`)
                setSelectedIds([])
                queryClient.invalidateQueries({ queryKey: ['nutrition-meal-plans'] })
            } else {
                toast.error(res.error)
            }
        }
    })

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredPlans.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredPlans.map((p: any) => p.id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} thực đơn đã chọn? Thao tác này không thể hoàn tác.`)) return
        bulkDeleteMutation.mutate(selectedIds)
    }

    const filteredPlans = React.useMemo(() => {
        if (!searchQuery) return plans
        const q = searchQuery.toLowerCase()
        return plans.filter((p: any) => 
            p.name?.toLowerCase().includes(q) ||
            p.contracts?.id?.toLowerCase().includes(q) ||
            p.contracts?.clients?.member_name?.toLowerCase().includes(q)
        )
    }, [plans, searchQuery])

    const exportToExcel = () => {
        const dateStr = new Date().toISOString().slice(0, 10)
        if (plans.length === 0) {
            const template = [{
                'T\u00ean th\u1ef1c \u0111\u01a1n (*)': 'Th\u1ef1c \u0111\u01a1n t\u0103ng c\u01a1 tu\u1ea7n 1',
                'M\u00e3 h\u1ee3p \u0111\u1ed3ng (*)': 'HD-001',
                'S\u1ed1 b\u1eef\u0101': 3,
                'Tr\u1ea1ng th\u00e1i (active/draft)': 'active',
            }]
            const ws = XLSX.utils.json_to_sheet(template)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Template')
            XLSX.writeFile(wb, 'template_thuc_don_dinh_duong.xlsx')
            toast.success('\u0110\u00e3 xu\u1ea5t file template m\u1eabu')
            return
        }
        const data = filteredPlans.map((p: any) => ({
            'T\u00ean th\u1ef1c \u0111\u01a1n': p.name || '',
            'H\u1ecdc vi\u00ean': p.contracts?.clients?.member_name || '',
            'M\u00e3 H\u0110': p.contract_id || '',
            'S\u1ed1 b\u1eefa \u0103n': p.nutrition_meals?.length || 0,
            'Tr\u1ea1ng th\u00e1i': p.is_active ? '\u0110ang \u00e1p d\u1ee5ng' : 'B\u1ea3n nh\u00e1p',
            'Ng\u00e0y t\u1ea1o': format(new Date(p.created_at), 'dd/MM/yyyy'),
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'ThucDon')
        XLSX.writeFile(wb, `thuc_don_dinh_duong_${dateStr}.xlsx`)
        toast.success(`\u0110\u00e3 xu\u1ea5t ${data.length} th\u1ef1c \u0111\u01a1n`)
    }

    return (
        <div suppressHydrationWarning className="space-y-6 animate-in fade-in duration-500">
            {/* Header section matching project standard */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-2 tracking-tight">
                        <UtensilsCrossed className="w-8 h-8 text-[#FD5771]" />
                        Thực đơn & Lịch ăn
                    </h1>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">Quản lý bữa ăn chi tiết và chế độ dinh dưỡng hàng ngày cho học viên.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button 
                        variant="ghost" 
                        onClick={() => setImportDialogOpen(true)}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-gray-300 h-11 px-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all font-bold"
                    >
                        <FileUp className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="hidden sm:inline">Nhập Excel</span>
                        <span className="sm:hidden">Nhập</span>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={exportToExcel}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-gray-300 h-11 px-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all font-bold"
                    >
                        <FileDown className="w-4 h-4 mr-2 text-emerald-600" />
                        <span className="hidden sm:inline">Xuất Excel</span>
                        <span className="sm:hidden">Xuất</span>
                    </Button>
                    <Button 
                        onClick={() => setDialogOpen(true)} 
                        className="bg-[#FD5771] hover:bg-[#E0485F] text-white rounded-xl h-11 px-6 shadow-lg shadow-red-100 dark:shadow-none transition-all active:scale-95 font-bold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Thiết kế thực đơn
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Tổng số thực đơn" 
                    value={plans.length.toString()} 
                    icon={UtensilsCrossed} 
                    color="red"
                />
                <StatCard 
                    title="Đang áp dụng" 
                    value={plans.filter((p: any) => p.is_active).length.toString()} 
                    icon={ArrowRight} 
                    color="green"
                />
            </div>

            <Card className="rounded-xl border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="border-b border-gray-50 dark:border-gray-800 p-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Tìm kiếm thực đơn..." 
                            className="pl-10 h-10 bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-red-500/20 shadow-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
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
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-50 dark:border-gray-800 hover:bg-transparent border-t-0">
                                <TableHead className="w-[40px] px-1 text-center h-11">
                                    <Checkbox
                                        checked={selectedIds.length === filteredPlans.length && filteredPlans.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded border-slate-300"
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Mở rộng</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Học viên / Hợp đồng</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Tên thực đơn</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11 text-center">Số bữa</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11">Trạng thái</TableHead>
                                <TableHead className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider h-11 text-right pr-6">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-400 font-medium">Đang tải dữ liệu...</TableCell></TableRow>
                            ) : filteredPlans.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-400">Không có thực đơn nào được tìm thấy.</TableCell></TableRow>
                            ) : filteredPlans.map((plan: any) => (
                                <React.Fragment key={plan.id}>
                                    <TableRow className={cn("border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group", selectedIds.includes(plan.id) && "bg-red-50/30 dark:bg-red-900/10")} onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}>
                                        <TableCell className="px-1 text-center" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.includes(plan.id)}
                                                onCheckedChange={() => toggleSelect(plan.id)}
                                                className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            />
                                        </TableCell>
                                        <TableCell className="pl-6">
                                            {expandedPlan === plan.id ? <ChevronUp className="w-4 h-4 text-red-600" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-[14px] font-bold text-slate-900 dark:text-white">{plan.contracts?.clients?.member_name || 'Học viên ẩn'}</div>
                                            <div className="text-[10px] font-mono text-slate-400 uppercase">{plan.contract_id || '---'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">{plan.name}</div>
                                            <div suppressHydrationWarning className="text-[10px] text-slate-400">Tạo ngày: {format(new Date(plan.created_at), 'dd/MM/yyyy')}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="rounded-full font-bold">{plan.nutrition_meals?.length || 0}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={plan.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}>
                                                {plan.is_active ? "Đang áp dụng" : "Bản nháp"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => {
                                                        // logic edit if exists
                                                    }}
                                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    disabled={deleteMutation.isPending}
                                                    onClick={() => setDeleteId(plan.id)}
                                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    
                                    {expandedPlan === plan.id && (
                                        <TableRow className="bg-slate-50/30 dark:bg-slate-800/20">
                                            <TableCell colSpan={7} className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {plan.nutrition_meals?.sort((a: any, b: any) => a.meal_order - b.meal_order).map((meal: any) => (
                                                        <div key={meal.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-xs font-black uppercase text-red-600 dark:text-red-400 tracking-wider flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full" />
                                                                    {meal.name}
                                                                </h4>
                                                                <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border-none dark:text-slate-300">{meal.kcal} Kcal</Badge>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {meal.nutrition_meal_items?.map((item: any) => (
                                                                    <div key={item.id} className="flex items-start justify-between gap-3 text-xs group">
                                                                        <div className="flex-1">
                                                                            <div className="font-bold text-slate-700 dark:text-slate-200">{item.food_id || 'Thực phẩm'}</div>
                                                                            <div className="text-[10px] text-slate-400">{item.quantity}g</div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                                                                P:{Math.round(item.protein)} C:{Math.round(item.carb)} F:{Math.round(item.fat)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {(!meal.nutrition_meal_items || meal.nutrition_meal_items.length === 0) && (
                                                                    <p className="text-[10px] text-slate-400 italic">Chưa có món ăn trong bữa này.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <MealPlanDialog 
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <MealPlanImportDialog 
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
            />

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa thực đơn?</DialogTitle>
                        <DialogDescription>Hành động này sẽ xóa toàn bộ các bữa ăn và chi tiết thực phẩm trong kế hoạch này.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">Hủy</Button>
                        <Button onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">Xác nhận xóa</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
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
