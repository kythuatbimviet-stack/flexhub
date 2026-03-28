'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon, DollarSign, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface InstallmentDialogProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: { amount: number, due_date: string }) => Promise<void>
    installment?: any // If provided, we are in Edit mode
}

export function InstallmentDialog({
    isOpen,
    onClose,
    onSave,
    installment
}: InstallmentDialogProps) {
    const [amount, setAmount] = React.useState<number>(0)
    const [dueDate, setDueDate] = React.useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [loading, setLoading] = React.useState(false)

    const isEdit = !!installment

    React.useEffect(() => {
        if (isOpen) {
            if (installment) {
                setAmount(Number(installment.amount))
                setDueDate(format(new Date(installment.due_date), 'yyyy-MM-dd'))
            } else {
                setAmount(0)
                setDueDate(format(new Date(), 'yyyy-MM-dd'))
            }
        }
    }, [installment, isOpen])

    const handleSave = async () => {
        setLoading(true)
        try {
            await onSave({ amount, due_date: dueDate })
            onClose()
        } catch (error) {
            console.error('Installment save error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] rounded-[24px] border-none shadow-2xl p-6 bg-white dark:bg-gray-950 font-inter">
                <DialogHeader className="space-y-2 pb-4">
                    <DialogTitle className="text-[17px] font-medium text-slate-900 dark:text-white text-center">
                        {isEdit ? 'Sửa lịch hẹn thanh toán' : 'Thêm lịch hẹn thanh toán'}
                    </DialogTitle>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 text-center font-normal leading-relaxed">
                        {isEdit ? 'Cập nhật lại thông tin đợt thanh toán này.' : 'Thiết lập thêm một đợt thanh toán mới.'}
                    </p>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Amount Field */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-[12px] font-medium text-slate-400 dark:text-slate-500 ml-1">
                            Số tiền dự kiến
                        </Label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <Input
                                id="amount"
                                type="text"
                                value={amount.toLocaleString('vi-VN')}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '')
                                    setAmount(val ? parseInt(val) : 0)
                                }}
                                className="h-12 pl-11 pr-4 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-[15px] font-medium text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Date Field */}
                    <div className="space-y-2">
                        <Label htmlFor="due_date" className="text-[12px] font-medium text-slate-400 dark:text-slate-500 ml-1">
                            Ngày hẹn thanh toán
                        </Label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <CalendarIcon className="w-4 h-4" />
                            </div>
                            <Input
                                id="due_date"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="h-12 pl-11 pr-4 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-[15px] font-medium text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 h-12 rounded-2xl text-[14px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || amount <= 0}
                        className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-medium shadow-lg shadow-emerald-200/20 dark:shadow-none transition-all active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            isEdit ? 'Cập nhật' : 'Thêm mới'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
