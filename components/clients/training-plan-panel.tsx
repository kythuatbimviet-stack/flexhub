'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
    Dumbbell, 
    Plus, 
    BookOpen, 
    Calendar, 
    ChevronRight, 
    Clock, 
    History,
    MoreHorizontal,
    Trash2,
    Loader2,
    CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { 
    fetchClientPrograms, 
    fetchProgramTemplates, 
    assignProgramToClient,
    deleteProgram 
} from '@/app/actions/training-plans'

interface TrainingPlanPanelProps {
    clientId: string
    ptName: string
}

export function TrainingPlanPanel({ clientId, ptName }: TrainingPlanPanelProps) {
    const queryClient = useQueryClient()
    const [isAssignOpen, setIsAssignOpen] = React.useState(false)

    const { data: clientPrograms = [], isLoading: isClientLoading } = useQuery({
        queryKey: ['client-training-programs', clientId],
        queryFn: () => fetchClientPrograms(clientId).then(res => res.success ? res.data : [])
    })

    const { data: templates = [], isLoading: isTemplatesLoading } = useQuery({
        queryKey: ['training-program-templates'],
        queryFn: () => fetchProgramTemplates().then(res => res.success ? res.data : [])
    })

    const assignMutation = useMutation({
        mutationFn: (templateId: string) => assignProgramToClient(templateId, clientId, ptName),
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Đã giao giáo án thành công')
                setIsAssignOpen(false)
                queryClient.invalidateQueries({ queryKey: ['client-training-programs', clientId] })
            } else {
                toast.error(res.error)
            }
        }
    })

    const activeProgram = clientPrograms[0] // Show the most recent one

    if (isClientLoading) {
        return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-red-600" />
                    Chương trình tập luyện
                </h3>
                
                <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-widest px-3">
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Giao giáo án mới
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                        <DialogHeader className="p-6 bg-slate-900 text-white">
                            <DialogTitle className="text-lg font-black uppercase tracking-widest italic">CHỌN GIÁO ÁN MẪU</DialogTitle>
                        </DialogHeader>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-950 no-scrollbar">
                            {templates.length === 0 ? (
                                <p className="text-center py-10 text-slate-400 text-sm italic">Chưa có giáo án mẫu nào trong thư viện.</p>
                            ) : templates.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => assignMutation.mutate(t.id)}
                                    disabled={assignMutation.isPending}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-left group transition-all"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-red-100 text-red-600">{t.level}</Badge>
                                            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t.name}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium">Mục tiêu: {t.goal} • {t.duration_weeks} Tuần</p>
                                    </div>
                                    {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-500" />}
                                </button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {activeProgram ? (
                <div className="space-y-6">
                    {/* Active Program Header */}
                    <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900 border-l-4 border-l-red-500 overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-none font-black text-[9px] uppercase tracking-widest">Đang tập luyện</Badge>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activeProgram.level}</span>
                                    </div>
                                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{activeProgram.name}</CardTitle>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Thời lượng</div>
                                    <div className="text-sm font-bold text-red-600">{activeProgram.duration_weeks} Tuần</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50 dark:border-slate-800/50">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <Target className="w-4 h-4 text-red-400" />
                                    <span>Mục tiêu: <span className="text-slate-900 dark:text-slate-200">{activeProgram.goal}</span></span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <History className="w-4 h-4 text-red-400" />
                                    <span>Giao ngày: <span className="text-slate-900 dark:text-slate-200">{new Date(activeProgram.created_at).toLocaleDateString('vi-VN')}</span></span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Session Quick View */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Chi tiết các buổi tập</h4>
                        <div className="grid grid-cols-1 gap-3">
                            {activeProgram.sessions?.map((session: any) => (
                                <Card key={session.id} className="rounded-xl border border-slate-100 dark:border-slate-800 shadow-none hover:bg-slate-50 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 flex items-center justify-center">
                                                    <Dumbbell className="w-5 h-5 text-red-500" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{session.day_label}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium">Đã thiết lập: {session.exercises?.length || 0} bài tập</div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white"><ChevronRight className="w-4 h-4 text-slate-300" /></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                        <Dumbbell className="w-8 h-8 text-slate-200" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-400 text-sm font-medium italic">Chưa giao giáo án cho hội viên này.</p>
                        <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">Chọn mẫu từ thư viện để bắt đầu</p>
                    </div>
                </div>
            )}
        </div>
    )
}
