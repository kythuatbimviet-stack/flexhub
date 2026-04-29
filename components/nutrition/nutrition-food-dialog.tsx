'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { useQueryClient } from '@tanstack/react-query'
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
    Utensils,
    Save,
    X,
    Camera,
    Trash2,
    Hash,
    Link,
    Loader2
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createNutritionFood, updateNutritionFood, downloadImageAsBase64 } from '@/app/actions/nutrition-foods'
import { cn } from '@/lib/utils'

const foodSchema = z.object({
    id: z.string().optional(),
    food_type: z.string().min(1, 'Vui lòng nhập tên thực phẩm'),
    food_group: z.string().min(1, 'Vui lòng nhập nhóm thực phẩm'),
    protein: z.coerce.number().min(0).default(0),
    carbs: z.coerce.number().min(0).default(0),
    fat: z.coerce.number().min(0).default(0),
    fiber: z.coerce.number().min(0).default(0),
    unit: z.string().min(1, 'Vui lòng nhập đơn vị'),
    conversion_factor: z.coerce.number().min(0.001).default(1),
    image_base64: z.string().optional().nullable(),
})

type FoodValues = z.infer<typeof foodSchema>

export function NutritionFoodDialog({ 
    open, 
    onOpenChange, 
    initialData, 
    onSuccess 
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    initialData?: any,
    onSuccess?: () => void
}) {
    const queryClient = useQueryClient()
    const [loading, setLoading] = React.useState(false)
    const [imageUrl, setImageUrl] = React.useState('')

    const form = useForm<FoodValues>({
        resolver: zodResolver(foodSchema),
        defaultValues: initialData || {
            food_type: '',
            food_group: '',
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            unit: '100g',
            conversion_factor: 1,
            image_base64: null,
        }
    })

    // Update form when initialData changes
    React.useEffect(() => {
        if (open) {
            form.reset(initialData || {
                food_type: '',
                food_group: '',
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
                unit: '100g',
                conversion_factor: 1,
                image_base64: null,
            })
        }
    }, [open, initialData, form])

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64 = reader.result as string
            form.setValue('image_base64', base64)
            toast.success('Đã tải ảnh lên')
        }
        reader.readAsDataURL(file)
    }

    const handleImageUrlSubmit = async () => {
        if (!imageUrl) return toast.error('Vui lòng nhập Link ảnh')
        if (!imageUrl.startsWith('http')) return toast.error('Link ảnh không hợp lệ')

        try {
            // Instead of downloading, we just store the URL string directly.
            // This saves database space and points directly to the external source.
            form.setValue('image_base64', imageUrl)
            setImageUrl('')
            toast.success('Đã nhận Link ảnh thành công. Ảnh sẽ được hiển thị từ nguồn ngoài.')
        } catch (error: any) {
            console.error('Image URL Error:', error)
            toast.error('Lỗi: Không thể nhận diện link ảnh này.')
        }
    }

    async function onSubmit(values: FoodValues) {
        setLoading(true)
        try {
            let res
            if (initialData?.id) {
                res = await updateNutritionFood(initialData.id, values)
            } else {
                res = await createNutritionFood(values)
            }

            if (res.success) {
                toast.success(initialData ? 'Cập nhật thành công' : 'Thêm mới thành công')
                onSuccess?.()
                onOpenChange(false)
                queryClient.invalidateQueries({ queryKey: ['nutrition-foods'] })
            } else {
                toast.error(res.error)
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent 
                side="right" 
                resizable={true}
                defaultWidth={500}
                minWidth={440}
                maxWidth={800}
                className="p-0 flex flex-col h-full gap-0 font-inter overflow-hidden border-none shadow-2xl"
            >
                <div className="px-6 py-5 border-b shrink-0 flex items-center justify-between bg-white dark:bg-slate-900 z-10 transition-colors">
                    <div className="space-y-0.5">
                        <SheetTitle className="text-xl font-semibold text-black dark:text-white flex items-center gap-2 tracking-tight">
                            <Utensils className="w-5 h-5 text-[#FD5771]" />
                            {initialData ? 'Cập nhật thực phẩm' : 'Thêm thực phẩm mới'}
                        </SheetTitle>
                        <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Chi tiết thông tin dữ liệu dinh dưỡng.
                        </SheetDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            type="button" 
                            onClick={() => onOpenChange(false)} 
                            className="rounded-xl font-semibold h-9 px-4 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Hủy bỏ
                        </Button>
                        <Button 
                            size="sm"
                            type="button"
                            disabled={loading}
                            onClick={() => form.handleSubmit(onSubmit)()}
                            className="bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl px-6 font-semibold h-9 transition-all active:scale-95 shadow-lg"
                        >
                            {loading ? '...' : (
                                <>
                                    <Save className="w-3.5 h-3.5 mr-2" />
                                    Lưu dữ liệu
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div suppressHydrationWarning className="flex-1 flex flex-col min-h-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-6 space-y-6">
                                {/* Image Upload Component */}
                                <div className="space-y-3">
                                    <FormLabel className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 ml-1">Hình ảnh thực phẩm</FormLabel>
                                    <div className="relative group">
                                        {form.watch('image_base64') ? (
                                            <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                                                <img 
                                                    src={form.watch('image_base64')!} 
                                                    alt="Food Preview" 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <Button 
                                                        type="button"
                                                        variant="secondary" 
                                                        size="icon" 
                                                        className="h-10 w-10 rounded-full shadow-lg"
                                                        onClick={() => {
                                                            const input = document.getElementById('food-image-upload')
                                                            input?.click()
                                                        }}
                                                    >
                                                        <Camera className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        type="button"
                                                        variant="destructive" 
                                                        size="icon" 
                                                        className="h-10 w-10 rounded-full shadow-lg"
                                                        onClick={() => form.setValue('image_base64', null)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label 
                                                htmlFor="food-image-upload"
                                                className="flex flex-col items-center justify-center aspect-video rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 hover:border-[#FD5771]/20 cursor-pointer transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                    <Camera className="w-6 h-6 text-slate-300 group-hover:text-black dark:group-hover:text-white" />
                                                </div>
                                                <span className="mt-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-black dark:group-hover:text-white">Tải ảnh lên</span>
                                            </label>
                                        )}
                                        <input 
                                            id="food-image-upload"
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleImageUpload}
                                        />
                                    </div>

                                    {/* Image URL Input Area */}
                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <Link className="w-3.5 h-3.5 text-slate-400" />
                                                Hoặc dán Link ảnh trực tiếp
                                            </label>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input 
                                                    placeholder="https://example.com/image.jpg" 
                                                    value={imageUrl}
                                                    onChange={e => setImageUrl(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleImageUrlSubmit();
                                                        }
                                                    }}
                                                    className="h-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-black dark:text-white font-medium text-sm focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 pr-10"
                                                />
                                                {imageUrl && (
                                                    <button 
                                                        onClick={() => setImageUrl('')}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black dark:hover:text-white transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <Button 
                                                type="button"
                                                size="sm"
                                                disabled={!imageUrl}
                                                onClick={handleImageUrlSubmit}
                                                className="h-11 px-5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs border-none shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shrink-0"
                                            >
                                                Nhận Link
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="food_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 ml-1">Tên thực phẩm</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="VD: Ức gà, Trứng..." className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-black dark:text-white transition-all font-bold" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="food_group"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 ml-1">Nhóm thực phẩm</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="VD: Thịt, Rau..." className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-black dark:text-white transition-all font-bold" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="p-5 bg-slate-50/80 dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-5 transition-colors">
                                    <div className="flex items-center gap-2 border-l-2 border-slate-900 dark:border-white pl-3">
                                        <h3 className="text-[13px] font-semibold text-black dark:text-white">Thành phần dinh dưỡng (/100g)</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="protein"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 ml-1">Protein (g)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" step="0.1" className="h-10 rounded-xl bg-white dark:bg-slate-900 border-blue-50 dark:border-blue-900/30 focus:ring-blue-500 text-black dark:text-white font-mono font-bold" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="fat"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 ml-1">Fat (g)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" step="0.1" className="h-10 rounded-xl bg-white dark:bg-slate-900 border-orange-50 dark:border-orange-900/30 focus:ring-orange-500 text-black dark:text-white font-mono font-bold" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="carbs"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 ml-1">Carb (g)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" step="0.1" className="h-10 rounded-xl bg-white dark:bg-slate-900 border-emerald-50 dark:border-emerald-900/30 focus:ring-emerald-500 text-black dark:text-white font-mono font-bold" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="fiber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 ml-1">Fiber (g)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" step="0.1" className="h-10 rounded-xl bg-white dark:bg-slate-900 border-indigo-50 dark:border-indigo-900/30 focus:ring-indigo-500 text-black dark:text-white font-mono font-bold" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="unit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 ml-1">Đơn vị chuẩn</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="VD: 100g, Cái..." className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-black dark:text-white transition-all font-bold" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="conversion_factor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 ml-1 flex items-center gap-1">
                                                    Hệ số quy đổi
                                                    <Hash className="w-3 h-3 text-slate-400" />
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="number" step="0.01" className="h-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-black dark:text-white transition-all font-mono font-bold" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </ScrollArea>
                    </form>
                </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
