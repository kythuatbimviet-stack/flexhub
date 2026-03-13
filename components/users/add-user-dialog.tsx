'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
    Plus,
    User,
    Mail,
    Phone,
    Building2,
    Briefcase,
    Shield,
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
import { createUser } from '@/app/actions/users'
import { fetchBranches } from '@/app/actions/branches'

const userFormSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ' }),
    name: z.string().min(2, { message: 'Tên không được để trống' }),
    phone: z.string().optional(),
    branch_id: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
    role_id: z.string().optional(),
    status: z.string().min(1, { message: 'Trạng thái không được để trống' }),
})

export function AddUserDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [branches, setBranches] = React.useState<any[]>([])

    const form = useForm<z.infer<typeof userFormSchema>>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            email: '',
            name: '',
            phone: '',
            branch_id: '',
            position: '',
            department: '',
            role_id: 'User',
            status: 'Activated',
        },
    })

    React.useEffect(() => {
        if (open) {
            const loadData = async () => {
                const branchesRes = await fetchBranches()
                if (branchesRes.success) setBranches(branchesRes.data || [])
            }
            loadData()
        }
    }, [open])

    async function onSubmit(values: z.infer<typeof userFormSchema>) {
        setLoading(true)
        try {
            const branch = branches.find(b => b.id === values.branch_id)
            const result = await createUser({
                ...values,
                branch_name: branch ? branch.name : null
            })
            if (result.success) {
                toast.success('Đã thêm nhân sự mới thành công')
                setOpen(false)
                form.reset()
                onSuccess()
            } else {
                toast.error('Lỗi khi thêm nhân sự: ' + result.error)
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
                    Thêm nhân sự
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl font-inter bg-white dark:bg-gray-950">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-slate-950 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
                        Thêm nhân viên mới
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Nhập thông tin cơ bản để tạo tài khoản nhân viên trong hệ thống Eva Fit.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
                        {/* Section 1: Thông tin cá nhân */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Thông tin cá nhân
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Họ và tên</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ví dụ: Nguyễn Văn A" {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition-all h-11 border-2" />
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
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Email (ID đăng nhập)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="email@evafit.vn" {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition-all h-11 border-2" />
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
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Số điện thoại</FormLabel>
                                            <FormControl>
                                                <Input placeholder="090..." {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 h-11 border-2" />
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
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Trạng thái</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 border-2">
                                                        <SelectValue placeholder="Chọn trạng thái" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                                    <SelectItem value="Activated">Đang hoạt động</SelectItem>
                                                    <SelectItem value="Deactivated">Ngừng hoạt động</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section 2: Công việc */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <Briefcase className="w-5 h-5" />
                                Thông tin công việc
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="branch_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Chi nhánh</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 border-2">
                                                        <SelectValue placeholder="Chọn chi nhánh" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                                    {branches.map(branch => (
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
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Phòng ban</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Kinh doanh, Kỹ thuật..." {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 border-2" />
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
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Chức vụ</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Trưởng phòng, Nhân viên..." {...field} className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 border-2" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Vai trò hệ thống</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 border-2">
                                                        <SelectValue placeholder="Chọn vai trò" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                                    <SelectItem value="Admin">Quản trị viên (Admin)</SelectItem>
                                                    <SelectItem value="Manager">Quản lý (Manager)</SelectItem>
                                                    <SelectItem value="User">Nhân viên (User)</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                className="rounded-xl px-6 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-semibold text-xs"
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl px-10 bg-slate-950 dark:bg-red-600 text-white hover:bg-black dark:hover:bg-red-700 transition-all font-semibold text-xs shadow-xl"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang tạo...
                                    </div>
                                ) : 'Tạo nhân viên'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
