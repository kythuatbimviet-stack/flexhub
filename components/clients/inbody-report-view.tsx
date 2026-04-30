'use client'

import * as React from 'react'
import { 
    Activity,
    Info,
    Edit,
    Trash2,
    FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface InBodyReportViewProps {
    data: any
    client: any
    onEdit?: () => void
    onDelete?: () => void
    isPrintMode?: boolean
}

export function InBodyReportView({ data, client, onEdit, onDelete, isPrintMode = false }: InBodyReportViewProps) {
    if (!data) return null

    const handleOpenPrintPage = () => {
        window.open(`/inbody/print/${data.id}`, '_blank')
    }

    return (
        <div className={cn(
            "bg-[#f2f2f7] p-3 sm:p-8 font-inter text-black", 
            isPrintMode ? "bg-white p-0 print:p-0" : ""
        )}>
            {!isPrintMode && (
                <div className="max-w-[850px] mx-auto mb-4 sm:mb-6 flex flex-wrap justify-between items-center gap-2 no-print">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-black" />
                        <span className="text-[10px] font-medium text-black/60 tracking-widest">Báo cáo InBody</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onEdit} 
                            className="rounded-xl gap-2 font-medium h-9 border-black/10 bg-white hover:bg-slate-50 text-black px-3 sm:px-5 transition-all"
                        >
                            <Edit className="w-4 h-4" /> Sửa
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onDelete} 
                            className="rounded-xl gap-2 font-medium h-9 border-black/10 bg-white hover:bg-slate-50 text-red-600 px-3 sm:px-5 transition-all"
                        >
                            <Trash2 className="w-4 h-4" /> Xóa
                        </Button>
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={handleOpenPrintPage} 
                            className="rounded-xl gap-2 font-medium h-9 bg-black hover:bg-slate-900 text-white shadow-md px-3 sm:px-8 transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">Xuất / In PDF (A4)</span>
                            <span className="sm:hidden">Xuất PDF</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* MAIN REPORT TABLE STRUCTURE FOR REPEATING HEADERS/FOOTERS */}
            <div 
                id="inbody-report-pdf-area"
                className={cn(
                    "max-w-[850px] mx-auto bg-white shadow-lg rounded-2xl overflow-visible ring-1 ring-black/5",
                    isPrintMode && "shadow-none rounded-none ring-0 w-full no-shadow print:shadow-none print:ring-0"
                )}
            >
                <table className="w-full border-collapse table-fixed">
                    {/* REPEATING HEADER */}
                    <thead className="print:display-table-header-group display-table-header-group">
                        <tr>
                            <td className="p-0 border-none">
                                <div className="bg-black text-white p-5 sm:p-8 sm:pb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-8">
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        <div className="w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center">
                                            <img src="/logo.png" alt="FlexHub Logo" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xl sm:text-3xl font-medium tracking-tight text-white flex items-center gap-1">In<span className="text-[#ff453a]">Body</span></div>
                                            <div className="text-[10px] text-white/60 font-medium tracking-[1px]">Body Composition Analysis</div>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right space-y-2 flex flex-col items-start sm:items-end">
                                        <div className="text-base sm:text-xl font-medium tracking-tight text-white">{client?.member_name || 'N/A'}</div>
                                        <div className="flex gap-3 text-[12px] text-white font-medium">
                                            <span>ID: {client?.id || '—'}</span>
                                            <span className="opacity-50">|</span>
                                            <span>{data.age || '—'} tuổi</span>
                                            <span className="opacity-50">|</span>
                                            <span>{data.gender || '—'}</span>
                                        </div>
                                        <div className="text-[12px] text-white font-medium">
                                            Chiều cao: {data.height || '—'} cm &nbsp;&nbsp;&nbsp; {format(new Date(data.recorded_at), 'dd/MM/yyyy — HH:mm')}
                                        </div>
                                        <div className="text-[10px] text-[#ffd60a] font-medium mt-2 opacity-60 tracking-tight text-white/60">FlexHub Fitness — Hệ thống quản trị tập luyện chuyên sâu</div>
                                    </div>
                                </div>
                                <div className="bg-white border-b border-black/5 p-3 sm:p-6 sm:px-12 flex flex-wrap gap-x-4 sm:gap-x-12 gap-y-3 justify-start">
                                    <KpiItem label="Cân nặng" value={`${data.weight || 0} kg`} />
                                    <KpiItem label="BMI" value={data.bmi || '—'} />
                                    <KpiItem label="Cơ xương" value={`${data.smm || 0} kg`} />
                                    <KpiItem label="PBF (%)" value={`${data.pbf || 0} %`} />
                                    <KpiItem label="Điểm thể trạng" value={`${data.fitness_score || 0} pts`} />
                                </div>
                            </td>
                        </tr>
                    </thead>

                    {/* MAIN CONTENT BODY */}
                    <tbody className="bg-white">
                        <tr>
                            <td className="p-0 border-none">
                                <div className="p-3 sm:p-10 sm:pb-12 space-y-6 sm:space-y-12 bg-white text-black">
                                    {/* ① Phân tích thành phần cơ thể */}
                                    <section className="space-y-6 sm:space-y-10">
                                        <SectionTitle title="Phân tích thành phần cơ thể" />
                                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 sm:gap-x-12 gap-y-6 sm:gap-y-10">
                                            <Gauge 
                                                label="Nước cơ thể" 
                                                value={data.body_water} 
                                                unit="L" 
                                                range="41.4 – 50.6 L"
                                                percent={Math.min((data.body_water / 60) * 100, 100)}
                                            />
                                            <Gauge 
                                                label="Protein" 
                                                value={data.protein} 
                                                unit="kg" 
                                                range="15.1 – 18.5 kg"
                                                percent={Math.min((data.protein / 20) * 100, 100)}
                                            />
                                            <Gauge 
                                                label="Khoáng chất" 
                                                value={data.minerals} 
                                                unit="kg" 
                                                range="3.83 – 4.69 kg"
                                                percent={Math.min((data.minerals / 6) * 100, 100)}
                                            />
                                            <Gauge 
                                                label="Mỡ cơ thể" 
                                                value={data.body_fat_mass} 
                                                unit="kg" 
                                                range="8.9 – 17.7 kg"
                                                percent={Math.min((data.body_fat_mass / 50) * 100, 100)}
                                                isAlert={data.body_fat_mass > 17.7}
                                            />
                                        </div>

                                        {/* Weight Details Box */}
                                        <div className="p-4 sm:p-8 bg-[#f2f2f7] rounded-3xl border border-black/5 flex flex-col md:flex-row items-center gap-6 sm:gap-12">
                                            <div className="shrink-0 space-y-1.5">
                                                <div className="text-[11px] text-black font-medium tracking-tight">Cân nặng hiện tại</div>
                                                <div className="text-4xl font-medium tracking-tighter text-black flex items-baseline gap-1">
                                                    {data.weight || 0}<span className="text-sm font-medium text-black">kg</span>
                                                </div>
                                                <div className="text-[11px] text-black font-medium opacity-60">Khoảng chuẩn: 62.0 – 83.8 kg</div>
                                            </div>
                                            <div className="flex-1 w-full space-y-4 font-medium">
                                                <div className="h-8 rounded-xl overflow-hidden border border-black/10 flex bg-white">
                                                    <div className="h-full bg-blue-600/10 flex items-center justify-center text-[11px] text-black" style={{ width: '43%' }}>Nước 43%</div>
                                                    <div className="h-full bg-emerald-600/10 flex items-center justify-center text-[11px] text-black" style={{ width: '16%' }}>Protein</div>
                                                    <div className="h-full bg-amber-500/5 flex items-center justify-center text-[11px] text-black/20" style={{ width: '4%' }}></div>
                                                    <div className="h-full bg-rose-600/10 flex items-center justify-center text-[11px] text-black" style={{ width: '37%' }}>Mỡ 37%</div>
                                                </div>
                                                <div className="flex justify-between items-center px-1 text-[11px] font-medium text-black">
                                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600" /> Nước {data.body_water}L</span>
                                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-600" /> Protein {data.protein}kg</span>
                                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Khoáng {data.minerals}</span>
                                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-600" /> Mỡ {data.body_fat_mass}kg</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* ② Cơ — Mỡ & ③ Béo phì */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16">
                                        <section className="space-y-8">
                                            <SectionTitle title="Phân tích Cơ — Mỡ" />
                                            <div className="space-y-10 py-2">
                                                <ProgressBar label="Cân nặng" value={data.weight} unit="kg" percent={Math.min((data.weight / 140) * 100, 100)} />
                                                <ProgressBar label="Cơ xương (SMM)" value={data.smm} unit="kg" percent={Math.min((data.smm / 60) * 100, 100)} color="bg-emerald-600" />
                                                <ProgressBar label="Mỡ cơ thể" value={data.body_fat_mass} unit="kg" percent={Math.min((data.body_fat_mass / 60) * 100, 100)} color="bg-rose-600" />
                                            </div>
                                        </section>
                                        <section className="space-y-8">
                                            <SectionTitle title="Phân tích Béo phì" />
                                            <div className="grid grid-cols-3 gap-6">
                                                <MetricCard label="BMI" value={data.bmi} range="18.5 – 25.0" />
                                                <MetricCard label="PBF (%)" value={data.pbf} range="10.0 – 20.0" isAlert={data.pbf > 25} />
                                                <MetricCard label="WHR" value={data.whr || '0.96'} range="0.80 – 0.90" isAlert={data.whr > 0.9} />
                                            </div>
                                            <div className="p-6 bg-slate-50 rounded-2xl border border-black/5 space-y-3">
                                                <div className="text-[11px] font-medium text-black/40 tracking-widest">Đánh giá chung</div>
                                                <p className="text-[13px] text-black font-medium leading-relaxed">
                                                    Các chỉ số cho thấy tình trạng cơ thể {data.pbf > 25 ? 'đang có xu hướng dư mỡ' : 'trong trạng thái ổn định'}. 
                                                    Cần tập trung vào việc {data.smm < 30 ? 'tăng khối lượng cơ xương' : 'duy trì cường độ tập luyện'} để tối ưu hóa sức khỏe.
                                                </p>
                                            </div>
                                        </section>
                                    </div>

                                    {/* ④ Bộ phận & ⑤ Kiểm soát */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16">
                                        <section className="space-y-8">
                                            <SectionTitle title="Mức độ phát triển cơ" />
                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                <SegmentBox label="Tay Phải" value={data.lean_arm_r} />
                                                <SegmentBox label="Tay Trái" value={data.lean_arm_l} />
                                                <div className="col-span-2">
                                                    <SegmentBox label="Thân mình" value={data.lean_trunk} emphasis />
                                                </div>
                                                <SegmentBox label="Chân Phải" value={data.lean_leg_r} />
                                                <SegmentBox label="Chân Trái" value={data.lean_leg_l} />
                                            </div>
                                        </section>

                                        <section className="space-y-8">
                                            <SectionTitle title="Phân tích & Kiểm soát" />
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <ControlBox label="Mỡ cần điều chỉnh" value={data.fat_control} color="text-rose-600" />
                                                    <ControlBox label="Cơ cần điều chỉnh" value={data.muscle_control} color="text-blue-600" />
                                                </div>
                                                <div className="p-6 bg-white border border-black/10 rounded-3xl flex items-start gap-5 shadow-sm">
                                                    <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] flex items-center justify-center shrink-0">
                                                        <Activity className="w-6 h-6 text-black" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium text-black tracking-tight">Khuyến nghị thể trạng</div>
                                                        <p className="text-[13px] font-medium text-black leading-relaxed">
                                                            Dựa trên chỉ số đo được, bạn được khuyến nghị tập trung vào việc {data.fat_control > 0 ? 'giảm mỡ thừa' : 'duy trì thể trọng'} 
                                                            và {data.muscle_control > 0 ? 'phát triển thêm cơ xương' : 'củng cố mật độ cơ'} để đạt trạng thái cân bằng tối ưu.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="px-6 py-5 bg-black rounded-2xl flex justify-between items-center text-white shadow-xl shadow-slate-200">
                                                    <span className="text-[11px] font-medium text-white/60 tracking-widest">Cân nặng mục tiêu</span>
                                                    <span className="text-2xl font-medium tracking-tight text-white">{data.target_weight || '—'} <span className="text-xs font-normal opacity-50 ml-1">kg</span></span>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>

                    {/* REPEATING FOOTER - ONE LINE BLACK BAR */}
                    <tfoot className="print:display-table-footer-group display-table-footer-group bg-black">
                        <tr>
                            <td className="p-0 border-none bg-black">
                                <div className="bg-black text-white px-4 sm:px-10 py-3 flex justify-between items-center text-[10px] font-medium text-white/60 leading-none">
                                    <div className="flex items-center gap-4">
                                        <span>FlexHub Ecosystem</span>
                                        <span className="opacity-30">|</span>
                                        <span className="lowercase opacity-60">v2.5.4</span>
                                    </div>
                                    <div className="text-white/70">
                                        Giải pháp quản trị tập luyện & phân tích cơ thể chuyên sâu
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <style jsx global>{`
                .display-table-header-group {
                    display: table-header-group !important;
                }
                .display-table-footer-group {
                    display: table-footer-group !important;
                }
                @media print {
                    table { page-break-inside:auto }
                    tr    { page-break-inside:avoid; page-break-after:auto }
                    thead { display:table-header-group }
                    tfoot { display:table-footer-group }
                }
            `}</style>
        </div>
    )
}

function KpiItem({ label, value }: { label: string, value: any }) {
    return (
        <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="text-[10px] text-black font-medium uppercase tracking-widest leading-none opacity-50">{label}</span>
            <span className="text-[16px] text-black font-medium tracking-tight leading-tight">{value}</span>
        </div>
    )
}

function SectionTitle({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-[4px] h-4 bg-black rounded-full" />
            <h3 className="text-[12px] sm:text-[14px] font-medium text-black tracking-tight">{title}</h3>
        </div>
    )
}

function Gauge({ label, value, unit, range, percent, isAlert }: any) {
    return (
        <div className="space-y-5">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <div className="text-[13px] font-medium text-black">{label}</div>
                    <div className="text-[11px] text-black font-medium opacity-50">{range}</div>
                </div>
                <div className="text-right">
                    <div className="text-lg sm:text-xl font-medium tracking-tight text-black">{value}<span className="text-[10px] sm:text-[12px] font-medium text-black opacity-30 ml-0.5">{unit}</span></div>
                    <div className={cn(
                        "text-[8px] sm:text-[9px] font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full inline-block mt-1 tracking-tighter shadow-sm",
                        isAlert ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                    )}>
                        {isAlert ? 'Cần chú ý' : 'Bình thường'}
                    </div>
                </div>
            </div>
            <div className="h-2 bg-[#f2f2f7] rounded-full overflow-hidden relative border border-black/5">
                <div className={cn("h-full rounded-full transition-all duration-1000", isAlert ? "bg-rose-600" : "bg-emerald-600")} style={{ width: `${percent}%` }} />
                <div className="absolute top-0 left-[35%] w-[0.5px] h-full bg-black/10" />
                <div className="absolute top-0 left-[65%] w-[0.5px] h-full bg-black/10" />
            </div>
        </div>
    )
}

function ProgressBar({ label, value, unit, percent, color = 'bg-blue-600' }: any) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-baseline">
                <span className="text-[12px] sm:text-[14px] font-medium text-black">{label}</span>
                <span className="text-lg sm:text-xl font-medium text-black tracking-tight">{value} <span className="text-[10px] sm:text-[12px] font-medium text-black opacity-30">{unit}</span></span>
            </div>
            <div className="h-2.5 bg-[#f2f2f7] rounded-full relative overflow-hidden border border-black/5">
                <div className="absolute inset-y-0 left-[33%] w-[34%] bg-black/5 border-x border-black/5" />
                <div className={cn("h-full rounded-full transition-all duration-1000 relative z-10", color)} style={{ width: `${percent}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-black opacity-30 mt-1 uppercase tracking-tighter">
                <span>Thấp</span><span>Trung bình</span><span>Cao</span>
            </div>
        </div>
    )
}

function MetricCard({ label, value, range, isAlert }: any) {
    return (
        <div className="bg-white border border-black/10 rounded-3xl p-3 sm:p-5 sm:py-6 space-y-3 text-center shadow-sm">
            <div className="text-[10px] font-medium text-black/40 tracking-widest">{label}</div>
            <div className={cn("text-2xl sm:text-3xl font-medium tracking-tighter text-black", isAlert && "text-rose-600")}>{value || '—'}</div>
            <div className="text-[10px] text-black font-medium pt-3 border-t border-black/5 opacity-40">{range}</div>
        </div>
    )
}

function SegmentBox({ label, value, emphasis }: any) {
    return (
        <div className={cn(
            "p-3 sm:p-5 rounded-2xl border text-center transition-all shadow-sm",
            emphasis ? "bg-[#f2f2f7] border-black/10" : "bg-white border-black/5"
        )}>
            <div className="text-[10px] font-medium text-black/40 tracking-widest mb-1.5">{label}</div>
            <div className="text-xl sm:text-2xl font-medium text-black tracking-tighter">{value || '0.0'}<span className="text-[13px] font-medium text-black opacity-20 ml-1">kg</span></div>
        </div>
    )
}

function ControlBox({ label, value, color }: any) {
    return (
        <div className="bg-white p-3 sm:p-5 border border-black/10 rounded-3xl shadow-sm space-y-2">
            <div className="text-[10px] font-medium text-black/40 tracking-widest">{label}</div>
            <div className={cn("text-2xl sm:text-3xl font-medium tracking-tighter", color)}>
                {value > 0 ? `+${value}` : value || '0.0'} <span className="text-[14px] font-medium text-black opacity-20 ml-1">kg</span>
            </div>
        </div>
    )
}
