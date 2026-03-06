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
import {
    Plus,
    User,
    Phone,
    Mail,
    MapPin,
    Dumbbell,
    HeartPulse,
    Target,
    Activity
} from 'lucide-react'
import { createClient } from '@/app/actions/clients'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

const clientSchema = z.object({
    id: z.string().min(1, 'Mã khách hàng là bắt buộc'),
    member_name: z.string().min(2, 'Tên hội viên tối thiểu 2 ký tự'),
    phone: z.string().optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    address: z.string().optional(),
    zalo_id: z.string().optional(),
    facebook_id: z.string().optional(),
    status: z.string().default('Chốt đăng kí'),
    assigned_pt: z.string().optional(),
    pt_name: z.string().optional(),
    age: z.coerce.number().optional(),
    height: z.coerce.number().optional(),
    weight: z.coerce.number().optional(),
    target_weight: z.coerce.number().optional(),
    registration_type: z.string().optional(),
    source: z.string().optional(),
    goal: z.string().optional(),
    medical_history: z.string().optional(),
    notes: z.string().optional(),
    branch_id: z.string().optional().nullable(),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface AddClientDialogProps {
    onSuccess?: () => void
}

export function AddClientDialog({ onSuccess }: AddClientDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    const form = useForm<any>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            id: '',
            member_name: '',
            phone: '',
            email: '',
            address: '',
            zalo_id: '',
            facebook_id: '',
            status: 'Chốt đăng kí',
            assigned_pt: '',
            pt_name: '',
            age: undefined,
            height: undefined,
            weight: undefined,
            target_weight: undefined,
            registration_type: '',
            source: '',
            goal: '',
            medical_history: '',
            notes: '',
            branch_id: null,
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

    async function onSubmit(values: any) {
        setLoading(true)
        try {
            const result = await createClient(values)
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
                <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-10 transition-colors shadow-sm font-medium">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Thêm Khách hàng</span>
                    <span className="sm:hidden">Thêm mới</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-medium text-gray-900 border-b pb-4 mb-2">
                        Thông tin Khách hàng mới
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Vui lòng điền đầy đủ thông tin hội viên để lưu vào hệ thống.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
                        {/* Section 1: Cơ bản */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Thông tin cơ bản
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Mã Khách hàng</FormLabel>
                                            <FormControl>
                                                <Input placeholder="LF-001" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="member_name"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-xs text-gray-500 font-medium">Họ và Tên hội viên</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nguyễn Văn A" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
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
                                            <FormLabel className="text-xs text-gray-500 font-medium">Số điện thoại</FormLabel>
                                            <FormControl>
                                                <Input placeholder="090..." {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
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
                                            <FormLabel className="text-xs text-gray-500 font-medium">Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="a@gmail.com" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Trạng thái</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50 text-sm">
                                                        <SelectValue placeholder="Chọn trạng thái" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100">
                                                    <SelectItem value="Chốt đăng kí">Chốt đăng kí</SelectItem>
                                                    <SelectItem value="Đang tập">Đang tập</SelectItem>
                                                    <SelectItem value="Tạm dừng">Tạm dừng</SelectItem>
                                                    <SelectItem value="Đã nghỉ">Đã nghỉ</SelectItem>
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
                                            <FormLabel className="text-xs text-gray-500 font-medium">Chi nhánh</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50 text-sm">
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
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="zalo_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Zalo ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ID Zalo" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="facebook_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Facebook ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ID Facebook" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section 2: Chỉ số cơ thể & Mục tiêu */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Chỉ số & Mục tiêu
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="age"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Tuổi</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="height"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Chiều cao (cm)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Cân nặng (kg)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="target_weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Cân nặng mục tiêu</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="goal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-gray-500 font-medium">Mục tiêu tập luyện</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Giảm cân, tăng cơ..." {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Section 3: Quản lý & Ghi chú */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
                                <Dumbbell className="w-4 h-4" />
                                Huấn luyện & Gói tập
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="pt_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">PT Phụ trách</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tên Huấn luyện viên" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="registration_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Loại đăng ký</FormLabel>
                                            <FormControl>
                                                <Input placeholder="VD: Gói 12 tháng..." {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="source"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Nguồn khách</FormLabel>
                                            <FormControl>
                                                <Input placeholder="VD: Facebook, Zalo..." {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="medical_history"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-gray-500 font-medium">Tiền sử bệnh lý</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Chấn thương, bệnh lý cần lưu ý..." {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-gray-500 font-medium">Ghi chú thêm</FormLabel>
                                        <FormControl>
                                            <Input placeholder="..." {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-6 border-t gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="rounded-xl px-6 text-gray-500 hover:text-gray-900"
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl px-8 bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 transition-all font-medium"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang tạo...
                                    </div>
                                ) : 'Tạo hồ sơ Khách hàng'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
