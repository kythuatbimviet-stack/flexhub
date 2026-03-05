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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Box, Tag, DollarSign, Layers, TextQuote } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

const itemSchema = z.object({
    id: z.string().min(2, 'Mã sản phẩm tối thiểu 2 ký tự'),
    sku: z.string().optional(),
    name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
    description: z.string().optional(),
    category_id: z.string().min(1, 'Vui lòng chọn danh mục'),
    cost_price: z.number().min(0, 'Giá vốn không được âm'),
    selling_price: z.number().min(0, 'Giá bán không được âm'),
    unit: z.string(),
})

type ItemFormValues = z.infer<typeof itemSchema>

interface AddItemDialogProps {
    onSuccess?: () => void
}

export function AddItemDialog({ onSuccess }: AddItemDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const supabase = createClient()

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase.from('categories').select('id, name')
            if (error) throw error
            return data
        },
    })

    const form = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            id: '',
            sku: '',
            name: '',
            description: '',
            category_id: '',
            cost_price: 0,
            selling_price: 0,
            unit: 'sqft',
        },
    })

    async function onSubmit(values: ItemFormValues) {
        setLoading(true)
        try {
            const { error } = await supabase.from('items').insert([values])
            if (error) throw error

            toast.success('Thêm sản phẩm thành công')
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi thêm sản phẩm')
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Box className="w-6 h-6 text-blue-600" />
                        Thêm Sản phẩm mới (Master)
                    </DialogTitle>
                    <DialogDescription>
                        Định nghĩa mã sản phẩm cơ bản trong hệ thống.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Mã Sản phẩm</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Vd: AR154M" {...field} className="rounded-xl border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">SKU</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Vd: SKU-AR-154" {...field} className="rounded-xl border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Tên sản phẩm</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Vd: Artic Leather Brown" {...field} className="rounded-xl border-gray-200" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                            <Layers className="w-3 h-3" /> Danh mục
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-gray-200">
                                                    <SelectValue placeholder="Chọn danh mục" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-gray-100">
                                                {categories?.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name} ({cat.id})
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
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Đơn vị tính</FormLabel>
                                        <FormControl>
                                            <Input placeholder="sqft" {...field} className="rounded-xl border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2 text-gray-900">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                                Thông tin Giá & Mô tả
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="cost_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Giá vốn ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="selling_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 font-bold text-blue-600">Giá bán ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} className="rounded-xl border-gray-200 border-blue-100 bg-blue-50/30" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Mô tả sản phẩm</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Chi tiết về sản phẩm..." {...field} className="rounded-xl border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl px-6">
                                Hủy
                            </Button>
                            <Button type="submit" disabled={loading} className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-95">
                                {loading ? 'Đang lưu...' : 'Lưu Sản phẩm'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
