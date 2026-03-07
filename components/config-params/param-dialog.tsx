'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    createConfigParam,
    updateConfigParam,
    type ConfigItem
} from '@/app/actions/config-params'
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, Save, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

const paramSchema = z.object({
    nam: z.string().min(1, 'Vui lòng nhập tên hiển thị'),
    value: z.coerce.number().min(0, 'Vui lòng nhập thứ tự (>= 0)'),
    is_default: z.boolean().default(false),
})

type ParamFormValues = z.infer<typeof paramSchema>

interface ParamDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tableName: string
    item: ConfigItem | null
    groupColor: string
    groupBg: string
}

export function ParamDialog({ open, onOpenChange, tableName, item, groupColor, groupBg }: ParamDialogProps) {
    const queryClient = useQueryClient()
    const isEditing = !!item

    const form = useForm<any>({
        resolver: zodResolver(paramSchema),
        defaultValues: {
            nam: '',
            value: 0,
            is_default: false,
        },
    })

    // Reset form when item changes
    React.useEffect(() => {
        if (item) {
            form.reset({
                nam: item.nam,
                value: item.value,
                is_default: item.is_default,
            })
        } else {
            form.reset({
                nam: '',
                value: 0,
                is_default: false,
            })
        }
    }, [item, form])

    const mutation = useMutation({
        mutationFn: (values: ParamFormValues) => {
            if (isEditing && item) {
                return updateConfigParam(tableName, item.id, values)
            } else {
                return createConfigParam(tableName, values)
            }
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success(isEditing ? 'Cập nhật thành công' : 'Thêm mới thành công')
                queryClient.invalidateQueries({ queryKey: ['config-params', tableName] })
                onOpenChange(false)
            } else {
                toast.error(result.error || 'Đã xảy ra lỗi')
            }
        },
    })

    function onSubmit(values: ParamFormValues) {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden font-inter">
                <div className={cn("px-6 py-6 border-b border-gray-50 dark:border-gray-800/50", groupBg)}>
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                                <LayoutGrid className={cn("w-5 h-5", groupColor)} />
                            </div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                {isEditing ? 'Sửa tham số' : 'Thêm tham số mới'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs font-medium text-gray-500/80 dark:text-gray-400 pl-13">
                            {isEditing ? 'Chỉnh sửa thông tin tham số cấu hình.' : 'Nhập thông tin cho tham số cấu hình mới.'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
                        <FormField
                            control={form.control}
                            name="nam"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-xs text-gray-500 font-bold uppercase tracking-wider ml-1">Tên hiển thị</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Nhập tên..."
                                            {...field}
                                            className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-red-500"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs text-gray-500 font-bold uppercase tracking-wider ml-1">Thứ tự ưu tiên</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                className="rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-red-500"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="is_default"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/30">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Đặt mặc định
                                            </FormLabel>
                                            <p className="text-[10px] text-gray-400">
                                                Giá trị được chọn tự động.
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl px-6 h-11 text-sm font-semibold text-gray-500 hover:bg-gray-100"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 h-11 shadow-lg shadow-red-500/20 text-sm font-bold gap-2"
                            >
                                {mutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isEditing ? 'Lưu thay đổi' : 'Xác nhận'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
