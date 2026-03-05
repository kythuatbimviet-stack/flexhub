'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase'
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
import { Plus, Warehouse, MapPin, Info } from 'lucide-react'

const warehouseSchema = z.object({
    id: z.string().min(2, 'Mã kho tối thiểu 2 ký tự'),
    name: z.string().min(2, 'Tên kho tối thiểu 2 ký tự'),
    description: z.string().optional(),
    address: z.string().optional(),
})

type WarehouseFormValues = z.infer<typeof warehouseSchema>

interface AddWarehouseDialogProps {
    onSuccess?: () => void
}

export function AddWarehouseDialog({ onSuccess }: AddWarehouseDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const supabase = createClient()

    const form = useForm<WarehouseFormValues>({
        resolver: zodResolver(warehouseSchema),
        defaultValues: {
            id: '',
            name: '',
            description: '',
            address: '',
        },
    })

    async function onSubmit(values: WarehouseFormValues) {
        setLoading(true)
        try {
            const { error } = await supabase.from('warehouses').insert([values])
            if (error) throw error

            toast.success('Thêm kho thành công')
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi thêm kho')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Warehouse className="w-6 h-6 text-blue-600" />
                        Thêm Kho hàng mới
                    </DialogTitle>
                    <DialogDescription>
                        Tạo một địa điểm lưu trữ mới trong hệ thống.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Mã Kho</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Vd: KHO-HCM" {...field} className="rounded-xl border-gray-200" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Tên Kho</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Vd: Kho Quận 1" {...field} className="rounded-xl border-gray-200" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Địa chỉ
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Địa chỉ cụ thể..." {...field} className="rounded-xl border-gray-200" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> Mô tả
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ghi chú về kho này..." {...field} className="rounded-xl border-gray-200" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4 border-t gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl px-6">
                                Hủy
                            </Button>
                            <Button type="submit" disabled={loading} className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                                {loading ? 'Đang lưu...' : 'Lưu Kho'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
