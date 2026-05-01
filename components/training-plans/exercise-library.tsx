'use client'

import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
    Search, 
    Dumbbell, 
    Target, 
    Video, 
    Plus,
    Edit2,
    Trash2,
    Info,
    LayoutGrid,
    MoreHorizontal
} from 'lucide-react'
import { fetchExercises, deleteExercise, type Exercise } from '@/app/actions/training-plans'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ExerciseDetailsSheet } from './exercise-details-sheet'
import { toast } from 'sonner'

export function ExerciseLibrary() {
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = React.useState('')
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [selectedExercise, setSelectedExercise] = React.useState<Exercise | null>(null)

    const { data: exercises = [], isLoading, error } = useQuery({
        queryKey: ['exercises-library'],
        queryFn: async () => {
            const res = await fetchExercises()
            if (!res.success) {
                console.error('Fetch exercises error:', res.error)
                throw new Error(res.error)
            }
            return res.data as Exercise[]
        }
    })

    const categories = React.useMemo(() => 
        Array.from(new Set(exercises.map(ex => ex.category))).sort()
    , [exercises])

    const filteredExercises = exercises.filter(ex => {
        const name = ex.name || ''
        const nameVi = ex.name_vi || ''
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             nameVi.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || ex.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleAdd = () => {
        setSelectedExercise(null)
        setIsSheetOpen(true)
    }

    const handleEdit = (ex: Exercise, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setSelectedExercise(ex)
        setIsSheetOpen(true)
    }

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (!confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return
        
        try {
            const res = await deleteExercise(id)
            if (res.success) {
                toast.success('Đã xóa bài tập')
                queryClient.invalidateQueries({ queryKey: ['exercises-library'] })
            } else {
                toast.error('Lỗi khi xóa: ' + res.error)
            }
        } catch (err) {
            toast.error('Có lỗi xảy ra khi xóa')
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 font-inter">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between px-1">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#FD5771] transition-colors" />
                        <Input 
                            placeholder="Tìm kiếm bài tập (Squat, Push up...)" 
                            className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-[#FD5771]/10 focus:border-[#FD5771] transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:max-w-[400px]">
                        <Button 
                            variant="ghost"
                            onClick={() => setSelectedCategory(null)}
                            className={cn(
                                "rounded-xl h-9 px-4 text-xs font-semibold whitespace-nowrap transition-all",
                                !selectedCategory 
                                    ? "bg-[#FD5771] text-white shadow-md shadow-red-100 dark:shadow-none" 
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            Tất cả
                        </Button>
                        {categories.map(cat => (
                            <Button 
                                key={cat} 
                                variant="ghost"
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "rounded-xl h-9 px-4 text-xs font-semibold whitespace-nowrap transition-all",
                                    selectedCategory === cat 
                                        ? "bg-[#FD5771] text-white shadow-md shadow-red-100 dark:shadow-none" 
                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                <Button 
                    onClick={handleAdd}
                    className="bg-[#FD5771] hover:bg-[#e04d64] text-white rounded-2xl h-11 px-6 shadow-lg shadow-red-100 dark:shadow-none transition-all active:scale-95 font-bold gap-2 shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    Thêm bài tập
                </Button>
            </div>

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="rounded-3xl h-44 animate-pulse bg-white dark:bg-slate-900 border-none shadow-sm" />
                    ))
                ) : error ? (
                    <div className="col-span-full py-20 text-center bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900/30">
                        <p className="text-red-500 font-medium text-sm">
                            Lỗi tải dữ liệu: {(error as any).message}
                        </p>
                        <Button variant="ghost" onClick={() => queryClient.invalidateQueries({ queryKey: ['exercises-library'] })} className="mt-4 text-red-600 font-bold underline">
                            Thử lại
                        </Button>
                    </div>
                ) : filteredExercises.length === 0 ? (
                    <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Dumbbell className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium text-sm">
                            Không tìm thấy bài tập nào phù hợp.
                        </p>
                    </div>
                ) : filteredExercises.map((ex) => (
                    <Card 
                        key={ex.id} 
                        onClick={() => handleEdit(ex)}
                        className="group relative rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden cursor-pointer"
                    >
                        <CardContent className="p-5 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <Badge variant="secondary" className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none rounded-lg uppercase tracking-wider">
                                    {ex.equipment || 'No Gear'}
                                </Badge>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                                        <DropdownMenuItem onClick={(e) => handleEdit(ex, e)} className="text-xs font-medium cursor-pointer gap-2">
                                            <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleDelete(ex.id, e)} className="text-xs font-medium text-red-600 cursor-pointer gap-2">
                                            <Trash2 className="w-3.5 h-3.5" /> Xóa bài tập
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            
                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-[#FD5771] transition-colors line-clamp-2 mb-1 text-[15px] tracking-tight leading-snug">
                                {ex.name}
                            </h4>
                            {ex.name_vi && <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mb-4 line-clamp-1">{ex.name_vi}</p>}
                            
                            <div className="mt-auto space-y-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {ex.muscle_groups.slice(0, 3).map(m => (
                                        <div key={m} className="px-2 py-0.5 bg-[#FD5771]/5 dark:bg-[#FD5771]/10 text-[#FD5771] text-[10px] font-bold rounded-md leading-none border border-[#FD5771]/5">
                                            {m}
                                        </div>
                                    ))}
                                    {ex.muscle_groups.length > 3 && (
                                        <div className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] font-bold rounded-md border border-slate-100 dark:border-slate-700">
                                            +{ex.muscle_groups.length - 3}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                    <div className="flex items-center gap-1.5">
                                        {ex.demo_url ? (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                                                <Video className="w-3 h-3" />
                                                Video
                                            </div>
                                        ) : (
                                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                                                No Demo
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                        Kỹ thuật
                                        <Info className="w-3.5 h-3.5 text-[#FD5771]" />
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <ExerciseDetailsSheet 
                exercise={selectedExercise}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['exercises-library'] })}
            />
        </div>
    )
}
