'use client'

import * as React from 'react'
import { 
    Plus, 
    Trash2, 
    Save, 
    Dumbbell, 
    Clock, 
    Hash, 
    Target, 
    PlusCircle,
    ChevronDown,
    ChevronUp,
    Search,
    Loader2,
    ChevronRight,
    ArrowLeft,
    X
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select'

import { fetchExercises, createProgramTemplate, type Exercise } from '@/app/actions/training-plans'
import { cn } from '@/lib/utils'

interface TrainingPlanBuilderProps {
    onSuccess: () => void
}

export function TrainingPlanBuilder({ onSuccess }: TrainingPlanBuilderProps) {
    const [loading, setLoading] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState('0')
    const [mainStep, setMainStep] = React.useState('setup')
    const [program, setProgram] = React.useState({
        name: '',
        goal: '',
        level: 'Beginner',
        duration_weeks: 12,
        is_public: true
    })

    const [sessions, setSessions] = React.useState<any[]>([
        { day_label: 'Ngày 1', sort_order: 0, notes: '', exercises: [] }
    ])
    const [activeAddingIdx, setActiveAddingIdx] = React.useState<number | null>(null)

    const { data: exerciseLibrary = [] } = useQuery({
        queryKey: ['exercises-library'],
        queryFn: async () => {
            const res = await fetchExercises()
            return res.success ? (res.data as Exercise[]) : []
        }
    })

    const addSession = () => {
        setSessions([...sessions, { 
            day_label: `Ngày ${sessions.length + 1}`, 
            sort_order: sessions.length, 
            notes: '', 
            exercises: [] 
        }])
        setActiveTab(sessions.length.toString())
    }

    const removeSession = (idx: number) => {
        const newSessions = sessions.filter((_, i) => i !== idx)
        setSessions(newSessions)
        if (activeTab === idx.toString()) setActiveTab('0')
    }

    const addExerciseToSession = (sessionIdx: number, exercise: Exercise) => {
        const newSessions = [...sessions]
        newSessions[sessionIdx].exercises.push({
            exercise_id: exercise.id,
            exercise_name: exercise.name,
            sets: '3',
            reps: '12',
            rest_seconds: 60,
            intensity: '',
            tempo: '2-0-2',
            notes: ''
        })
        setSessions(newSessions)
        setActiveAddingIdx(null)
    }

    const updateExercise = (sessionIdx: number, exIdx: number, field: string, value: any) => {
        const newSessions = [...sessions]
        newSessions[sessionIdx].exercises[exIdx][field] = value
        setSessions(newSessions)
    }

    const removeExercise = (sessionIdx: number, exIdx: number) => {
        const newSessions = [...sessions]
        newSessions[sessionIdx].exercises = newSessions[sessionIdx].exercises.filter((_: any, i: number) => i !== exIdx)
        setSessions(newSessions)
    }

    const handleSave = async () => {
        if (!program.name) return toast.error('Vui lòng nhập tên giáo án')
        
        try {
            setLoading(true)
            const res = await createProgramTemplate(program, sessions)
            if (res.success) {
                toast.success('Đã lưu giáo án mẫu thành công')
                onSuccess()
            } else {
                toast.error('Lỗi: ' + res.error)
            }
        } catch (error: any) {
            toast.error('Lỗi hệ thống: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Top Action Bar - High-End Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-1 py-3 mb-2 shrink-0">
                <div className="flex items-center justify-between gap-3 max-w-full">
                    {/* Header Left - Mobile: Segmented Control / Desktop: Title */}
                    <div className="flex-1">
                        <div className="hidden md:flex flex-col">
                            <h3 className="text-base font-medium text-black dark:text-white leading-none">Thiết kế giáo án</h3>
                            <span className="text-[11px] text-black/60 dark:text-white/60 font-normal mt-1">Hệ thống xây dựng lộ trình tập luyện chuyên nghiệp</span>
                        </div>
                        
                        {/* Mobile Step Indicator - Premium Segmented Control */}
                        <div className="flex md:hidden items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                            <button 
                                onClick={() => setMainStep('setup')}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300",
                                    mainStep === 'setup' ? "bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm scale-100" : "text-black/40 dark:text-white/40 scale-95 opacity-70"
                                )}
                            >
                                Thiết lập
                            </button>
                            <button 
                                onClick={() => setMainStep('sessions')}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300",
                                    mainStep === 'sessions' ? "bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm scale-100" : "text-black/40 dark:text-white/40 scale-95 opacity-70"
                                )}
                            >
                                Buổi tập
                            </button>
                        </div>
                    </div>

                    {/* Header Right - Global Actions */}
                    <div className="flex items-center gap-1.5">
                        <Button 
                            variant="ghost" 
                            type="button"
                            className="rounded-xl font-medium text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-3 text-xs"
                            onClick={() => onSuccess()}
                        >
                            Hủy bỏ
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-[#FD5771] hover:bg-[#e44e65] text-white rounded-xl h-10 px-4 sm:px-6 font-medium shadow-md transition-all active:scale-95 gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span className="text-xs sm:text-sm">Lưu giáo án</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <Tabs value={mainStep} onValueChange={setMainStep} className="h-full flex flex-col">
                    <div className="hidden sm:block px-1 mb-4">
                        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-12 border-none">
                            <TabsTrigger value="setup" className="rounded-lg px-8 font-medium text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-black dark:data-[state=active]:text-white shadow-sm transition-all">
                                1. Thiết lập chung
                            </TabsTrigger>
                            <TabsTrigger value="sessions" className="rounded-lg px-8 font-medium text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-black dark:data-[state=active]:text-white shadow-sm transition-all">
                                2. Nội dung buổi tập
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                        <TabsContent value="setup" className="mt-0 space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                            <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                                <div className="p-1 bg-red-600 w-full" />
                                <CardContent className="p-4 sm:p-6 space-y-5">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-medium text-black dark:text-white ml-1">Tên giáo án huấn luyện</label>
                                            <Input 
                                                placeholder="VD: 12 Tuần Tăng Cơ Giảm Mỡ" 
                                                value={program.name}
                                                onChange={e => setProgram({...program, name: e.target.value})}
                                                className="h-12 rounded-xl font-medium border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-black dark:text-white focus-visible:ring-1 focus-visible:ring-slate-900/30 placeholder:text-black/40 dark:placeholder:text-white/20 transition-all text-sm shadow-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-medium text-black dark:text-white ml-1">Cấp độ mục tiêu</label>
                                                <Select value={program.level} onValueChange={val => setProgram({...program, level: val})}>
                                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium text-sm transition-all focus:ring-1 focus:ring-black dark:focus:ring-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-950">
                                                        <SelectItem value="Beginner" className="rounded-lg font-medium">Bắt đầu (Beginner)</SelectItem>
                                                        <SelectItem value="Intermediate" className="rounded-lg font-medium">Trung bình (Intermediate)</SelectItem>
                                                        <SelectItem value="Advance" className="rounded-lg font-medium">Nâng cao (Advance)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-medium text-black dark:text-white ml-1">Số tuần thực hiện</label>
                                                <Input 
                                                    type="number"
                                                    value={program.duration_weeks}
                                                    onChange={e => setProgram({...program, duration_weeks: parseInt(e.target.value)})}
                                                    className="h-12 rounded-xl font-medium border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-black dark:text-white focus-visible:ring-1 focus-visible:ring-slate-900/30 transition-all text-sm shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        type="button"
                                        onClick={() => setMainStep('sessions')}
                                        className="w-full h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black font-medium text-sm mt-4 sm:hidden shadow-lg active:scale-95 transition-all"
                                    >
                                        Tiếp tục thiết lập buổi tập
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="sessions" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="space-y-4 px-1">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[13px] font-medium text-black dark:text-white flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                                        Danh sách các buổi tập
                                    </h3>
                                    <Button onClick={addSession} variant="ghost" className="h-9 rounded-xl px-0 text-xs font-medium gap-1 text-black dark:text-white hover:bg-transparent transition-colors">
                                        <PlusCircle className="w-4 h-4" />
                                        Thêm buổi tập
                                    </Button>
                                </div>

                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl h-14 w-full justify-start gap-2 overflow-x-auto no-scrollbar">
                                        {sessions.map((s, idx) => (
                                            <TabsTrigger 
                                                key={idx} 
                                                value={idx.toString()}
                                                className="rounded-xl px-6 font-medium text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#FD5771] data-[state=active]:shadow-sm transition-all"
                                            >
                                                {s.day_label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {sessions.map((session, sIdx) => (
                                        <TabsContent key={sIdx} value={sIdx.toString()} className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 pb-20">
                                            <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                                                <CardContent className="p-0 space-y-0">
                                                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 p-4 sm:p-5 bg-slate-50 dark:bg-white/5">
                                                        <div className="flex-1 flex items-center gap-3">
                                                            <div className="w-1 h-6 bg-[#FD5771] rounded-full" />
                                                            <Input 
                                                                value={session.day_label}
                                                                onChange={e => {
                                                                    const newSessions = [...sessions]
                                                                    newSessions[sIdx].day_label = e.target.value
                                                                    setSessions(newSessions)
                                                                }}
                                                                className="border-none text-lg sm:text-xl font-semibold h-auto p-0 focus-visible:ring-0 bg-transparent text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/20"
                                                                placeholder="VD: Leg Day..."
                                                            />
                                                        </div>
                                                        {sessions.length > 1 && (
                                                            <Button variant="ghost" onClick={() => removeSession(sIdx)} className="text-black/10 dark:text-white/10 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 h-9 w-9 p-0 rounded-xl transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="p-4 sm:p-5 space-y-4">
                                                        {session.exercises.map((ex: any, exIdx: number) => (
                                                            <Card key={exIdx} className="rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#FD5771]/30 transition-all shadow-none overflow-hidden group">
                                                                <div className="bg-slate-50/50 dark:bg-slate-800/80 p-3.5 flex items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-7 h-7 rounded-lg bg-black dark:bg-white flex items-center justify-center font-medium text-[10px] text-white dark:text-black shadow-sm">
                                                                            {exIdx + 1}
                                                                        </div>
                                                                        <span className="font-medium text-sm text-black dark:text-white tracking-tight">{ex.exercise_name}</span>
                                                                    </div>
                                                                    <Button variant="ghost" onClick={() => removeExercise(sIdx, exIdx)} className="h-8 w-8 p-0 text-black/40 dark:text-white/40 hover:text-red-600 rounded-lg">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                                <div className="p-3 sm:p-5 grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-6 bg-white dark:bg-slate-900/50">
                                                                    <div className="space-y-1.5 flex flex-col">
                                                                        <label className="text-[11px] font-medium text-black dark:text-white ml-1 flex items-center gap-1.5 line-clamp-1">
                                                                            <Hash className="w-3 h-3 text-black/40" /> <span className="hidden xs:inline">Sets</span>
                                                                        </label>
                                                                        <Input 
                                                                            value={ex.sets}
                                                                            onChange={e => updateExercise(sIdx, exIdx, 'sets', e.target.value)}
                                                                            className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-medium text-xs focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white transition-all text-center px-1 shadow-sm text-black dark:text-white"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5 flex flex-col">
                                                                        <label className="text-[11px] font-medium text-black dark:text-white ml-1 flex items-center gap-1.5 line-clamp-1">
                                                                            <ChevronRight className="w-3 h-3 text-black/40" /> <span className="hidden xs:inline">Reps</span>
                                                                        </label>
                                                                        <Input 
                                                                            value={ex.reps}
                                                                            onChange={e => updateExercise(sIdx, exIdx, 'reps', e.target.value)}
                                                                            className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-medium text-xs focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white transition-all text-center px-1 shadow-sm text-black dark:text-white"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5 flex flex-col">
                                                                        <label className="text-[11px] font-medium text-black dark:text-white ml-1 flex items-center gap-1.5 line-clamp-1">
                                                                            <Clock className="w-3 h-3 text-black/40" /> <span className="hidden xs:inline">Nghỉ</span>
                                                                        </label>
                                                                        <Input 
                                                                            type="number"
                                                                            value={ex.rest_seconds}
                                                                            onChange={e => updateExercise(sIdx, exIdx, 'rest_seconds', parseInt(e.target.value))}
                                                                            className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-medium text-xs focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white transition-all text-center px-1 shadow-sm text-black dark:text-white"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5 flex flex-col col-span-1.5 sm:col-span-1">
                                                                        <label className="text-[11px] font-medium text-black dark:text-white ml-1 flex items-center gap-1.5 line-clamp-1">
                                                                            <Target className="w-3 h-3 text-black/40" /> <span className="hidden xs:inline">Cường độ</span>
                                                                        </label>
                                                                        <Input 
                                                                            value={ex.intensity}
                                                                            onChange={e => updateExercise(sIdx, exIdx, 'intensity', e.target.value)}
                                                                            className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-medium text-xs placeholder:font-normal focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white transition-all px-3 shadow-sm text-black dark:text-white"
                                                                            placeholder="70%"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5 flex flex-col col-span-1.5 sm:col-span-1">
                                                                        <label className="text-[11px] font-medium text-black dark:text-white ml-1 flex items-center gap-1.5 line-clamp-1">
                                                                            <PlusCircle className="w-3 h-3 text-black/40" /> <span className="hidden xs:inline">Tempo</span>
                                                                        </label>
                                                                        <Input 
                                                                            value={ex.tempo}
                                                                            onChange={e => updateExercise(sIdx, exIdx, 'tempo', e.target.value)}
                                                                            className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-medium text-xs placeholder:font-normal focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white transition-all px-3 shadow-sm text-black dark:text-white"
                                                                            placeholder="3-0-1"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        ))}

                                                        {activeAddingIdx === sIdx ? (
                                                            <InlineExercisePicker 
                                                                onSelect={(ex) => addExerciseToSession(sIdx, ex)} 
                                                                exerciseLibrary={exerciseLibrary} 
                                                                onClose={() => setActiveAddingIdx(null)}
                                                            />
                                                        ) : (
                                                            <Button 
                                                                variant="outline" 
                                                                onClick={() => setActiveAddingIdx(sIdx)}
                                                                className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-black dark:text-white hover:border-black dark:hover:border-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-medium text-xs gap-3 bg-white dark:bg-slate-900"
                                                            >
                                                                <PlusCircle className="w-5 h-5 text-black/40 dark:text-white/40" />
                                                                Thêm bài tập vào buổi tập
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}

function InlineExercisePicker({ onSelect, exerciseLibrary, onClose }: { onSelect: (ex: Exercise) => void, exerciseLibrary: Exercise[], onClose: () => void }) {
    const [search, setSearch] = React.useState('')

    const filtered = exerciseLibrary.filter(ex => 
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.name_vi?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-[#FD5771]" />
                    <span className="text-xs font-semibold text-black dark:text-white uppercase tracking-wider">Thư viện bài tập</span>
                </div>
                <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0 rounded-lg text-black/40 dark:text-white/40 hover:text-red-500">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                <Input 
                    placeholder="Tìm nhanh bài tập..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-medium shadow-sm transition-all focus:ring-1 focus:ring-[#FD5771]"
                    autoFocus
                />
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-1 no-scrollbar">
                {filtered.length === 0 ? (
                    <div className="py-8 text-center text-xs text-black/40 dark:text-white/40 italic">
                        Không tìm thấy bài tập phù hợp
                    </div>
                ) : (
                    filtered.map(ex => (
                        <button 
                            key={ex.id}
                            onClick={() => onSelect(ex)}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left group transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/10"
                        >
                            <div className="space-y-0.5">
                                <h4 className="font-medium text-black dark:text-white tracking-tight text-sm group-hover:text-[#FD5771] transition-colors">{ex.name}</h4>
                                <p className="text-[10px] text-black/40 dark:text-white/40 font-normal">{ex.category} • {ex.equipment}</p>
                            </div>
                            <PlusCircle className="w-4 h-4 text-black/10 dark:text-white/10 group-hover:text-[#FD5771] transition-all" />
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
