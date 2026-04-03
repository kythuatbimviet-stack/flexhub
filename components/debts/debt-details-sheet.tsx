'use client'

import * as React from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
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
    ArrowUpRight,
    Pencil
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchDebtDetails, payInstallment, deleteDebt, updateDebtInstallment, deleteDebtInstallment, createDebtInstallment } from '@/app/actions/debts'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ConfirmPaymentDialog } from './confirm-payment-dialog'
import { InstallmentDialog } from './installment-dialog'

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

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false)
    const [isInstallmentDialogOpen, setIsInstallmentDialogOpen] = React.useState(false)
    const [selectedInstallment, setSelectedInstallment] = React.useState<any>(null)
    const [installmentToEdit, setInstallmentToEdit] = React.useState<any>(null)

    const handleConfirmPayment = async (data: { amount: number, date: string, paymentMethod: string }) => {
        if (!selectedInstallment) return

        const revenueData = {
            amount: data.amount,
            category_id: 'Công nợ',
            branch_id: details?.data?.branch_id,
            customer_id: details?.data?.client_id,
            contract_id: details?.data?.contract_id,
            description: `Thanh toán công nợ đợt cho HĐ ${details?.data?.contract_id}`,
            payment_method: data.paymentMethod,
            recorded_at: data.date,
            debt_id: details?.data?.id,
            installment_id: selectedInstallment.id
        }

        const res = await payInstallment(selectedInstallment.id, revenueData)
        if (res.success) {
            toast.success('Thanh toán thành công')
            refetch()
            onSuccess?.()
        } else {
            toast.error('Lỗi: ' + res.error)
            throw new Error(res.error)
        }
    }

    const handleSaveInstallment = async (data: { amount: number, due_date: string }) => {
        let res;
        if (installmentToEdit) {
            res = await updateDebtInstallment(installmentToEdit.id, data)
        } else {
            // Find next installment number
            const nextIdx = (details?.data?.installments?.length || 0) + 1
            res = await createDebtInstallment(debt.id, {
                ...data,
                installment_number: nextIdx,
                status: 'Chưa thanh toán'
            })
        }

        if (res.success) {
            toast.success(installmentToEdit ? 'Cập nhật thành công' : 'Thêm đợt thành công')
            refetch()
        } else {
            toast.error('Lỗi: ' + res.error)
            throw new Error(res.error)
        }
    }

    const handleDeleteInstallment = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đợt thanh toán này?')) return

        const res = await deleteDebtInstallment(id)
        if (res.success) {
            toast.success('Xóa thành công')
            refetch()
        } else {
            toast.error('Lỗi: ' + res.error)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[500px] p-0 border-none shadow-2xl flex flex-col h-full bg-slate-50 dark:bg-gray-950 font-inter overflow-hidden"
                showCloseButton={false}
            >
                {/* Sticky Header */}
                <div className="shrink-0 flex flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-950 border-b border-slate-100 dark:border-slate-800">
                    <SheetHeader className="flex flex-row items-center gap-3 space-y-0 text-left">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                            <HandCoinsIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <SheetTitle className="text-[15px] font-bold text-slate-900 dark:text-white line-clamp-1">
                                {debt?.clients?.member_name || 'Chi tiết công nợ'}
                            </SheetTitle>
                            <SheetDescription className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                ID: {debt?.id?.split('-')[0]}
                            </SheetDescription>
                        </div>
                    </SheetHeader>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-5 custom-scrollbar">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-32 w-full rounded-2xl dark:bg-slate-800" />
                                <Skeleton className="h-64 w-full rounded-2xl dark:bg-slate-800" />
                            </div>
                        ) : details?.data ? (
                            <>
                                {/* Overview Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                            <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <h3 className="text-[12px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                            Tổng quan công nợ
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tổng nợ ban đầu</p>
                                            <p className="text-[18px] font-bold text-slate-900 dark:text-white">{Number(details.data.total_amount).toLocaleString()} ₫</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Trạng thái</p>
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                                                details.data.status === 'Đã thanh toán' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                                            )}>
                                                {details.data.status}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Đã thanh toán</p>
                                            <p className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400">{Number(details.data.paid_amount).toLocaleString()} ₫</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Còn nợ lại</p>
                                            <p className="text-[16px] font-bold text-red-600 dark:text-red-400">{Number(details.data.remaining_amount).toLocaleString()} ₫</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer & Contract Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h3 className="text-[12px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                            Thông tin liên quan
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs uppercase border border-slate-100 dark:border-slate-700">
                                                    {details.data.clients?.member_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">{details.data.clients?.member_name}</p>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{details.data.clients?.phone}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="pt-2 grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-800">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <FileText className="w-3 h-3" /> Hợp đồng
                                                </p>
                                                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{details.data.contract_id}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Building2 className="w-3 h-3" /> Chi nhánh
                                                </p>
                                                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{details.data.branches?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Installments Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <h3 className="text-[12px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                                Lịch hẹn thanh toán
                                            </h3>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setInstallmentToEdit(null)
                                                setIsInstallmentDialogOpen(true)
                                            }}
                                            className="h-8 px-3 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-[11px] font-bold"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                                            Thêm đợt
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {details.data.installments?.map((inst: any, idx: number) => (
                                            <div key={inst.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 relative overflow-hidden group">
                                                {inst.status === 'Đã thanh toán' && (
                                                    <div className="absolute top-0 right-0 p-2">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-20" />
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Đợt số {inst.installment_number || idx + 1}</span>
                                                        <span className="text-[14px] font-bold text-slate-900 dark:text-white">{Number(inst.amount).toLocaleString()} ₫</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {inst.status !== 'Đã thanh toán' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setInstallmentToEdit(inst)
                                                                        setIsInstallmentDialogOpen(true)
                                                                    }}
                                                                    className="h-7 w-7 rounded-sm text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteInstallment(inst.id)}
                                                                    className="h-7 w-7 rounded-sm text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                        inst.status === 'Đã thanh toán' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                                                    )}>
                                                        {inst.status}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span className="text-[12px] font-medium">Hẹn: {format(new Date(inst.due_date), 'dd/MM/yyyy')}</span>
                                                    </div>

                                                    {inst.status !== 'Đã thanh toán' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedInstallment(inst)
                                                                setIsPaymentDialogOpen(true)
                                                            }}
                                                            className="h-8 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-sm"
                                                        >
                                                            Thanh toán
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {(!details.data.installments || details.data.installments.length === 0) && (
                                            <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
                                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Không có lịch hẹn trả góp cho công nợ này.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-10 text-center">
                                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Không tìm thấy dữ liệu.</p>
                            </div>
                        )}
                </div>


                {/* Sticky Footer */}
                <div className="shrink-0 bg-white dark:bg-gray-950 border-t border-slate-100 dark:border-slate-800 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex items-center justify-between z-10 w-full">
                    <Button
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl h-11 px-4 text-xs font-bold"
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
                        className="rounded-xl px-6 h-11 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold text-xs uppercase"
                    >
                        Đóng
                    </Button>
                </div>

                <ConfirmPaymentDialog
                    isOpen={isPaymentDialogOpen}
                    onClose={() => setIsPaymentDialogOpen(false)}
                    onConfirm={handleConfirmPayment}
                    installment={selectedInstallment}
                />
                <InstallmentDialog
                    isOpen={isInstallmentDialogOpen}
                    onClose={() => setIsInstallmentDialogOpen(false)}
                    onSave={handleSaveInstallment}
                    installment={installmentToEdit}
                />
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
