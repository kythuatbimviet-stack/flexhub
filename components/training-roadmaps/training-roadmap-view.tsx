'use client'

import * as React from 'react'
import { TrainingRoadmap, RoadmapPhase } from '@/app/actions/training-roadmaps'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
    Calendar, 
    Target, 
    Dumbbell, 
    Flag, 
    Clock, 
    Hash,
    User,
    ChevronRight,
    Route
} from 'lucide-react'

interface TrainingRoadmapViewProps {
    roadmap: TrainingRoadmap
}

const Tag = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all hover:translate-y-[-1px] uppercase tracking-tight",
        className
    )}>
        {children}
    </span>
)

const renderTags = (text: string, className?: string) => {
    if (!text) return null
    // Split by comma, semi-colon or newline
    const items = text.split(/[,\n;]+/).map(item => item.trim()).filter(item => item.length > 0)
    if (items.length === 0) return null
    
    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {items.map((item, i) => (
                <Tag key={i} className={className}>
                    {item}
                </Tag>
            ))}
        </div>
    )
}

export function TrainingRoadmapView({ roadmap }: TrainingRoadmapViewProps) {
    if (!roadmap || !roadmap.phases) return null

    // Sort phases by phase number
    const sortedPhases = [...roadmap.phases].sort((a, b) => a.phase_number - b.phase_number)

    const phaseStyles = [
        { 
            bg: 'bg-amber-50/30 dark:bg-amber-950/20', 
            border: 'border-amber-100 dark:border-amber-900/40', 
            text: 'text-amber-900 dark:text-amber-100', 
            accent: 'bg-amber-100/60 dark:bg-amber-900/40',
            tagPrimary: 'bg-amber-100 text-amber-900 border-amber-200/40 dark:bg-amber-800/60 dark:text-amber-200',
            tagSecondary: 'bg-amber-50/50 text-amber-800/60 border-amber-100/40 dark:bg-amber-950/40 dark:text-amber-400'
        },
        { 
            bg: 'bg-sky-50/30 dark:bg-sky-950/20', 
            border: 'border-sky-100 dark:border-sky-900/40', 
            text: 'text-sky-900 dark:text-sky-100', 
            accent: 'bg-sky-100/60 dark:bg-sky-900/40',
            tagPrimary: 'bg-sky-100 text-sky-900 border-sky-200/40 dark:bg-sky-800/60 dark:text-sky-200',
            tagSecondary: 'bg-sky-50/50 text-sky-800/60 border-sky-100/40 dark:bg-sky-950/40 dark:text-sky-400'
        },
        { 
            bg: 'bg-rose-50/30 dark:bg-rose-950/20', 
            border: 'border-rose-100 dark:border-rose-900/40', 
            text: 'text-rose-900 dark:text-rose-100', 
            accent: 'bg-rose-100/60 dark:bg-rose-900/40',
            tagPrimary: 'bg-rose-100 text-rose-900 border-rose-200/40 dark:bg-rose-800/60 dark:text-rose-200',
            tagSecondary: 'bg-rose-50/50 text-rose-800/60 border-rose-100/40 dark:bg-rose-950/40 dark:text-rose-400'
        }
    ]

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header Info */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-3 py-1 bg-[#FD5771]/5 text-[#FD5771] rounded-full text-[11px] font-medium border border-[#FD5771]/10">
                            Chiến lược huấn luyện dài hạn
                        </div>
                        <span className="text-xs text-slate-400 font-normal tracking-tight">Cập nhật: {new Date(roadmap.updated_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-3 tracking-tight">
                        <Route className="w-6 h-6 text-[#FD5771]" />
                        Lộ trình huấn luyện khách hàng
                    </h2>
                    <p className="text-sm text-slate-800 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
                        Mục tiêu ưu tiên: <span className="font-medium text-black dark:text-white px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700">{roadmap.goal}</span>
                    </p>
                </div>
                <div className="flex items-center gap-6 bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col items-center px-4 border-r border-slate-100 dark:border-slate-700">
                        <span className="text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-tighter">Thời gian tổng kết</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-semibold text-black dark:text-white tracking-tight">{roadmap.duration_overall}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center px-4 text-center">
                        <span className="text-[11px] font-medium text-slate-400 mb-1">Huấn luyện viên phụ trách</span>
                        <span className="text-[13px] font-semibold text-[#FD5771] tracking-tight">{roadmap.created_by}</span>
                    </div>
                </div>
            </div>

            {/* Phases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sortedPhases.map((phase, idx) => {
                    const style = phaseStyles[idx % phaseStyles.length]
                    
                    return (
                        <div key={phase.id} className="flex flex-col h-full rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900">
                            {/* Phase Number & Title */}
                            <div className={cn("p-5 text-center flex flex-col gap-1 items-center justify-center border-b border-black/5 dark:border-white/5", style.accent)}>
                                <span className={cn("text-[11px] font-medium text-slate-600 dark:text-slate-400 tracking-tight uppercase")}>Giai đoạn {phase.phase_number}</span>
                                <h3 className={cn("text-base font-semibold text-slate-900 dark:text-white tracking-tight leading-tight")}>
                                    {phase.phase_title}
                                </h3>
                            </div>

                            <div className="flex-1 p-1 flex flex-col gap-1">
                                {/* Mục tiêu Section */}
                                <div className={cn("p-5 rounded-xl flex-1", style.bg)}>
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-black/5 dark:border-white/5">
                                        <Target className="w-4 h-4 text-slate-900 dark:text-slate-100" />
                                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">Mục tiêu cụ thể</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trọng tâm:</span>
                                            {renderTags(phase.primary_goal, style.tagPrimary)}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mục tiêu bổ sung:</span>
                                            {renderTags(phase.supplementary_goal, style.tagSecondary)}
                                        </div>
                                    </div>
                                </div>

                                {/* Phương pháp Section */}
                                <div className={cn("p-5 rounded-xl flex-1", style.bg)}>
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-black/5 dark:border-white/5">
                                        <Dumbbell className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phương pháp huấn luyện</span>
                                    </div>
                                    {renderTags(phase.methodology, "bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50")}
                                </div>

                                {/* Kết quả Section */}
                                <div className={cn("p-5 rounded-xl flex-1", style.bg)}>
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-black/5 dark:border-white/5">
                                        <Flag className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Kết quả mong đợi</span>
                                    </div>
                                    {renderTags(phase.expected_results, "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 shadow-sm shadow-emerald-500/5")}
                                </div>

                                {/* Thời gian Section */}
                                <div className={cn("p-5 rounded-xl flex items-center justify-between mt-1 border border-black/5 dark:border-white/5", style.accent)}>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Tổng thời gian</span>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-black dark:text-white" />
                                            <span className="text-sm font-semibold text-black dark:text-white">{phase.total_time}</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-black/10 dark:bg-white/10 mx-2" />
                                    <div className="flex flex-col gap-1 text-right items-end">
                                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Số buổi dự kiến</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-black dark:text-white">{phase.total_sessions}</span>
                                            <Hash className="w-3.5 h-3.5 text-black dark:text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
