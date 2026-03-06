'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
    Plus,
    Package,
    Building2,
    DollarSign,
    Calendar,
    Image as ImageIcon,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { createMembership } from '@/app/actions/memberships'
import { useQuery } from '@tanstack/react-query'
import { fetchBranches } from '@/app/actions/branches'

const membershipFormSchema = z.object({
    id: z.string().min(1, { message: 'Mã gói tập không được để trống' }),
    branch_id: z.string().optional().nullable(),
    package_type: z.string().min(1, { message: 'Vui lòng chọn hình thức tập' }),
    package_name: z.string().min(1, { message: 'Tên gói tập không được để trống' }),
    trainer_type: z.string().min(1, { message: 'Vui lòng chọn hình thức PT' }),
    unit_price: z.string().min(1, { message: 'Giá niêm yết không được để trống' }),
    months_purchased: z.string().optional(),
    discounted_price: z.string().optional(),
    duration_days: z.string().min(1, { message: 'Thời hạn không được để trống' }),
    image_url: z.string().optional(),
})

export function AddMembershipDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    const formatNumber = (val: string | undefined) => {
        if (!val) return ''
        const num = val.replace(/\D/g, '')
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }

    const parseNumber = (val: string) => {
        return val.replace(/\./g, '')
    }

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? res.data : []
        }
    })

    const form = useForm<z.infer<typeof membershipFormSchema>>({
        resolver: zodResolver(membershipFormSchema),
        defaultValues: {
            id: '',
            branch_id: '',
            package_type: '',
            package_name: '',
            trainer_type: '',
            unit_price: '',
            months_purchased: '',
            discounted_price: '',
            duration_days: '',
            image_url: '',
        },
    })

    async function onSubmit(values: z.infer<typeof membershipFormSchema>) {
        setLoading(true)
        try {
            const result = await createMembership({
                ...values,
                unit_price: parseFloat(parseNumber(values.unit_price)),
                months_purchased: values.months_purchased ? parseFloat(values.months_purchased) : null,
                discounted_price: values.discounted_price ? parseFloat(parseNumber(values.discounted_price)) : null,
                duration_days: parseInt(values.duration_days),
                branch_id: values.branch_id || null
            })
            if (result.success) {
                toast.success('Đã thêm gói tập thành công')
                setOpen(false)
                form.reset()
                onSuccess()
            } else {
                toast.error('Lỗi khi tạo gói tập: ' + result.error)
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi không xác định')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-slate-950 dark:bg-red-600 hover:bg-black dark:hover:bg-red-700 text-white rounded-2xl px-6 h-12 font-semibold transition-all shadow-xl active:scale-95">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm gói tập
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl font-inter bg-white dark:bg-slate-950 p-0">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-slate-950 dark:text-white">
                            Thông tin gói tập mới
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                            Thiết lập các gói dịch vụ, giá và thời hạn cho học viên.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
                        {/* Section 1: Thông tin cơ bản */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Thông tin cơ bản
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Mã Gói tập</FormLabel>
                                            <FormControl>
                                                <Input placeholder="GOI-1M" {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all h-11 border-2" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="package_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Tên Gói tập</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Gói 1 tháng cơ bản" {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all h-11 border-2" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="branch_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Chi nhánh (Tùy chọn)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 bg-white dark:bg-slate-900 border-2">
                                                        <SelectValue placeholder="Chọn chi nhánh" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                                                    <SelectItem value="null">Tất cả chi nhánh</SelectItem>
                                                    {branches?.map((branch: any) => (
                                                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="package_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Hình thức tập</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 bg-white dark:bg-slate-900 border-2">
                                                            <SelectValue placeholder="Chọn" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                                                        <SelectItem value="Trực tiếp">Trực tiếp</SelectItem>
                                                        <SelectItem value="Online">Online</SelectItem>
                                                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="trainer_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Huấn luyện viên</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 bg-white dark:bg-slate-900 border-2">
                                                            <SelectValue placeholder="Chọn" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                                                        <SelectItem value="Kèm PT">Kèm PT</SelectItem>
                                                        <SelectItem value="Không kèm PT">Không kèm PT</SelectItem>
                                                        <SelectItem value="Tự do">Tự do</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Giá & Thời hạn */}
                        <div className="space-y-6 pt-4">
                            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Giá & Thời hạn
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="unit_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Giá niêm yết (VNĐ)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="1.500.000"
                                                    {...field}
                                                    value={formatNumber(field.value)}
                                                    onChange={(e) => field.onChange(parseNumber(e.target.value))}
                                                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all h-11 border-2"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="discounted_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Giá ưu đãi (Tùy chọn)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="1.200.000"
                                                    {...field}
                                                    value={formatNumber(field.value)}
                                                    onChange={(e) => field.onChange(parseNumber(e.target.value))}
                                                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all h-11 border-2"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="duration_days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Thời hạn (Ngày)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="30" {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500/20 transition-all h-11 border-2" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-8 border-t border-slate-100 dark:border-slate-800 gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="rounded-xl px-6 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-semibold text-xs transition-all"
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl px-10 bg-slate-950 dark:bg-red-600 text-white hover:bg-black dark:hover:bg-red-700 transition-all font-semibold text-xs shadow-xl active:scale-95"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang lưu...
                                    </div>
                                ) : 'Tạo gói tập'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
