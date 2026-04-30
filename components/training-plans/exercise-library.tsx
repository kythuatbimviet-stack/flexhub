'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
    Search, 
    Dumbbell, 
    Target, 
    Video, 
    Filter,
    Layers,
    Info
} from 'lucide-react'
import { fetchExercises, type Exercise } from '@/app/actions/training-plans'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ExerciseLibrary() {
    const [searchQuery, setSearchQuery] = React.useState('')
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)

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

    const categories = Array.from(new Set(exercises.map(ex => ex.category)))

    const filteredExercises = exercises.filter(ex => {
        const name = ex.name || ''
        const nameVi = ex.name_vi || ''
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             nameVi.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || ex.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filter Bar */}
            <div className="flex flex-col gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Tìm kiếm bài tập ( Squat, Push up...)" 
                        className="pl-10 h-10 bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800 rounded-xl text-sm shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    <Button 
                        variant={!selectedCategory ? "secondary" : "ghost"}
                        onClick={() => setSelectedCategory(null)}
                        className={cn("rounded-lg h-8 text-xs font-medium whitespace-nowrap shrink-0", !selectedCategory && "bg-[#FD5771]/5 text-[#FD5771]")}
                    >
                        Tất cả
                    </Button>
                    {categories.map(cat => (
                        <Button 
                            key={cat} 
                            variant={selectedCategory === cat ? "secondary" : "ghost"}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn("rounded-lg h-8 text-xs font-medium whitespace-nowrap shrink-0", selectedCategory === cat && "bg-[#FD5771]/5 text-[#FD5771]")}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Exercise Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="rounded-xl h-36 sm:h-40 animate-pulse bg-gray-50 border-none" />
                    ))
                ) : error ? (
                    <div className="col-span-full py-16 text-center text-red-500 text-sm bg-red-50 rounded-xl border border-red-100">
                        Lỗi tải dữ liệu: {(error as any).message || 'Vui lòng kiểm tra lại kết nối.'}
                    </div>
                ) : filteredExercises.length === 0 ? (
                    <div className="col-span-full py-16 sm:py-20 text-center text-slate-400 text-sm">
                        Không tìm thấy bài tập nào.
                    </div>
                ) : filteredExercises.map((ex) => (
                    <Card key={ex.id} className="group rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900">
                        <CardContent className="p-3 sm:p-4 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-2">
                                <Badge variant="secondary" className="text-[9px] sm:text-[10px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none truncate max-w-[80%]">
                                    {ex.equipment}
                                </Badge>
                                {ex.demo_url && <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FD5771] opacity-60 shrink-0" />}
                            </div>
                            
                            <h4 className="font-medium text-black dark:text-white group-hover:text-[#FD5771] transition-colors line-clamp-2 mb-1 tracking-tight text-xs sm:text-sm leading-snug">
                                {ex.name}
                            </h4>
                            {ex.name_vi && <p className="text-[10px] text-black/40 dark:text-white/40 font-normal mb-2 line-clamp-1">{ex.name_vi}</p>}
                            
                            <div className="mt-auto space-y-1.5 sm:space-y-2">
                                <div className="flex flex-wrap gap-1">
                                    {ex.muscle_groups.slice(0, 2).map(m => (
                                        <div key={m} className="px-1.5 py-0.5 bg-[#FD5771]/5 dark:bg-[#FD5771]/10 text-[#FD5771] text-[9px] sm:text-[10px] font-medium rounded leading-none">
                                            {m}
                                        </div>
                                    ))}
                                    {ex.muscle_groups.length > 2 && (
                                        <div className="text-[9px] text-slate-300 font-bold">+{ex.muscle_groups.length - 2}</div>
                                    )}
                                </div>
                                
                                <button className="w-full pt-2 sm:pt-3 mt-1 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-black dark:text-white group-hover:text-[#FD5771] transition-all">
                                    Chi tiết kỹ thuật
                                    <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function Button({ children, className, variant, onClick }: any) {
    const variants: any = {
        ghost: "hover:bg-slate-50 dark:hover:bg-slate-800 text-black/40 dark:text-white/40",
        secondary: "bg-slate-100 dark:bg-slate-800 text-black dark:text-white"
    }
    return (
        <button 
            onClick={onClick}
            className={cn("px-4 transition-all duration-200", variants[variant || 'ghost'], className)}
        >
            {children}
        </button>
    )
}
