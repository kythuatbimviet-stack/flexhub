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
import { fetchClientConfigs } from '@/app/actions/config-params'
import { fetchCurrentUserProfile, fetchUsers } from '@/app/actions/users'
import { fetchZaloUsers } from '@/app/actions/zalo-users'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
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
    Activity,
    UserCheck,
    Star,
    MessageSquare,
    UserStar,
    RotateCcw,
    Search,
    Check
} from 'lucide-react'
import { createClient, generateClientId } from '@/app/actions/clients'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { SignatureField } from '@/components/ui/signature-field'

const clientSchema = z.object({
    id: z.string().min(1, 'Mã khách hàng là bắt buộc'),
    member_name: z.string().min(2, 'Tên hội viên tối thiểu 2 ký tự'),
    phone: z.string().optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    address: z.string().optional(),
    zalo_id: z.string().optional(),
    facebook_id: z.string().optional(),
    status: z.string().min(1, 'Trạng thái là bắt buộc'),
    assigned_pt: z.string().min(1, 'PT phụ trách là bắt buộc'),
    pt_name: z.string().optional(),
    dob: z.string().min(1, 'Ngày sinh là bắt buộc'),
    age: z.coerce.number().min(1, 'Tuổi phải lớn hơn 0'),
    height: z.coerce.number().min(1, 'Chiều cao là bắt buộc'),
    weight: z.coerce.number().min(1, 'Cân nặng là bắt buộc'),
    target_weight: z.coerce.number().optional(),
    registration_type: z.string().optional(),
    training_time: z.string().optional(),
    customer_cycle: z.string().optional(),
    source: z.string().min(1, 'Nguồn khách là bắt buộc'),
    referrer: z.string().optional(),
    goal: z.string().min(1, 'Mục tiêu là bắt buộc'),
    medical_history: z.string().optional(),
    notes: z.string().optional(),
    branch_id: z.string().min(1, 'Chi nhánh là bắt buộc').nullable(),
    signature_url: z.string().optional(),
    avatar_url: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface AddClientDialogProps {
    onSuccess?: () => void
}

export function AddClientDialog({ onSuccess }: AddClientDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [generatingId, setGeneratingId] = React.useState(false)
    const { data: configResult } = useQuery({
        queryKey: ['client-configs'],
        queryFn: fetchClientConfigs
    })

    const { data: currentUserResult } = useQuery({
        queryKey: ['current-user-profile'],
        queryFn: fetchCurrentUserProfile
    })

    const { data: zaloUsersData } = useQuery({
        queryKey: ['zalo-users-all'],
        queryFn: async () => {
            const result = await fetchZaloUsers()
            return result.success ? (result.data || []) : []
        }
    })

    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const result = await fetchUsers()
            if (!result.success) throw new Error(result.error)
            return result.data
        }
    })

    const [zaloSearchTerm, setZaloSearchTerm] = React.useState('')
    const [zaloOpen, setZaloOpen] = React.useState(false)

    const [ptSearchTerm, setPtSearchTerm] = React.useState('')
    const [ptOpen, setPtOpen] = React.useState(false)

    const clientStatuses = React.useMemo(() => configResult?.data?.statuses || [], [configResult])
    const clientSources = React.useMemo(() => configResult?.data?.sources || [], [configResult])
    const clientGoals = React.useMemo(() => configResult?.data?.goals || [], [configResult])
    const clientTrainingTimes = React.useMemo(() => configResult?.data?.trainingTimes || [], [configResult])
    const clientRegistrationTypes = React.useMemo(() => configResult?.data?.registrationTypes || [], [configResult])
    const zaloUsers = React.useMemo(() => Array.isArray(zaloUsersData) ? zaloUsersData : [], [zaloUsersData])
    const users = React.useMemo(() => Array.isArray(usersData) ? usersData : [], [usersData])

    const filteredZaloUsers = React.useMemo(() => {
        if (!zaloSearchTerm) return zaloUsers
        return zaloUsers.filter((user: any) =>
            user.display_name?.toLowerCase().includes(zaloSearchTerm.toLowerCase()) ||
            user.zalo_user_id?.toLowerCase().includes(zaloSearchTerm.toLowerCase())
        )
    }, [zaloUsers, zaloSearchTerm])

    const filteredPts = React.useMemo(() => {
        if (!ptSearchTerm) return users
        return users.filter((user: any) =>
            user.name?.toLowerCase().includes(ptSearchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(ptSearchTerm.toLowerCase())
        )
    }, [users, ptSearchTerm])

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
            status: '',
            assigned_pt: '',
            pt_name: '',
            dob: '',
            age: undefined,
            height: undefined,
            weight: undefined,
            target_weight: undefined,
            registration_type: '',
            training_time: '',
            source: '',
            referrer: '',
            goal: '',
            medical_history: '',
            notes: '',
            branch_id: null,
            signature_url: '',
            avatar_url: '',
        },
    })

    const watchDob = form.watch('dob')

    React.useEffect(() => {
        if (watchDob) {
            const birthDate = new Date(watchDob)
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const m = today.getMonth() - birthDate.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--
            }
            if (age >= 0) {
                form.setValue('age', age, { shouldValidate: true })
            }
        } else {
            form.setValue('age', undefined)
        }
    }, [watchDob, form])

    // Set default values after config data loads
    React.useEffect(() => {
        if (clientStatuses.length > 0) {
            const def = clientStatuses.find(s => s.is_default)?.nam || clientStatuses[0].nam
            if (def) form.setValue('status', def)
        }
        if (clientSources.length > 0) {
            const def = clientSources.find(s => s.is_default)?.nam
            if (def) form.setValue('source', def)
        }
        if (clientGoals.length > 0) {
            const def = clientGoals.find(s => s.is_default)?.nam
            if (def) form.setValue('goal', def)
        }
        if (clientTrainingTimes.length > 0) {
            const def = clientTrainingTimes.find(s => s.is_default)?.nam
            if (def) form.setValue('training_time', def)
        }
        if (clientRegistrationTypes.length > 0) {
            const def = clientRegistrationTypes.find(s => s.is_default)?.nam
            if (def) form.setValue('registration_type', def)
        }
    }, [clientStatuses, clientSources, clientGoals, clientTrainingTimes, clientRegistrationTypes, form])

    // Set current user as PT by default and their branch
    React.useEffect(() => {
        if (currentUserResult?.success && currentUserResult.data) {
            const user = currentUserResult.data
            if (user.name) form.setValue('pt_name', user.name)
            if (user.email) form.setValue('assigned_pt', user.email)
            if (user.branch_id) form.setValue('branch_id', user.branch_id)
        }
    }, [currentUserResult, form])

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const watchBranchId = form.watch('branch_id')

    // Auto-generate client ID when dialog opens or branch changes
    React.useEffect(() => {
        if (!open) return
        setGeneratingId(true)
        generateClientId(watchBranchId).then((res) => {
            if (res.success && res.data) {
                form.setValue('id', res.data)
            }
        }).finally(() => setGeneratingId(false))
    }, [open, watchBranchId, form])

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
                <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-10 transition-colors shadow-sm font-medium dark:shadow-red-900/20">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Thêm Khách hàng</span>
                    <span className="sm:hidden">Thêm mới</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl font-inter">
                <DialogHeader>
                    <DialogTitle className="text-xl font-medium text-gray-900 dark:text-white border-b dark:border-gray-800 pb-4 mb-2">
                        Thông tin Khách hàng mới
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400 flex items-center justify-between gap-4">
                        <span>Hoàn tất thông tin bên dưới (<span className="text-red-600 font-bold">*</span> là bắt buộc)</span>
                        <Select
                            value={form.watch('status')}
                            onValueChange={(val) => form.setValue('status', val)}
                        >
                            <SelectTrigger className="w-[180px] rounded-xl border-gray-100 bg-gray-50/50 text-sm shrink-0 font-bold text-red-600">
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100">
                                {clientStatuses.length > 0 ? (
                                    clientStatuses.map((s) => (
                                        <SelectItem key={s.id} value={s.nam} className="font-bold">{s.nam}</SelectItem>
                                    ))
                                ) : (
                                    <>
                                        <SelectItem value="Chốt đăng kí" className="font-bold">Chốt đăng kí</SelectItem>
                                        <SelectItem value="Đang tập" className="font-bold">Đang tập</SelectItem>
                                        <SelectItem value="Tạm dừng" className="font-bold">Tạm dừng</SelectItem>
                                        <SelectItem value="Đã nghỏ" className="font-bold">Đã nghỏ</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-bold">Mã Khách hàng <span className="text-red-600">*</span></FormLabel>
                                            <FormControl>
                                                <Input
                                                    readOnly
                                                    placeholder={generatingId ? "Đang tạo mã..." : "LF-XX-YY-MM-001"}
                                                    {...field}
                                                    className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-900/50 text-gray-900 dark:text-white font-bold font-mono text-sm"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="member_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">Họ và Tên hội viên <span className="text-red-600">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nguyễn Văn A" {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
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
                                                <Input placeholder="090..." {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
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
                                                <Input placeholder="a@gmail.com" {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="avatar_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Avatar URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://..." {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="dob"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Ngày tháng năm sinh <span className="text-red-600">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="age"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Tuổi <span className="text-red-600">*</span></FormLabel>
                                            <FormControl>
                                                <Input readOnly placeholder="Tự động" type="number" {...field} value={field.value ?? ''} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400" />
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
                                        <FormLabel className="text-xs text-gray-500 font-medium">Địa chỉ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số nhà, đường, quận/huyện..." {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Mạng xã hội
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="zalo_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs text-gray-500 font-medium text-blue-600 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                Zalo
                                            </FormLabel>
                                            <Popover modal={true} open={zaloOpen} onOpenChange={(open) => {
                                                setZaloOpen(open)
                                                if (!open) setZaloSearchTerm('')
                                            }}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between rounded-xl border-gray-100 bg-gray-50/50 text-sm font-normal h-10 px-3",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? zaloUsers.find((u: any) => u.zalo_user_id === field.value)?.display_name
                                                                : "Chọn Zalo Khách Hàng"}
                                                            <RotateCcw className="ml-2 h-4 w-4 shrink-0 opacity-50 hidden" />
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                {field.value && (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-5 h-5 rounded-full bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url(${zaloUsers.find((u: any) => u.zalo_user_id === field.value)?.avatar_url})` }} />
                                                                        <span className="truncate max-w-[150px]">
                                                                            {zaloUsers.find((u: any) => u.zalo_user_id === field.value)?.display_name}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {!field.value && ""}
                                                            </div>
                                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-gray-100"
                                                    align="start"
                                                    onCloseAutoFocus={(e) => e.preventDefault()}
                                                >
                                                    <div className="p-2 border-b border-gray-50">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                placeholder="Tìm kiếm..."
                                                                value={zaloSearchTerm}
                                                                onChange={(e) => setZaloSearchTerm(e.target.value)}
                                                                className="pl-8 h-9 border-none bg-gray-50/50 dark:bg-gray-900 rounded-lg focus-visible:ring-0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <ScrollArea className="h-[250px]">
                                                        <div className="p-1">
                                                            {filteredZaloUsers.length === 0 && (
                                                                <div className="p-4 text-center text-xs text-gray-500">
                                                                    Không tìm thấy kết quả
                                                                </div>
                                                            )}
                                                            {filteredZaloUsers.map((user: any) => (
                                                                <button
                                                                    key={user.id}
                                                                    type="button"
                                                                    className={cn(
                                                                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 transition-colors",
                                                                        field.value === user.zalo_user_id && "bg-blue-50/50 text-blue-600"
                                                                    )}
                                                                    onClick={() => {
                                                                        form.setValue('zalo_id', user.zalo_user_id)
                                                                        setZaloOpen(false)
                                                                    }}
                                                                >
                                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none' }}>
                                                                        {!user.avatar_url && user.display_name?.charAt(0)}
                                                                    </div>
                                                                    <div className="flex flex-col items-start min-w-0">
                                                                        <span className="font-medium truncate w-full">{user.display_name}</span>
                                                                        <span className="text-[10px] text-gray-400 truncate w-full">{user.zalo_user_id}</span>
                                                                    </div>
                                                                    {field.value === user.zalo_user_id && (
                                                                        <Check className="ml-auto h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                </PopoverContent>
                                            </Popover>
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
                                                <Input placeholder="Facebook" {...field} className="rounded-xl border-gray-100 bg-gray-50/50" />
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="height"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 font-medium">Chiều cao (cm) <span className="text-red-600">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="text" inputMode="decimal" placeholder="170" {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
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
                                            <FormLabel className="text-xs text-gray-500 font-medium">Cân nặng (kg) <span className="text-red-600">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="text" inputMode="decimal" placeholder="65" {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
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
                                                <Input type="text" inputMode="decimal" placeholder="55" {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
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
                                        <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">Mục tiêu của bạn <span className="text-red-600">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
                                                    <SelectValue placeholder="Chọn mục tiêu" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                {clientGoals.map((g) => (
                                                    <SelectItem key={g.id} value={g.nam}>
                                                        {g.nam}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Section 3: Quản lý & Ghi chú */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-red-600 dark:text-red-500 flex items-center gap-2">
                                <Dumbbell className="w-4 h-4" />
                                Huấn luyện & Gói tập
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="pt_name"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">PT phụ trách <span className="text-red-600">*</span></FormLabel>
                                            <Popover modal={true} open={ptOpen} onOpenChange={(open) => {
                                                setPtOpen(open)
                                                if (!open) setPtSearchTerm('')
                                            }}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-sm font-normal h-10 px-3 text-gray-900 dark:text-white",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2 overflow-hidden w-full">
                                                                <UserCheck className="w-4 h-4 shrink-0 text-gray-400" />
                                                                <span className="truncate">
                                                                    {field.value || "Chọn Huấn luyện viên"}
                                                                </span>
                                                            </div>
                                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-gray-100"
                                                    align="start"
                                                    onCloseAutoFocus={(e) => e.preventDefault()}
                                                >
                                                    <div className="p-2 border-b border-gray-50">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                placeholder="Tìm nhân viên..."
                                                                value={ptSearchTerm}
                                                                onChange={(e) => setPtSearchTerm(e.target.value)}
                                                                className="pl-8 h-9 border-none bg-gray-50/50 rounded-lg focus-visible:ring-0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <ScrollArea className="h-[250px]">
                                                        <div className="p-1">
                                                            <button
                                                                type="button"
                                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                                                                onClick={() => {
                                                                    form.setValue('assigned_pt', '')
                                                                    form.setValue('pt_name', '')
                                                                    setPtOpen(false)
                                                                }}
                                                            >
                                                                <span className="text-gray-400 italic text-xs">-- Không gán PT --</span>
                                                            </button>
                                                            {filteredPts.length === 0 && (
                                                                <div className="p-4 text-center text-xs text-gray-500">
                                                                    Không tìm thấy kết quả
                                                                </div>
                                                            )}
                                                            {filteredPts.map((user: any) => (
                                                                <button
                                                                    key={user.id}
                                                                    type="button"
                                                                    className={cn(
                                                                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 transition-colors",
                                                                        field.value === user.name && "bg-blue-50/50 text-blue-600"
                                                                    )}
                                                                    onClick={() => {
                                                                        form.setValue('assigned_pt', user.email)
                                                                        form.setValue('pt_name', user.name)
                                                                        setPtOpen(false)
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col items-start min-w-0">
                                                                        <span className="font-medium truncate w-full">{user.name}</span>
                                                                        <span className="text-[10px] text-gray-400 truncate w-full">{user.email}</span>
                                                                    </div>
                                                                    {field.value === user.name && (
                                                                        <Check className="ml-auto h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="branch_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">Chi nhánh <span className="text-red-600">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
                                                        <SelectValue placeholder="Chọn chi nhánh" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
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
                                    name="registration_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">Lộ trình đăng ký</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="Chọn hoặc nhập lộ trình"
                                                        {...field}
                                                        list="registration-types-list"
                                                        className="w-full rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                                                    />
                                                    <datalist id="registration-types-list">
                                                        {clientRegistrationTypes.map((t) => (
                                                            <option key={t.id} value={t.nam} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="training_time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">Thời gian tập</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
                                                        <SelectValue placeholder="Chọn thời gian" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    {clientTrainingTimes.map((t) => (
                                                        <SelectItem key={t.id} value={t.nam}>
                                                            {t.nam}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="customer_cycle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">Chu kỳ khách</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Chu kỳ chăm sóc..." {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
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
                                        <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">Tiền sử bệnh lý</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Chấn thương, bệnh lý cần lưu ý..." {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
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
                                        <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">Ghi chú thêm</FormLabel>
                                        <FormControl>
                                            <Input placeholder="..." {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Section 4: Nguồn khách */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Nguồn khách
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="source"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">Nguồn khách hàng <span className="text-red-600">*</span></FormLabel>
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange('Tự kiếm')}
                                                    className={cn(
                                                        "text-[10px] font-semibold px-2 py-1 rounded-lg transition-all border",
                                                        field.value === 'Tự kiếm' 
                                                            ? "bg-red-50 border-red-200 text-red-600 shadow-sm" 
                                                            : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"
                                                    )}
                                                >
                                                    Tự kiếm
                                                </button>
                                            </div>
                                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
                                                        <SelectValue placeholder="Chọn nguồn khách" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    {clientSources.map((s) => (
                                                        <SelectItem key={s.id} value={s.nam}>
                                                            {s.nam}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="referrer"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-gray-500 dark:text-gray-300 font-medium">Người giới thiệu</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tên/SĐT người giới thiệu" {...field} className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section 5: Chữ ký khách hàng */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Chữ ký Khách hàng
                            </h3>
                            <FormField
                                control={form.control}
                                name="signature_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <SignatureField 
                                                value={field.value} 
                                                onChange={field.onChange}
                                            />
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
                                className="rounded-xl px-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
