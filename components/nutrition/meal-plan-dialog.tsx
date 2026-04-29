'use client'

import * as React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
    Plus, 
    Trash2, 
    UtensilsCrossed, 
    Search, 
    Calculator
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchContractsLite } from '@/app/actions/contracts'
import { fetchNutritionFoods } from '@/app/actions/nutrition-foods'
import { createMealPlan } from '@/app/actions/nutrition-meal-plans'

const mealItemSchema = z.object({
    food_id: z.string().min(1, 'Chọn thực phẩm'),
    quantity: z.coerce.number().min(1, 'Số lượng > 0'),
    protein: z.coerce.number().default(0),
    carb: z.coerce.number().default(0),
    fat: z.coerce.number().default(0),
    kcal: z.coerce.number().default(0),
})

const mealSchema = z.object({
    name: z.string().min(1, 'Tên bữa ăn'),
    meal_order: z.number(),
    kcal: z.coerce.number().default(0),
    items: z.array(mealItemSchema).default([])
})

const planSchema = z.object({
    contract_id: z.string().min(1, 'Chọn hợp đồng'),
    name: z.string().min(1, 'Tên thực đơn'),
    is_active: z.boolean().default(true),
    meals: z.array(mealSchema).min(1, 'Cần có ít nhất 1 bữa ăn')
})

type PlanValues = z.infer<typeof planSchema>

export function MealPlanDialog({ 
    open, 
    onOpenChange, 
    onSuccess 
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    onSuccess?: () => void
}) {
    const queryClient = useQueryClient()
    const [loading, setLoading] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')

    const form = useForm<PlanValues>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            contract_id: '',
            name: 'Thực đơn mới',
            is_active: true,
            meals: [
                { name: 'Bữa sáng', meal_order: 1, kcal: 0, items: [] }
            ]
        }
    })

    const { fields: mealFields, append: appendMeal, remove: removeMeal } = useFieldArray({
        control: form.control,
        name: "meals"
    })

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts-lite'],
        queryFn: async () => {
            const res = await fetchContractsLite()
            return res.success ? res.data : []
        }
    })

    const { data: foods = [] } = useQuery({
        queryKey: ['nutrition-foods'],
        queryFn: async () => {
            const res = await fetchNutritionFoods()
            return res.success ? res.data : []
        }
    })

    const filteredContracts = React.useMemo(() => {
        const q = searchQuery.toLowerCase()
        const filtered = contracts.filter((c: any) => 
            !searchQuery || 
            c.id.toLowerCase().includes(q) || 
            c.member_name?.toLowerCase().includes(q) ||
            c.phone?.includes(q)
        )
        
        // De-duplicate by ID to prevent key collision
        const seen = new Set()
        return filtered.filter((c: any) => {
            if (seen.has(c.id)) return false
            seen.add(c.id)
            return true
        })
    }, [contracts, searchQuery])

    async function onSubmit(values: PlanValues) {
        setLoading(true)
        try {
            const res = await createMealPlan(
                { contract_id: values.contract_id, name: values.name, is_active: values.is_active },
                values.meals
            )

            if (res.success) {
                toast.success('Đã tạo thực đơn thành công')
                onSuccess?.()
                onOpenChange(false)
                queryClient.invalidateQueries({ queryKey: ['nutrition-meal-plans'] })
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
                defaultWidth={750}
                minWidth={320}
                maxWidth={1200}
                className="p-0 flex flex-col font-inter border-none shadow-2xl w-full"
            >
                <div className="p-6 border-b shrink-0 bg-white dark:bg-slate-900 transition-colors">
                    <SheetTitle className="font-semibold text-xl flex items-center gap-2 text-black dark:text-white tracking-tight">
                        <UtensilsCrossed className="w-5 h-5 text-[#FD5771]" />
                        Thiết kế thực đơn
                    </SheetTitle>
                    <SheetDescription className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Chi tiết kế hoạch dinh dưỡng cho học viên.
                    </SheetDescription>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <FormField
                                        control={form.control}
                                        name="contract_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 ml-1">Hợp đồng khách hàng</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger className="rounded-xl h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-black dark:text-white font-medium transition-all shadow-sm"><SelectValue placeholder="Chọn hợp đồng..." /></SelectTrigger></FormControl>
                                                    <SelectContent className="max-h-[300px] rounded-2xl border-slate-200 dark:border-slate-800">
                                                        <div className="p-2 border-b sticky top-0 bg-white dark:bg-slate-950 z-10">
                                                            <Input placeholder="Tìm khách..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9 text-xs pl-3 bg-slate-50 dark:bg-slate-900 border-none" />
                                                        </div>
                                                        {filteredContracts.slice(0, 20).map((c: any) => (
                                                            <SelectItem key={c.id} value={c.id}>{c.member_name} ({c.id})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 ml-1">Tên thực đơn</FormLabel>
                                                <FormControl><Input {...field} className="rounded-xl h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-black dark:text-white font-semibold transition-all shadow-sm" /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
                                                Cấu trúc các bữa ăn
                                            </h3>
                                            <Button type="button" variant="outline" size="sm" onClick={() => appendMeal({ name: `Bữa số ${mealFields.length + 1}`, meal_order: mealFields.length + 1, kcal: 0, items: [] })} className="rounded-xl font-semibold border-slate-200 dark:border-slate-800 text-[11px] h-9 px-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm bữa mới
                                            </Button>
                                        </div>

                                    {mealFields.map((meal, mealIdx) => (
                                        <MealEditor key={meal.id} mealIdx={mealIdx} form={form} foods={foods} onRemove={() => removeMeal(mealIdx)} />
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t bg-white dark:bg-slate-950 flex items-center justify-between gap-4">
                             <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="rounded-xl font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 h-11 px-6 transition-colors">Hủy bỏ</Button>
                            <Button type="submit" disabled={loading} className="bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl px-12 font-semibold h-11 transition-all shadow-lg active:scale-95">
                                {loading ? '...' : 'Lưu thực đơn'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}

function MealEditor({ mealIdx, form, foods, onRemove }: { mealIdx: number, form: any, foods: any[], onRemove: () => void }) {
    const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
        control: form.control,
        name: `meals.${mealIdx}.items`
    })

    const calculateTotals = () => {
        const items = form.getValues(`meals.${mealIdx}.items`) || []
        const total = items.reduce((acc: number, item: any) => acc + (parseFloat(item.kcal) || 0), 0)
        form.setValue(`meals.${mealIdx}.kcal`, Math.round(total))
    }

    return (
        <Card className="rounded-2xl border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-all focus-within:ring-1 focus-within:ring-slate-200 dark:focus-within:ring-slate-700">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                    <Badge className="bg-slate-900 dark:bg-white h-6 w-6 rounded-lg flex items-center justify-center p-0 font-semibold text-white dark:text-black shadow-sm">{mealIdx + 1}</Badge>
                    <FormField
                        control={form.control}
                        name={`meals.${mealIdx}.name`}
                        render={({ field }) => (
                            <Input {...field} className="h-8 border-none bg-transparent font-semibold text-sm w-48 focus-visible:ring-0 p-1 text-black dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" />
                        )}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                        <Calculator className="w-3.5 h-3.5 text-slate-400" />
                        {form.watch(`meals.${mealIdx}.kcal`) || 0} KCAL
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 bg-white dark:bg-slate-900 transition-colors">
                <div suppressHydrationWarning className="space-y-3">
                    {itemFields.map((item, itemIdx) => (
                        <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end group animate-in slide-in-from-left-2 duration-200">
                            <div className="col-span-6">
                                <FormField
                                    control={form.control}
                                    name={`meals.${mealIdx}.items.${itemIdx}.food_id`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={(val) => {
                                                const food = foods.find(f => f.id === val)
                                                if (food) {
                                                    field.onChange(val)
                                                    const qty = form.getValues(`meals.${mealIdx}.items.${itemIdx}.quantity`) || 100
                                                    const factor = qty / 100
                                                    form.setValue(`meals.${mealIdx}.items.${itemIdx}.protein`, (food.protein * factor).toFixed(1))
                                                    form.setValue(`meals.${mealIdx}.items.${itemIdx}.carb`, (food.carb * factor).toFixed(1))
                                                    form.setValue(`meals.${mealIdx}.items.${itemIdx}.fat`, (food.fat * factor).toFixed(1))
                                                    form.setValue(`meals.${mealIdx}.items.${itemIdx}.kcal`, (food.protein * 4 + food.carb * 4 + food.fat * 9) * factor)
                                                    calculateTotals()
                                                }
                                            }} value={field.value}>
                                                <FormControl><SelectTrigger className="h-10 rounded-xl text-[13px] bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-full font-medium transition-all focus:ring-1 focus:ring-slate-200 dark:focus:ring-slate-700 shadow-sm"><SelectValue placeholder="Chọn thực phẩm..." /></SelectTrigger></FormControl>
                                                <SelectContent className="max-h-[300px] rounded-2xl border-slate-200 dark:border-slate-800">
                                                    <div className="p-2 border-b sticky top-0 bg-white dark:bg-slate-950 z-10">
                                                        <Input placeholder="Tìm nhanh..." className="h-9 text-xs mb-1 bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3" />
                                                    </div>
                                                    <ScrollArea className="h-60">
                                                        {foods.map(f => <SelectItem key={f.id} value={f.id} className="text-[13px] font-medium">{f.name}</SelectItem>)}
                                                    </ScrollArea>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-3">
                                <FormField
                                    control={form.control}
                                    name={`meals.${mealIdx}.items.${itemIdx}.quantity`}
                                    render={({ field }) => (
                                     <Input type="number" {...field} placeholder="g" className="h-10 rounded-xl text-[13px] bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-center font-semibold transition-all shadow-sm" onChange={(e) => {
                                            field.onChange(e)
                                            // Recalculate nutrients
                                            const foodId = form.getValues(`meals.${mealIdx}.items.${itemIdx}.food_id`)
                                            const food = foods.find(f => f.id === foodId)
                                            if (food) {
                                                const factor = parseFloat(e.target.value) / 100
                                                form.setValue(`meals.${mealIdx}.items.${itemIdx}.protein`, (food.protein * factor).toFixed(1))
                                                form.setValue(`meals.${mealIdx}.items.${itemIdx}.carb`, (food.carb * factor).toFixed(1))
                                                form.setValue(`meals.${mealIdx}.items.${itemIdx}.fat`, (food.fat * factor).toFixed(1))
                                                form.setValue(`meals.${mealIdx}.items.${itemIdx}.kcal`, (food.protein * 4 + food.carb * 4 + food.fat * 9) * factor)
                                                calculateTotals()
                                            }
                                        }} />
                                    )}
                                />
                            </div>
                             <div className="col-span-2 text-right self-center">
                                 <div className="text-[11px] font-semibold text-slate-900 dark:text-white uppercase tracking-tight">{Math.round(form.watch(`meals.${mealIdx}.items.${itemIdx}.kcal` || 0))} KCAL</div>
                             </div>
                             <div className="col-span-1 flex justify-end">
                                 <Button type="button" variant="ghost" size="icon" onClick={() => { removeItem(itemIdx); calculateTotals(); }} className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"><Trash2 className="w-3.5 h-3.5" /></Button>
                             </div>
                        </div>
                    ))}

                    <Button type="button" variant="ghost" size="sm" onClick={() => appendItem({ food_id: '', quantity: 100, protein: 0, carb: 0, fat: 0, kcal: 0 })} className="w-full border border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-[13px] font-semibold py-5 rounded-2xl transition-all">
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Thêm thực phẩm vào bữa ăn
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
