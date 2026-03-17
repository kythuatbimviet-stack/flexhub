'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
    Plus,
    Building2,
    MapPin,
    User,
    Phone,
    CreditCard,
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
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createBranch } from '@/app/actions/branches'

const branchFormSchema = z.object({
    id: z.string().min(2, { message: 'Mã chi nhánh phải có ít nhất 2 ký tự' }),
    name: z.string().min(2, { message: 'Tên chi nhánh không được để trống' }),
    short_name: z.string().optional(),
    address: z.string().optional(),
    representative: z.string().optional(),
    phone: z.string().optional(),
    account_number: z.string().optional(),
    account_holder: z.string().optional(),
    bank_name: z.string().optional(),
    signature_center: z.string().optional(),
})

export function AddBranchDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    const form = useForm<z.infer<typeof branchFormSchema>>({
        resolver: zodResolver(branchFormSchema),
        defaultValues: {
            id: '',
            name: '',
            short_name: '',
            address: '',
            representative: '',
            phone: '',
            account_number: '',
            account_holder: '',
            bank_name: '',
            signature_center: '',
        },
    })

    async function onSubmit(values: z.infer<typeof branchFormSchema>) {
        setLoading(true)
        try {
            const result = await createBranch({
                ...values,
                account_number: values.account_number ? parseInt(values.account_number) : null
            })
            if (result.success) {
                toast.success('Đã thêm chi nhánh mới thành công')
                setOpen(false)
                form.reset()
                onSuccess()
            } else {
                toast.error('Lỗi khi thêm chi nhánh: ' + result.error)
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
                <Button className="bg-red-600 hover:bg-red-700 text-white rounded-2xl px-6 h-12 font-bold transition-all shadow-lg shadow-red-200 dark:shadow-none">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm chi nhánh
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl font-inter bg-white dark:bg-gray-950">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-slate-950 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
                        Thêm chi nhánh mới
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Điền đầy đủ thông tin để định danh chi nhánh trong hệ thống Eva's Fit.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
                        {/* Section 1: Thông tin cơ bản */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Thông tin cơ bản
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Mã Chi nhánh</FormLabel>
                                            <FormControl>
                                                <Input placeholder="CN-HCM" {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition-all h-11 border-2" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Tên Chi nhánh</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Eva's Fit - Quận 1" {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition-all h-11 border-2" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="short_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">Tên viết tắt</FormLabel>
                                            <FormControl>
                                                <Input placeholder="LF Q1" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="representative"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">Người đại diện</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nguyễn Văn B" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">Số điện thoại</FormLabel>
                                            <FormControl>
                                                <Input placeholder="028..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Địa chỉ chi nhánh</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số 123, Đường ABC..." {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 h-11 border-2" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Section 2: Tài khoản ngân hàng */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Thông tin thanh toán
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="bank_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">Ngân hàng</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Vietcombank, Techcombank..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="account_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">Số tài khoản</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="account_holder"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">Chủ tài khoản</FormLabel>
                                            <FormControl>
                                                <Input placeholder="NGUYEN VAN A" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11 uppercase" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="signature_center"
                                render={({ field }) => (
                                    <FormItem className="pt-4">
                                        <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">URL Chữ ký / Dấu mộc chi nhánh</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/signature.png" {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition-all h-11 border-2" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-8 border-t border-slate-100 dark:border-slate-800 gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="rounded-xl px-6 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-semibold text-xs"
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
                                        Đang tạo...
                                    </div>
                                ) : 'Tạo chi nhánh'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
