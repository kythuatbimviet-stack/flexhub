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
    SheetTrigger,
} from '@/components/ui/sheet'
import { useQuery } from '@tanstack/react-query'
import { fetchBranches } from '@/app/actions/branches'
import { fetchClients } from '@/app/actions/clients'
import { createClient } from '@/lib/supabase'
import { createRevenue, fetchFinancialCategories, updateRevenue } from '@/app/actions/financial'
import { fetchDebtsByCustomer, fetchDebtDetails } from '@/app/actions/debts'
import { fetchContracts, fetchContractById, sendPaymentConfirmationAction } from '@/app/actions/contracts'
import { fetchUsers } from '@/app/actions/users'
import { format } from 'date-fns'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Plus,
    DollarSign,
    Calendar,
    Building2,
    User,
    Tag,
    StickyNote,
    CreditCard,
    X,
    FileText
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

const revenueSchema = z.object({
    amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
    category_id: z.string().min(1, 'Vui lòng chọn danh mục'),
    branch_id: z.string().min(1, 'Vui lòng chọn chi nhánh'),
    customer_id: z.string().nullable().optional(),
    contract_id: z.string().nullable().optional(),
    description: z.string(),
    payment_method: z.string().min(1, 'Vui lòng chọn hình thức thanh toán'),
    recorded_at: z.string().min(1, 'Vui lòng chọn ngày ghi nhận'),
    debt_id: z.string().nullable().optional(),
    installment_id: z.string().nullable().optional(),
    tax_rate: z.number().min(0, 'Thuế không thể âm').default(0),
})

type RevenueFormValues = z.infer<typeof revenueSchema>

interface AddRevenueSheetProps {
    onSuccess?: () => void
    revenue?: any
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function AddRevenueSheet({
    onSuccess,
    revenue,
    trigger,
    open: externalOpen,
    onOpenChange: externalOnOpenChange
}: AddRevenueSheetProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = (val: boolean) => {
        if (externalOnOpenChange) externalOnOpenChange(val)
        else setInternalOpen(val)
    }

    const isEdit = !!revenue
    const [loading, setLoading] = React.useState(false)
    const [searchClientQuery, setSearchClientQuery] = React.useState('')
    const [filterHasContract, setFilterHasContract] = React.useState(false)

    const form = useForm<RevenueFormValues>({
        resolver: zodResolver(revenueSchema) as any,
        defaultValues: {
            amount: 0,
            category_id: '',
            branch_id: '',
            customer_id: null,
            contract_id: null,
            description: '',
            payment_method: 'Tiền mặt',
            recorded_at: format(new Date(), 'yyyy-MM-dd'),
            debt_id: null,
            installment_id: null,
            tax_rate: 0,
            send_xntt: true,
            xntt_email: ''
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

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            const result = await fetchClients()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: contracts } = useQuery({
        queryKey: ['contracts'],
        queryFn: async () => {
            const result = await fetchContracts()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const customerId = form.watch('customer_id')
    const debtId = form.watch('debt_id')
    const installmentId = form.watch('installment_id')

    const { data: customerDebts } = useQuery({
        queryKey: ['debts-customer', customerId],
        queryFn: () => fetchDebtsByCustomer(customerId as string),
        enabled: !!customerId
    })

    const { data: debtDetails } = useQuery({
        queryKey: ['debt-details-rev', debtId],
        queryFn: () => fetchDebtDetails(debtId as string),
        enabled: !!debtId
    })

    const { data: users = [] } = useQuery({
        queryKey: ['users-all'],
        queryFn: async () => {
            const res = await fetchUsers()
            return res.success ? (res.data ?? []) : []
        },
        enabled: open,
    })

    const contractId = form.watch('contract_id')
    const amount = form.watch('amount')

    const { data: contractRevenues } = useQuery({
        queryKey: ['revenue-contract', contractId],
        queryFn: async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('revenue')
                .select('id, amount')
                .eq('contract_id', contractId)
            if (error) throw error
            return data
        },
        enabled: !!contractId && !isEdit && open
    })

    // Reset form when revenue changes or sheet opens
    React.useEffect(() => {
        if (open) {
            if (revenue) {
                form.reset({
                    amount: Number(revenue.amount),
                    category_id: revenue.category_id || '',
                    branch_id: revenue.branch_id || '',
                    customer_id: revenue.customer_id || null,
                    contract_id: revenue.contract_id || null,
                    description: revenue.description || '',
                    payment_method: revenue.payment_method || 'Tiền mặt',
                    recorded_at: revenue.recorded_at ? format(new Date(revenue.recorded_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                    debt_id: revenue.debt_id || null,
                    installment_id: revenue.installment_id || null,
                    tax_rate: Number(revenue.tax_rate) || 0,
                    send_xntt: false, // Default false for editing
                    xntt_email: revenue.clients?.email || ''
                })
            } else {
                form.reset({
                    amount: 0,
                    category_id: '',
                    branch_id: '',
                    customer_id: null,
                    contract_id: null,
                    description: '',
                    payment_method: 'Tiền mặt',
                    recorded_at: format(new Date(), 'yyyy-MM-dd'),
                    debt_id: null,
                    installment_id: null,
                    tax_rate: 0,
                    send_xntt: true,
                    xntt_email: ''
                })
            }
        }
    }, [open, revenue, form])

    React.useEffect(() => {
        if (customerId && clients) {
            const selectedClient = clients.find((c: any) => c.id === customerId)
            if (selectedClient?.branch_id) {
                form.setValue('branch_id', selectedClient.branch_id)
            }
            if (selectedClient?.email) {
                form.setValue('xntt_email', selectedClient.email)
            } else {
                form.setValue('xntt_email', '')
            }
        }
    }, [customerId, clients, form])

    React.useEffect(() => {
        if (installmentId && debtDetails?.data?.installments) {
            const inst = debtDetails.data.installments.find((i: any) => i.id === installmentId)
            if (inst) {
                form.setValue('amount', Number(inst.amount))
                form.setValue('category_id', 'Công nợ')
                form.setValue('description', `Thanh toán công nợ đợt ${inst.installment_number} cho HĐ ${debtDetails.data.contract_id}`)
            }
        }
    }, [installmentId, debtDetails, form])

    // Automation logic for Category & Description when Contract is selected
    React.useEffect(() => {
        if (!isEdit && contractId && contracts && open) {
            const contract = contracts.find((c: any) => c.id === contractId)
            if (!contract) return

            const prevPaymentsCount = contractRevenues?.length || 0
            const packagePrice = Number(contract.package_price) || Number(contract.total_amount) || 0

            // If it's the first payment
            if (prevPaymentsCount === 0) {
                if (amount >= packagePrice && packagePrice > 0) {
                    form.setValue('category_id', 'Hợp đồng')
                    form.setValue('description', `Thanh toán đủ cho HĐ ${contractId}`)
                } else if (amount > 0) {
                    form.setValue('category_id', 'Công nợ')
                    form.setValue('description', `Thanh toán đợt 1 cho HĐ ${contractId}`)
                }
            } else if (amount > 0) {
                // For subsequent payments
                form.setValue('category_id', 'Công nợ')
                form.setValue('description', `Thanh toán đợt ${prevPaymentsCount + 1} cho HĐ ${contractId}`)
            }
        }
    }, [contractId, amount, contractRevenues, contracts, isEdit, form, open])

    const filteredContracts = React.useMemo(() => {
        if (!contracts) return []
        if (!customerId) return []
        return contracts.filter((c: any) => c.client_id === customerId)
    }, [contracts, customerId])

    const filteredClients = React.useMemo(() => {
        if (!clients) return []
        let result = clients
        if (searchClientQuery) {
            const lowerQuery = searchClientQuery.toLowerCase()
            result = result.filter((c: any) =>
                (c.member_name && c.member_name.toLowerCase().includes(lowerQuery)) ||
                (c.phone && c.phone.includes(searchClientQuery))
            )
        }
        if (filterHasContract && contracts) {
            const clientsWithContracts = new Set(contracts.map((c: any) => c.client_id))
            result = result.filter((c: any) => clientsWithContracts.has(c.id))
        }
        return result
    }, [clients, searchClientQuery, filterHasContract, contracts])

    async function onSubmit(values: RevenueFormValues) {
        setLoading(true)
        try {
            let result;
            if (isEdit) {
                const { ...updates } = values
                // @ts-ignore
                delete updates.send_xntt
                // @ts-ignore
                delete updates.xntt_email
                result = await updateRevenue(revenue.id, updates)
            } else {
                result = await createRevenue(values)
            }

            if (!result.success) throw new Error(result.error)

            const message = isEdit ? 'Cập nhật khoản thu thành công' : 'Ghi nhận khoản thu thành công'
            if (values.send_xntt && values.xntt_email) {
                try {
                    // Lấy thông tin hợp đồng để fill payload XNTT
                    let contractData = null
                    if (values.contract_id) {
                        const cRes = await fetchContractById(values.contract_id)
                        if (cRes.success) contractData = cRes.data
                    }

                    const selectedClient = clients?.find((c: any) => c.id === values.customer_id)
                    const selectedBranch = branches?.find((b: any) => b.id === values.branch_id)

                    // Lấy tên người thu từ danh sách users
                    const supabase = createClient()
                    const { data: { user: authUser } } = await supabase.auth.getUser()
                    const currentUser = users.find((u: any) => u.email === authUser?.email)
                    const collectorName = currentUser?.name || authUser?.email || ''

                    const safeDate = (val: any) => {
                        if (!val) return ''
                        try { return format(new Date(val), 'dd/MM/yyyy') } catch { return '' }
                    }

                    const xnttPayload: any = {
                        coso: selectedBranch?.name || contractData?.branches?.name || "Eva's Fit",
                        ten: selectedClient?.member_name || contractData?.member_name || 'Khách hàng',
                        sdt: selectedClient?.phone || contractData?.phone || '',
                        email: values.xntt_email,
                        diachi: selectedClient?.address || contractData?.member_address || '',
                        ngaysinh: safeDate(selectedClient?.dob || contractData?.dob),
                        cmnd: selectedClient?.id_number || contractData?.id_number || '',
                        nguon: contractData?.source || 'Khác',
                        goi: contractData?.package_name || 'Dịch vụ lẻ',
                        custom: contractData?.custom_selection || '',
                        tien1: values.amount.toLocaleString('vi-VN'),
                        httt1: values.payment_method,
                        tonggiatri: values.amount.toLocaleString('vi-VN'), // Với doanh thu lẻ, tổng = số tiền đóng
                        hlv: contractData?.trainer_name || '',
                        nbd: safeDate(contractData?.start_date),
                        nkt: safeDate(contractData?.end_date),
                        ndong: format(new Date(), 'dd/MM/yyyy'),
                        nguoithu: collectorName,
                        ghichu: values.description || '',
                        contractId: values.contract_id || 'REVENUE_' + result.data.id,
                        clientId: values.customer_id || undefined,
                        revenueId: result.data.id,
                        custom_message: "Cảm ơn bạn đã tin tưởng và đồng hành cùng Eva's Fit! Hy vọng bạn sẽ có những trải nghiệm tập luyện tuyệt vời nhất."
                    }

                    await sendPaymentConfirmationAction(xnttPayload)
                    toast.success('Ghi nhận khoản thu và gửi email thành công')
                } catch (emailErr) {
                    console.error('Lỗi gửi XNTT:', emailErr)
                    toast.error('Ghi nhận thu thành công nhưng gửi email thất bại')
                }
            } else {
                toast.success('Ghi nhận khoản thu thành công')
            }

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
        <Sheet open={open} onOpenChange={setOpen}>
            {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : (
                <SheetTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-11 shadow-lg shadow-emerald-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm Khoản thu
                    </Button>
                </SheetTrigger>
            )}
            <SheetContent
                side="right"
                className="w-full sm:max-w-[480px] p-0 border-l bg-slate-50 flex flex-col h-[100dvh] font-inter"
                showCloseButton={false}
            >
                {/* Sticky Header */}
                <div className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between z-20 sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Plus className="w-4.5 h-4.5 text-emerald-600" />
                        </div>
                        <div className="flex flex-col text-left">
                            <SheetTitle className="text-sm font-semibold text-slate-900 leading-tight">
                                {isEdit ? 'Sửa khoản thu' : 'Ghi nhận thu'}
                            </SheetTitle>
                            <SheetDescription className="text-[10px] font-medium text-slate-500 hidden sm:block">
                                {isEdit ? 'Cập nhật thông tin giao dịch' : 'Điền thông tin giao dịch'}
                            </SheetDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="sm:hidden font-semibold text-[12px] text-slate-500 px-2 h-8"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            form="add-revenue-form"
                            type="submit"
                            disabled={loading}
                            className="sm:hidden bg-emerald-600 text-white font-semibold text-[12px] px-3 h-8 rounded-lg shadow-sm"
                        >
                            {loading ? '...' : 'Lưu'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500 ml-1 hidden sm:flex"
                            onClick={() => setOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <Form {...form}>
                        <form id="add-revenue-form" onSubmit={form.handleSubmit(onSubmit)} className="p-4 sm:p-5 space-y-4">
                            {/* Card Section: Phân loại khoản thu */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <h3 className="text-[12px] font-semibold text-blue-600">
                                        PHÂN LOẠI KHOẢN THU
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category_id"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="text-[11px] font-semibold text-slate-900">Danh mục</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700 w-full sm:w-[180px]">
                                                            <SelectValue placeholder="Chọn..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-100">
                                                        <SelectItem value="Hợp đồng">Hợp đồng</SelectItem>
                                                        <SelectItem value="Công nợ">Công nợ</SelectItem>
                                                        <SelectItem value="Khác">Khác</SelectItem>
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
                                            <FormItem className="space-y-1">
                                                <FormLabel className="text-[11px] font-semibold text-slate-900">Hình thức</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700 w-full sm:w-[180px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-100">
                                                        <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
                                                        <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
                                                        <SelectItem value="Thẻ">Thẻ</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Card Section: Thông tin liên quan (Moved Up) */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center">
                                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                                    </div>
                                    <h3 className="text-[12px] font-semibold text-purple-600">
                                        THÔNG TIN LIÊN QUAN
                                    </h3>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="customer_id"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <div className="flex flex-col gap-3 mb-2">
                                                <div className="flex items-center space-x-2 bg-emerald-50 p-2 rounded-xl border border-emerald-100 w-fit">
                                                    <Checkbox
                                                        id="filter-contracts"
                                                        checked={filterHasContract}
                                                        onCheckedChange={(checked) => setFilterHasContract(checked as boolean)}
                                                        className="h-4 w-4 rounded-md border-emerald-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none text-white shrink-0"
                                                    />
                                                    <label htmlFor="filter-contracts" className="text-[11px] font-semibold text-emerald-700 cursor-pointer select-none">
                                                        Chỉ hiện khách có hợp đồng
                                                    </label>
                                                </div>
                                                <FormLabel className="text-[11px] font-semibold text-slate-900">Khách hàng (Tùy chọn)</FormLabel>
                                            </div>
                                            <Select
                                                onValueChange={(val) => {
                                                    field.onChange(val)
                                                    form.setValue('contract_id', null) // clear contract when customer changes
                                                    form.setValue('debt_id', null)
                                                    form.setValue('installment_id', null)
                                                }}
                                                value={field.value || undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700 w-full">
                                                        <SelectValue placeholder="Chọn khách hàng" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100 p-0">
                                                    <div className="p-2 border-b border-slate-50 sticky top-0 bg-white z-10">
                                                        <Input
                                                            autoFocus
                                                            placeholder="Tìm kiếm khách hàng..."
                                                            className="h-9 text-xs border-slate-200 bg-slate-50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                            value={searchClientQuery}
                                                            onChange={(e) => setSearchClientQuery(e.target.value)}
                                                            onKeyDown={(e) => e.stopPropagation()} // Prevent closing select on Space
                                                        />
                                                    </div>
                                                    <div className="max-h-[220px] overflow-y-auto p-1">
                                                        {filteredClients.length > 0 ? (
                                                            filteredClients.map((client: any) => (
                                                                <SelectItem key={client.id} value={client.id} className="text-[13px] py-2 cursor-pointer">{client.member_name || client.name} {client.phone ? `- ${client.phone}` : ''}</SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-slate-500">Khách hàng không tồn tại</div>
                                                        )}
                                                    </div>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contract_id"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-semibold text-slate-900">Hợp đồng liên kết</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || undefined}
                                                disabled={!customerId || filteredContracts.length === 0}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 text-[15px] font-medium text-slate-700 w-full">
                                                        <SelectValue placeholder={
                                                            !customerId ? "Vui lòng chọn khách hàng trước"
                                                                : filteredContracts.length === 0 ? "Khách hàng này không có hợp đồng"
                                                                    : "Chọn hợp đồng"
                                                        } />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100">
                                                    {filteredContracts.map((contract: any) => (
                                                        <SelectItem key={contract.id} value={contract.id}>
                                                            {contract.id} {contract.contract_name ? `- ${contract.contract_name}` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {customerDebts?.data && customerDebts.data.length > 0 && (
                                    <div className="pt-2 border-t border-slate-50 space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="debt_id"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[11px] font-semibold text-amber-600">Chọn Hồ sơ Công nợ</FormLabel>
                                                    <Select
                                                        onValueChange={(val) => {
                                                            field.onChange(val)
                                                            form.setValue('installment_id', null)
                                                            const selectedDebt = customerDebts.data.find((d: any) => d.id === val)
                                                            if (selectedDebt) {
                                                                form.setValue('contract_id', selectedDebt.contract_id)
                                                            }
                                                        }}
                                                        value={field.value || undefined}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl border-amber-100 bg-amber-50/30 h-11 text-[13px] font-medium text-slate-700">
                                                                <SelectValue placeholder="Chọn khoản nợ cần thu" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-amber-100">
                                                            {customerDebts.data.map((d: any) => (
                                                                <SelectItem key={d.id} value={d.id}>
                                                                    HĐ: {d.contract_id} - Còn nợ: {Number(d.remaining_amount).toLocaleString()} ₫
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {debtId && debtDetails?.data?.installments && (
                                            <FormField
                                                control={form.control}
                                                name="installment_id"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1">
                                                        <FormLabel className="text-[11px] font-semibold text-amber-600">Chọn đợt thanh toán</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value || undefined}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="rounded-xl border-amber-100 bg-amber-50/50 h-11 text-[13px] font-medium text-slate-700">
                                                                    <SelectValue placeholder="Chọn đợt (Nếu có)" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl border-amber-100">
                                                                {debtDetails.data.installments
                                                                    .filter((inst: any) => inst.status !== 'Đã thanh toán')
                                                                    .map((inst: any) => (
                                                                        <SelectItem key={inst.id} value={inst.id}>
                                                                            Đợt {inst.installment_number} - {Number(inst.amount).toLocaleString()} ₫ (Hạn: {new Date(inst.due_date).toLocaleDateString('vi-VN')})
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="branch_id"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-semibold text-slate-900">Chi nhánh</FormLabel>
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
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-semibold text-slate-900">Ghi chú / Diễn giải</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Nhập ghi chú cho khoản thu này..."
                                                    {...field}
                                                    className="rounded-xl border-slate-200 bg-white min-h-[80px] focus:ring-emerald-500 text-[15px] font-medium text-slate-700 resize-none"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Card Section: Thông tin số tiền (Moved Down) */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-[12px] font-semibold text-emerald-600">
                                        SỐ TIỀN
                                    </h3>
                                </div>
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[11px] font-semibold text-slate-900">Số tiền (VND)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                            <Input
                                                                type="text"
                                                                placeholder="0"
                                                                value={field.value ? Number(field.value).toLocaleString('vi-VN') : ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\./g, '').replace(/,/g, '')
                                                                    if (val === '' || !isNaN(Number(val))) {
                                                                        field.onChange(val === '' ? 0 : Number(val))
                                                                    }
                                                                }}
                                                                className="rounded-xl border-slate-200 bg-white dark:bg-slate-900 pl-10 h-11 focus:ring-emerald-500 text-[17px] font-bold text-emerald-600"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="tax_rate"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1">
                                                        <FormLabel className="text-[11px] font-semibold text-slate-900 flex justify-between">
                                                            Thuế suất (%)
                                                            <span className="text-orange-600">Trừ thuế</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                                    className="rounded-xl border-slate-200 bg-white dark:bg-slate-900 pl-10 h-11 focus:ring-orange-500 text-[15px] font-bold text-orange-600"
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-semibold text-slate-900">Thực tế (Sau thuế)</Label>
                                                <div className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center px-4">
                                                    <span className="text-[15px] font-bold text-slate-700 dark:text-slate-300">
                                                        {(() => {
                                                            const amt = form.watch('amount') || 0
                                                            const tax = form.watch('tax_rate') || 0
                                                            return (amt * (1 - tax / 100)).toLocaleString('vi-VN')
                                                        })()}
                                                        <span className="ml-1 text-[11px] font-medium opacity-60">đ</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                <FormField
                                    control={form.control}
                                    name="recorded_at"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-semibold text-slate-900">Ngày ghi nhận</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                    <Input type="date" {...field} className="rounded-xl border-slate-200 bg-white pl-10 h-11 focus:ring-emerald-500 text-[15px] font-medium text-slate-700" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Section: Xác nhận thanh toán */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center">
                                            <FileText className="w-3.5 h-3.5 text-orange-600" />
                                        </div>
                                        <h3 className="text-[12px] font-semibold text-orange-600">
                                            Xác nhận thanh toán
                                        </h3>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="send_xntt"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-none text-white"
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-[12px] font-medium text-slate-600 cursor-pointer">
                                                    Gửi Email (XNTT)
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {form.watch('send_xntt') && (
                                    <FormField
                                        control={form.control}
                                        name="xntt_email"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1 animate-in fade-in slide-in-from-top-2">
                                                <FormLabel className="text-[11px] font-semibold text-slate-900">Email nhận XNTT</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Vui lòng nhập email khách hàng..."
                                                        {...field}
                                                        className="rounded-xl border-slate-200 bg-white h-11 text-sm font-medium text-slate-700"
                                                    />
                                                </FormControl>
                                                {!field.value && (
                                                    <p className="text-[10px] text-red-500 font-medium">
                                                        * Cần có email để gửi xác nhận.
                                                    </p>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Footer - Desktop Only */}
                <div className="hidden sm:flex shrink-0 bg-white border-t border-slate-100 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] items-center justify-between z-20 w-full">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="rounded-xl px-6 h-11 text-slate-500 border-slate-200 hover:bg-slate-50"
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        type="submit"
                        form="add-revenue-form"
                        disabled={loading}
                        className="rounded-xl px-8 bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-semibold h-11 shadow-lg shadow-emerald-100"
                    >
                        {loading ? 'Đang lưu...' : 'Ghi nhận'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
