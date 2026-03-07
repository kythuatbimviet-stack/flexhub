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
    ClipboardList
} from 'lucide-react'
import { createWeightRecord } from '@/app/actions/weight-tracking'
import { fetchContracts } from '@/app/actions/contracts'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const weightSchema = z.object({
    id: z.string().optional(),
    client_id: z.string().min(1, 'Vui lòng chọn khách hàng'),
    contract_id: z.string().optional().nullable(),
    measurement_date: z.string().min(1, 'Vui lòng chọn ngày đo'),
    weight: z.coerce.number().min(1, 'Cân nặng phải lớn hơn 0'),
    measurements: z.string().optional(),
    next_measurement_date: z.string().optional().nullable(),
})

type WeightFormValues = {
    id?: string
    client_id: string
    contract_id?: string | null
    measurement_date: string
    weight: number
    measurements?: string
    next_measurement_date?: string | null
}

interface AddWeightDialogProps {
    onSuccess?: () => void
    clients: any[]
    initialClientId?: string
    initialDate?: string
    isQuickAction?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function AddWeightDialog({ onSuccess, clients, initialClientId, initialDate, isQuickAction, open: controlledOpen, onOpenChange }: AddWeightDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen
    const [loading, setLoading] = React.useState(false)

    const form = useForm<WeightFormValues>({
        resolver: zodResolver(weightSchema) as any,
        defaultValues: {
            client_id: initialClientId || '',
            contract_id: null,
            measurement_date: initialDate || format(new Date(), 'yyyy-MM-dd'),
            weight: 0,
            measurements: '',
            next_measurement_date: null,
        },
    })

    React.useEffect(() => {
        if (open) {
            form.reset({
                client_id: initialClientId || '',
                contract_id: null,
                measurement_date: initialDate || format(new Date(), 'yyyy-MM-dd'),
                weight: 0,
                measurements: '',
                next_measurement_date: null,
            })
        }
    }, [open, initialClientId, initialDate, form])

    const selectedClientId = form.watch('client_id')

    const { data: contractsResult } = useQuery({
        queryKey: ['contracts-for-client', selectedClientId],
        queryFn: async () => {
            const result = await fetchContracts()
            if (!result.success) throw new Error(result.error)
            return (result.data || []).filter((c: any) => c.client_id === selectedClientId)
        },
        enabled: !!selectedClientId,
    })

    async function onSubmit(values: WeightFormValues) {
        setLoading(true)
        try {
            const result = await createWeightRecord({
                ...values,
                id: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            if (!result.success) throw new Error(result.error)

            toast.success('Thêm bản ghi cân nặng thành công')
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi thêm bản ghi')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {onOpenChange === undefined && (
                <DialogTrigger asChild>
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
                </DialogTrigger>
            )}
            <DialogContent className="max-w-xl rounded-3xl border-none shadow-2xl bg-white dark:bg-gray-900">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Thêm bản ghi cân nặng
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        Nhập các thông số cân nặng và đo lường của khách hàng.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                                control={form.control}
                                name="client_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium text-gray-400">Khách hàng</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 h-11 text-sm">
                                                    <SelectValue placeholder="Chọn khách hàng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                {clients?.map((client: any) => (
                                                    <SelectItem key={client.id} value={client.id}>{client.member_name}</SelectItem>
                                                ))}
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
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium text-gray-400">Hợp đồng (tùy chọn)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 h-11 text-sm">
                                                    <SelectValue placeholder="Chọn hợp đồng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                {contractsResult?.map((contract: any) => (
                                                    <SelectItem key={contract.id} value={contract.id}>{contract.registration_type}</SelectItem>
                                                ))}
                                                {(!contractsResult || contractsResult.length === 0) && (
                                                    <SelectItem value="none" disabled>Không có hợp đồng</SelectItem>
                                                )}
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
                                        <FormLabel className="text-xs font-medium text-gray-400">Ngày đo</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input type="date" {...field} className="pl-10 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 h-11" />
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
                                        <FormLabel className="text-xs font-medium text-gray-400">Cân nặng (kg)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input type="number" step="0.1" placeholder="65.0" {...field} className="pl-10 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 h-11" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="next_measurement_date"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-xs font-medium text-gray-400">Ngày đo tiếp theo (dự kiến)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input type="date" value={field.value || ''} onChange={field.onChange} className="pl-10 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 h-11" />
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
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-xs font-medium text-gray-400">Ghi chú số đo / Nhận xét</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ví dụ: Vòng eo: 70cm, Vòng đùi: 55cm..."
                                                {...field}
                                                className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 min-h-[100px] resize-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t border-gray-50 dark:border-gray-800 gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="rounded-xl px-6 h-11 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl px-8 h-11 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900 rounded-full animate-spin" />
                                        Đang lưu...
                                    </div>
                                ) : 'Lưu bản ghi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
