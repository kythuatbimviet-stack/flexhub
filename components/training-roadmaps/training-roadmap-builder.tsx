'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Loader2, Target, Dumbbell, Flag, Route, ArrowLeft, Clock, Hash, X } from 'lucide-react'
import { createRoadmap, updateRoadmap, type TrainingRoadmap, type RoadmapPhase } from '@/app/actions/training-roadmaps'
import { fetchClients } from '@/app/actions/clients'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

interface TrainingRoadmapBuilderProps {
    onSuccess?: () => void
    onCancel?: () => void
    initialData?: TrainingRoadmap
}

const DEFAULT_PHASES: Partial<RoadmapPhase>[] = [
    { phase_number: 1, phase_title: 'HUẤN LUYỆN NỀN TẢNG', primary_goal: '', supplementary_goal: '', methodology: '', expected_results: '', total_time: '1 Tháng', total_sessions: '12 Buổi' },
    { phase_number: 2, phase_title: 'TĂNG CƯỜNG THỂ CHẤT', primary_goal: '', supplementary_goal: '', methodology: '', expected_results: '', total_time: '1 Tháng', total_sessions: '12 Buổi' },
    { phase_number: 3, phase_title: 'TỐI ƯU HÓA KẾT QUẢ', primary_goal: '', supplementary_goal: '', methodology: '', expected_results: '', total_time: '1 Tháng', total_sessions: '12 Buổi' },
]

const TagInput = ({
    value,
    onChange,
    placeholder,
    label,
    icon: Icon
}: {
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    label?: string,
    icon?: any
}) => {
    const [inputValue, setInputValue] = React.useState('')
    const tags = value ? value.split(/[,\n;]+/).map(t => t.trim()).filter(t => t) : []

    const addTag = (text?: string) => {
        const tagToAdd = (text || inputValue).trim()
        if (!tagToAdd) return
        if (tags.includes(tagToAdd)) {
            setInputValue('')
            return
        }
        const newTags = [...tags, tagToAdd]
        onChange(newTags.join(', '))
        setInputValue('')
    }

    const removeTag = (index: number) => {
        const newTags = tags.filter((_, i) => i !== index)
        onChange(newTags.join(', '))
    }

    return (
        <div className="space-y-3">
            {label && (
                <div className="flex items-center gap-2 mb-1">
                    {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">{label}</label>
                </div>
            )}

            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-0.5">
                    {tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 group transition-all hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm">
                            {tag}
                            <X
                                className="w-3.5 h-3.5 cursor-pointer text-slate-400 hover:text-red-500 transition-colors"
                                onClick={() => removeTag(i)}
                            />
                        </span>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                <Input
                    value={inputValue}
                    onChange={e => {
                        const val = e.target.value
                        if (val.endsWith(';') || val.endsWith(',')) {
                            addTag(val.slice(0, -1).trim())
                        } else {
                            setInputValue(val)
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag()
                        }
                    }}
                    placeholder={placeholder}
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-red-500/20 bg-white dark:bg-slate-900/50"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addTag()}
                    className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#FD5771]/10 hover:text-[#FD5771] border border-slate-200 dark:border-slate-800 shrink-0 px-5 font-bold text-xs transition-all active:scale-95"
                >
                    Thêm
                </Button>
            </div>
        </div>
    )
}

export function TrainingRoadmapBuilder({ onSuccess, onCancel, initialData }: TrainingRoadmapBuilderProps) {
    const queryClient = useQueryClient()
    const [selectedClientId, setSelectedClientId] = React.useState<string>(initialData?.client_id || '')
    const [activeTab, setActiveTab] = React.useState('0')
    const [roadmapData, setRoadmapData] = React.useState({
        goal: initialData?.goal || '',
        duration_overall: initialData?.duration_overall || '3 Tháng / 36 Buổi'
    })

    const [phases, setPhases] = React.useState<Partial<RoadmapPhase>[]>(
        initialData?.phases && initialData.phases.length > 0
            ? [...initialData.phases].sort((a, b) => a.phase_number - b.phase_number)
            : DEFAULT_PHASES
    )

    const { data: clients = [] } = useQuery({
        queryKey: ['clients-list'],
        queryFn: async () => {
            const res = await fetchClients()
            return res.success ? (res.data || []) : []
        }
    })

    const mutation = useMutation({
        mutationFn: async () => {
            if (initialData) {
                return updateRoadmap(initialData.id, roadmapData, phases as RoadmapPhase[])
            } else {
                return createRoadmap({ ...roadmapData, client_id: selectedClientId }, phases)
            }
        },
        onSuccess: (res) => {
            if (res.success) {
                toast.success(initialData ? 'Đã cập nhật lộ trình thành công' : 'Đã khởi tạo lộ trình thành công')
                queryClient.invalidateQueries({ queryKey: ['training-roadmaps', selectedClientId] })
                onSuccess?.()
            } else {
                toast.error('Lỗi: ' + res.error)
            }
        }
    })

    const handlePhaseChange = (index: number, field: keyof RoadmapPhase, value: string) => {
        const newPhases = [...phases]
        newPhases[index] = { ...newPhases[index], [field]: value }
        setPhases(newPhases)
    }

    const isValid = selectedClientId && roadmapData.goal && phases.every(p => p.phase_title && p.primary_goal)

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-[140px] lg:pb-24">
            {/* Main Info Card */}
            <Card className="p-6 border-none shadow-sm rounded-xl bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <TagInput
                                label="Mục tiêu tổng quát"
                                icon={Target}
                                placeholder="Ví dụ: Giảm mỡ, Tăng cơ... (Enter để thêm)"
                                value={roadmapData.goal}
                                onChange={(val) => setRoadmapData({ ...roadmapData, goal: val })}
                            />
                        </div>
                    </div>
                    <div className="space-y-4 text-left">
                        <div className="flex items-center gap-2 mb-2">
                            <Route className="w-4 h-4 text-[#FD5771]" />
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Thời gian tổng dự kiến</label>
                        </div>
                        {!initialData && (
                            <div className="mb-4">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Hội viên thụ hưởng</Label>
                                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/30">
                                        <SelectValue placeholder="Chọn hội viên..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="rounded-lg">
                                                {c.member_name} - {c.phone}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Input
                            placeholder="Ví dụ: 3 Tháng / 36 Buổi"
                            value={roadmapData.duration_overall}
                            onChange={(e) => setRoadmapData({ ...roadmapData, duration_overall: e.target.value })}
                            className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-red-500/20"
                        />
                        <p className="text-[10px] text-slate-400 font-medium mt-2">* Thông tin này hiển thị ở đầu bảng lộ trình.</p>
                    </div>
                </div>
            </Card>

            {/* Phases Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Giai đoạn
                    </h3>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-3 h-14 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-1 gap-2">
                        {phases.map((_, idx) => (
                            <TabsTrigger
                                key={idx}
                                value={idx.toString()}
                                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-tight"
                            >
                                Giai đoạn {idx + 1}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {phases.map((phase, idx) => (
                        <TabsContent key={idx} value={idx.toString()} className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="p-6 border-none shadow-sm rounded-xl bg-white dark:bg-slate-900 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Phase Title & Goals */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tiêu đề giai đoạn</label>
                                            <Input
                                                value={phase.phase_title}
                                                onChange={(e) => handlePhaseChange(idx, 'phase_title', e.target.value)}
                                                className="h-11 rounded-xl font-bold uppercase tracking-tight text-blue-600 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>
                                        <TagInput
                                            label="Mục tiêu chính"
                                            placeholder="VD: Cải thiện tư thế... (Enter để thêm)"
                                            value={phase.primary_goal || ''}
                                            onChange={(val) => handlePhaseChange(idx, 'primary_goal', val)}
                                        />
                                        <TagInput
                                            label="Mục tiêu bổ sung"
                                            placeholder="VD: Cardio, Sức bền... (Enter để thêm)"
                                            value={phase.supplementary_goal || ''}
                                            onChange={(val) => handlePhaseChange(idx, 'supplementary_goal', val)}
                                        />
                                    </div>

                                    {/* Methodology & Expected Results */}
                                    <div className="space-y-6">
                                        <TagInput
                                            label="Phương pháp thực hiện"
                                            icon={Dumbbell}
                                            placeholder="VD: Dropset, HIIT... (Enter để thêm)"
                                            value={phase.methodology || ''}
                                            onChange={(val) => handlePhaseChange(idx, 'methodology', val)}
                                        />
                                        <TagInput
                                            label="Kết quả dự kiến"
                                            icon={Flag}
                                            placeholder="VD: -2kg mỡ, +1cm bắp tay... (Enter để thêm)"
                                            value={phase.expected_results || ''}
                                            onChange={(val) => handlePhaseChange(idx, 'expected_results', val)}
                                        />
                                    </div>
                                </div>

                                {/* Metrics Row */}
                                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</label>
                                        </div>
                                        <Input
                                            value={phase.total_time}
                                            onChange={(e) => handlePhaseChange(idx, 'total_time', e.target.value)}
                                            className="h-11 rounded-xl uppercase font-bold border-slate-200 dark:border-slate-800"
                                            placeholder="VD: 4 Tuần"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-3.5 h-3.5 text-slate-400" />
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Số buổi tập</label>
                                        </div>
                                        <Input
                                            value={phase.total_sessions}
                                            onChange={(e) => handlePhaseChange(idx, 'total_sessions', e.target.value)}
                                            className="h-11 rounded-xl uppercase font-bold border-slate-200 dark:border-slate-800"
                                            placeholder="VD: 12 Buổi"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Actions Bar — sits above MobileNav on mobile (bottom-[60px]), flush at bottom on desktop */}
            <div className="fixed bottom-[60px] lg:bottom-0 left-0 lg:left-72 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3 justify-center z-50 transition-all duration-300">
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold px-5 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all gap-2 shrink-0"
                    >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Đóng</span>
                        <span className="sm:hidden">Đóng</span>
                    </Button>
                )}
                <Button
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending || !isValid}
                    className="flex-1 max-w-md h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200 dark:shadow-none active:scale-95 transition-all gap-2"
                >
                    {mutation.isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            {initialData ? 'Cập nhật lộ trình' : 'Khởi tạo lộ trình'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
