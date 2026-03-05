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
import { Plus, Layers, Ruler, Globe, Info } from 'lucide-react'

const categorySchema = z.object({
    id: z.string().min(2, 'Mã danh mục tối thiểu 2 ký tự'),
    name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
    unit: z.string(),
    grain: z.string().optional(),
    thickness: z.string().optional(),
    avg_size: z.string().optional(),
    finishing: z.string().optional(),
    material_origin: z.string().optional(),
    country_origin: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface AddCategoryDialogProps {
    onSuccess?: () => void
}

export function AddCategoryDialog({ onSuccess }: AddCategoryDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const supabase = createClient()

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            id: '',
            name: '',
            unit: 'sqft',
            grain: '',
            thickness: '',
            avg_size: '',
            finishing: '',
            material_origin: '',
            country_origin: '',
        },
    })

    async function onSubmit(values: CategoryFormValues) {
        setLoading(true)
        try {
            const { error } = await supabase.from('categories').insert([values])
            if (error) throw error

            toast.success('Thêm danh mục thành công')
            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi thêm danh mục')
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
                        <Layers className="w-6 h-6 text-blue-600" />
                        Thêm Danh mục / Bộ sưu tập
                    </DialogTitle>
                    <DialogDescription>
                        Định nghĩa bộ sưu tập da mới và các thông số kỹ thuật đi kèm.
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
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Mã Danh mục</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Vd: ART" {...field} className="rounded-xl border-gray-200" />
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
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Tên Danh mục</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Vd: Artic Leather" {...field} className="rounded-xl border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2 text-gray-900">
                                <Ruler className="w-4 h-4 text-blue-600" />
                                Thông số Kỹ thuật
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="grain"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Loại Vân (Grain)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Full Grain" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="thickness"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Độ dày (mm)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="1.2 - 1.4 mm" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="avg_size"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Average Size</FormLabel>
                                            <FormControl>
                                                <Input placeholder="25 - 30 sqft" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="finishing"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Finishing</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Aniline / Semi-Aniline" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2 text-gray-900">
                                <Globe className="w-4 h-4 text-blue-600" />
                                Nguồn gốc & Xuất xứ
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="material_origin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Nguồn nguyên liệu</FormLabel>
                                            <FormControl>
                                                <Input placeholder="European Hides" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="country_origin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Quốc gia sản xuất</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Italy / Thailand" {...field} className="rounded-xl border-gray-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl px-6">
                                Hủy
                            </Button>
                            <Button type="submit" disabled={loading} className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                                {loading ? 'Đang lưu...' : 'Lưu Danh mục'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
