'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { 
    Plus, 
    Search, 
    BookOpen, 
    Dumbbell, 
    Calendar, 
    Clock, 
    User, 
    Target,
    MoreHorizontal,
    Pencil,
    Trash2,
    Copy,
    ChevronRight,
    Library,
    FileDown,
    FileUp
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from '@/components/ui/tabs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'

import { fetchProgramTemplates, deleteProgram, bulkDeleteTrainingPrograms } from '@/app/actions/training-plans'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExerciseLibrary } from '@/components/training-plans/exercise-library'
import { TrainingPlanBuilder } from '@/components/training-plans/training-plan-builder'

function TrainingPlansContent() {
    const searchParams = useSearchParams()
    const tabParam = searchParams.get('tab')
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = React.useState('')
    const [activeTab, setActiveTab] = React.useState('library')
    const [isBuilderOpen, setIsBuilderOpen] = React.useState(false)
    const [selectedTemplate, setSelectedTemplate] = React.useState<any>(null)
    const [selectedIds, setSelectedIds] = React.useState<string[]>([])
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => { setIsMounted(true) }, [])

    // Sync tab when URL parameter changes
    React.useEffect(() => {
        if (tabParam && (tabParam === 'library' || tabParam === 'exercises')) {
            setActiveTab(tabParam)
        }
    }, [tabParam])

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['training-program-templates'],
        queryFn: async () => {
            const res = await fetchProgramTemplates()
            return res.success ? res.data : []
        }
    })

    const deleteMutation = useMutation({
        mutationFn: deleteProgram,
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Đã xóa giáo án mẫu')
                queryClient.invalidateQueries({ queryKey: ['training-program-templates'] })
            } else {
                toast.error(res.error)
            }
        }
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeleteTrainingPrograms,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(`Đã xóa ${selectedIds.length} giáo án mẫu`)
                setSelectedIds([])
                queryClient.invalidateQueries({ queryKey: ['training-program-templates'] })
            } else {
                toast.error(res.error)
            }
        }
    })

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredTemplates.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredTemplates.map((t: any) => t.id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleCreate = () => {
        setSelectedTemplate(null)
        setIsBuilderOpen(true)
    }

    const handleEdit = (template: any) => {
        setSelectedTemplate(template)
        setIsBuilderOpen(true)
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} giáo án đã chọn?`)) return
        bulkDeleteMutation.mutate(selectedIds)
    }

    const filteredTemplates = templates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.goal?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const exportToExcel = () => {
        const dateStr = new Date().toISOString().slice(0, 10)
        if (filteredTemplates.length === 0) {
            const template = [{
                'T\u00ean gi\u00e1o \u00e1n (*)': 'PUSH-PULL-LEGS 3 Ng\u00e0y',
                'M\u1ee5c ti\u00eau': 'T\u0103ng c\u01a1',
                '\u0110\u1ed9 kh\u00f3': 'Intermediate',
                'S\u1ed1 bu\u1ed5i/tu\u1ea7n': 3,
                'S\u1ed1 tu\u1ea7n': 8,
                'Ng\u01b0\u1eddi t\u1ea1o': 'PT Nguy\u1ec5n V\u0103n A',
                'C\u00f4ng khai': 'C\u00f3',
            }]
            const ws = XLSX.utils.json_to_sheet(template)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Template')
            XLSX.writeFile(wb, 'template_giao_an_tap_luyen.xlsx')
            toast.success('\u0110\u00e3 xu\u1ea5t file template m\u1eabu')
            return
        }
        const data = filteredTemplates.map((t: any) => ({
            'T\u00ean gi\u00e1o \u00e1n': t.name || '',
            'M\u1ee5c ti\u00eau': t.goal || '',
            '\u0110\u1ed9 kh\u00f3': t.level || '',
            'S\u1ed1 bu\u1ed5i/tu\u1ea7n': t.sessions_per_week || '',
            'S\u1ed1 tu\u1ea7n': t.weeks || '',
            'C\u00f4ng khai': t.is_public ? 'C\u00f3' : 'Kh\u00f4ng',
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'GiaoAn')
        XLSX.writeFile(wb, `giao_an_tap_luyen_${dateStr}.xlsx`)
        toast.success(`\u0110\u00e3 xu\u1ea5t ${data.length} gi\u00e1o \u00e1n`)
    }

    return (
        <div className="space-y-6 font-inter pb-10">
            {/* Header section matching project standard */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium text-black dark:text-white flex items-center gap-2 tracking-tight">
                        <BookOpen className="w-8 h-8 text-[#FD5771]" />
                        Giáo án tập luyện
                    </h1>
                    <p className="text-sm text-black/60 dark:text-gray-400 font-normal tracking-tight">Xây dựng thư viện giáo án mẫu và quản lý chương trình tập luyện chuyên sâu.</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                    <Button 
                        variant="ghost" 
                        onClick={() => toast.info('Tính năng Nhập Excel cho giáo án đang được phát triển')}
                        className="rounded-xl font-medium h-11 w-11 p-0 border border-dashed border-gray-200 dark:border-gray-800 text-slate-600 hover:bg-slate-50 shrink-0"
                    >
                        <FileUp className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={exportToExcel}
                        className="rounded-xl font-medium h-11 w-11 p-0 border border-dashed border-gray-200 dark:border-gray-800 text-slate-600 hover:bg-slate-50 shrink-0"
                    >
                        <FileDown className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => setActiveTab('exercises')}
                        className="rounded-xl font-medium h-11 border border-dashed border-gray-200 dark:border-gray-800 text-slate-600 hover:bg-slate-50 px-4"
                    >
                        <Library className="w-4 h-4 mr-2" />
                        <span className="text-sm">Bản đồ bài tập</span>
                    </Button>
                    <Button 
                        onClick={handleCreate}
                        className="bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl px-6 font-medium h-11 shadow-sm transition-all active:scale-95 flex-1 sm:flex-none"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo mới
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-xl border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader className="pb-2"><CardTitle className="text-[13px] font-medium text-black/60 dark:text-white/60 tracking-tight">Tổng số giáo án</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-medium text-black dark:text-white">{templates.length}</div></CardContent>
                </Card>
                <Card className="rounded-xl border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader className="pb-2"><CardTitle className="text-[13px] font-medium text-blue-600 tracking-tight">Độ khó: Beginner</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-medium text-blue-600">{templates.filter(t => t.level === 'Beginner').length}</div></CardContent>
                </Card>
                <Card className="rounded-xl border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader className="pb-2"><CardTitle className="text-[13px] font-medium text-orange-600 tracking-tight">Độ khó: Advance</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-medium text-orange-600">{templates.filter(t => t.level === 'Advance').length}</div></CardContent>
                </Card>
                <Card className="rounded-xl border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader className="pb-2"><CardTitle className="text-[13px] font-medium text-green-600 tracking-tight">Công khai</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-medium text-green-600">{templates.filter(t => t.is_public).length}</div></CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="library" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent h-auto p-0 gap-8 border-b border-gray-100 dark:border-gray-800 w-full justify-start rounded-none mb-6">
                    <TabsTrigger 
                        value="library" 
                        className="data-[state=active]:border-[#FD5771] data-[state=active]:text-[#FD5771] border-b-2 border-transparent px-2 py-3 rounded-none font-medium text-sm bg-transparent shadow-none"
                    >
                        Thư viện giáo án PT
                    </TabsTrigger>
                    <TabsTrigger 
                        value="exercises" 
                        className="data-[state=active]:border-[#FD5771] data-[state=active]:text-[#FD5771] border-b-2 border-transparent px-2 py-3 rounded-none font-medium text-sm bg-transparent shadow-none"
                    >
                        Danh mục bài tập
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="library" className="mt-0 space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                placeholder="Tìm kiếm giáo án..." 
                                className="pl-10 h-11 bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800 rounded-xl text-sm shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-4">
                                <Checkbox
                                    checked={selectedIds.length === filteredTemplates.length && filteredTemplates.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                    className="rounded-md border-red-300"
                                />
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

                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i} className="rounded-xl h-36 animate-pulse bg-gray-50 border-none shadow-sm" />
                            ))
                        ) : filteredTemplates.length === 0 ? (
                            <div className="col-span-full py-16 text-center space-y-4">
                                <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                                    <BookOpen className="w-7 h-7 text-gray-300" />
                                </div>
                                <p className="text-gray-400 font-medium text-sm lowercase">Chưa có giáo án nào được tạo.</p>
                                <Button variant="outline" onClick={() => setIsBuilderOpen(true)} className="rounded-xl px-8 h-10 text-sm">Tạo ngay giáo án đầu tiên</Button>
                            </div>
                        ) : filteredTemplates.map((template) => (
                            <Card key={template.id} className={cn(
                                "group relative rounded-xl border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900 flex flex-col overflow-hidden border-l-4",
                                selectedIds.includes(template.id) ? "border-l-red-600 ring-1 ring-red-600" : "border-l-red-500"
                            )}>
                                {/* Checkbox hover */}
                                <div className="absolute top-2.5 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedIds.includes(template.id)}
                                        onCheckedChange={() => toggleSelect(template.id)}
                                        className="rounded border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 bg-white shadow-sm"
                                    />
                                </div>

                                {/* Header */}
                                <CardHeader className="pb-1.5 pt-3 pl-7 pr-3">
                                    <div className="flex items-start justify-between gap-1">
                                        <div className="space-y-0.5 min-w-0">
                                            <Badge variant="outline" className="text-[9px] sm:text-[10px] font-medium border-red-100 text-[#FD5771] bg-[#FD5771]/5 h-4">
                                                {template.level || 'Beginner'}
                                            </Badge>
                                            <CardTitle className="text-sm sm:text-base font-semibold text-black dark:text-white group-hover:text-[#FD5771] transition-colors line-clamp-2 leading-snug">
                                                {template.name}
                                            </CardTitle>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-50 shrink-0">
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl w-40">
                                                <DropdownMenuItem 
                                                    className="rounded-lg cursor-pointer"
                                                    onClick={() => handleEdit(template)}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-lg cursor-pointer"><Copy className="mr-2 h-4 w-4 text-green-500" /> Nhân bản</DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="rounded-lg cursor-pointer text-red-600 font-medium"
                                                    onClick={() => deleteMutation.mutate(template.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa giáo án
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription className="text-[11px] line-clamp-1 text-black/50 dark:text-white/50 mt-0.5">
                                        Ư/c: <span className="font-medium text-black/70 dark:text-white/70">{template.goal || 'Tăng cường sức mạnh'}</span>
                                    </CardDescription>
                                </CardHeader>

                                {/* Stats */}
                                <CardContent className="pt-0 pb-3 px-3">
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                            <Calendar className="w-3 h-3 text-red-400 shrink-0" />
                                            <span>{template.duration_weeks || 12} Tuần</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                            <Dumbbell className="w-3 h-3 text-red-400 shrink-0" />
                                            <span>{template.sessions?.length || 0} Buổi</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 w-full">
                                            <User className="w-3 h-3 text-red-400 shrink-0" />
                                            <span className="truncate">{template.created_by || 'Star Fit PT'}</span>
                                        </div>
                                    </div>
                                </CardContent>

                                {/* Footer hover action */}
                                <div className="px-3 pb-3 mt-auto hidden group-hover:block">
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => handleEdit(template)}
                                        className="w-full rounded-lg h-8 text-[11px] sm:text-xs font-medium gap-1.5 hover:bg-[#FD5771]/5 hover:text-[#FD5771] border border-slate-100 dark:border-slate-800 transition-all"
                                    >
                                        Chi tiết giáo án
                                        <ChevronRight className="w-3 h-3" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="exercises" className="mt-0">
                    <ExerciseLibrary />
                </TabsContent>
            </Tabs>

            {/* Builder Sheet */}
            <Sheet open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
                <SheetContent 
                    side="right" 
                    resizable={isMounted && window.innerWidth >= 640}
                    defaultWidth={isMounted && window.innerWidth < 640 ? undefined : 760}
                    minWidth={isMounted && window.innerWidth < 640 ? undefined : 320}
                    maxWidth={isMounted && window.innerWidth < 640 ? undefined : 1200}
                    showCloseButton={false}
                    className={cn(
                        "p-0 flex flex-col font-inter overflow-hidden border-l border-slate-100 dark:border-slate-800 shadow-2xl",
                        isMounted && window.innerWidth < 640 ? "!w-full !max-w-full" : "sm:max-w-[800px]"
                    )}
                >
                    <ScrollArea className="flex-1 h-full">
                        <div className="p-0">
                            <TrainingPlanBuilder 
                                initialData={selectedTemplate}
                                onSuccess={() => {
                                    setIsBuilderOpen(false)
                                    queryClient.invalidateQueries({ queryKey: ['training-program-templates'] })
                                }} 
                            />
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default function TrainingPlansPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6 animate-pulse p-6">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4" />
                <div className="h-32 w-full bg-gray-100 dark:bg-gray-900 rounded-xl" />
            </div>
        }>
            <TrainingPlansContent />
        </Suspense>
    )
}
