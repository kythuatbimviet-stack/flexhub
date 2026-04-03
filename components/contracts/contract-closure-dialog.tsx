'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    AlertTriangle,
    Scale,
    CheckCircle2,
    RefreshCw,
    PauseCircle,
    XCircle,
    ChevronRight,
    ChevronLeft,
    TrendingDown,
    TrendingUp,
    Minus,
    Calendar,
    User,
    Package,
} from 'lucide-react'
import { cn, formatDecimalForDisplay, parseDecimalInput, isValidDecimalInput } from '@/lib/utils'
import { closeContract } from '@/app/actions/contracts'

// ─── Types ───────────────────────────────────────────────────
type ClosureStatus = 'Renew' | 'Tạm nghỉ' | 'Nghỉ hẳn'

interface ContractClosureDialogProps {
    contract: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

// ─── Step Indicator ──────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-6">
            {Array.from({ length: total }).map((_, i) => (
                <React.Fragment key={i}>
                    <div
                        className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                            i + 1 === current
                                ? 'bg-red-600 text-white shadow-lg shadow-red-200 scale-110'
                                : i + 1 < current
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-400'
                        )}
                    >
                        {i + 1 < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div
                            className={cn(
                                'h-0.5 w-10 rounded-full transition-all duration-500',
                                i + 1 < current ? 'bg-red-400' : 'bg-gray-200'
                            )}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    )
}

// ─── Closure Status Card ─────────────────────────────────────
function ClosureCard({
    value,
    label,
    description,
    icon: Icon,
    color,
    selected,
    onClick,
}: {
    value: ClosureStatus
    label: string
    description: string
    icon: React.ElementType
    color: string
    selected: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 focus:outline-none',
                selected
                    ? `border-current shadow-lg scale-[1.02] ${color}`
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 bg-white dark:bg-gray-900 dark:border-gray-800'
            )}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        selected ? 'bg-white/30' : 'bg-gray-100 dark:bg-gray-800'
                    )}
                >
                    <Icon className={cn('w-5 h-5', selected ? 'text-current' : 'text-gray-500')} />
                </div>
                <div>
                    <p className={cn('font-semibold text-sm', selected ? 'text-current' : 'text-gray-900 dark:text-gray-100')}>
                        {label}
                    </p>
                    <p className={cn('text-xs mt-0.5', selected ? 'opacity-80' : 'text-gray-500')}>{description}</p>
                </div>
            </div>
        </button>
    )
}

// ─── Main Component ───────────────────────────────────────────
export function ContractClosureDialog({
    contract,
    open,
    onOpenChange,
    onSuccess,
}: ContractClosureDialogProps) {
    const [step, setStep] = React.useState(1)
    const [finalWeightInput, setFinalWeightInput] = React.useState('')
    const [closureStatus, setClosureStatus] = React.useState<ClosureStatus | null>(null)
    const [closureReason, setClosureReason] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    // Reset state when dialog opens
    React.useEffect(() => {
        if (open) {
            setStep(1)
            setFinalWeightInput('')
            setClosureStatus(null)
            setClosureReason('')
        }
    }, [open])

    const initialWeight = contract?.initial_weight ? Number(contract.initial_weight) : null
    const finalWeight = finalWeightInput ? parseFloat(parseDecimalInput(finalWeightInput)) : null
    const weightChange =
        initialWeight != null && finalWeight != null ? initialWeight - finalWeight : null

    const isPositiveChange = weightChange != null && weightChange > 0 // Giảm cân = tốt
    const isNegativeChange = weightChange != null && weightChange < 0 // Tăng cân
    const noChange = weightChange === 0

    const remainingDays = React.useMemo(() => {
        if (!contract?.end_date) return null
        const end = new Date(contract.end_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }, [contract?.end_date])

    const canProceedStep2 = true // Step 2 optional final weight
    const canProceedStep3 = !!closureStatus
    const needsReason = closureStatus === 'Tạm nghỉ' || closureStatus === 'Nghỉ hẳn'
    const canConfirm = closureStatus && (!needsReason || closureReason.trim().length > 0)

    const handleConfirm = async () => {
        if (!contract?.id || !closureStatus) return
        setLoading(true)
        try {
            const result = await closeContract(contract.id, {
                final_weight: finalWeight,
                weight_change: weightChange,
                closure_status: closureStatus,
                closure_reason: closureReason.trim() || undefined,
            })

            if (result.success) {
                const msg =
                    closureStatus === 'Renew'
                        ? 'Đã xử lý Gia hạn và chuyển trạng thái hợp đồng về "Hết hạn HĐ"!'
                        : `Đã xử lý ${closureStatus} và chuyển trạng thái hợp đồng về "Hết hạn HĐ"!`
                toast.success(msg)
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(result.error || 'Có lỗi xảy ra')
            }
        } catch (err: any) {
            toast.error('Lỗi hệ thống: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!contract) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl p-0 gap-0 overflow-hidden border-0 shadow-2xl font-inter">
                {/* Header */}
                <div className="bg-gradient-to-br from-red-600 to-rose-700 p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl font-semibold">
                            Xử lý hợp đồng hết hạn
                        </DialogTitle>
                        <DialogDescription className="text-red-100 text-sm mt-1">
                            {contract.id} · {contract.member_name}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className="p-6">
                    <StepIndicator current={step} total={3} />

                    {/* ── Step 1: Thông báo hết hạn ── */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30">
                                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                        {remainingDays != null && remainingDays <= 0
                                            ? 'Hợp đồng đã hết hạn!'
                                            : `Hợp đồng sắp hết hạn (còn ${remainingDays} ngày)`}
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                        Cần xác nhận tình trạng để hoàn tất chu kỳ hợp đồng
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-gray-400 font-medium">Hội viên</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {contract.member_name || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                    <Package className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-gray-400 font-medium">Gói tập</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {contract.package_name || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-medium">Ngày kết thúc</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {contract.end_date
                                                    ? new Date(contract.end_date).toLocaleDateString('vi-VN')
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                        <Scale className="w-4 h-4 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-medium">Cân ban đầu</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {initialWeight != null ? `${initialWeight} kg` : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Nhập cân kết thúc ── */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    Cân nặng kết thúc
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Nhập cân nặng hiện tại của hội viên để tính số cân đã thay đổi.
                                    Có thể bỏ qua nếu chưa đo.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                                    Cân nặng kết thúc (kg)
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="Ví dụ: 65,5"
                                        value={finalWeightInput}
                                        onChange={(e) => {
                                            if (isValidDecimalInput(e.target.value)) {
                                                setFinalWeightInput(e.target.value)
                                            }
                                        }}
                                        className="h-12 rounded-xl border-gray-200 dark:border-gray-700 text-base pr-12 focus:ring-2 focus:ring-red-500/20"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                                        kg
                                    </span>
                                </div>
                            </div>

                            {/* Weight change visualization */}
                            {initialWeight != null && (
                                <div
                                    className={cn(
                                        'p-4 rounded-2xl border transition-all duration-300',
                                        finalWeight != null
                                            ? isPositiveChange
                                                ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30'
                                                : isNegativeChange
                                                ? 'bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/30'
                                                : 'bg-gray-50 border-gray-100 dark:bg-gray-800/30 dark:border-gray-700'
                                            : 'bg-gray-50 border-gray-100 dark:bg-gray-800/30 dark:border-gray-700'
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-400 font-medium mb-1">Ban đầu</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {initialWeight}
                                                <span className="text-xs font-normal ml-1">kg</span>
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            {finalWeight != null ? (
                                                isPositiveChange ? (
                                                    <TrendingDown className="w-6 h-6 text-emerald-500" />
                                                ) : isNegativeChange ? (
                                                    <TrendingUp className="w-6 h-6 text-orange-500" />
                                                ) : (
                                                    <Minus className="w-6 h-6 text-gray-400" />
                                                )
                                            ) : (
                                                <Minus className="w-6 h-6 text-gray-300" />
                                            )}
                                            {weightChange != null && (
                                                <span
                                                    className={cn(
                                                        'text-[11px] font-bold px-2 py-0.5 rounded-full',
                                                        isPositiveChange
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : isNegativeChange
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                    )}
                                                >
                                                    {isPositiveChange ? '-' : isNegativeChange ? '+' : ''}
                                                    {Math.abs(weightChange).toFixed(1)} kg
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-400 font-medium mb-1">Kết thúc</p>
                                            <p
                                                className={cn(
                                                    'text-xl font-bold',
                                                    finalWeight != null
                                                        ? 'text-gray-900 dark:text-gray-100'
                                                        : 'text-gray-300'
                                                )}
                                            >
                                                {finalWeight != null ? finalWeight : '?'}
                                                <span className="text-xs font-normal ml-1">kg</span>
                                            </p>
                                        </div>
                                    </div>
                                    {finalWeight != null && (
                                        <p
                                            className={cn(
                                                'text-center text-xs font-medium mt-3',
                                                isPositiveChange
                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                    : isNegativeChange
                                                    ? 'text-orange-700 dark:text-orange-400'
                                                    : 'text-gray-500'
                                            )}
                                        >
                                            {isPositiveChange
                                                ? `🎉 Giảm được ${Math.abs(weightChange!).toFixed(1)} kg trong chu kỳ này`
                                                : isNegativeChange
                                                ? `⚠️ Tăng ${Math.abs(weightChange!).toFixed(1)} kg trong chu kỳ này`
                                                : '⚖️ Cân nặng không thay đổi'}
                                        </p>
                                    )}
                                </div>
                            )}

                            {initialWeight == null && (
                                <p className="text-xs text-gray-400 italic text-center">
                                    Không có dữ liệu cân nặng ban đầu để so sánh
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Chọn tình trạng ── */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    Tình trạng hợp đồng
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Chọn hướng xử lý cho hợp đồng này sau khi kết thúc.
                                </p>
                            </div>

                            <div className="space-y-2.5">
                                <ClosureCard
                                    value="Renew"
                                    label="Gia hạn (Renew)"
                                    description="Hội viên tiếp tục đăng ký gói mới"
                                    icon={RefreshCw}
                                    color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300"
                                    selected={closureStatus === 'Renew'}
                                    onClick={() => { setClosureStatus('Renew'); setClosureReason('') }}
                                />
                                <ClosureCard
                                    value="Tạm nghỉ"
                                    label="Tạm nghỉ"
                                    description="Hội viên tạm dừng, có thể quay lại sau"
                                    icon={PauseCircle}
                                    color="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300"
                                    selected={closureStatus === 'Tạm nghỉ'}
                                    onClick={() => setClosureStatus('Tạm nghỉ')}
                                />
                                <ClosureCard
                                    value="Nghỉ hẳn"
                                    label="Nghỉ hẳn"
                                    description="Hội viên chấm dứt hoàn toàn"
                                    icon={XCircle}
                                    color="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300"
                                    selected={closureStatus === 'Nghỉ hẳn'}
                                    onClick={() => setClosureStatus('Nghỉ hẳn')}
                                />
                            </div>

                            {needsReason && (
                                <div
                                    className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                                >
                                    <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        Lý do nghỉ
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        placeholder="Nhập lý do khách hàng nghỉ... (bắt buộc)"
                                        value={closureReason}
                                        onChange={(e) => setClosureReason(e.target.value)}
                                        className="rounded-xl border-gray-200 dark:border-gray-700 resize-none text-sm focus:ring-2 focus:ring-red-500/20"
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => step > 1 ? setStep(s => s - 1) : onOpenChange(false)}
                        className="rounded-xl h-11 px-5 font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        {step === 1 ? 'Hủy' : 'Quay lại'}
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={() => setStep(s => s + 1)}
                            disabled={step === 3 && !canProceedStep3}
                            className="rounded-xl h-11 px-6 font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 dark:shadow-red-900/20 transition-all"
                        >
                            Tiếp theo
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleConfirm}
                            disabled={!canConfirm || loading}
                            className={cn(
                                'rounded-xl h-11 px-6 font-semibold text-white shadow-lg transition-all',
                                closureStatus === 'Renew'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 dark:shadow-emerald-900/20'
                                    : closureStatus === 'Tạm nghỉ'
                                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100 dark:shadow-amber-900/20'
                                    : 'bg-red-600 hover:bg-red-700 shadow-red-100 dark:shadow-red-900/20'
                            )}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {loading ? 'Đang lưu...' : 'Xác nhận'}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
