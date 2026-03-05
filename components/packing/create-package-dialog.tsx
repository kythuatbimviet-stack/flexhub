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
import { Card } from '@/components/ui/card'
import { Plus, Trash2, Package, ShoppingBag, Truck, Ruler, CheckCircle2, QrCode } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'

const packagePieceSchema = z.object({
    inventory_id: z.string().min(1, 'Vui lòng chọn tấm da'),
    order_item_id: z.string().optional(), // Links back to order-item if applicable
})

const packageSchema = z.object({
    order_id: z.string().min(1, 'Vui lòng chọn đơn hàng'),
    pieces: z.array(packagePieceSchema).min(1, 'Vui lòng thêm ít nhất 1 tấm'),
    total_weight: z.number().min(0).optional(),
    notes: z.string().optional().or(z.literal('')),
})

type PackageFormValues = z.infer<typeof packageSchema>

interface CreatePackageDialogProps {
    onSuccess?: () => void
}

export function CreatePackageDialog({ onSuccess }: CreatePackageDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const supabase = createClient()

    const { data: confirmedOrders } = useQuery({
        queryKey: ['orders', 'Confirmed'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('id, customer_id, customers(name)')
                .eq('status', 'Confirmed')
            if (error) throw error
            return data
        },
    })

    const form = useForm<PackageFormValues>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            order_id: '',
            pieces: [],
            total_weight: 0,
            notes: '',
        },
    })

    const { fields, append, remove, replace } = useFieldArray({
        name: 'pieces',
        control: form.control,
    })

    const selectedOrderId = form.watch('order_id')

    const { data: orderDetails } = useQuery({
        queryKey: ['order-items', selectedOrderId],
        enabled: !!selectedOrderId,
        queryFn: async () => {
            const { data: items, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', selectedOrderId)

            if (itemsError) throw itemsError

            // Pre-fill pieces if they are already defined in the order (piece-level orders)
            const inventoryPieces = items
                .filter(item => item.item_type === 'inventory')
                .map(item => ({
                    inventory_id: item.reference_id,
                    order_item_id: item.id
                }))

            if (inventoryPieces.length > 0) {
                replace(inventoryPieces)
            }

            return items
        },
    })

    const { data: availablePieces } = useQuery({
        queryKey: ['inventory', 'Còn hàng/Giữ chỗ'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory')
                .select('id, amount, items(name)')
                .in('status', ['Còn hàng', 'Giữ chỗ'])
            if (error) throw error
            return data
        },
    })

    async function onSubmit(values: PackageFormValues) {
        setLoading(true)
        try {
            // 1. Create Package Header
            const { data: pkgData, error: pkgError } = await supabase
                .from('packages')
                .insert([{
                    order_id: values.order_id,
                    total_weight: values.total_weight || 0,
                    status: 'Packed',
                    notes: values.notes,
                }])
                .select()
                .single()

            if (pkgError) throw pkgError

            // 2. Link Pieces to Package
            const packageItems = values.pieces.map(p => ({
                package_id: pkgData.id,
                inventory_id: p.inventory_id,
            }))

            const { error: itemsError } = await supabase.from('package_items').insert(packageItems)
            if (itemsError) throw itemsError

            // 3. Update Order Status
            await supabase.from('orders').update({ status: 'Packaging' }).eq('id', values.order_id)

            // 4. Update Inventory Status
            const inventoryIds = values.pieces.map(p => p.inventory_id)
            await supabase.from('inventory').update({ status: 'Giữ chỗ' }).in('id', inventoryIds)

            toast.success('Đóng kiện thành công')
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi tạo kiện hàng')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Package
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-800 p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                            <Package className="w-8 h-8 text-indigo-200" />
                            Đóng Kiện hàng (Packing)
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 text-base">
                            Quản lý các tấm da thực tế trong kiện hàng này.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="order_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4 text-indigo-600" /> Đơn hàng xác nhận
                                        </FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-2xl bg-gray-50 border-gray-100 h-12">
                                                    <SelectValue placeholder="Chọn đơn hàng đang chờ..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl border-gray-100">
                                                {confirmedOrders?.map((o) => {
                                                    const customerData = o.customers as any
                                                    return (
                                                        <SelectItem key={o.id} value={o.id}>
                                                            Order #{o.id.split('-')[0]} - {customerData?.name}
                                                        </SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="total_weight"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <Truck className="w-4 h-4 text-indigo-600" /> Cân nặng (kg)
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} className="rounded-2xl bg-gray-50 border-gray-100 h-12" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                    <QrCode className="w-5 h-5 text-blue-600" />
                                    Danh sách tấm trong kiện
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ inventory_id: '' })}
                                    className="rounded-full px-4 h-10 font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Thêm tấm
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fields.map((field, index) => (
                                    <Card key={field.id} className="p-4 border-gray-100 shadow-sm rounded-2xl bg-white flex items-center gap-4 relative group">
                                        <FormField
                                            control={form.control}
                                            name={`pieces.${index}.inventory_id`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl bg-gray-50 border-gray-100">
                                                                <SelectValue placeholder="Chọn ID tấm..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl">
                                                            {availablePieces?.map((p) => {
                                                                const itemData = p.items as any
                                                                return (
                                                                    <SelectItem key={p.id} value={p.id}>
                                                                        ID: {p.id} - {p.amount}sqft ({itemData?.name})
                                                                    </SelectItem>
                                                                )
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-bold text-gray-900">Ghi chú kiện hàng</FormLabel>
                                    <FormControl>
                                        <textarea
                                            {...field}
                                            className="w-full min-h-[100px] rounded-2xl border-gray-100 bg-gray-50/50 p-4 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm"
                                            placeholder="Mô tả kiện hàng, số lượng bao, pallet..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-8 border-t border-gray-100 gap-4">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-2xl px-8 h-12 text-gray-500 font-bold">
                                Hủy
                            </Button>
                            <Button type="submit" disabled={loading} className="rounded-2xl px-12 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-100 transition-all active:scale-95">
                                {loading ? 'Đang lưu...' : 'Hoàn tất Đóng kiện'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
