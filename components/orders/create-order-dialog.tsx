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
import { Plus, Trash2, ShoppingBag, User, DollarSign, Package, FileText, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'

const orderItemSchema = z.object({
    type: z.enum(['item', 'inventory']),
    reference_id: z.string().min(1, 'Vui lòng chọn sản phẩm/tấm'),
    quantity: z.number().min(0.01, 'Số lượng > 0'),
    unit_price: z.number().min(0, 'Giá không được âm'),
    discount: z.number(),
    tax: z.number(),
})

const orderSchema = z.object({
    customer_id: z.string().min(1, 'Vui lòng chọn khách hàng'),
    quotation_id: z.string().optional(),
    items: z.array(orderItemSchema).min(1, 'Vui lòng thêm ít nhất 1 dòng'),
    notes: z.string().optional().or(z.literal('')),
})

type OrderFormValues = z.infer<typeof orderSchema>

interface CreateOrderDialogProps {
    onSuccess?: () => void
}

export function CreateOrderDialog({ onSuccess }: CreateOrderDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const supabase = createClient()

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const { data, error } = await supabase.from('customers').select('id, name, company_name')
            if (error) throw error
            return data
        },
    })

    const { data: quotes } = useQuery({
        queryKey: ['quotations', 'Sent'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('quotations')
                .select('id, customer_id, total_amount')
                .eq('status', 'Sent')
            if (error) throw error
            return data
        },
    })

    const { data: masterItems } = useQuery({
        queryKey: ['items'],
        queryFn: async () => {
            const { data, error } = await supabase.from('items').select('id, name, sku, selling_price')
            if (error) throw error
            return data
        },
    })

    const { data: inventoryPieces } = useQuery({
        queryKey: ['inventory', 'Còn hàng'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory')
                .select('id, item_id, amount, items(name, selling_price)')
                .eq('status', 'Còn hàng')
            if (error) throw error
            return data
        },
    })

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            customer_id: '',
            items: [{ type: 'item', reference_id: '', quantity: 1, unit_price: 0, discount: 0, tax: 0 }],
            notes: '',
        },
    })

    const { fields, append, remove, replace } = useFieldArray({
        name: 'items',
        control: form.control,
    })

    const handleQuotationSelect = async (quoteId: string) => {
        const quote = quotes?.find(q => q.id === quoteId)
        if (!quote) return

        form.setValue('customer_id', quote.customer_id)

        // Fetch quote items
        const { data: quoteItems, error } = await supabase
            .from('quotation_items')
            .select('*')
            .eq('quotation_id', quoteId)

        if (error) {
            toast.error('Lỗi khi tải chi tiết báo giá')
            return
        }

        const mappedItems = quoteItems.map(item => ({
            type: item.item_type as 'item' | 'inventory',
            reference_id: item.reference_id,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            discount: Number(item.discount),
            tax: Number(item.tax),
        }))

        replace(mappedItems)
    }

    const handleTypeChange = (index: number, type: 'item' | 'inventory') => {
        form.setValue(`items.${index}.type`, type)
        form.setValue(`items.${index}.reference_id`, '')
        form.setValue(`items.${index}.unit_price`, 0)
        form.setValue(`items.${index}.quantity`, 1)
    }

    const handleReferenceChange = (index: number, refId: string) => {
        const type = form.getValues(`items.${index}.type`)
        if (type === 'item') {
            const item = masterItems?.find(i => i.id === refId)
            if (item) {
                form.setValue(`items.${index}.unit_price`, item.selling_price || 0)
            }
        } else {
            const piece = inventoryPieces?.find(p => p.id === refId)
            if (piece) {
                const itemData = piece.items as any
                form.setValue(`items.${index}.unit_price`, itemData?.selling_price || 0)
                form.setValue(`items.${index}.quantity`, Number(piece.amount) || 0)
            }
        }
    }

    async function onSubmit(values: OrderFormValues) {
        setLoading(true)
        try {
            // 1. Calculate Total
            const total_amount = values.items.reduce((acc, curr) => {
                const subtotal = curr.quantity * curr.unit_price
                const discounted = subtotal * (1 - curr.discount / 100)
                const taxed = discounted * (1 + curr.tax / 100)
                return acc + taxed
            }, 0)

            // 2. Create Order Header
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_id: values.customer_id,
                    total_amount,
                    status: 'Confirmed',
                    payment_status: 'Pending',
                    notes: values.notes,
                }])
                .select()
                .single()

            if (orderError) throw orderError

            // 3. Create Order Items
            const itemsToInsert = values.items.map(item => ({
                order_id: orderData.id,
                item_type: item.type,
                reference_id: item.reference_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount: item.discount,
                tax: item.tax,
            }))

            const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)
            if (itemsError) throw itemsError

            // 4. Update Quotation Status if linked
            if (values.quotation_id) {
                await supabase.from('quotations').update({ status: 'Confirmed' }).eq('id', values.quotation_id)
            }

            // 5. Update Inventory Status if piece-level
            const pieceIds = values.items.filter(i => i.type === 'inventory').map(i => i.reference_id)
            if (pieceIds.length > 0) {
                await supabase.from('inventory').update({ status: 'Giữ chỗ' }).in('id', pieceIds)
            }

            toast.success('Tạo đơn hàng thành công')
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi tạo đơn hàng')
        } finally {
            setLoading(false)
        }
    }

    const watchedItems = form.watch('items')
    const grandTotal = watchedItems.reduce((acc, curr) => {
        const subtotal = (curr.quantity || 0) * (curr.unit_price || 0)
        const discounted = subtotal * (1 - (curr.discount || 0) / 100)
        const taxed = discounted * (1 + (curr.tax || 0) / 100)
        return acc + taxed
    }, 0)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    New Order
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                            <ShoppingBag className="w-8 h-8 text-emerald-200" />
                            Xác nhận Đơn hàng mới
                        </DialogTitle>
                        <DialogDescription className="text-emerald-100 text-base">
                            Chuyển đổi báo giá hoặc tạo đơn hàng trực tiếp.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="quotation_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-emerald-600" /> Bản báo giá (Nếu có)
                                        </FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                                handleQuotationSelect(val)
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-2xl bg-gray-50 border-gray-100 h-12">
                                                    <SelectValue placeholder="Chọn báo giá gốc..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl border-gray-100">
                                                {quotes?.map((q) => (
                                                    <SelectItem key={q.id} value={q.id}>
                                                        Quote #{q.id} - ${q.total_amount?.toLocaleString()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="customer_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <User className="w-4 h-4 text-emerald-600" /> Khách hàng
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-2xl bg-gray-50 border-gray-100 h-12">
                                                    <SelectValue placeholder="Chọn khách hàng..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-2xl border-gray-100">
                                                {customers?.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name} {c.company_name ? `(${c.company_name})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col justify-end bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Tổng giá trị đơn hàng</span>
                                <h2 className="text-3xl font-black text-emerald-900">${grandTotal.toLocaleString()}</h2>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                    <Package className="w-5 h-5 text-teal-600" />
                                    Chi tiết mặt hàng
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ type: 'item', reference_id: '', quantity: 1, unit_price: 0, discount: 0, tax: 0 })}
                                    className="rounded-full px-4 h-10 font-bold text-teal-600 border-teal-200 hover:bg-teal-50"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Thêm mặt hàng
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <Card key={field.id} className="p-6 border-gray-100 shadow-sm rounded-2xl bg-white group relative">
                                        <div className="grid grid-cols-12 gap-6 items-start">
                                            <div className="col-span-12 md:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.type`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-bold uppercase text-gray-400">Loại</FormLabel>
                                                            <Select
                                                                onValueChange={(val: any) => {
                                                                    field.onChange(val)
                                                                    handleTypeChange(index, val)
                                                                }}
                                                                defaultValue={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="rounded-xl bg-gray-50 border-gray-100">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="rounded-xl">
                                                                    <SelectItem value="item">Mã hàng</SelectItem>
                                                                    <SelectItem value="inventory">Mã tấm (ID)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="col-span-12 md:col-span-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.reference_id`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-bold uppercase text-gray-400">Sản phẩm / Tấm</FormLabel>
                                                            <Select
                                                                onValueChange={(val) => {
                                                                    field.onChange(val)
                                                                    handleReferenceChange(index, val)
                                                                }}
                                                                value={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50 overflow-hidden">
                                                                        <SelectValue placeholder="Tìm chọn..." />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="rounded-xl max-h-[300px]">
                                                                    {form.getValues(`items.${index}.type`) === 'item' ? (
                                                                        masterItems?.map(i => (
                                                                            <SelectItem key={i.id} value={i.id}>{i.name} ({i.sku || i.id})</SelectItem>
                                                                        ))
                                                                    ) : (
                                                                        inventoryPieces?.map(p => {
                                                                            const itemData = p.items as any
                                                                            return (
                                                                                <SelectItem key={p.id} value={p.id}>{p.id} - {p.amount}sqft ({itemData?.name})</SelectItem>
                                                                            )
                                                                        })
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="col-span-6 md:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.quantity`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-bold uppercase text-gray-400">SL/Diện tích</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" step="0.01" {...field} className="rounded-xl border-gray-100 bg-gray-50" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="col-span-6 md:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.unit_price`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-bold uppercase text-gray-400">Đơn giá ($)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" step="0.01" {...field} className="rounded-xl border-gray-100 bg-gray-50" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="col-span-12 md:col-span-2 pt-6 flex justify-end">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold uppercase text-gray-400">Thành tiền</p>
                                                    <p className="text-lg font-black text-gray-900">
                                                        ${((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0)).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="absolute -top-3 -right-3 h-8 w-8 bg-white border border-gray-100 text-red-500 shadow-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                                                disabled={fields.length === 1}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-bold text-gray-900">Ghi chú giao hàng / Thanh toán</FormLabel>
                                    <FormControl>
                                        <textarea
                                            {...field}
                                            className="w-full min-h-[100px] rounded-2xl border-gray-100 bg-gray-50/50 p-4 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-sm"
                                            placeholder="Yêu cầu đặc biệt về đóng gói, tiến độ thanh toán..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-8 border-t border-gray-100 gap-4">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-2xl px-8 h-12 text-gray-500 font-bold">
                                Thoát
                            </Button>
                            <Button type="submit" disabled={loading} className="rounded-2xl px-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xl shadow-emerald-100 transition-all active:scale-95">
                                {loading ? 'Đang tạo đơn...' : 'Chốt Đơn hàng'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
