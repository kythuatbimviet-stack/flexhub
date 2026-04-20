'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { useQuery } from '@tanstack/react-query'
import { fetchBranches } from '@/app/actions/branches'
import { fetchExpenseTypes, createExpense } from '@/app/actions/financial'
import { fetchUsers } from '@/app/actions/users'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Plus,
    Banknote,
    Calendar,
    Building2,
    Tag,
    StickyNote,
    CreditCard,
    X,
    ChevronDown,
    Search,
    Check
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const expenseSchema = z.object({
    amount: z.string().min(1, 'Vui lòng nhập số tiền'),
    category_id: z.string().min(1, 'Vui lòng chọn danh mục'),
    branch_id: z.string().min(1, 'Vui lòng chọn chi nhánh'),
    description: z.string().optional().default(''),
    payment_method: z.string().min(1, 'Vui lòng chọn hình thức thanh toán'),
    recorded_at: z.string().min(1, 'Vui lòng chọn ngày ghi nhận'),
    spender_name: z.string().min(1, 'Vui lòng chọn người chi'),
    settlement_status: z.string().min(1, 'Vui lòng chọn trạng thái kết toán'),
    settled_at: z.string().optional().nullable(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface AddExpenseSheetProps {
    onSuccess?: () => void
}

export function AddExpenseSheet({ onSuccess }: AddExpenseSheetProps) {

    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema) as any,
        defaultValues: {
            amount: '',
            category_id: '',
            branch_id: '',
            description: '',
            payment_method: 'Tiền mặt',
            recorded_at: format(new Date(), 'yyyy-MM-dd'),
            spender_name: '',
            settlement_status: 'Chưa kết toán',
            settled_at: null,
        },
    })

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: categories, isLoading: isCategoriesLoading, error: categoriesError } = useQuery({
        queryKey: ['financial-expense-types'],
        queryFn: async () => {
            const result = await fetchExpenseTypes()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const result = await fetchUsers()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    async function onSubmit(values: ExpenseFormValues) {
        setLoading(true)
        try {
            // Convert amount string to number (remove separators)
            const cleanAmount = Number(values.amount.replace(/\./g, ''))

            const result = await createExpense({
                ...values,
                amount: cleanAmount
            })

            if (!result.success) throw new Error(result.error)

            toast.success('Ghi nhận khoản chi thành công')
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi ghi nhận khoản chi')
        } finally {
            setLoading(false)
        }
    }

    const formatAmount = (value: string) => {
        const digits = value.replace(/\D/g, '')
        if (!digits) return ''
        return Number(digits).toLocaleString('vi-VN')
    }

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-6 h-11 shadow-lg shadow-rose-100 dark:shadow-rose-900/20 active:scale-95 transition-all font-semibold"
            >
                <Plus className="w-4 h-4 mr-2" />
                Thêm Khoản chi
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="right"
                    showCloseButton={false}
                    className="w-full sm:max-w-[480px] border-none shadow-2xl p-0 flex flex-col h-[100dvh] bg-slate-50 dark:bg-gray-950 font-inter"
                >
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 shrink-0">
                        <SheetHeader className="flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                                    <Banknote className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <SheetTitle className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                                        Ghi nhận chi
                                    </SheetTitle>
                                    <SheetDescription className="text-[10px] text-slate-500 dark:text-slate-400 capitalize hidden sm:block">Thêm giao dịch mới</SheetDescription>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setOpen(false)}
                                    className="sm:hidden font-semibold text-[12px] text-slate-500 px-2 h-8"
                                    disabled={loading}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    form="add-expense-form"
                                    type="submit"
                                    disabled={loading}
                                    className="sm:hidden bg-rose-600 text-white font-semibold text-[12px] px-3 h-8 rounded-lg shadow-sm"
                                >
                                    {loading ? '...' : 'Lưu'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setOpen(false)}
                                    className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ml-1 hidden sm:flex"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </Button>
                            </div>
                        </SheetHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5">
                        <Form {...form}>
                            <form id="add-expense-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                                {/* Card Section: Thông tin cơ bản */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 text-left">
                                        <div className="w-6 h-6 rounded-md bg-rose-50 flex items-center justify-center">
                                            <Banknote className="w-3.5 h-3.5 text-rose-600" />
                                        </div>
                                        <h3 className="text-[12px] font-semibold text-rose-600">
                                            THÔNG TIN GIAO DỊCH
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1 text-left">
                                                    <FormLabel className="text-[11px] font-semibold text-slate-900 dark:text-slate-300">Số tiền (VNĐ)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="0"
                                                                value={field.value}
                                                                onChange={(e) => {
                                                                    const formatted = formatAmount(e.target.value)
                                                                    field.onChange(formatted)
                                                                }}
                                                                className="rounded-xl border-slate-200 bg-white h-11 text-[18px] font-bold text-rose-600 focus:ring-rose-500 pr-10"
                                                            />
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-300">vnđ</div>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="recorded_at"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1 text-left">
                                                    <FormLabel className="text-[11px] font-semibold text-slate-900 dark:text-slate-300">Ngày ghi nhận</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                        <FormField
                                            control={form.control}
                                            name="branch_id"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1 text-left">
                                                    <FormLabel className="text-[11px] font-semibold text-slate-900 dark:text-slate-300">Chi nhánh</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700 w-full">
                                                                <SelectValue placeholder="Chọn chi nhánh" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-slate-100">
                                                            {branches?.map((branch: any) => (
                                                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="spender_name"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1 text-left">
                                                    <FormLabel className="text-[11px] font-semibold text-slate-900 dark:text-slate-300">Người chi</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700 w-full">
                                                                <SelectValue placeholder="Chọn người chi" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-slate-100">
                                                            {['Kế toán', 'FM', 'CEO'].map(s => (
                                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 text-left">
                                        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                                        </div>
                                        <h3 className="text-[12px] font-semibold text-blue-600">
                                            PHÂN LOẠI - THANH TOÁN
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="category_id"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1 text-left">
                                                    <FormLabel className="text-[11px] font-semibold text-slate-900 dark:text-slate-300">Danh mục</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700 w-full">
                                                                <SelectValue placeholder="Chọn..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-slate-100">
                                                            {isCategoriesLoading ? (
                                                                <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                                                            ) : categoriesError ? (
                                                                <SelectItem value="error" disabled>Lỗi: {(categoriesError as Error).message}</SelectItem>
                                                            ) : !categories || categories.length === 0 ? (
                                                                <SelectItem value="none" disabled>Trống</SelectItem>
                                                            ) : (
                                                                categories.map((cat: any) => (
                                                                    <SelectItem key={cat.id} value={String(cat.nam)}>{cat.nam}</SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="payment_method"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1 text-left">
                                                    <FormLabel className="text-[11px] font-semibold text-slate-900 dark:text-slate-300">Hình thức</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700 w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-slate-100">
                                                            {['Tiền mặt', 'Chuyển khoản', 'Thẻ'].map(m => (
                                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 text-left">
                                        <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                                            <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                                        </div>
                                        <h3 className="text-[12px] font-semibold text-amber-600">
                                            GHI CHÚ
                                        </h3>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Nhập ghi chú cho khoản chi này..."
                                                        {...field}
                                                        className="rounded-xl border-slate-200 bg-white min-h-[100px] focus:ring-rose-500 text-[15px] font-medium text-slate-700 resize-none"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {/* Card Section: Kết toán */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 text-left">
                                        <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                        <h3 className="text-[12px] font-semibold text-emerald-600">
                                            KẾT TOÁN
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="settlement_status"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1 text-left">
                                                    <FormLabel className="text-[11px] font-semibold text-slate-900 dark:text-slate-300">Trạng thái kết toán</FormLabel>
                                                    <Select
                                                        onValueChange={(val) => {
                                                            field.onChange(val)
                                                            if (val === 'Đã kết toán') {
                                                                form.setValue('settled_at', format(new Date(), 'yyyy-MM-dd'))
                                                            } else {
                                                                form.setValue('settled_at', null)
                                                            }
                                                        }}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700 w-full">
                                                                <SelectValue placeholder="Chọn..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-slate-100">
                                                            {['Chưa kết toán', 'Đã kết toán'].map(s => (
                                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="settled_at"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1 text-left">
                                                    <FormLabel className="text-[11px] font-semibold text-slate-900 dark:text-slate-300">Ngày kết toán</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            value={field.value || ''}
                                                            disabled={form.watch('settlement_status') !== 'Đã kết toán'}
                                                            className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>

                    <div className="hidden sm:flex bg-white dark:bg-gray-950 border-t border-slate-100 dark:border-slate-800 p-4 items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] shrink-0 z-20">
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="rounded-xl h-11 px-6 font-semibold text-[13px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-inter"
                            disabled={loading}
                        >
                            Hủy bỏ
                        </Button>

                        <Button
                            form="add-expense-form"
                            type="submit"
                            disabled={loading}
                            className="rounded-xl h-11 px-10 font-semibold text-[13px] bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-100 dark:shadow-rose-900/20 transition-all font-inter active:scale-95 flex-1 sm:flex-none"
                        >
                            {loading ? 'Đang lưu...' : 'Ghi nhận khoản chi'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
