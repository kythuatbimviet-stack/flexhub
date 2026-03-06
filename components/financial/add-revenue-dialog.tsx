'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useQuery } from '@tanstack/react-query'
import { fetchBranches } from '@/app/actions/branches'
import { fetchCustomers } from '@/app/actions/customers'
import { fetchFinancialCategories, createRevenue } from '@/app/actions/financial'
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
    DollarSign,
    Calendar,
    Building2,
    User,
    Tag,
    StickyNote,
    CreditCard
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

const revenueSchema = z.object({
    amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
    category_id: z.string().min(1, 'Vui lòng chọn danh mục'),
    branch_id: z.string().min(1, 'Vui lòng chọn chi nhánh'),
    customer_id: z.string().nullable().optional(),
    description: z.string(),
    payment_method: z.string().min(1, 'Vui lòng chọn hình thức thanh toán'),
    recorded_at: z.string().min(1, 'Vui lòng chọn ngày ghi nhận'),
})

type RevenueFormValues = z.infer<typeof revenueSchema>

interface AddRevenueDialogProps {
    onSuccess?: () => void
}

export function AddRevenueDialog({ onSuccess }: AddRevenueDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    const form = useForm<RevenueFormValues>({
        resolver: zodResolver(revenueSchema) as any,
        defaultValues: {
            amount: 0,
            category_id: '',
            branch_id: '',
            customer_id: null,
            description: '',
            payment_method: 'Tiền mặt',
            recorded_at: new Date().toISOString().split('T')[0],
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

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const result = await fetchCustomers()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: categories } = useQuery({
        queryKey: ['financial-categories-revenue'],
        queryFn: async () => {
            const result = await fetchFinancialCategories('revenue')
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    async function onSubmit(values: RevenueFormValues) {
        setLoading(true)
        try {
            const result = await createRevenue(values)
            if (!result.success) throw new Error(result.error)

            toast.success('Ghi nhận khoản thu thành công')
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi ghi nhận khoản thu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-11">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Khoản thu
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden font-inter">
                <div className="p-8 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                            Ghi nhận Khoản thu mới
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                            Điền đầy đủ thông tin giao dịch để theo dõi dòng tiền chính xác.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Số tiền (VND)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                    className="rounded-xl border-gray-100 bg-gray-50/50 pl-10 h-11 focus:ring-emerald-500"
                                                />
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
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Ngày ghi nhận</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                <Input type="date" {...field} className="rounded-xl border-gray-100 bg-gray-50/50 pl-10 h-11 focus:ring-emerald-500" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Danh mục</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50 h-11 text-sm">
                                                    <SelectValue placeholder="Chọn danh mục" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-gray-100">
                                                {categories?.map((cat: any) => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
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
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Hình thức thanh toán</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50 h-11 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-gray-100">
                                                <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
                                                <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
                                                <SelectItem value="Thẻ">Thẻ</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="branch_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Chi nhánh</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50 h-11 text-sm">
                                                    <SelectValue placeholder="Chọn chi nhánh" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-gray-100">
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
                                name="customer_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Khách hàng (Không bắt buộc)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50 h-11 text-sm">
                                                    <SelectValue placeholder="Chọn khách hàng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-gray-100">
                                                {customers?.map((customer: any) => (
                                                    <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Ghi chú / Diễn giải</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="..." {...field} className="rounded-xl border-gray-100 bg-gray-50/50 min-h-[100px] focus:ring-emerald-500" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-6 border-t gap-3 md:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="rounded-xl px-6 text-gray-500 h-11 hover:text-gray-900"
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl px-8 bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-semibold h-11"
                            >
                                {loading ? 'Đang lưu...' : 'Ghi nhận khoản thu'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
