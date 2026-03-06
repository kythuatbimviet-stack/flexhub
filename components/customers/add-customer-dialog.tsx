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
import { Plus, Building, MapPin, UserCircle } from 'lucide-react'
import { importCustomers } from '@/app/actions/customers'

const customerSchema = z.object({
    id: z.string().min(2, 'Mã khách hàng tối thiểu 2 ký tự'),
    name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    phone: z.string().optional(),
    tax_code: z.string().optional(),
    company_name: z.string().optional(),
    shipping_address: z.string().optional(),
    tax_address: z.string().optional(),
    legal_rep: z.string().optional(),
    position: z.string().optional(),
    email_tax: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface AddCustomerDialogProps {
    onSuccess?: () => void
}

export function AddCustomerDialog({ onSuccess }: AddCustomerDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            id: '',
            name: '',
            email: '',
            phone: '',
            tax_code: '',
            company_name: '',
            shipping_address: '',
            tax_address: '',
            legal_rep: '',
            position: '',
            email_tax: '',
        },
    })

    async function onSubmit(values: CustomerFormValues) {
        setLoading(true)
        try {
            const result = await importCustomers([values])
            if (!result.success) throw new Error(result.error)

            toast.success('Thêm khách hàng thành công')
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi thêm khách hàng')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <UserCircle className="w-6 h-6 text-blue-600" />
                        Thêm Khách hàng mới
                    </DialogTitle>
                    <DialogDescription>
                        Điền thông tin khách hàng hoặc đối tác mới. Nhấn lưu khi hoàn tất.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Mã KH (Barcode)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="KH001" {...field} className="rounded-xl border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Tên Khách hàng</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nguyễn Văn A" {...field} className="rounded-xl border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="example@gmail.com" {...field} className="rounded-xl border-gray-200" />
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
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Số điện thoại</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0901234567" {...field} className="rounded-xl border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2 text-gray-900">
                                <Building className="w-4 h-4 text-blue-600" />
                                Thông tin Doanh nghiệp
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="company_name"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Tên Công ty</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Công ty TNHH Lady Fit" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tax_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Mã số thuế</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0123456789" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="legal_rep"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Người đại diện</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Mr. Aury" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="position"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Chức vụ</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Giám đốc / Trưởng phòng" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email_tax"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Email nhận hóa đơn (Email Tax)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ketoan@example.com" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2 text-gray-900">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                Địa chỉ & Giao nhận
                            </h3>
                            <FormField
                                control={form.control}
                                name="shipping_address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Địa chỉ giao hàng</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Đường ABC, Quận X, TP. Y" {...field} className="rounded-xl border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tax_address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Địa chỉ xuất hóa đơn</FormLabel>
                                        <FormControl>
                                            <Input placeholder="456 Đường XYZ, Quận Z, TP. W" {...field} className="rounded-xl border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="rounded-xl px-6 border-gray-200"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu Khách hàng'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
