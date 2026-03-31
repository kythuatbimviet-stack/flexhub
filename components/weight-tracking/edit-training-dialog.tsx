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
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
    Calendar,
    Activity
} from 'lucide-react'
import { upsertTrainingStatus } from '@/app/actions/weight-tracking'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

const trainingSchema = z.object({
    client_id: z.string().min(1),
    date: z.string().min(1, 'Vui lòng chọn ngày'),
    status: z.enum(['Y', 'N', 'TĐ']).nullable().refine(v => v !== null, { message: 'Vui lòng chọn trạng thái' }),
})

type TrainingFormValues = z.infer<typeof trainingSchema>

interface EditTrainingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    record: any
    onSuccess?: () => void
}

export function EditTrainingDialog({ open, onOpenChange, record, onSuccess }: EditTrainingDialogProps) {
    const [loading, setLoading] = React.useState(false)

    const form = useForm<TrainingFormValues>({
        resolver: zodResolver(trainingSchema),
        defaultValues: {
            client_id: '',
            date: '',
            status: null as any,
        },
    })

    React.useEffect(() => {
        if (record) {
            form.reset({
                client_id: record.client_id,
                date: record.date,
                status: record.status as any,
            })
        }
    }, [record, form])

    async function onSubmit(values: TrainingFormValues) {
        setLoading(true)
        try {
            const result = await upsertTrainingStatus(values.client_id, values.date, values.status)
            if (!result.success) throw new Error(result.error)

            toast.success('Cập nhật lịch tập thành công')
            onOpenChange(false)
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi cập nhật lịch tập')
        } finally {
            setLoading(false)
        }
    }

    if (!record) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl bg-white dark:bg-gray-900">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Chỉnh sửa lịch tập
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        Cập nhật trạng thái tập luyện cho ngày này.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-medium text-gray-400">Ngày</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input 
                                                type="date" 
                                                {...field} 
                                                readOnly 
                                                className="pl-10 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 h-11 cursor-not-allowed opacity-70" 
                                            />
                                        </div>
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
                                    <FormLabel className="text-xs font-medium text-gray-400">Trạng thái tập</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 h-11 text-sm">
                                                <SelectValue placeholder="Chọn trạng thái" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                            <SelectItem value="Y">Tập (Y)</SelectItem>
                                            <SelectItem value="N">Nghỉ (N)</SelectItem>
                                            <SelectItem value="TĐ">Tự tập (TĐ)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4 border-t border-gray-50 dark:border-gray-800 gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl px-6 h-11 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl px-8 h-11 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium"
                            >
                                {loading ? 'Đang lưu...' : 'Cập nhật'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
