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
import { Calendar as CalendarIcon, DollarSign, Loader2, CreditCard } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'

interface ConfirmPaymentDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (data: { amount: number, date: string, paymentMethod: string }) => Promise<void>
    installment: any
}

export function ConfirmPaymentDialog({
    isOpen,
    onClose,
    onConfirm,
    installment
}: ConfirmPaymentDialogProps) {
    const [amount, setAmount] = React.useState<number>(0)
    const [date, setDate] = React.useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [paymentMethod, setPaymentMethod] = React.useState<string>('Chuyển khoản')
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        if (installment && isOpen) {
            setAmount(Number(installment.amount))
            setDate(format(new Date(), 'yyyy-MM-dd'))
            setPaymentMethod('Chuyển khoản')
        }
    }, [installment, isOpen])

    const handleConfirm = async () => {
        setLoading(true)
        try {
            await onConfirm({ amount, date, paymentMethod })
            onClose()
        } catch (error) {
            console.error('Payment confirmation error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] rounded-[24px] border-none shadow-2xl p-6 bg-white dark:bg-gray-950 font-inter">
                <DialogHeader className="space-y-2 pb-4">
                    <DialogTitle className="text-[17px] font-medium text-slate-900 dark:text-white text-center">
                        Xác nhận thanh toán
                    </DialogTitle>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 text-center font-normal leading-relaxed">
                        Vui lòng kiểm tra lại số tiền và ngày thanh toán trước khi xác nhận.
                    </p>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Amount Field */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-[12px] font-medium text-slate-400 dark:text-slate-500 ml-1">
                            Số tiền thanh toán
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
                                className="h-12 pl-11 pr-4 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all text-[15px] font-medium text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Date Field */}
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-[12px] font-medium text-slate-400 dark:text-slate-500 ml-1">
                            Ngày thanh toán
                        </Label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <CalendarIcon className="w-4 h-4" />
                            </div>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-12 pl-11 pr-4 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all text-[15px] font-medium text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Payment Method Field */}
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod" className="text-[12px] font-medium text-slate-400 dark:text-slate-500 ml-1">
                            Phương thức thanh toán
                        </Label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="h-12 pl-11 pr-4 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all text-[15px] font-medium text-slate-900 dark:text-white shadow-none outline-none">
                                    <SelectValue placeholder="Chọn phương thức" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                    <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
                                    <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
                                </SelectContent>
                            </Select>
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
                        onClick={handleConfirm}
                        disabled={loading || amount <= 0}
                        className="flex-1 h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-[14px] font-medium shadow-lg shadow-amber-200/20 dark:shadow-none transition-all active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            'Xác nhận'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
