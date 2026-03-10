'use client'

import * as React from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    X,
    User,
    FileText,
    Calendar,
    CreditCard,
    Building2,
    DollarSign,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    Trash2,
    ArrowUpRight
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchDebtDetails, payInstallment, deleteDebt } from '@/app/actions/debts'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface DebtDetailsSheetProps {
    debt: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function DebtDetailsSheet({ debt, open, onOpenChange, onSuccess }: DebtDetailsSheetProps) {
    const { data: details, isLoading, refetch } = useQuery({
        queryKey: ['debt-details', debt?.id],
        queryFn: () => fetchDebtDetails(debt.id),
        enabled: !!debt?.id && open,
    })

    const handlePayInstallment = async (instId: string, amount: number) => {
        if (!confirm(`Xác nhận thanh toán đợt này (Số tiền: ${amount.toLocaleString()} ₫)?`)) return


        const revenueData = {
            amount: amount,
            category_id: 'Công nợ',
            branch_id: details?.data?.branch_id,
            customer_id: details?.data?.client_id,
            contract_id: details?.data?.contract_id,
            description: `Thanh toán công nợ đợt cho HĐ ${details?.data?.contract_id}`,
            payment_method: 'Chuyển khoản', // Default to Transfer for installments
            recorded_at: new Date().toISOString().split('T')[0],
            debt_id: details?.data?.id,
            installment_id: instId
        }

        const res = await payInstallment(instId, revenueData)
        if (res.success) {
            toast.success('Thanh toán thành công')
            refetch()
            onSuccess?.()
        } else {
            toast.error('Lỗi: ' + res.error)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[500px] p-0 border-l bg-slate-50 flex flex-col h-full font-inter"
                showCloseButton={false}
            >
                {/* Sticky Header */}
                <div className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <HandCoinsIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-[15px] font-bold text-slate-900 line-clamp-1">
                                {debt?.clients?.member_name || 'Chi tiết công nợ'}
                            </SheetTitle>
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                ID: {debt?.id?.split('-')[0]}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Main Content */}
                <ScrollArea className="flex-1">
                    <div className="p-4 sm:p-5 space-y-5">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-32 w-full rounded-2xl" />
                                <Skeleton className="h-64 w-full rounded-2xl" />
                            </div>
                        ) : details?.data ? (
                            <>
                                {/* Overview Card */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                                            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                                        </div>
                                        <h3 className="text-[12px] font-bold uppercase tracking-widest text-amber-600">
                                            Tổng quan công nợ
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tổng nợ ban đầu</p>
                                            <p className="text-[18px] font-bold text-slate-900">{Number(details.data.total_amount).toLocaleString()} ₫</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Trạng thái</p>
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                                                details.data.status === 'Đã thanh toán' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                            )}>
                                                {details.data.status}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Đã thanh toán</p>
                                            <p className="text-[16px] font-bold text-emerald-600">{Number(details.data.paid_amount).toLocaleString()} ₫</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Còn nợ lại</p>
                                            <p className="text-[16px] font-bold text-red-600">{Number(details.data.remaining_amount).toLocaleString()} ₫</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer & Contract Card */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-blue-600" />
                                        </div>
                                        <h3 className="text-[12px] font-bold uppercase tracking-widest text-blue-600">
                                            Thông tin liên quan
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                                    {details.data.clients?.member_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-slate-900">{details.data.clients?.member_name}</p>
                                                    <p className="text-[11px] text-slate-400">{details.data.clients?.phone}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 rounded-full hover:bg-blue-50">
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="pt-2 grid grid-cols-2 gap-4 border-t border-slate-50">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <FileText className="w-3 h-3" /> Hợp đồng
                                                </p>
                                                <p className="text-[13px] font-medium text-slate-700">{details.data.contract_id}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Building2 className="w-3 h-3" /> Chi nhánh
                                                </p>
                                                <p className="text-[13px] font-medium text-slate-700">{details.data.branches?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Installments Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                            </div>
                                            <h3 className="text-[12px] font-bold uppercase tracking-widest text-emerald-600">
                                                Lịch hẹn thanh toán
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {details.data.installments?.map((inst: any, idx: number) => (
                                            <div key={inst.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 relative overflow-hidden group">
                                                {inst.status === 'Đã thanh toán' && (
                                                    <div className="absolute top-0 right-0 p-2">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-20" />
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Đợt số {inst.installment_number || idx + 1}</span>
                                                        <span className="text-[14px] font-bold text-slate-900">{Number(inst.amount).toLocaleString()} ₫</span>
                                                    </div>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                        inst.status === 'Đã thanh toán' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                    )}>
                                                        {inst.status}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-50">
                                                    <div className="flex items-center gap-1.5 text-slate-500">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span className="text-[12px] font-medium">Hẹn: {format(new Date(inst.due_date), 'dd/MM/yyyy')}</span>
                                                    </div>

                                                    {inst.status !== 'Đã thanh toán' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handlePayInstallment(inst.id, inst.amount)}
                                                            className="h-8 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-sm"
                                                        >
                                                            Thanh toán
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {(!details.data.installments || details.data.installments.length === 0) && (
                                            <div className="bg-slate-100/50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                                                <p className="text-xs font-medium text-slate-400">Không có lịch hẹn trả góp cho công nợ này.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-10 text-center">
                                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-slate-400">Không tìm thấy dữ liệu.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Sticky Footer */}
                <div className="shrink-0 bg-white border-t border-slate-100 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex items-center justify-between z-10 w-full">
                    <Button
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 rounded-xl h-11 px-4 text-xs font-bold"
                        onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa bản ghi công nợ này?')) {
                                deleteDebt(debt.id).then(() => {
                                    onOpenChange(false)
                                    onSuccess?.()
                                })
                            }
                        }}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa hồ sơ
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl px-6 h-11 text-slate-600 border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase"
                    >
                        Đóng
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function HandCoinsIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
            <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8L13 15" />
            <circle cx="18" cy="5" r="3" />
        </svg>
    )
}
