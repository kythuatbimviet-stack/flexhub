'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
    Plus,
    FileText,
    Calendar,
    CreditCard,
    BadgeCheck,
    Calculator,
    ChevronDown,
    ShieldCheck,
    AlertCircle,
    Loader2,
    Activity,
    Clock,
    Wallet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { finalizeContract } from '@/app/actions/contracts'

const finalizeFormSchema = z.object({
    paid_upfront: z.string().min(1, { message: 'Vui lòng nhập số tiền trả trước' }),
    installments_count: z.string().optional(),
    installment_frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
    signing_date: z.string().min(1, { message: 'Vui lòng chọn ngày ký' }),
    start_date: z.string().min(1, { message: 'Vui lòng chọn ngày bắt đầu' }),
    end_date: z.string().min(1, { message: 'Vui lòng chọn ngày kết thúc' }),
    payment_method: z.string().min(1, { message: 'Vui lòng chọn hình thức thanh toán' }),
})

interface FinalizeContractDialogProps {
    contract: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function FinalizeContractDialog({
    contract,
    open,
    onOpenChange,
    onSuccess
}: FinalizeContractDialogProps) {
    const [loading, setLoading] = React.useState(false)

    const form = useForm<z.infer<typeof finalizeFormSchema>>({
        resolver: zodResolver(finalizeFormSchema),
        defaultValues: {
            paid_upfront: '0',
            installments_count: '1',
            installment_frequency: 'monthly',
            signing_date: new Date().toISOString().split('T')[0],
            start_date: contract?.start_date || new Date().toISOString().split('T')[0],
            end_date: contract?.end_date || '',
            payment_method: 'Tiền mặt',
        },
    })

    // Reset form when contract changes or dialog opens
    React.useEffect(() => {
        if (open && contract) {
            form.reset({
                paid_upfront: '0',
                installments_count: '1',
                installment_frequency: 'monthly',
                signing_date: new Date().toISOString().split('T')[0],
                start_date: contract.start_date || new Date().toISOString().split('T')[0],
                end_date: contract.end_date || '',
                payment_method: 'Tiền mặt',
            })
        }
    }, [open, contract, form])

    const watchTotalAmount = contract?.total_amount || 0
    const watchPaidUpfront = form.watch('paid_upfront')

    const totalAmountNum = Number(watchTotalAmount)
    const paidUpfrontNum = Number(watchPaidUpfront?.toString().replace(/\./g, '') || 0)
    const remainingBalance = totalAmountNum - paidUpfrontNum
    const hasDebt = remainingBalance > 0

    const onSubmit = async (values: z.infer<typeof finalizeFormSchema>) => {
        setLoading(true)
        try {
            const paidUpfront = Number(values.paid_upfront.replace(/\./g, ''))
            const remaining = totalAmountNum - paidUpfront

            // Prepare Debt Plan
            const debtPlan = {
                has_debt: remaining > 0,
                paid_upfront: paidUpfront,
                installments: [] as any[]
            }

            if (remaining > 0) {
                const count = Number(values.installments_count || 1)
                const freq = values.installment_frequency || 'monthly'
                const amountPerInst = Math.floor(remaining / count)

                let currentDate = new Date(values.signing_date)
                for (let i = 1; i <= count; i++) {
                    if (freq === 'weekly') currentDate.setDate(currentDate.getDate() + 7)
                    else if (freq === 'biweekly') currentDate.setDate(currentDate.getDate() + 14)
                    else if (freq === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1)

                    debtPlan.installments.push({
                        installment_number: i,
                        amount: i === count ? remaining - (amountPerInst * (count - 1)) : amountPerInst,
                        due_date: currentDate.toISOString().split('T')[0],
                        status: 'Chưa thanh toán'
                    })
                }
            }

            const finalizeData = {
                contractUpdates: {
                    signing_date: values.signing_date,
                    start_date: values.start_date,
                    end_date: values.end_date,
                    payment_method: values.payment_method,
                },
                debtPlan
            }

            const result = await finalizeContract(contract.id, finalizeData)
            if (result.success) {
                toast.success('Hợp đồng đã được ký kết và chốt công nợ thành công!')
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error('Lỗi khi chốt hợp đồng: ' + result.error)
            }
        } catch (error: any) {
            toast.error('Đã xảy ra lỗi hệ thống: ' + (error.message || 'Lỗi không xác định'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl font-inter bg-white dark:bg-gray-950">
                <DialogHeader className="space-y-4">
                    <DialogTitle className="text-2xl font-medium text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4">
                        Chốt Ký HĐ & Kế hoạch thanh toán
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400 font-medium">
                        Thiết lập ngày hiệu lực và kế hoạch thanh toán cho hợp đồng của khách hàng <strong>{contract?.member_name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 py-6">
                        {/* Section: Thời gian hiệu lực */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Thời gian hiệu lực
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="signing_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Ngày ký HĐ</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Ngày bắt đầu tập</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Ngày kết thúc tập</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section: Thanh toán & Công nợ */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <Wallet className="w-4 h-4" />
                                Thanh toán & Công nợ
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1 pt-2">
                                    <p className="text-[10px] text-gray-500 font-medium tracking-tight">Tổng giá trị hợp đồng</p>
                                    <p className="text-2xl font-medium text-gray-950 dark:text-white leading-none">
                                        {totalAmountNum.toLocaleString('vi-VN')} <span className="text-sm font-normal text-gray-400">VNĐ</span>
                                    </p>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="payment_method"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Hình thức thanh toán (Trả trước)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11">
                                                        <SelectValue placeholder="Chọn hình thức" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
                                                    <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
                                                    <SelectItem value="Thẻ tín dụng">Thẻ tín dụng</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="paid_upfront"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Số tiền trả trước (VNĐ)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="0"
                                                    {...field}
                                                    value={field.value ? Number(field.value.toString().replace(/\./g, '')).toLocaleString('vi-VN').replace(/,/g, '.') : ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\./g, '')
                                                        if (/^\d*$/.test(val)) {
                                                            field.onChange(val)
                                                        }
                                                    }}
                                                    className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11 font-medium text-gray-900"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Plan if balance exists */}
                            {hasDebt ? (
                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 space-y-6">
                                    <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-500 font-medium tracking-tight">Số dư nợ còn lại</p>
                                            <p className="text-xl font-medium text-red-600 leading-none">{remainingBalance.toLocaleString('vi-VN')} VNĐ</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[10px] text-gray-500 font-medium tracking-tight">Gói tập</p>
                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{contract?.package_name}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="installments_count"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] text-gray-500 font-medium tracking-tight">Số kỳ thanh toán</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 h-11">
                                                                <SelectValue placeholder="Chọn số kỳ" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl">
                                                            {[1, 2, 3, 4, 5, 6, 12].map(num => (
                                                                <SelectItem key={num} value={num.toString()}>{num} kỳ</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="installment_frequency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] text-gray-500 font-medium tracking-tight">Tần suất thanh toán</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 h-11">
                                                                <SelectValue placeholder="Chọn tần suất" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="weekly">Hàng tuần</SelectItem>
                                                            <SelectItem value="biweekly">2 tuần một lần</SelectItem>
                                                            <SelectItem value="monthly">Hàng tháng</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium bg-white dark:bg-gray-950/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <Calculator className="w-3.5 h-3.5 text-red-500" />
                                        Mỗi kỳ thanh toán ước tính:
                                        <span className="text-gray-900 dark:text-gray-100">
                                            {Math.round(remainingBalance / Number(form.watch('installments_count') || 1)).toLocaleString('vi-VN')} VNĐ
                                        </span>
                                    </div>
                                </div>
                            ) : paidUpfrontNum > 0 ? (
                                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3 text-emerald-700">
                                    <BadgeCheck className="w-5 h-5 text-emerald-600" />
                                    <p className="text-xs font-medium">Hợp đồng đã thanh toán 100%. Không phát sinh công nợ.</p>
                                </div>
                            ) : null}
                        </div>

                        <DialogFooter className="pt-8 border-t border-gray-100 dark:border-gray-800 gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl px-6 text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white font-medium text-xs tracking-tight"
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl px-10 bg-gray-950 dark:bg-red-600 text-white hover:bg-black dark:hover:bg-red-700 transition-all font-medium text-xs tracking-tight shadow-xl shadow-gray-200 dark:shadow-red-900/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Xác nhận Chốt ký'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
