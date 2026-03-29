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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Plus,
    User,
    Calendar,
    Activity,
    Scale,
    FileText,
    ClipboardList,
    Search,
    Target,
    Ruler
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createWeightRecord, fetchLatestWeightRecordByClientId } from '@/app/actions/weight-tracking'
import { fetchLatestContractByClientId } from '@/app/actions/contracts'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const weightSchema = z.object({
    id: z.string().optional(),
    client_id: z.string().min(1, 'Vui lòng chọn khách hàng'),
    measurement_date: z.string().min(1, 'Vui lòng chọn ngày đo'),
    weight: z.coerce.number().min(1, 'Cân nặng phải lớn hơn 0'),
    target_weight: z.coerce.number().optional().nullable(),
    height: z.coerce.number().optional().nullable(),
    measurements: z.string().optional(),
    next_measurement_date: z.string().optional().nullable(),
    contract_id: z.string().optional().nullable(),
})

type WeightFormValues = z.infer<typeof weightSchema>

interface AddWeightDialogProps {
    onSuccess?: () => void
    clients: any[]
    initialClientId?: string
    initialDate?: string
    isQuickAction?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
    triggerOverride?: React.ReactNode
}

export function AddWeightDialog({ onSuccess, clients, initialClientId, initialDate, isQuickAction, open: controlledOpen, onOpenChange, triggerOverride }: AddWeightDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen
    const [loading, setLoading] = React.useState(false)

    const form = useForm<WeightFormValues>({
        resolver: zodResolver(weightSchema),
        defaultValues: {
            client_id: initialClientId || '',
            measurement_date: initialDate || format(new Date(), 'yyyy-MM-dd'),
            weight: 0,
            target_weight: null,
            height: null,
            measurements: '',
            next_measurement_date: null,
            contract_id: null,
        },
    })

    const selectedClientId = form.watch('client_id')
    const [searchQuery, setSearchQuery] = React.useState("")
    const [openClientSelect, setOpenClientSelect] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            form.reset({
                client_id: initialClientId || '',
                measurement_date: initialDate || format(new Date(), 'yyyy-MM-dd'),
                weight: 0,
                target_weight: null,
                height: null,
                measurements: '',
                next_measurement_date: null,
                contract_id: null,
            })
            setSearchQuery("")
        }
    }, [open, initialClientId, initialDate, form])

    // Fetch Reference Info
    const { data: contractsResult, isLoading: loadingContracts } = useQuery({
        queryKey: ['contracts-for-weight-add', selectedClientId],
        queryFn: async () => {
            const res = await fetchLatestContractByClientId(selectedClientId) // Using latest to get the main one, but maybe I should fetch all?
            // User said: "Hợp đồng tùy chọn sẽ là danh sách hợp đồng theo hôi viên đó"
            // So I should fetch all contracts for that client.
            const { fetchContractsByClientId } = await import('@/app/actions/contracts')
            const result = await fetchContractsByClientId(selectedClientId)
            return result.success ? result.data : []
        },
        enabled: !!selectedClientId,
    })

    const latestContract = contractsResult?.[0] || null

    const { data: latestWeight, isLoading: loadingWeight } = useQuery({
        queryKey: ['latest-weight', selectedClientId],
        queryFn: async () => {
            const res = await fetchLatestWeightRecordByClientId(selectedClientId)
            return res.success ? res.data : null
        },
        enabled: !!selectedClientId,
    })

    // Auto-prefill target_weight and height when client is selected
    React.useEffect(() => {
        if (selectedClientId && (latestContract || latestWeight)) {
            const currentWeight = form.getValues('weight')
            const currentTarget = form.getValues('target_weight')
            const currentHeight = form.getValues('height')

            if (!currentTarget) {
                form.setValue('target_weight', latestContract?.target_weight || null)
            }
            if (!currentHeight) {
                form.setValue('height', latestWeight?.height || latestContract?.initial_height || null)
            }
            if (!form.getValues('contract_id')) {
                form.setValue('contract_id', latestContract?.id || null)
            }
        }
    }, [selectedClientId, latestContract, latestWeight, form])

    const filteredClients = React.useMemo(() => {
        if (!searchQuery) return clients || []
        const query = searchQuery.toLowerCase().trim()
        return (clients || []).filter(c => 
            c.member_name?.toLowerCase().includes(query) || 
            c.phone?.includes(query)
        )
    }, [clients, searchQuery])

    async function onSubmit(values: WeightFormValues) {
        setLoading(true)
        console.log('Submitting weight record:', values)
        try {
            const result = await createWeightRecord({
                ...values,
            })
            
            if (!result.success) {
                console.error('Submission failed from server:', result.error)
                throw new Error(result.error)
            }

            toast.success('Thêm bản ghi cân nặng thành công')
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            console.error('Submission error:', error)
            toast.error(error.message || 'Lỗi khi thêm bản ghi')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {onOpenChange === undefined && (
                <DialogTrigger asChild>
                    {triggerOverride || (
                        <Button
                            className={cn(
                                isQuickAction
                                    ? "h-20 rounded-2xl flex-col gap-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all font-medium text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 bg-transparent shadow-none border"
                                    : "bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-10 transition-colors shadow-sm"
                            )}
                        >
                            <Plus className={cn(isQuickAction ? "w-5 h-5" : "w-4 h-4 mr-2")} />
                            {initialClientId ? 'Cập nhật cân nặng' : 'Thêm mới'}
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="max-w-xl rounded-[24px] border-none shadow-2xl bg-white dark:bg-slate-950 p-0 overflow-hidden font-inter">
                <DialogHeader className="px-8 pt-8 pb-4">
                    <DialogTitle className="text-2xl font-semibold text-black dark:text-white flex items-center gap-3">
                        <Activity className="w-6 h-6 text-red-500" />
                        Thêm bản ghi cân nặng
                    </DialogTitle>
                    <DialogDescription className="text-[14px] text-slate-800 dark:text-slate-200 font-medium">
                        Cập nhật và theo dõi thay đổi chỉ số của khách hàng.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-8 pb-8">
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="client_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-2">
                                                Khách hàng
                                            </FormLabel>
                                            <Popover open={openClientSelect} onOpenChange={setOpenClientSelect}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 h-12 text-[14px] font-medium transition-all text-black dark:text-white",
                                                                !field.value && "text-slate-400"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? clients.find(c => c.id === field.value)?.member_name
                                                                : "Tìm tên khách hoặc SĐT..."}
                                                            <Search className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl overflow-hidden border-slate-100 dark:border-slate-800 shadow-2xl" align="start">
                                                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-950">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input
                                                                placeholder="Tìm khách hàng..."
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                className="h-10 w-full pl-10 border-none bg-slate-50 dark:bg-slate-900 rounded-xl text-[14px] font-medium focus-visible:ring-1 focus-visible:ring-red-500/20"
                                                            />
                                                        </div>
                                                    </div>
                                                    <ScrollArea className="max-h-[300px]">
                                                        {filteredClients.length === 0 ? (
                                                            <div className="py-10 text-center text-[13px] text-slate-500 font-medium">
                                                                Không tìm thấy kết quả
                                                            </div>
                                                        ) : (
                                                            <div className="p-2 space-y-1">
                                                                {filteredClients.map((client) => (
                                                                    <div
                                                                        key={client.id}
                                                                        className={cn(
                                                                            "flex flex-col gap-0.5 px-4 py-3 text-[14px] rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-all",
                                                                            field.value === client.id && "bg-slate-100 dark:bg-slate-800 text-black dark:text-white font-semibold"
                                                                        )}
                                                                        onClick={() => {
                                                                            field.onChange(client.id)
                                                                            setOpenClientSelect(false)
                                                                            setSearchQuery("")
                                                                        }}
                                                                    >
                                                                        <span className="text-black dark:text-white">{client.member_name}</span>
                                                                        <span className="text-[12px] text-slate-500">{client.phone || "Chưa có SĐT"}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </ScrollArea>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="contract_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-2">
                                                Hợp đồng áp dụng
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 h-12 text-[14px] font-medium transition-all text-black dark:text-white">
                                                        <SelectValue placeholder={loadingContracts ? "Đang tải..." : "Chọn hợp đồng"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 font-inter">
                                                    <SelectItem value="none">Không áp dụng hợp đồng</SelectItem>
                                                    {contractsResult?.map((c: any) => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            {c.package_name || c.registration_type} ({c.id.slice(-4)})
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
                                    name="measurement_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-2">Ngày đo chỉ số</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <Input type="date" {...field} className="pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 h-12 text-[14px] font-medium text-black dark:text-white" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="target_weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-2">Cân nặng cần đạt</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                                    <Input type="number" step="0.1" placeholder="Số kg..." {...field} value={field.value || ''} className="pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-14 text-[16px] font-semibold text-black dark:text-white transition-all focus:ring-2 focus:ring-blue-500/10" />
                                                </div>
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
                                            <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-2">Cân nặng thực tế</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                    <Input type="number" step="0.1" placeholder="Số kg..." {...field} className="pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-14 text-[16px] font-semibold text-emerald-600 dark:text-emerald-400 transition-all focus:ring-2 focus:ring-emerald-500/10" />
                                                </div>
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
                                            <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-2">Chiều cao (cm)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                                                    <Input type="number" step="1" placeholder="Cm..." {...field} value={field.value || ''} className="pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-14 text-[16px] font-semibold text-purple-600 dark:text-purple-400 transition-all focus:ring-2 focus:ring-purple-500/10" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <AnimatePresence>
                                {selectedClientId && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Thông tin bảo hiểm & Hợp đồng</h3>
                                            {latestContract?.registration_type && (
                                                <Badge variant="outline" className="border-red-100 text-red-600 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30 text-[10px] px-2.5 py-0.5 font-bold rounded-lg uppercase">
                                                    {latestContract.registration_type}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Cân nặng ký HĐ</span>
                                                <span className="text-[16px] font-semibold text-black dark:text-white">
                                                    {loadingContracts ? "..." : (latestContract?.initial_weight || "-")} <span className="text-[12px] font-medium">kg</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Cân nặng Gần nhất</span>
                                                <span className="text-[16px] font-semibold text-black dark:text-white">
                                                    {loadingWeight ? "..." : (latestWeight?.weight || "-")} <span className="text-[12px] font-medium">kg</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Mục tiêu HĐ</span>
                                                <span className="text-[16px] font-semibold text-black dark:text-white">
                                                    {loadingContracts ? "..." : (latestContract?.target_weight || "-")} <span className="text-[12px] font-medium">kg</span>
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="next_measurement_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-2">Ngày hẹn đo tiếp theo</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <Input type="date" value={field.value || ''} onChange={field.onChange} className="pl-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 h-14 text-[14px] font-medium text-black dark:text-white" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="measurements"
                                    render={({ field }) => (
                                        <FormItem className="md:col-start-1 md:col-span-2">
                                            <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-2">Ghi chú & Nhận xét</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Ghi chú chi tiết các vòng đo (Eo, đùi, ngực...) hoặc nhận xét về thay đổi sức khỏe của khách hàng"
                                                    {...field}
                                                    className="rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 min-h-[100px] resize-none p-4 text-[14px] font-medium text-black dark:text-white placeholder:text-slate-400"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-8 gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="rounded-xl px-8 h-12 text-[14px] font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl px-10 h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100 transition-all font-semibold text-[14px] shadow-lg shadow-black/5"
                            >
                                {loading ? "Đang xử lý..." : "Lưu bản ghi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
