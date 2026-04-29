'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    HeartPulse,
    User,
    Activity,
    Ruler,
    Calendar,
    ShieldAlert,
    History,
    Edit2,
    X,
    Clock,
    Utensils,
    Wind,
    Brain,
    Stethoscope,
    ChevronRight,
    Scale,
    Maximize2,
    Minimize2,
    ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface HealthProfileDetailsSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    profile: any
    onEdit?: () => void
    onClientClick?: (clientId: string) => void
}

export function HealthProfileDetailsSheet({
    open,
    onOpenChange,
    profile,
    onEdit
}: HealthProfileDetailsSheetProps) {
    const isMobile = useIsMobile()
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [width, setWidth] = React.useState(500)
    const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({
        basic: false,
        habits: false,
        measurements: false,
        medical: false,
        lifestyle: false
    })

    // Reset width when opening/closing or toggling expand
    React.useEffect(() => {
        if (!open) {
            setIsExpanded(false)
            setWidth(500)
        }
    }, [open])

    const toggleExpand = () => {
        if (isExpanded) {
            setWidth(500)
            setIsExpanded(false)
        } else {
            const expandedWidth = Math.min(window.innerWidth - 40, 1200)
            setWidth(expandedWidth)
            setIsExpanded(true)
        }
    }

    const toggleSection = (section: string) => {
        setCollapsed(prev => ({ ...prev, [section]: !prev[section] }))
    }

    if (!profile) return null

    const InfoRow = ({ label, value, icon: Icon, colorClass = "text-black dark:text-white" }: any) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-white/[0.05] last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors px-1 rounded-lg">
            <div className="flex items-center gap-3">
                {Icon && <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${colorClass}`}><Icon className="w-3.5 h-3.5" /></div>}
                <span className="text-[13px] font-medium text-black/60 dark:text-white/60">{label}</span>
            </div>
            <span className="text-[13px] font-medium text-black dark:text-white">{value || '---'}</span>
        </div>
    )

    const SectionHeader = ({ id, title, icon: Icon, colorClass = "text-red-500" }: any) => {
        const isCollapsed = collapsed[id]
        return (
            <div
                className="flex items-center justify-between mb-4 mt-6 first:mt-0 cursor-pointer group hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-all"
                onClick={() => toggleSection(id)}
            >
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/[0.05] ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-medium text-black dark:text-white tracking-tight">{title}</h3>
                </div>
                <div className={cn("text-slate-400 transition-transform duration-200", isCollapsed ? "-rotate-90" : "rotate-0")}>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
        )
    }

    const MedicalTag = ({ label, value }: { label: string, value: any }) => {
        if (!value) return null
        const tags = typeof value === 'string' ? value.split(',').map(t => t.trim()).filter(t => t) : [value]
        return (
            <div className="space-y-2 py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-medium tracking-tight">{label}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-black dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border-none px-2.5 py-0.5 rounded-lg text-[12px] font-medium">
                            {tag}
                        </Badge>
                    ))}
                </div>
            </div>
        )
    }

    const TagCloud = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => {
        if (!value) return null
        const tags = value.split(',').map(t => t.trim()).filter(t => t)
        return (
            <div className="space-y-2 py-3 border-b border-slate-50">
                <div className="flex items-center gap-2 text-black/50 dark:text-white/50">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-medium tracking-tight">{label}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-black dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border-none px-2.5 py-0.5 rounded-lg text-[12px] font-medium">
                            {tag}
                        </Badge>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                resizable={!isMobile}
                width={isMobile ? undefined : width}
                onWidthChange={setWidth}
                minWidth={360}
                maxWidth={1600}
                className="p-0 flex flex-col h-full gap-0 font-inter overflow-hidden border-none shadow-2xl"
            >
                <div className="px-6 py-5 border-b shrink-0 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-20">
                    <div className="space-y-0.5">
                        <SheetTitle className="text-xl font-medium text-black dark:text-white flex items-center gap-2">
                            <HeartPulse className="w-5 h-5 text-red-600" />
                            Chi tiết hồ sơ sức khỏe
                        </SheetTitle>
                        <SheetDescription className="text-xs text-black/60 dark:text-white/60 font-normal tracking-tight">
                            Hội viên: <span
                                className="text-red-600 dark:text-red-400 font-medium cursor-pointer hover:underline hover:text-red-700 transition-all active:scale-95"
                                onClick={() => profile.contracts?.client_id && onClientClick?.(profile.contracts.client_id)}
                            >
                                {profile.contracts?.clients?.member_name || 'Học viên ẩn'}
                            </span>
                        </SheetDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isMobile && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleExpand}
                                className="rounded-full h-9 w-9 text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
                                title={isExpanded ? "Thu nhỏ" : "Phóng to"}
                            >
                                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onEdit}
                            className="rounded-full h-9 w-9 text-blue-600 hover:bg-blue-50"
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full h-8 w-8 text-slate-400 hover:text-black hover:bg-slate-100"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-6 pb-10 space-y-2">
                        {/* Summary Section */}
                        <SectionHeader id="basic" title="Chỉ số sinh học" icon={Activity} colorClass="text-blue-500" />
                        {!collapsed.basic && (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex flex-col items-center justify-center text-center">
                                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 tracking-widest mb-1">BMI & Thể trạng</span>
                                        <div className="text-2xl font-medium text-blue-900 dark:text-blue-100">{profile.body_fat ? `${profile.body_fat}%` : '---'}</div>
                                        <span className="text-[11px] font-normal text-blue-500 mt-1">Body Fat</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex flex-col items-center justify-center text-center">
                                        <span className="text-[10px] font-medium text-red-600 dark:text-red-400 tracking-widest mb-1">Cân nặng</span>
                                        <div className="text-2xl font-medium text-red-900 dark:text-red-100">{profile.weight ? `${profile.weight}kg` : '---'}</div>
                                        <span className="text-[11px] font-normal text-red-500 mt-1">Hiện tại</span>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-1 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    <InfoRow label="Giới tính" value={profile.gender} icon={User} colorClass="text-purple-500" />
                                    <InfoRow label="Tuổi" value={profile.age ? `${profile.age} tuổi` : '---'} icon={Calendar} colorClass="text-orange-500" />
                                    <InfoRow label="Chiều cao" value={profile.height ? `${profile.height} cm` : '---'} icon={Scale} colorClass="text-emerald-500" />
                                    <InfoRow label="Kinh nghiệm tập" value={profile.experience ? 'Đã có' : 'Chưa có'} icon={History} colorClass="text-indigo-500" />
                                </div>
                            </>
                        )}

                        {/* Habits Section */}
                        <SectionHeader id="habits" title="Lịch trình & Thói quen" icon={Clock} colorClass="text-amber-500" />
                        {!collapsed.habits && (
                            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="flex flex-col items-center p-2 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                        <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">Thức dậy</span>
                                        <span className="text-xs font-medium text-amber-900 dark:text-amber-100 mt-1">{profile.wake_time || '--:--'}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                                        <span className="text-[9px] font-medium text-indigo-600 dark:text-indigo-400">Đi ngủ</span>
                                        <span className="text-xs font-medium text-indigo-900 dark:text-indigo-100 mt-1">{profile.sleep_time || '--:--'}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                                        <span className="text-[9px] font-medium text-red-600 dark:text-red-400">Tập luyện</span>
                                        <span className="text-xs font-medium text-red-900 dark:text-red-100 mt-1">{profile.train_time || '--:--'}</span>
                                    </div>
                                </div>

                                <TagCloud label="Dị ứng thức ăn" value={profile.allergies} icon={Utensils} />
                                <TagCloud label="Món ăn yêu thích" value={profile.favorite_foods} icon={Activity} />
                                <TagCloud label="Tính chất hoạt động" value={profile.daily_activity} icon={Activity} />

                                <TagCloud label="Chiến lược cân nặng" value={profile.weight_strategy} icon={Scale} />
                            </div>
                        )}

                        {/* Measurements Section */}
                        <SectionHeader id="measurements" title="Số đo cơ thể" icon={Ruler} colorClass="text-indigo-500" />
                        {!collapsed.measurements && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-1 shadow-sm">
                                    <InfoRow label="Vai" value={profile.measurement_shoulder ? `${profile.measurement_shoulder} cm` : '--'} />
                                    <InfoRow label="Ngực" value={profile.measurement_chest ? `${profile.measurement_chest} cm` : '--'} />
                                    <InfoRow label="Bắp tay (T)" value={profile.measurement_bicep_left ? `${profile.measurement_bicep_left} cm` : '--'} />
                                    <InfoRow label="Bắp tay (P)" value={profile.measurement_bicep_right ? `${profile.measurement_bicep_right} cm` : '--'} />
                                    <InfoRow label="Bụng (Eo)" value={profile.measurement_waist ? `${profile.measurement_waist} cm` : '--'} />
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-1 shadow-sm">
                                    <InfoRow label="Mông" value={profile.measurement_hip ? `${profile.measurement_hip} cm` : '--'} />
                                    <InfoRow label="Đùi (T)" value={profile.measurement_thigh_left ? `${profile.measurement_thigh_left} cm` : '--'} />
                                    <InfoRow label="Đùi (P)" value={profile.measurement_thigh_right ? `${profile.measurement_thigh_right} cm` : '--'} />
                                    <InfoRow label="Bắp chân (T)" value={profile.measurement_calf_left ? `${profile.measurement_calf_left} cm` : '--'} />
                                    <InfoRow label="Bắp chân (P)" value={profile.measurement_calf_right ? `${profile.measurement_calf_right} cm` : '--'} />
                                </div>
                            </div>
                        )}

                        {/* Medical Section */}
                        <SectionHeader id="medical" title="Tiền sử bệnh lý" icon={Stethoscope} colorClass="text-blue-500" />
                        {!collapsed.medical && (
                            <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <MedicalTag label="Tim mạch" value={profile.medical_cardiovascular} />
                                <MedicalTag label="Huyết áp" value={profile.medical_blood_pressure} />
                                <MedicalTag label="Tiểu đường" value={profile.medical_diabetes} />
                                <MedicalTag label="Hen suyễn" value={profile.medical_asthma} />
                                <MedicalTag label="Tiền đình" value={profile.medical_vestibular} />
                                <MedicalTag label="Cột sống" value={profile.medical_back_issue} />
                                <MedicalTag label="Dạ dày" value={profile.medical_stomach} />
                                <MedicalTag label="Thần kinh" value={profile.medical_nerves} />
                                <MedicalTag label="Cổ vai gáy" value={profile.medical_neck_shoulder_pain} />
                                <MedicalTag label="Thần kinh tọa" value={profile.medical_sciatica} />
                                <MedicalTag label="Khớp" value={profile.medical_joints} />
                                <MedicalTag label="Thoát vị" value={profile.medical_hernia} />
                                <MedicalTag label="Phẫu thuật" value={profile.medical_surgery} />
                                <MedicalTag label="Mất ngủ" value={profile.medical_insomnia} />
                                <MedicalTag label="Lệch hông" value={profile.medical_hip_alignment} />
                            </div>
                        )}

                        {/* Lifestyle */}
                        <SectionHeader id="lifestyle" title="Lối sống & Khác" icon={Wind} colorClass="text-slate-500" />
                        {!collapsed.lifestyle && (
                            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"><Wind className="w-3.5 h-3.5" /></div>
                                        <span className="text-[13px] font-medium text-black/70 dark:text-white/70">Hút thuốc</span>
                                    </div>
                                    <Badge variant="outline" className={profile.is_smoker ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}>
                                        {profile.is_smoker ? 'Có' : 'Không'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"><Wind className="w-3.5 h-3.5" /></div>
                                        <span className="text-[13px] font-medium text-black/70 dark:text-white/70">Sử dụng rượu bia</span>
                                    </div>
                                    <Badge variant="outline" className={profile.is_alcoholic ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}>
                                        {profile.is_alcoholic ? 'Có' : 'Không'}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-white flex gap-2 shrink-0 z-20">
                    <Button onClick={onEdit} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-medium shadow-lg shadow-red-100 dark:shadow-none active:scale-[0.98] transition-all">
                        Sửa hồ sơ
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-xl border-slate-200 dark:border-white/[0.1] font-medium text-black/60 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all">
                        Đóng
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
