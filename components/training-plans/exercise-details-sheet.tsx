'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dumbbell,
    Save,
    Trash2,
    X,
    Loader2,
    Target,
    Video,
    Layers,
    Info,
    ChevronDown,
    Plus
} from 'lucide-react'
import { createExercise, updateExercise, deleteExercise, type Exercise } from '@/app/actions/training-plans'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

interface ExerciseDetailsSheetProps {
    exercise: Exercise | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

const ExerciseInfoRow = ({ label, value, name, type = "text", options, isEditing, formData, onChange, onSelectChange }: any) => {
    return (
        <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                {label}
            </Label>
            {isEditing ? (
                type === 'textarea' ? (
                    <Textarea
                        name={name}
                        value={formData[name] || ''}
                        onChange={onChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] text-sm focus:ring-2 focus:ring-[#FD5771]/20 focus:border-[#FD5771] shadow-sm transition-all"
                        placeholder={`Nhập ${label.toLowerCase()}...`}
                    />
                ) : type === 'select' ? (
                    <Select value={formData[name] || ''} onValueChange={(val) => onSelectChange(name, val)}>
                        <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-[#FD5771]/20 focus:border-[#FD5771] shadow-sm transition-all">
                            <SelectValue placeholder={`Chọn ${label.toLowerCase()}...`} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                            {options?.map((opt: string) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        name={name}
                        type={type}
                        value={formData[name] ?? ''}
                        onChange={onChange}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-[#FD5771]/20 focus:border-[#FD5771] shadow-sm transition-all"
                        placeholder={`Nhập ${label.toLowerCase()}...`}
                    />
                )
            ) : (
                <div className="min-h-[2.5rem] flex items-center">
                    <p className="text-[15px] font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                        {value || <span className="text-slate-400 font-normal italic text-sm">Chưa cập nhật</span>}
                    </p>
                </div>
            )}
        </div>
    )
}

export function ExerciseDetailsSheet({ exercise, open, onOpenChange, onSuccess }: ExerciseDetailsSheetProps) {
    const isCreateMode = !exercise
    const [isEditing, setIsEditing] = React.useState(isCreateMode)
    const isMobile = useIsMobile()
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<Partial<Exercise>>({
        name: '',
        name_vi: '',
        category: 'Resistance',
        muscle_groups: [],
        equipment: '',
        description: '',
        demo_url: ''
    })

    React.useEffect(() => {
        if (exercise) {
            setFormData({ ...exercise })
            setIsEditing(false)
        } else if (open) {
            setFormData({
                name: '',
                name_vi: '',
                category: 'Resistance',
                muscle_groups: [],
                equipment: '',
                description: '',
                demo_url: ''
            })
            setIsEditing(true)
        }
    }, [exercise, open])

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Vui lòng nhập tên bài tập')
            return
        }

        setLoading(true)
        try {
            if (isCreateMode) {
                const result = await createExercise(formData)
                if (!result.success) throw new Error(result.error)
                toast.success('Thêm bài tập thành công')
                onOpenChange(false)
            } else {
                const result = await updateExercise(exercise!.id, formData)
                if (!result.success) throw new Error(result.error)
                toast.success('Cập nhật bài tập thành công')
                setIsEditing(false)
            }
            onSuccess()
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!exercise) return
        if (!confirm('Bạn có chắc chắn muốn xóa bài tập này khỏi thư viện?')) return

        setLoading(true)
        try {
            const result = await deleteExercise(exercise.id)
            if (!result.success) throw new Error(result.error)
            toast.success('Đã xóa bài tập')
            onOpenChange(false)
            onSuccess()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi xóa')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleMuscleGroupsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const groups = e.target.value.split(',').map(g => g.trim()).filter(g => g !== '')
        setFormData(prev => ({ ...prev, muscle_groups: groups }))
    }

    const categories = ['Resistance', 'Cardio', 'Flexibility', 'Mobility', 'Power', 'Endurance']

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                resizable={!isMobile}
                showCloseButton={false}
                className="w-full sm:max-w-[500px] border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-inter overflow-hidden"
            >
                {/* Header Section */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-5 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#FD5771]/10 flex items-center justify-center border border-[#FD5771]/20">
                                <Dumbbell className="w-6 h-6 text-[#FD5771]" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-semibold text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
                                    {isCreateMode ? 'Thêm bài tập mới' : (formData.name || 'Chi tiết bài tập')}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {isCreateMode ? 'Nhập thông tin kỹ thuật bài tập' : 'Quản lý thông tin và kỹ thuật bài tập'}
                                </SheetDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 h-9 w-9"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isCreateMode && !isEditing && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="h-9 px-4 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all font-medium text-xs gap-2"
                                >
                                    Sửa thông tin
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    className="h-9 px-4 rounded-xl bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border-slate-200 dark:border-slate-700 hover:bg-red-50 transition-all font-medium text-xs gap-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Xóa
                                </Button>
                            </>
                        )}
                        {isEditing && (
                            <div className="flex items-center gap-2 w-full">
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="h-9 px-6 rounded-xl bg-[#FD5771] hover:bg-[#e04d64] text-white shadow-lg shadow-red-100 dark:shadow-none transition-all active:scale-95 font-semibold text-xs flex-1"
                                >
                                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                                    {isCreateMode ? 'Tạo bài tập' : 'Lưu thay đổi'}
                                </Button>
                                {!isCreateMode && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                        className="h-9 px-4 rounded-xl text-slate-500 font-medium text-xs"
                                    >
                                        Hủy
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Basic Info Group */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <Info className="w-4 h-4 text-[#FD5771]" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Thông tin chung</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <ExerciseInfoRow
                                label="Tên bài tập (Tiếng Anh)"
                                value={formData.name}
                                name="name"
                                isEditing={isEditing}
                                formData={formData}
                                onChange={handleChange}
                            />
                            <ExerciseInfoRow
                                label="Tên bài tập (Tiếng Việt)"
                                value={formData.name_vi}
                                name="name_vi"
                                isEditing={isEditing}
                                formData={formData}
                                onChange={handleChange}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <ExerciseInfoRow
                                    label="Phân loại"
                                    value={formData.category}
                                    name="category"
                                    type="select"
                                    options={categories}
                                    isEditing={isEditing}
                                    formData={formData}
                                    onSelectChange={handleSelectChange}
                                />
                                <ExerciseInfoRow
                                    label="Thiết bị"
                                    value={formData.equipment}
                                    name="equipment"
                                    isEditing={isEditing}
                                    formData={formData}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Technical Info Group */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <Target className="w-4 h-4 text-[#FD5771]" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Kỹ thuật & Cơ bắp</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                    Nhóm cơ tác động
                                </Label>
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <Input
                                            value={formData.muscle_groups?.join(', ') || ''}
                                            onChange={handleMuscleGroupsChange}
                                            placeholder="Ví dụ: Chest, Triceps, Shoulders (ngăn cách bằng dấu phẩy)"
                                            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-[#FD5771]/20 focus:border-[#FD5771]"
                                        />
                                        <p className="text-[10px] text-slate-400 pl-1 italic">Dùng dấu phẩy (,) để phân tách các nhóm cơ</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {formData.muscle_groups && formData.muscle_groups.length > 0 ? (
                                            formData.muscle_groups.map(m => (
                                                <div key={m} className="px-3 py-1 bg-[#FD5771]/5 text-[#FD5771] dark:bg-[#FD5771]/10 text-[12px] font-semibold rounded-lg border border-[#FD5771]/10">
                                                    {m}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 italic text-sm">Chưa có thông tin nhóm cơ</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <ExerciseInfoRow
                                label="Link Video hướng dẫn (YouTube/Vimeo)"
                                value={formData.demo_url}
                                name="demo_url"
                                isEditing={isEditing}
                                formData={formData}
                                onChange={handleChange}
                            />

                            <ExerciseInfoRow
                                label="Hướng dẫn kỹ thuật chi tiết"
                                value={formData.description}
                                name="description"
                                type="textarea"
                                isEditing={isEditing}
                                formData={formData}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer / Quick Actions (Optional) */}
                {!isEditing && !isCreateMode && formData.demo_url && (
                    <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                        <Button
                            asChild
                            variant="ghost"
                            className="w-full h-12 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-all font-bold text-sm gap-3"
                        >
                            <a href={formData.demo_url} target="_blank" rel="noopener noreferrer">
                                <Video className="w-5 h-5" />
                                Xem Video hướng dẫn
                            </a>
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
