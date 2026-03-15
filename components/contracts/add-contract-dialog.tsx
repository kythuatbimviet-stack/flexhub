'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
    Plus,
    FileText,
    User as UserIcon,
    Building2,
    Calendar,
    CreditCard,
    Package,
    Dumbbell,
    MapPin,
    Phone,
    Mail,
    Loader2,
    Users as UsersIcon,
    Activity,
    ShieldCheck,
    Hash,
    MonitorPlay,
    AlertCircle,
    Calculator,
    ChevronDown,
    Search,
    UserCheck,
    RotateCcw,
    Check
} from 'lucide-react'
import { cn, numberToVietnameseWords } from '@/lib/utils'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { createContract, generateContractId } from '@/app/actions/contracts'
import { fetchClients } from '@/app/actions/clients'
import { fetchBranches } from '@/app/actions/branches'
import { fetchMemberships } from '@/app/actions/memberships'
import { fetchUserByEmail, fetchUsers } from '@/app/actions/users'
import { addDays } from 'date-fns'
import { fetchConfigParams, ConfigItem } from '@/app/actions/config-params'
import { useQuery } from '@tanstack/react-query'
const contractFormSchema = z.object({
    id: z.string().min(2, { message: 'Mã hợp đồng phải có ít nhất 2 ký tự' }),
    client_id: z.string().min(1, { message: 'Vui lòng chọn khách hàng' }),
    branch_id: z.string().min(1, { message: 'Vui lòng chọn chi nhánh' }),
    member_name: z.string().min(1, { message: 'Tên hội viên không được để trống' }),
    phone: z.string().optional(),
    email: z.string().min(1, { message: 'Vui lòng nhập email' }).email({ message: 'Email không hợp lệ' }),
    member_address: z.string().optional(),
    contract_type: z.string().optional(),
    contract_name: z.string().optional(),
    start_date: z.string().min(1, { message: 'Vui lòng chọn ngày bắt đầu' }),
    end_date: z.string().optional(),
    package_name: z.string().min(1, { message: 'Vui lòng chọn gói tập' }),
    package_price: z.string().optional(),
    total_amount: z.string().min(1, { message: 'Vui lòng nhập giá hợp đồng' }),
    payment_method: z.string().min(1, { message: 'Vui lòng chọn phương thức thanh toán' }),
    trainer_name: z.string().optional(),
    center_representative: z.string().optional(),
    status: z.string().min(1, { message: 'Vui lòng chọn trạng thái hợp đồng' }),
    facility_name: z.string().optional(),
    short_name: z.string().optional(),
    address: z.string().optional(),
    center_phone: z.string().optional(),
    account_number: z.string().optional(),
    account_holder: z.string().optional(),
    bank_name: z.string().optional(),
    // New fields
    dob: z.string().optional(),
    id_number: z.string().min(1, { message: 'Vui lòng nhập số CCCD' }),
    representative_name: z.string().optional(),
    representative_phone: z.string().optional(),
    legal_representative: z.string().optional(),
    center_address: z.string().optional(),
    medical_condition: z.string().optional(),
    initial_height: z.string().optional(),
    initial_weight: z.string().optional(),
    package_type: z.string().optional(),
    quantity: z.string().min(1, { message: 'Vui lòng nhập số lượng' }),
    discounted_price: z.string().optional(),
    staff_phone: z.string().optional(),
    assigned_pt: z.string().optional(),
    custom_selection: z.string().optional(),
    trainer_type: z.string().optional(),
    total_sessions: z.string().optional(),
    signature_url: z.string().optional(),
})

export function AddContractDialog({ onSuccess, initialClientId, initialClient, isQuickAction, triggerOverride }: { onSuccess: () => void, initialClientId?: string, initialClient?: any, isQuickAction?: boolean, triggerOverride?: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [generatingId, setGeneratingId] = React.useState(false)
    const [branches, setBranches] = React.useState<any[]>(
        initialClient?.branch_id
            ? [{ id: initialClient.branch_id, name: initialClient.branch_name || initialClient.branch_id }]
            : []
    )
    const [packages, setPackages] = React.useState<any[]>([])
    const [statuses, setStatuses] = React.useState<ConfigItem[]>([])

    const { data: clients = [], isLoading: clientsLoading } = useQuery({
        queryKey: ['clients-all'],
        queryFn: async () => {
            const res = await fetchClients()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: 30 * 60 * 1000,
    })

    const [clientSearchTerm, setClientSearchTerm] = React.useState('')
    const [clientOpen, setClientOpen] = React.useState(false)

    const filteredClients = React.useMemo(() => {
        if (!clientSearchTerm) return clients
        const term = clientSearchTerm.toLowerCase()
        return clients.filter((client: any) =>
            client.member_name?.toLowerCase().includes(term) ||
            client.phone?.toLowerCase().includes(term) ||
            client.email?.toLowerCase().includes(term)
        )
    }, [clients, clientSearchTerm])

    const form = useForm<z.infer<typeof contractFormSchema>>({
        resolver: zodResolver(contractFormSchema),
        defaultValues: {
            id: '',
            client_id: '',
            branch_id: '',
            member_name: '',
            signature_url: '',
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
            dob: '',
            id_number: '',
            representative_name: '',
            representative_phone: '',
            legal_representative: '',
            center_address: '',
            medical_condition: '',
            initial_height: '',
            initial_weight: '',
            package_type: 'offline',
            quantity: '1',
            discounted_price: '0',
            staff_phone: '',
            assigned_pt: '',
            custom_selection: '',
            trainer_type: '',
            total_sessions: '',
        },
    })

    const watchTotalAmountValue = form.watch('total_amount')
    const watchPackagePrice = form.watch('package_price')
    const watchDiscountedPrice = form.watch('discounted_price')

    // Helper: format number to Vietnamese words preview
    const toWords = (val: string | undefined) => {
        try {
            const num = Number((val || '').toString().replace(/\./g, ''))
            if (!num || isNaN(num)) return ''
            return numberToVietnameseWords(num) + ' đồng chẵn'
        } catch { return '' }
    }

    const [trainerTypes, setTrainerTypes] = React.useState<ConfigItem[]>([])
    const [users, setUsers] = React.useState<any[]>([])
    const [ptSearchTerm, setPtSearchTerm] = React.useState('')
    const [ptOpen, setPtOpen] = React.useState(false)

    const filteredPts = React.useMemo(() => {
        if (!ptSearchTerm) return users
        return users.filter((user: any) =>
            user.name?.toLowerCase().includes(ptSearchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(ptSearchTerm.toLowerCase())
        )
    }, [users, ptSearchTerm])

    const selectedPackageRef = React.useRef<any>(null)

    React.useEffect(() => {
        if (open) {
            // Instantly pre-fill customer info if passed from parent
            if (initialClient) {
                form.setValue('client_id', initialClient.id)
                form.setValue('member_name', initialClient.member_name)
                form.setValue('phone', initialClient.phone || '')
                form.setValue('email', initialClient.email || '')
                if (initialClient.member_address || initialClient.address) {
                    form.setValue('member_address', initialClient.member_address || initialClient.address)
                }
                form.setValue('trainer_name', initialClient.pt_name || '')
                if (initialClient.dob) {
                    form.setValue('dob', initialClient.dob.split('T')[0])
                }
                if (initialClient.signature_url) {
                    form.setValue('signature_url', initialClient.signature_url)
                }
                if (initialClient.assigned_pt) {
                    form.setValue('assigned_pt', initialClient.assigned_pt)
                } else {
                    form.setValue('assigned_pt', '')
                }
                if (initialClient.branch_id) {
                    form.setValue('branch_id', initialClient.branch_id)
                }
            }

            const loadData = async () => {
                const [branchesRes, packagesRes, statusRes, usersRes] = await Promise.all([
                    fetchBranches(),
                    fetchMemberships(),
                    fetchConfigParams('config_contract_status'),
                    fetchUsers()
                ])
                if (statusRes.success && statusRes.data) {
                    setStatuses(statusRes.data)
                    const currentStatus = form.getValues('status')
                    if (currentStatus === 'Đang thực hiện' || !currentStatus) {
                        const defaultStatus = statusRes.data.find(s => s.is_default) || statusRes.data[0]
                        if (defaultStatus) {
                            form.setValue('status', defaultStatus.nam)
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
                            form.setValue('center_phone', branch.center_phone || branch.phone || '')
                            form.setValue('center_address', branch.center_address || branch.address || '')
                            form.setValue('legal_representative', branch.legal_representative || '')
                            form.setValue('representative_phone', '')
                            form.setValue('center_representative', branch.representative || '')
                            form.setValue('representative_name', '')
                            form.setValue('account_number', branch.account_number?.toString() || '')
                            form.setValue('account_holder', branch.account_holder || '')
                            form.setValue('bank_name', branch.bank_name || '')
                        }
                    }
                }

                if (packagesRes.success) setPackages(packagesRes.data || [])

                const trainerTypeRes = await fetchConfigParams('config_contract_trainer_type')
                if (trainerTypeRes.success) setTrainerTypes(trainerTypeRes.data || [])

                if (usersRes.success) setUsers(usersRes.data || [])
            }
            loadData()
        }
    }, [open, initialClientId, initialClient, form])

    // Specific effect to handle initial selection from shared cache
    React.useEffect(() => {
        if (open && clients.length > 0) {
            if (initialClientId || initialClient?.id) {
                const targetId = initialClientId || initialClient.id
                form.setValue('client_id', targetId)
                const client = clients.find((c: any) => c.id === targetId)
                if (client) {
                    form.setValue('member_name', client.member_name)
                    form.setValue('phone', client.phone || '')
                    form.setValue('email', client.email || '')
                    if (client.member_address || client.address) {
                        form.setValue('member_address', client.member_address || client.address)
                    }
                    form.setValue('trainer_name', client.pt_name || '')
                    if (client.dob) {
                        form.setValue('dob', client.dob.split('T')[0])
                    }
                    if (client.signature_url) {
                        form.setValue('signature_url', client.signature_url)
                    }
                    if (client.assigned_pt) {
                        form.setValue('assigned_pt', client.assigned_pt)
                    } else {
                        form.setValue('assigned_pt', '')
                    }

                    if (client.branch_id) {
                        form.setValue('branch_id', client.branch_id)
                    }
                }
            }
        }
    }, [open, clients, initialClientId, initialClient, form])

    // Watch assigned_pt to update staff_phone automatically
    const watchAssignedPt = form.watch('assigned_pt')
    React.useEffect(() => {
        if (watchAssignedPt && users.length > 0) {
            const ptUser = users.find(u => u.email === watchAssignedPt)
            if (ptUser) {
                form.setValue('staff_phone', ptUser.phone || '')
            }
        } else if (!watchAssignedPt) {
            form.setValue('staff_phone', '')
        }
    }, [watchAssignedPt, users, form])

    const onClientChange = (clientId: string) => {
        const client = clients.find(c => c.id === clientId)
        if (client) {
            form.setValue('member_name', client.member_name)
            form.setValue('phone', client.phone || '')
            form.setValue('email', client.email || '')
            if (client.member_address || client.address) {
                form.setValue('member_address', client.member_address || client.address)
            }
            form.setValue('trainer_name', client.pt_name || '')
            if (client.dob) {
                form.setValue('dob', client.dob.split('T')[0])
            }
            if (client.signature_url) {
                form.setValue('signature_url', client.signature_url)
            }
            if (client.assigned_pt) {
                form.setValue('assigned_pt', client.assigned_pt)
            } else {
                form.setValue('assigned_pt', '')
            }

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
            form.setValue('center_phone', branch.center_phone || branch.phone || '')
            form.setValue('center_address', branch.center_address || branch.address || '')
            form.setValue('legal_representative', branch.legal_representative || '')
            form.setValue('representative_phone', '')
            form.setValue('center_representative', branch.representative || '')
            form.setValue('representative_name', '')
            form.setValue('account_number', branch.account_number?.toString() || '')
            form.setValue('account_holder', branch.account_holder || '')
            form.setValue('bank_name', branch.bank_name || '')
        }
    }

    const onPackageChange = (packageId: string) => {
        const pkg = packages.find(p => p.id === packageId)
        if (pkg) {
            selectedPackageRef.current = pkg
            form.setValue('package_name', pkg.package_name)
            const unitPrice = pkg.discounted_price || pkg.unit_price
            const qty = parseInt(form.getValues('quantity') || '1')
            const pkgPrice = unitPrice * qty

            form.setValue('package_price', pkgPrice.toString())
            form.setValue('total_amount', pkgPrice.toString())

            // Calculate end date
            if (form.getValues('start_date') && pkg.duration_days) {
                const startDate = new Date(form.getValues('start_date'))
                const endDate = addDays(startDate, parseInt(pkg.duration_days) * qty)
                form.setValue('end_date', endDate.toISOString().split('T')[0])
            }
        }
    }

    // Auto-calculate prices
    const watchQuantity = form.watch('quantity')

    React.useEffect(() => {
        if (selectedPackageRef.current) {
            const pkg = selectedPackageRef.current
            const unitPrice = pkg.discounted_price || pkg.unit_price
            const qty = parseInt(watchQuantity || '1')
            const pkgPrice = unitPrice * qty
            form.setValue('package_price', pkgPrice.toString())

            // Re-calculate end date based on qty
            if (form.getValues('start_date') && pkg.duration_days) {
                const startDate = new Date(form.getValues('start_date'))
                const endDate = addDays(startDate, parseInt(pkg.duration_days) * qty)
                form.setValue('end_date', endDate.toISOString().split('T')[0])
            }
        }
    }, [watchQuantity, form])

    React.useEffect(() => {
        const pkgPrice = parseFloat(form.getValues('package_price') || '0')
        const total = parseFloat(watchTotalAmountValue || '0')
        const discount = total - pkgPrice
        form.setValue('discounted_price', discount.toString())
    }, [watchTotalAmountValue, watchQuantity, form])

    const watchBranchId = form.watch('branch_id')

    React.useEffect(() => {
        if (!open) return
        setGeneratingId(true)
        generateContractId(watchBranchId).then((res) => {
            if (res.success && res.data) {
                form.setValue('id', res.data)
            }
        }).finally(() => setGeneratingId(false))
    }, [open, watchBranchId, form])

    async function onSubmit(values: z.infer<typeof contractFormSchema>) {
        setLoading(true)
        try {
            // Prepare data for submission, converting numeric strings where necessary
            const totalAmount = Number(values.total_amount?.toString().replace(/\./g, '') || 0)

            const formData = {
                ...values,
                total_amount: totalAmount,
                package_price: values.package_price ? Number(values.package_price.toString().replace(/\./g, '')) : 0,
                discounted_price: values.discounted_price ? Number(values.discounted_price.toString().replace(/\./g, '')) : 0,
                initial_height: values.initial_height ? Number(values.initial_height) : null,
                initial_weight: values.initial_weight ? Number(values.initial_weight) : null,
                quantity: values.quantity ? Number(values.quantity) : 1,
                total_sessions: values.total_sessions ? Number(values.total_sessions) : null,
                status: 'Chờ ký HĐ', // Default status for new contracts
            }

            const result = await createContract(formData)
            if (result.success) {
                toast.success('Hợp đồng đã được tạo thành công!')
                setOpen(false)
                form.reset()
                onSuccess()
            } else {
                toast.error('Lỗi khi tạo hợp đồng: ' + result.error)
            }
        } catch (error: any) {
            toast.error('Đã xảy ra lỗi hệ thống: ' + (error.message || 'Lỗi không xác định'))
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
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl font-medium text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-2">
                        Tạo Hợp đồng mới
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400 font-medium">
                        Nhập các thông tin cần thiết (<span className="text-red-600">*</span> là bắt buộc) để tạo hợp đồng dịch vụ cho khách hàng.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 py-4">
                        {/* Section 2: Khách hàng */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                Thông tin Khách hàng
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                    control={form.control}
                                    name="client_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Chọn Khách hàng (Sẵn có)</FormLabel>
                                            <Popover modal={true} open={clientOpen} onOpenChange={(open) => {
                                                setClientOpen(open)
                                                if (!open) setClientSearchTerm('')
                                            }}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11 px-3 font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2 overflow-hidden w-full text-sm">
                                                                <UsersIcon className="w-4 h-4 shrink-0 text-gray-400" />
                                                                <span className="truncate">
                                                                    {field.value
                                                                        ? clients.find(c => c.id === field.value)?.member_name || "Khách hàng không xác định"
                                                                        : "Tìm khách hàng..."}
                                                                </span>
                                                            </div>
                                                            {clientsLoading ? (
                                                                <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                                                            ) : (
                                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            )}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-gray-200 dark:border-gray-800"
                                                    align="start"
                                                >
                                                    <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                placeholder="Tìm tên, số điện thoại hoặc email..."
                                                                value={clientSearchTerm}
                                                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                                                className="pl-8 h-9 border-none bg-gray-50/50 dark:bg-gray-900 rounded-lg focus-visible:ring-0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <ScrollArea className="h-[300px]">
                                                        <div className="p-1">
                                                            {clientsLoading ? (
                                                                <div className="p-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                    Đang tải danh sách...
                                                                </div>
                                                            ) : filteredClients.length === 0 ? (
                                                                <div className="p-4 text-center text-xs text-gray-500">
                                                                    Không tìm thấy khách hàng nào
                                                                </div>
                                                            ) : (
                                                                filteredClients.map((client: any) => (
                                                                    <button
                                                                        key={client.id}
                                                                        type="button"
                                                                        className={cn(
                                                                            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                                                            field.value === client.id && "bg-red-50 dark:bg-red-900/20 text-red-600"
                                                                        )}
                                                                        onClick={() => {
                                                                            field.onChange(client.id)
                                                                            onClientChange(client.id)
                                                                            setClientOpen(false)
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col items-start min-w-0">
                                                                            <span className="font-medium truncate w-full">{client.member_name}</span>
                                                                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                                                <span className="truncate">{client.phone}</span>
                                                                                {client.email && (
                                                                                    <>
                                                                                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                                                        <span className="truncate">{client.email}</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {field.value === client.id && (
                                                                            <Check className="ml-auto h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                ))
                                                            )}
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
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Email <span className="text-red-600">*</span></FormLabel>
                                            <FormControl>
                                                <Input {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dob"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Ngày tháng năm sinh</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="id_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Căn cước công dân (ID Number) <span className="text-red-600">*</span></FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Số CCCD..." className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
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

                        {/* Section 2.2: Chỉ số sức khỏe */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Chỉ số sức khỏe
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="medical_condition"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Bệnh lý</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Tiền sử bệnh..." className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="initial_height"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Chiều cao ban đầu (cm)</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="170" className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="initial_weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Cân nặng ban đầu (kg)</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="60" className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
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
                                <ShieldCheck className="w-4 h-4" />
                                Nhân sự phụ trách
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="trainer_name"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Huấn luyện viên (PT)</FormLabel>
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
                                                                "w-full justify-between rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11 px-3 font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2 overflow-hidden w-full text-sm">
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
                                                    className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-gray-200 dark:border-gray-800"
                                                    align="start"
                                                >
                                                    <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                placeholder="Tìm nhân viên..."
                                                                value={ptSearchTerm}
                                                                onChange={(e) => setPtSearchTerm(e.target.value)}
                                                                className="pl-8 h-9 border-none bg-gray-50/50 dark:bg-gray-900 rounded-lg focus-visible:ring-0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <ScrollArea className="h-[250px]">
                                                        <div className="p-1">
                                                            <button
                                                                type="button"
                                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                                onClick={() => {
                                                                    form.setValue('assigned_pt', '')
                                                                    form.setValue('trainer_name', '')
                                                                    form.setValue('staff_phone', '')
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
                                                                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                                                        field.value === user.name && "bg-red-50 dark:bg-red-900/20 text-red-600"
                                                                    )}
                                                                    onClick={() => {
                                                                        form.setValue('assigned_pt', user.email)
                                                                        form.setValue('trainer_name', user.name)
                                                                        form.setValue('staff_phone', user.phone || '')
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
                                    name="staff_phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Số điện thoại nhân sự</FormLabel>
                                            <FormControl>
                                                <Input placeholder="090..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </div>

                        {/* Section 3: Gói dịch vụ */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Gói dịch vụ
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormItem>
                                    <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Chọn Gói tập (Sẵn có)</FormLabel>
                                    <Select onValueChange={(e: string) => onPackageChange(e)}>
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
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Tên gói tập (Thủ công) <span className="text-red-600">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Gói VIP 12 tháng..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="package_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Phân loại gói tập</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full min-w-0 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 h-11 overflow-hidden">
                                                        <SelectValue placeholder="Phân loại..." className="truncate" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    <SelectItem value="offline">Offline (Tại trung tâm)</SelectItem>
                                                    <SelectItem value="online">Online</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="total_sessions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Tổng số buổi cân khoán</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="24" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="trainer_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Hình thức tập</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full min-w-0 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11 overflow-hidden">
                                                        <SelectValue placeholder="Chọn hình thức..." className="truncate" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                    {trainerTypes.map(type => (
                                                        <SelectItem key={`trainer-type-${type.id}`} value={type.nam}>{type.nam}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="custom_selection"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Tùy chọn (Custom)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Yêu cầu riêng..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2 pt-2">
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
                                                <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Ngày kết thúc</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3.1: Thành tiền */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                Thành tiền
                            </h3>
                            <div className="space-y-6">
                                {/* Row 1: Số tháng & Giá tự tính */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Số tháng (Số lượng) <span className="text-red-600">*</span></FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="1" {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="package_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Giá tự tính (VNĐ)</FormLabel>
                                                <FormControl>
                                                    <Input readOnly {...field} value={field.value ? Number(field.value).toLocaleString('vi-VN') : '0'} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 h-11 font-medium text-gray-500" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Row 2: Bằng chữ (Giá tự tính) */}
                                {toWords(watchPackagePrice) && (
                                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">Bằng chữ (Tạm tính)</p>
                                        <p className="text-xs italic text-gray-600 dark:text-gray-400">{toWords(watchPackagePrice)}</p>
                                    </div>
                                )}

                                {/* Row 3: Giá hợp đồng & Giảm giá */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="total_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Giá hợp đồng (VNĐ - Nhập cuối) <span className="text-red-600">*</span></FormLabel>
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
                                                        className="rounded-xl border-gray-200 dark:border-gray-800 bg-red-50/30 dark:bg-red-950/10 h-11 font-semibold text-red-600"
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
                                                <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Phần giảm giá (Tính toán)</FormLabel>
                                                <FormControl>
                                                    <Input readOnly {...field} value={field.value ? Number(field.value).toLocaleString('vi-VN') : '0'} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 h-11 font-medium text-emerald-600" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Row 4: Bằng chữ (Giá hợp đồng) */}
                                {toWords(watchTotalAmountValue) && (
                                    <div className="px-4 py-2 bg-red-50/30 dark:bg-red-950/10 rounded-xl border border-dashed border-red-200 dark:border-red-900/30">
                                        <p className="text-[10px] font-medium text-red-400 uppercase tracking-widest mb-1">Bằng chữ (Thành tiền)</p>
                                        <p className="text-xs italic text-red-600 dark:text-red-400 font-medium">{toWords(watchTotalAmountValue)}</p>
                                    </div>
                                )}

                                {/* Row 5: Phương thức thanh toán */}
                                <FormField
                                    control={form.control}
                                    name="payment_method"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Phương thức thanh toán <span className="text-red-600">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full min-w-0 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11 overflow-hidden">
                                                        <SelectValue placeholder="Chọn phương thức" className="truncate" />
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
                            </div>
                        </div>


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
                                                <Input
                                                    readOnly
                                                    placeholder={generatingId ? "Đang tạo mã..." : "HD-XX-YYMM-001"}
                                                    {...field}
                                                    className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 h-11 font-bold font-mono text-sm"
                                                />
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
                                            <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Trạng thái HĐ <span className="text-red-600">*</span></FormLabel>
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
                        {/* Section 2.1: Người đại diện pháp luật */}

                        <div className="space-y-6">
                            <h3 className="text-xs font-medium text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2">
                                <UsersIcon className="w-4 h-4" />
                                Người đại diện pháp luật
                            </h3>
                            <FormField
                                control={form.control}
                                name="center_representative"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Đại diện trung tâm ký</FormLabel>
                                        <FormControl>
                                            <Input readOnly placeholder="Tên quản lý..." {...field} className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 h-11" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Khách hàng (Người giám hộ/đại diện nếu có)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="representative_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Tên người đại diện pháp luật</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Nhập tên..." className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="representative_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-tight">Số điện thoại người đại diện</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Nhập số điện thoại..." className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
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
                                ) : 'Tạo Hợp đồng'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
