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
import { fetchContracts } from '@/app/actions/contracts'
import { createRevenue } from '@/app/actions/financial'
import { fetchDebtsByCustomer, fetchDebtDetails } from '@/app/actions/debts'
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
})

type RevenueFormValues = z.infer<typeof revenueSchema>

interface AddRevenueSheetProps {
    onSuccess?: () => void
}

export function AddRevenueSheet({ onSuccess }: AddRevenueSheetProps) {
    const [open, setOpen] = React.useState(false)
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
            recorded_at: new Date().toISOString().split('T')[0],
            debt_id: null,
            installment_id: null,
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

    React.useEffect(() => {
        if (customerId && clients) {
            const selectedClient = clients.find((c: any) => c.id === customerId)
            if (selectedClient?.branch_id) {
                form.setValue('branch_id', selectedClient.branch_id)
            }
        }
    }, [customerId, clients, form])

    // Auto-fill from installment
    React.useEffect(() => {
        if (installmentId && debtDetails?.data?.installments) {
            const inst = debtDetails.data.installments.find((i: any) => i.id === installmentId)
            if (inst) {
                form.setValue('amount', Number(inst.amount))
                form.setValue('category_id', 'Công nợ')
                form.setValue('description', `Thanh toán công nợ đợt cho HĐ ${debtDetails.data.contract_id}`)
            }
        }
    }, [installmentId, debtDetails, form])

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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-11 shadow-lg shadow-emerald-100">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Khoản thu
                </Button>
            </SheetTrigger>
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
                            <SheetTitle className="text-sm font-bold text-slate-900 leading-tight">
                                Ghi nhận thu
                            </SheetTitle>
                            <SheetDescription className="text-[10px] font-medium text-slate-500 hidden sm:block">
                                Điền thông tin giao dịch
                            </SheetDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="sm:hidden font-bold text-[12px] text-slate-500 px-2 h-8"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            form="add-revenue-form"
                            type="submit"
                            disabled={loading}
                            className="sm:hidden bg-emerald-600 text-white font-bold text-[12px] px-3 h-8 rounded-lg shadow-sm"
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

                            {/* Card Section: Thông tin liên quan (Moved Up) */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center">
                                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                                    </div>
                                    <h3 className="text-[12px] font-bold uppercase tracking-widest text-purple-600">
                                        Thông tin liên quan
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
                                                    <label htmlFor="filter-contracts" className="text-[11px] font-bold text-emerald-700 cursor-pointer select-none uppercase tracking-tight">
                                                        Chỉ hiện khách có hợp đồng
                                                    </label>
                                                </div>
                                                <FormLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Khách hàng (Tùy chọn)</FormLabel>
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
                                            <FormLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hợp đồng liên kết</FormLabel>
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
                                                    <FormLabel className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Chọn Hồ sơ Công nợ</FormLabel>
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
                                                        <FormLabel className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Chọn đợt thanh toán</FormLabel>
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
                                            <FormLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Chi nhánh</FormLabel>
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
                                            <FormLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ghi chú / Diễn giải</FormLabel>
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

                            {/* Card Section: Phân loại khoản thu */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <h3 className="text-[12px] font-bold uppercase tracking-widest text-blue-600">
                                        Phân loại khoản thu
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category_id"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Danh mục</FormLabel>
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
                                                <FormLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hình thức</FormLabel>
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

                            {/* Card Section: Thông tin số tiền (Moved Down) */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-[12px] font-bold uppercase tracking-widest text-emerald-600">
                                        Số tiền
                                    </h3>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Số tiền (VND)</FormLabel>
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
                                                        className="rounded-xl border-slate-200 bg-white pl-10 h-11 focus:ring-emerald-500 text-[17px] font-bold text-emerald-600"
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
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ngày ghi nhận</FormLabel>
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
