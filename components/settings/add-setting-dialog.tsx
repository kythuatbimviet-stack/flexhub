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
import { Plus, Tag, Layers, Type, Hash, Star } from 'lucide-react'
import { createSetting, type Setting } from '@/app/actions/settings'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const settingSchema = z.object({
    data_name: z.string().min(1, 'Vui lòng nhập module'),
    categories: z.string().min(1, 'Vui lòng nhập danh mục'),
    nam: z.string().min(1, 'Vui lòng nhập tên hiển thị'),
    value: z.coerce.number().min(0, 'Giá trị phải là số dương'),
    default: z.coerce.number().nullable().optional(),
})

type SettingFormValues = z.infer<typeof settingSchema>

interface AddSettingDialogProps {
    defaultDataName?: string
    defaultCategory?: string
}

export function AddSettingDialog({ defaultDataName = '', defaultCategory = '' }: AddSettingDialogProps) {
    const [open, setOpen] = React.useState(false)
    const queryClient = useQueryClient()

    const form = useForm<SettingFormValues>({
        resolver: zodResolver(settingSchema) as any,
        defaultValues: {
            data_name: defaultDataName,
            categories: defaultCategory,
            nam: '',
            value: 0,
            default: null,
        },
    })

    const mutation = useMutation({
        mutationFn: (values: SettingFormValues) => createSetting(values as any),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('Thêm thông số thành công')
                setOpen(false)
                form.reset()
                queryClient.invalidateQueries({ queryKey: ['settings'] })
            } else {
                toast.error(result.error || 'Lỗi khi thêm thông số')
            }
        }
    })

    function onSubmit(values: SettingFormValues) {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-xs h-9 transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm mới
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden font-inter text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                <div className="p-8 bg-gradient-to-br from-red-50/50 to-white dark:from-red-950/10 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                            Thêm Thông số mới
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            Khai báo thông số mới cho hệ thống.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-5">
                        <FormField
                            control={form.control}
                            name="data_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Module (Data Name)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                            <Input placeholder="Ví dụ: Client" {...field} className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 pl-10 h-10 focus:ring-red-500 transition-all text-sm" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="categories"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Danh mục (Categories)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                            <Input placeholder="Ví dụ: Trạng thái" {...field} className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 pl-10 h-10 focus:ring-red-500 transition-all text-sm" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nam"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tên hiển thị (Nam)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                            <Input placeholder="Ví dụ: Đã chốt" {...field} className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 pl-10 h-10 focus:ring-red-500 transition-all text-sm" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Giá trị (Value)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                                <Input type="number" {...field} className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 pl-10 h-10 focus:ring-red-500 transition-all text-sm" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="default"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mặc định (Default)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                                <Input type="number" {...field} value={field.value || ''} placeholder="1 hoặc Trống" className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 pl-10 h-10 focus:ring-red-500 transition-all text-sm" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4 gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="rounded-xl px-6 text-gray-500 h-11 hover:text-gray-900"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                                className="rounded-xl px-8 bg-red-600 text-white hover:bg-red-700 transition-all font-semibold h-11 shadow-lg shadow-red-500/20"
                            >
                                {mutation.isPending ? 'Đang thêm...' : 'Lưu thông số'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
