'use client'

import * as React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Layers, Warehouse, Ruler, Barcode, ClipboardList, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Checkbox } from '@/components/ui/checkbox'

const pieceSchema = z.object({
    id: z.string().min(1, 'Mã tấm bắt buộc'),
    amount: z.number().min(0.01, 'Diện tích > 0'),
    is_defect: z.boolean(),
})

const batchSchema = z.object({
    item_id: z.string().min(1, 'Vui lòng chọn sản phẩm'),
    warehouse_id: z.string().min(1, 'Vui lòng chọn kho'),
    import_id: z.string().optional(),
    pieces: z.array(pieceSchema).min(1, 'Vui lòng nhập ít nhất 1 tấm'),
})

type BatchFormValues = z.infer<typeof batchSchema>

interface BatchInventoryDialogProps {
    onSuccess?: () => void
}

export function BatchInventoryDialog({ onSuccess }: BatchInventoryDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const supabase = createClient()

    const { data: items } = useQuery({
        queryKey: ['items'],
        queryFn: async () => {
            const { data, error } = await supabase.from('items').select('id, name, sku')
            if (error) throw error
            return data
        },
    })

    const { data: warehouses } = useQuery({
        queryKey: ['warehouses'],
        queryFn: async () => {
            const { data, error } = await supabase.from('warehouses').select('id, name')
            if (error) throw error
            return data
        },
    })

    const form = useForm<BatchFormValues>({
        resolver: zodResolver(batchSchema),
        defaultValues: {
            item_id: '',
            warehouse_id: '',
            import_id: '',
            pieces: [{ id: '', amount: 0, is_defect: false }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        name: 'pieces',
        control: form.control,
    })

    async function onSubmit(values: BatchFormValues) {
        setLoading(true)
        try {
            const dataToInsert = values.pieces.map(piece => ({
                id: piece.id,
                item_id: values.item_id,
                warehouse_id: values.warehouse_id,
                import_id: values.import_id,
                amount: piece.amount,
                is_defect: piece.is_defect,
                status: 'Còn hàng',
                unit: 'sqft', // Default for now
            }))

            const { error } = await supabase.from('inventory').insert(dataToInsert)
            if (error) throw error

            toast.success(`Đã nhập kho ${dataToInsert.length} tấm thành công`)
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi nhập kho theo lô')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Nhập kho theo lô
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-blue-600" />
                        Nhập kho theo lô (Batch Entry)
                    </DialogTitle>
                    <DialogDescription>
                        Nhập nhanh nhiều tấm da cho cùng một mã sản phẩm và kho hàng.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <FormField
                                control={form.control}
                                name="item_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-gray-500">Sản phẩm (SKU)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl bg-white border-gray-200">
                                                    <SelectValue placeholder="Chọn sản phẩm" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-gray-100">
                                                {items?.map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name} ({item.sku || item.id})
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
                                name="warehouse_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-gray-500">Kho hàng</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl bg-white border-gray-200">
                                                    <SelectValue placeholder="Chọn kho" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-gray-100">
                                                {warehouses?.map((w) => (
                                                    <SelectItem key={w.id} value={w.id}>
                                                        {w.name}
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
                                name="import_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-gray-500">Mã lô nhập (Lot ID)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Vd: LOT-2024-001" {...field} className="rounded-xl bg-white border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-gray-900">
                                    <Barcode className="w-4 h-4 text-blue-600" />
                                    Danh sách tấm (Pieces List)
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ id: '', amount: 0, is_defect: false })}
                                    className="rounded-full h-8 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Thêm tấm
                                </Button>
                            </div>

                            <div className="grid grid-cols-12 gap-4 px-2 text-[10px] font-bold uppercase text-gray-400">
                                <div className="col-span-5">Mã tấm (Barcode)</div>
                                <div className="col-span-4">Diện tích (Amount)</div>
                                <div className="col-span-2 text-center">Lỗ gù</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-3 items-start group">
                                        <div className="col-span-5">
                                            <FormField
                                                control={form.control}
                                                name={`pieces.${index}.id`}
                                                render={({ field }) => (
                                                    <FormItem className="space-y-0">
                                                        <FormControl>
                                                            <Input placeholder="Quét mã..." {...field} className="rounded-xl border-gray-200 h-9" />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-4 flex items-center gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`pieces.${index}.amount`}
                                                render={({ field }) => (
                                                    <FormItem className="space-y-0 flex-1">
                                                        <FormControl>
                                                            <Input type="number" step="0.01" placeholder="0.00" {...field} className="rounded-xl border-gray-200 h-9" />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                            <span className="text-xs text-gray-400 font-bold">sqft</span>
                                        </div>
                                        <div className="col-span-2 flex justify-center pt-2">
                                            <FormField
                                                control={form.control}
                                                name={`pieces.${index}.is_defect`}
                                                render={({ field }) => (
                                                    <FormItem className="space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                className="rounded-md h-5 w-5 border-gray-300 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity text-right">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="h-7 w-7 text-gray-400 hover:text-red-500 rounded-full"
                                                disabled={fields.length === 1}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-6 border-t gap-2">
                            <div className="flex-1 flex flex-col items-start gap-1">
                                <p className="text-xs font-bold text-gray-500">Tóm tắt lô hàng:</p>
                                <div className="flex gap-4">
                                    <div className="text-[10px] text-gray-400">Số tấm: <span className="text-gray-900 font-bold">{fields.length}</span></div>
                                    <div className="text-[10px] text-gray-400">Tổng diện tích: <span className="text-gray-900 font-bold">
                                        {form.watch('pieces').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toFixed(2)}
                                    </span> sqft</div>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl px-6">
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={loading} className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-95">
                                    {loading ? 'Đang lưu...' : 'Nhập Kho'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
