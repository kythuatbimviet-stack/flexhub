'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
    Plus,
    FileText,
    User,
    Building2,
    Calendar,
    CreditCard,
    Package,
    Dumbbell,
    MapPin,
    Phone,
    Mail,
    Loader2
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
import { createContract } from '@/app/actions/contracts'
import { fetchClients } from '@/app/actions/clients'
import { fetchBranches } from '@/app/actions/branches'
import { fetchMemberships } from '@/app/actions/memberships'
import { addDays } from 'date-fns'
import { fetchConfigParams, ConfigItem } from '@/app/actions/config-params'
const contractFormSchema = z.object({
    id: z.string().min(2, { message: 'Mã hợp đồng phải có ít nhất 2 ký tự' }),
    client_id: z.string().min(1, { message: 'Vui lòng chọn khách hàng' }),
    branch_id: z.string().min(1, { message: 'Vui lòng chọn chi nhánh' }),
    member_name: z.string().min(1, { message: 'Tên hội viên không được để trống' }),
    phone: z.string().optional(),
    email: z.string().optional(),
    member_address: z.string().optional(),
    contract_type: z.string().optional(),
    contract_name: z.string().optional(),
    start_date: z.string().min(1, { message: 'Vui lòng chọn ngày bắt đầu' }),
    end_date: z.string().optional(),
    package_name: z.string().optional(),
    package_price: z.string().optional(),
    total_amount: z.string().optional(),
    payment_method: z.string().optional(),
    trainer_name: z.string().optional(),
    center_representative: z.string().optional(),
    status: z.string().optional(),
    facility_name: z.string().optional(),
    short_name: z.string().optional(),
    address: z.string().optional(),
    center_phone: z.string().optional(),
    account_number: z.string().optional(),
    account_holder: z.string().optional(),
    bank_name: z.string().optional(),
})

export function AddContractDialog({ onSuccess, initialClientId, initialClient, isQuickAction, triggerOverride }: { onSuccess: () => void, initialClientId?: string, initialClient?: any, isQuickAction?: boolean, triggerOverride?: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [clients, setClients] = React.useState<any[]>(initialClient ? [initialClient] : [])
    const [branches, setBranches] = React.useState<any[]>(
        initialClient?.branch_id
            ? [{ id: initialClient.branch_id, name: initialClient.branch_name || initialClient.branch_id }]
            : []
    )
    const [packages, setPackages] = React.useState<any[]>([])
    const [statuses, setStatuses] = React.useState<ConfigItem[]>([])

    const form = useForm<z.infer<typeof contractFormSchema>>({
        resolver: zodResolver(contractFormSchema),
        defaultValues: {
            id: '',
            client_id: '',
            branch_id: '',
            member_name: '',
            phone: '',
            email: '',
            member_address: '',
            contract_type: 'Hội viên',
            contract_name: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            package_name: '',
            package_price: '',
            total_amount: '',
            payment_method: 'Tiền mặt',
            trainer_name: '',
            center_representative: '',
            status: 'Đang thực hiện',
            facility_name: '',
            short_name: '',
            address: '',
            center_phone: '',
            account_number: '',
            account_holder: '',
            bank_name: '',
        },
    })

    React.useEffect(() => {
        if (open) {
            // Instantly pre-fill customer info if passed from parent
            if (initialClient) {
                form.setValue('client_id', initialClient.id)
                form.setValue('member_name', initialClient.member_name)
                form.setValue('phone', initialClient.phone || '')
                form.setValue('email', initialClient.email || '')
                form.setValue('member_address', initialClient.address || '')
                form.setValue('trainer_name', initialClient.pt_name || '')
                if (initialClient.branch_id) {
                    form.setValue('branch_id', initialClient.branch_id)
                }
            }

            const loadData = async () => {
                const [clientsRes, branchesRes, packagesRes, statusRes] = await Promise.all([
                    fetchClients(),
                    fetchBranches(),
                    fetchMemberships(),
                    fetchConfigParams('config_contract_status')
                ])
                if (statusRes.success && statusRes.data) {
                    setStatuses(statusRes.data)
                    // Set default status if not already set or is default
                    const currentStatus = form.getValues('status')
                    if (currentStatus === 'Đang thực hiện' || !currentStatus) {
                        const defaultStatus = statusRes.data.find(s => s.is_default) || statusRes.data[0]
                        if (defaultStatus) {
                            form.setValue('status', defaultStatus.nam)
                        }
                    }
                }

                if (clientsRes.success) {
                    const clientList = clientsRes.data || []

                    // Merge initial client if not present in the fetched list, just to be safe
                    const fetchedIds = new Set(clientList.map((c: any) => c.id))
                    const initialArray = initialClient && !fetchedIds.has(initialClient.id) ? [initialClient] : []
                    setClients([...initialArray, ...clientList])

                    // Pre-select client if initialClientId is provided but no initialClient object is present
                    if (initialClientId && !initialClient) {
                        form.setValue('client_id', initialClientId)
                        const client = clientList.find((c: any) => c.id === initialClientId)
                        if (client) {
                            form.setValue('member_name', client.member_name)
                            form.setValue('phone', client.phone || '')
                            form.setValue('email', client.email || '')
                            form.setValue('member_address', client.address || '')
                            form.setValue('trainer_name', client.pt_name || '')

                            if (client.branch_id) {
                                form.setValue('branch_id', client.branch_id)
                            }
                        }
                    }
                }

                if (branchesRes.success) {
                    const branchList = branchesRes.data || []
                    setBranches(branchList)

                    const currentBranchId = form.getValues('branch_id')
                    if (currentBranchId) {
                        const branch = branchList.find((b: any) => b.id === currentBranchId)
                        if (branch) {
                            form.setValue('facility_name', branch.name)
                            form.setValue('short_name', branch.short_name || '')
                            form.setValue('address', branch.address || '')
                            form.setValue('center_phone', branch.phone || '')
                            form.setValue('account_number', branch.account_number?.toString() || '')
                            form.setValue('account_holder', branch.account_holder || '')
                            form.setValue('bank_name', branch.bank_name || '')
                        }
                    }
                }

                if (packagesRes.success) setPackages(packagesRes.data || [])
            }
            loadData()
        }
    }, [open, initialClientId, initialClient, form])

    const onClientChange = (clientId: string) => {
        const client = clients.find(c => c.id === clientId)
        if (client) {
            form.setValue('member_name', client.member_name)
            form.setValue('phone', client.phone || '')
            form.setValue('email', client.email || '')
            form.setValue('member_address', client.address || '')
            form.setValue('trainer_name', client.pt_name || '')

            // Auto-select branch from client
            if (client.branch_id) {
                form.setValue('branch_id', client.branch_id)
                onBranchChange(client.branch_id)
            }
        }
    }

    const onBranchChange = (branchId: string) => {
        const branch = branches.find(b => b.id === branchId)
        if (branch) {
            form.setValue('facility_name', branch.name)
            form.setValue('short_name', branch.short_name || '')
            form.setValue('address', branch.address || '')
            form.setValue('center_phone', branch.phone || '')
            form.setValue('account_number', branch.account_number?.toString() || '')
            form.setValue('account_holder', branch.account_holder || '')
            form.setValue('bank_name', branch.bank_name || '')
        }
    }

    const onPackageChange = (packageId: string) => {
        const pkg = packages.find(p => p.id === packageId)
        if (pkg) {
            form.setValue('package_name', pkg.package_name)
            const price = pkg.discounted_price || pkg.unit_price
            form.setValue('package_price', price.toString())
            form.setValue('total_amount', price.toString())

            // Calculate end date
            if (form.getValues('start_date') && pkg.duration_days) {
                const startDate = new Date(form.getValues('start_date'))
                const endDate = addDays(startDate, parseInt(pkg.duration_days))
                form.setValue('end_date', endDate.toISOString().split('T')[0])
            }
        }
    }

    async function onSubmit(values: z.infer<typeof contractFormSchema>) {
        setLoading(true)
        try {
            const result = await createContract({
                ...values,
                package_price: values.package_price ? parseFloat(values.package_price) : null,
                total_amount: values.total_amount ? parseFloat(values.total_amount) : null,
            })
            if (result.success) {
                toast.success('Đã tạo hợp đồng thành công')
                setOpen(false)
                form.reset()
                onSuccess()
            } else {
                toast.error('Lỗi khi tạo hợp đồng: ' + result.error)
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
                {triggerOverride || (
                    <Button
                        className={cn(
                            isQuickAction
                                ? "h-20 rounded-2xl flex-col gap-2 border-slate-100 dark:border-slate-800 hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all font-medium text-xs text-slate-600 dark:text-slate-400 hover:text-red-600 bg-transparent shadow-none border"
                                : "bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-10 transition-colors shadow-sm"
                        )}
                    >
                        <Plus className={cn(isQuickAction ? "w-5 h-5" : "w-4 h-4 mr-2")} />
                        Tạo hợp đồng
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl border-none shadow-2xl font-inter bg-white dark:bg-gray-950"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl font-medium text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-2">
                        Tạo Hợp đồng mới
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400 font-medium">
                        Nhập các thông tin cần thiết để tạo hợp đồng dịch vụ cho khách hàng.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 py-4">
                        {/* Section 1: Định danh hợp đồng */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Thông tin định danh
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Số Hợp đồng</FormLabel>
                                            <FormControl>
                                                <Input placeholder="HD-2024-..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11" />
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
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Trạng thái HĐ</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full min-w-0 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11 overflow-hidden">
                                                        <SelectValue placeholder="Chọn trạng thái" className="truncate" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800" position="popper" sideOffset={4}>
                                                    {statuses.map(status => (
                                                        <SelectItem key={`status-${status.id}`} value={status.nam}>{status.nam}</SelectItem>
                                                    ))}
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
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Chi nhánh ký</FormLabel>
                                            <Select
                                                onValueChange={(val) => {
                                                    field.onChange(val)
                                                    onBranchChange(val)
                                                }}
                                                value={field.value || ""}
                                                disabled
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full min-w-0 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11 overflow-hidden">
                                                        <SelectValue placeholder="Chọn chi nhánh" className="truncate text-left" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800" position="popper" sideOffset={4}>
                                                    {branches.map(branch => (
                                                        <SelectItem key={`branch-${branch.id}`} value={branch.id}>{branch.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contract_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Loại hợp đồng</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full min-w-0 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11 overflow-hidden">
                                                        <SelectValue placeholder="Chọn loại" className="truncate" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    <SelectItem value="Hội viên">Hội viên</SelectItem>
                                                    <SelectItem value="Huấn luyện cá nhân">Huấn luyện cá nhân</SelectItem>
                                                    <SelectItem value="Combo">Combo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section 2: Khách hàng */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Thông tin Khách hàng
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="client_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Chọn Khách hàng (Sẵn có)</FormLabel>
                                            <Select
                                                onValueChange={(val) => {
                                                    field.onChange(val)
                                                    onClientChange(val)
                                                }}
                                                value={field.value || ""}
                                                disabled={!!initialClientId || !!initialClient}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full min-w-0 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11 overflow-hidden disabled:opacity-75 disabled:cursor-not-allowed">
                                                        <SelectValue placeholder="Tìm khách hàng..." className="truncate text-left" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 max-h-60 w-[--radix-select-trigger-width]" position="popper" sideOffset={4}>
                                                    {clients.map(client => (
                                                        <SelectItem key={`client-${client.id}`} value={client.id}>{client.member_name} - {client.phone}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="member_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Họ và tên (Trong HĐ)</FormLabel>
                                            <FormControl>
                                                <Input readOnly {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 h-11 font-medium" />
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
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Số điện thoại</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
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
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Email</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="member_address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Địa chỉ thường trú</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Section 3: Gói dịch vụ & Thanh toán */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Gói dịch vụ & Thanh toán
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormItem>
                                    <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Chọn Gói tập (Sẵn có)</FormLabel>
                                    <Select onValueChange={onPackageChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full min-w-0 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11 overflow-hidden">
                                                <SelectValue placeholder="Chọn gói tập..." className="truncate" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800" position="popper" sideOffset={4}>
                                            {packages.map(pkg => (
                                                <SelectItem key={`pkg-${pkg.id}`} value={pkg.id}>
                                                    {pkg.package_name} ({pkg.duration_days} ngày)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                                <FormField
                                    control={form.control}
                                    name="package_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Tên gói tập (Thủ công)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Gói VIP 12 tháng..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="payment_method"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Phương thức thanh toán</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full min-w-0 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11 overflow-hidden">
                                                        <SelectValue placeholder="Chọn PT" className="truncate" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
                                                    <SelectItem value="Chốt chuyển khoản">Chuyển khoản</SelectItem>
                                                    <SelectItem value="Quẹt thẻ">Quẹt thẻ</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="total_amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Tổng giá trị (VNĐ)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-red-50/30 dark:bg-red-950/10 h-11 font-medium text-red-600" />
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
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Ngày bắt đầu</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
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
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Ngày kết thúc (Dự kiến)</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section 4: Nhân sự */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <Dumbbell className="w-4 h-4" />
                                Nhân sự phụ trách
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="trainer_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Huấn luyện viên (PT)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tên PT..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="center_representative"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Đại diện trung tâm ký</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tên quản lý..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-8 border-t border-gray-100 dark:border-gray-800 gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
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
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang tạo HĐ...
                                    </div>
                                ) : 'Ký Hợp đồng'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
