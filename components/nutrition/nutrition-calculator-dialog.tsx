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
    Search,
    X,
    Apple,
    Calculator,
    Target,
    Activity,
    Scale,
    TrendingDown,
    TrendingUp,
    ChevronRight,
    ChevronLeft
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchClients } from '@/app/actions/clients'
import { fetchContractsLite } from '@/app/actions/contracts'
import { createNutritionDesign, updateNutritionDesign } from '@/app/actions/nutrition-actions'
import { 
    calculateBMI, 
    calculateBodyFatNavy, 
    calculateBodyFatBMI, 
    calculateBMR, 
    calculateTDEE, 
    calculateMacros 
} from '@/lib/nutrition-math'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const nutritionSchema = z.object({
    client_id: z.string().min(1, 'Vui lòng chọn khách hàng'),
    contract_id: z.string().optional().nullable(),
    
    // Biometrics
    gender: z.enum(['Nam', 'Nữ']),
    height: z.coerce.number().min(50, 'Chiều cao không hợp lệ'),
    weight: z.coerce.number().min(20, 'Cân nặng không hợp lệ'),
    age: z.coerce.number().min(10, 'Tuổi không hợp lệ'),
    waist_circumference: z.coerce.number().min(30, 'Số đo eo không hợp lệ'),
    hip_circumference: z.coerce.number().optional().nullable(),
    neck_circumference: z.coerce.number().min(20, 'Số đo cổ không hợp lệ'),
    
    // Calculation preferences
    body_fat_method: z.enum(['BMI', 'Navy', 'Manual']).default('BMI'),
    body_fat_percentage_manual: z.coerce.number().min(0).max(100).default(0),
    
    // Activity
    activity_level: z.string().min(1, 'Vui lòng chọn mức vận động'),
    activity_coefficient: z.coerce.number().min(1),
    training_sessions_per_week: z.coerce.number().min(0).max(7).default(0),
    training_duration_per_session: z.coerce.number().min(0).default(0),
    rt_ee: z.coerce.number().min(0).default(0), // Resistance Training Energy Expenditure
    
    // Diet Goal
    energy_delta_percentage: z.coerce.number().min(-50).max(50).default(0),
    protein_per_kg: z.coerce.number().min(0.5).max(4).default(2),
    fat_percentage: z.coerce.number().min(10).max(50).default(25),
})

type NutritionValues = z.infer<typeof nutritionSchema>

const ACTIVITY_LEVELS = [
    { label: 'Sedentary (Ít vận động)', value: 'Sedentary', coeff: 1.0 },
    { label: 'Lightly Active (Nhẹ)', value: 'Lightly Active', coeff: 1.1 },
    { label: 'Moderately Active (Vừa)', value: 'Moderately Active', coeff: 1.2 },
    { label: 'Active (Năng động)', value: 'Active', coeff: 1.27 },
    { label: 'Very Active (Rất năng động)', value: 'Very Active', coeff: 1.45 },
]

export function NutritionCalculatorDialog({ 
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
    const [step, setStep] = React.useState(1)
    const [loading, setLoading] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')

    const form = useForm<NutritionValues>({
        resolver: zodResolver(nutritionSchema),
        defaultValues: initialData || {
            gender: 'Nam',
            height: 170,
            weight: 70,
            age: 25,
            waist_circumference: 80,
            hip_circumference: 90,
            neck_circumference: 40,
            body_fat_method: 'BMI',
            activity_level: 'Sedentary',
            activity_coefficient: 1.0,
            training_sessions_per_week: 3,
            training_duration_per_session: 60,
            rt_ee: 300,
            energy_delta_percentage: -10,
            protein_per_kg: 2,
            fat_percentage: 25,
        }
    })

    const { data: clients = [] } = useQuery({
        queryKey: ['clients-lite'],
        queryFn: async () => {
            const res = await fetchClients()
            return res.success ? res.data : []
        }
    })

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts-lite-nutrition'],
        queryFn: async () => {
            const res = await fetchContractsLite()
            return res.success ? res.data : []
        }
    })

    // Real-time calculations
    const values = form.watch()
    const bmi = calculateBMI(values.weight, values.height) || 0
    const bfBMI = calculateBodyFatBMI(values.gender, bmi, values.age) || 0
    const bfNavy = calculateBodyFatNavy(values.gender, values.height, values.waist_circumference, values.neck_circumference, values.hip_circumference || undefined) || 0
    
    let bfUsed = (values.body_fat_method === 'BMI' ? bfBMI : values.body_fat_method === 'Navy' ? bfNavy : values.body_fat_percentage_manual) || 0
    const bmr = calculateBMR(values.weight, bfUsed) || 0
    const restEnergy = calculateTDEE(bmr, values.activity_coefficient, 0, 15)
    const trainingEnergy = calculateTDEE(bmr, values.activity_coefficient, values.rt_ee, 15)
    
    // Average Daily TDEE based on sessions
    const avgTDEE = ((restEnergy * (7 - values.training_sessions_per_week)) + (trainingEnergy * values.training_sessions_per_week)) / 7
    const calorieTarget = avgTDEE * (1 + values.energy_delta_percentage / 100)
    
    const macros = calculateMacros(calorieTarget, values.weight, values.protein_per_kg, values.fat_percentage)

    const filteredClients = React.useMemo(() => {
        if (!searchQuery) return clients
        const q = searchQuery.toLowerCase()
        return clients.filter((c: any) => 
            c.member_name?.toLowerCase().includes(q) || 
            c.phone?.includes(q)
        )
    }, [clients, searchQuery])

    async function onSubmit(data: NutritionValues) {
        setLoading(true)
        try {
            const payload = {
                ...data,
                bmi,
                body_fat_percentage_bmi: bfBMI,
                body_fat_percentage_navy: bfNavy,
                body_fat_used: bfUsed,
                ffm: data.weight * (1 - bfUsed / 100),
                bmr,
                rest_energy_expenditure: restEnergy,
                training_energy_expenditure: trainingEnergy,
                daily_calorie_intake: calorieTarget,
                protein_grams: macros.proteinGrams,
                fat_grams: macros.fatGrams,
                carb_grams: macros.carbGrams,
                tef_percentage: 15
            }

            let res
            if (initialData?.id) {
                res = await updateNutritionDesign(initialData.id, payload)
            } else {
                res = await createNutritionDesign(payload)
            }

            if (res.success) {
                toast.success(initialData ? 'Cập nhật thành công' : 'Thiết kế thành công')
                onSuccess?.()
                onOpenChange(false)
                queryClient.invalidateQueries({ queryKey: ['nutrition-designs'] })
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
                minWidth={500}
                maxWidth={1200}
                className="p-0 flex flex-col font-inter border-none shadow-2xl"
            >
                <div className="p-6 border-b shrink-0 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <SheetTitle className="uppercase font-bold text-xl flex items-center gap-2 text-black dark:text-white">
                            <Calculator className="w-6 h-6 text-red-600" />
                            {initialData ? 'Cập nhật phân tích' : 'Thiết kế dinh dưỡng mới'}
                        </SheetTitle>
                        <SheetDescription className="text-slate-500 dark:text-slate-400">Phân tích chỉ số sinh học và tính toán Macro mục tiêu.</SheetDescription>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Stepper Header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b bg-white dark:bg-slate-950">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                                    step === s ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none" : 
                                    step > s ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                )}>
                                    {s}
                                </div>
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-wider hidden sm:inline",
                                    step === s ? "text-slate-900 dark:text-white" : "text-slate-400"
                                )}>
                                    {s === 1 ? 'Chỉ số đầu vào' : s === 2 ? 'Vận động & Mục tiêu' : 'Kết quả Macro'}
                                </span>
                                {s < 3 && <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 ml-2" />}
                            </div>
                        ))}
                    </div>

                    <Form {...form}>
                        <form className="flex-1 flex flex-col overflow-hidden">
                            <ScrollArea className="flex-1">
                                <div className="p-6">
                                    <AnimatePresence mode="wait">
                                        {step === 1 && (
                                            <motion.div 
                                                key="step1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="client_id"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs font-bold uppercase text-slate-500">Hội viên</FormLabel>
                                                                <Select 
                                                                    onValueChange={(val) => {
                                                                        field.onChange(val)
                                                                        // Auto-select latest contract for this client if exists
                                                                        const clientContracts = contracts.filter((c: any) => c.client_id === val)
                                                                        if (clientContracts.length > 0) {
                                                                            form.setValue('contract_id', clientContracts[0].id)
                                                                        }
                                                                    }} 
                                                                    value={field.value}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="rounded-xl h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-black dark:text-white">
                                                                            <SelectValue placeholder="Chọn hội viên..." />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="max-h-[300px]">
                                                                        <div className="p-2 border-b sticky top-0 bg-white dark:bg-slate-950 z-10">
                                                                            <div className="relative">
                                                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                                                <Input 
                                                                                    placeholder="Tìm tên hoặc SĐT..." 
                                                                                    value={searchQuery}
                                                                                    onChange={e => setSearchQuery(e.target.value)}
                                                                                    className="h-9 text-xs pl-9"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        {filteredClients.map((c: any) => (
                                                                            <SelectItem key={c.id} value={c.id}>
                                                                                {c.member_name} - {c.phone}
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
                                                        name="contract_id"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Hợp đồng liên quan</FormLabel>
                                                                <Select 
                                                                    onValueChange={(val) => field.onChange(val === 'none' ? null : val)} 
                                                                    value={field.value || 'none'}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="rounded-xl h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-black dark:text-white">
                                                                            <SelectValue placeholder="Chọn hợp đồng (nếu có)..." />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">Không đính kèm hợp đồng</SelectItem>
                                                                        {contracts.filter((c: any) => c.client_id === values.client_id).map((c: any) => (
                                                                            <SelectItem key={c.id} value={c.id}>
                                                                                {c.id} - {c.package_name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <FormField
                                                        control={form.control}
                                                        name="gender"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Giới tính</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-10 bg-white dark:bg-slate-950 border-none shadow-sm rounded-lg text-sm">
                                                                            <SelectValue placeholder="Giới tính" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="Nam">Nam</SelectItem>
                                                                        <SelectItem value="Nữ">Nữ</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormInput form={form} name="age" label="Tuổi" suffix="tuổi" />
                                                    <FormInput form={form} name="height" label="Chiều cao" suffix="cm" />
                                                    <FormInput form={form} name="weight" label="Cân nặng" suffix="kg" />
                                                </div>

                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                                        <Scale className="w-4 h-4" />
                                                        Số đo các vòng (Dùng cho Navy Formula)
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <FormInput form={form} name="waist_circumference" label="Vòng eo" suffix="cm" />
                                                        <FormInput form={form} name="neck_circumference" label="Vòng cổ" suffix="cm" />
                                                        {values.gender === 'Nữ' && (
                                                            <FormInput form={form} name="hip_circumference" label="Vòng mông" suffix="cm" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Kết quả BMI & % Mỡ</span>
                                                        <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-950 p-1 border shadow-sm">
                                                            <button 
                                                                type="button"
                                                                onClick={() => form.setValue('body_fat_method', 'BMI')}
                                                                className={cn("text-[10px] px-2 py-1 rounded font-bold transition-all", values.body_fat_method === 'BMI' ? "bg-red-600 text-white" : "text-slate-400")}
                                                            >BMI</button>
                                                            <button 
                                                                type="button"
                                                                onClick={() => form.setValue('body_fat_method', 'Navy')}
                                                                className={cn("text-[10px] px-2 py-1 rounded font-bold transition-all", values.body_fat_method === 'Navy' ? "bg-red-600 text-white" : "text-slate-400")}
                                                            >NAVY</button>
                                                            <button 
                                                                type="button"
                                                                onClick={() => form.setValue('body_fat_method', 'Manual')}
                                                                className={cn("text-[10px] px-2 py-1 rounded font-bold transition-all", values.body_fat_method === 'Manual' ? "bg-red-600 text-white" : "text-slate-400")}
                                                            >Tự nhập</button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <ResultDisplay label="BMI" value={bmi.toFixed(1)} />
                                                        <ResultDisplay 
                                                            label={`% Mỡ (${values.body_fat_method})`} 
                                                            value={`${bfUsed.toFixed(1)}%`} 
                                                            highlight 
                                                        />
                                                        {values.body_fat_method === 'Manual' ? (
                                                            <FormField
                                                                control={form.control}
                                                                name="body_fat_percentage_manual"
                                                                render={({ field }) => (
                                                                    <FormItem className="space-y-0.5 mt-auto">
                                                                        <FormLabel className="text-[10px] font-bold text-slate-400">Nhập % mỡ</FormLabel>
                                                                        <FormControl>
                                                                            <Input {...field} type="number" step="0.1" className="h-8 text-xs font-bold text-center" />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        ) : (
                                                            <ResultDisplay label="LBM (Cơ nạc)" value={`${(values.weight * (1 - bfUsed/100)).toFixed(1)}kg`} />
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 2 && (
                                            <motion.div 
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-8"
                                            >
                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                                        <Activity className="w-4 h-4" />
                                                        Mức độ vận động & tập luyện
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <FormField
                                                            control={form.control}
                                                            name="activity_level"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Mức vận động chung</FormLabel>
                                                                    <Select 
                                                                        onValueChange={(val) => {
                                                                            field.onChange(val)
                                                                            const level = ACTIVITY_LEVELS.find(l => l.value === val)
                                                                            if (level) form.setValue('activity_coefficient', level.coeff)
                                                                        }} 
                                                                        value={field.value}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-11 rounded-xl">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {ACTIVITY_LEVELS.map(l => (
                                                                                <SelectItem key={l.value} value={l.value}>
                                                                                    {l.label} ({l.coeff})
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormInput form={form} name="rt_ee" label="Calo tiêu thụ mỗi buổi tập" suffix="kcal" />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <FormInput form={form} name="training_sessions_per_week" label="Số buổi tập / tuần" suffix="buổi" />
                                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-2 flex flex-col justify-center">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-bold text-slate-500">TDEE Ngày tập:</span>
                                                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase">{Math.round(trainingEnergy)} kcal</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                                                                <span className="text-xs font-bold">TDEE Ngày nghỉ:</span>
                                                                <span className="text-sm font-black uppercase text-blue-600 dark:text-blue-400">{Math.round(restEnergy)} kcal</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-4 border-t">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                                        <Target className="w-4 h-4" />
                                                        Thiết lập mục tiêu (Diet Goal)
                                                    </h4>
                                                    <div className="p-6 rounded-3xl bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 space-y-6">
                                                        <FormField
                                                            control={form.control}
                                                            name="energy_delta_percentage"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <FormLabel className="text-sm font-bold text-slate-900 dark:text-white">Thâm hụt / Thặng dư Calo (%)</FormLabel>
                                                                        <span className={cn(
                                                                            "text-lg font-black",
                                                                            field.value < 0 ? "text-blue-600" : field.value > 0 ? "text-emerald-600" : "text-slate-600"
                                                                        )}>{field.value > 0 ? '+' : ''}{field.value}%</span>
                                                                    </div>
                                                                    <FormControl>
                                                                        <input 
                                                                            type="range" 
                                                                            min="-30" 
                                                                            max="30" 
                                                                            step="1" 
                                                                            value={field.value} 
                                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                                            className="w-full accent-red-600"
                                                                        />
                                                                    </FormControl>
                                                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                                                                        <span>Giảm mỡ (-30%)</span>
                                                                        <span>Duy trì</span>
                                                                        <span>Tăng cơ (+30%)</span>
                                                                    </div>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <FormInput form={form} name="protein_per_kg" label="Protein (g / kg trọng lượng)" suffix="g/kg" />
                                                            <FormInput form={form} name="fat_percentage" label="Tỷ lệ chất béo trong chất ăn (%)" suffix="%" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 3 && (
                                            <motion.div 
                                                key="step3"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="space-y-8"
                                            >
                                                <div className="text-center space-y-2">
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Kết quả thiết kế Macro</h3>
                                                    <p className="text-sm text-slate-500 font-medium tracking-tight">Dành cho mục tiêu {values.energy_delta_percentage < 0 ? 'GIẢM MỠ' : values.energy_delta_percentage > 0 ? 'TĂNG CƠ' : 'DUY TRÌ'}</p>
                                                </div>

                                                <div className="relative group">
                                                    <div className="absolute -inset-1.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition" />
                                                    <div className="relative p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Tổng năng lượng nạp hàng ngày</span>
                                                        <span className="text-5xl font-black text-red-600 dark:text-red-400 tabular-nums">{Math.round(calorieTarget).toLocaleString()}</span>
                                                        <span className="text-lg font-bold text-slate-400 mt-1 uppercase tracking-wider">Kcal / Ngày</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <MacroCard label="Protein" value={macros.proteinGrams} unit="g" color="blue" subtitle={`${(macros.proteinGrams * 4 / calorieTarget * 100).toFixed(1)}%`} />
                                                    <MacroCard label="Fat" value={macros.fatGrams} unit="g" color="orange" subtitle={`${(macros.fatGrams * 9 / calorieTarget * 100).toFixed(1)}%`} />
                                                    <MacroCard label="Carbohydrate" value={macros.carbGrams} unit="g" color="emerald" subtitle={`${(macros.carbGrams * 4 / calorieTarget * 100).toFixed(1)}%`} />
                                                </div>

                                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                                                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tóm tắt lộ trình</h4>
                                                    <div className="space-y-3">
                                                        <SummaryRow label="BMR (Năng lượng nền)" value={Math.round(bmr)} />
                                                        <SummaryRow label="TDEE TB (Năng lượng tiêu thụ)" value={Math.round(avgTDEE)} />
                                                        <SummaryRow label="Mục tiêu calo" value={Math.round(calorieTarget)} highlight={values.energy_delta_percentage !== 0} />
                                                        <SummaryRow label="Độ biến thiên năng lượng" value={`${values.energy_delta_percentage}%`} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t bg-white dark:bg-slate-950 flex items-center justify-between gap-4 shrink-0">
                                {step > 1 && (
                                    <Button variant="ghost" type="button" onClick={() => setStep(s => s - 1)} className="rounded-xl font-bold h-11 px-6">
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        Quay lại
                                    </Button>
                                )}
                                
                                {step < 3 ? (
                                    <Button 
                                        type="button" 
                                        onClick={() => setStep(s => s + 1)} 
                                        className="bg-black dark:bg-white text-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100 rounded-xl px-10 font-bold h-11 ml-auto"
                                    >
                                        Tiếp tục
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button 
                                        type="button"
                                        onClick={form.handleSubmit(onSubmit)} 
                                        disabled={loading} 
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-12 font-bold h-11 ml-auto shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95"
                                    >
                                        {loading ? 'Đang lưu...' : 'Lưu thiết kế'}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function FormInput({ form, name, label, suffix }: { form: any, name: string, label: string, suffix: string }) {
    return (
        <FormField
            control={form.control}
            name={name as any}
            render={({ field }) => (
                <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-bold uppercase text-slate-400">{label}</FormLabel>
                    <FormControl>
                        <div className="relative group">
                            <Input 
                                {...field} 
                                type="number" 
                                step="any"
                                className="h-10 border-none bg-white dark:bg-slate-900 shadow-sm rounded-lg text-sm font-bold pr-10 focus-visible:ring-1 focus-visible:ring-red-500/20 text-black dark:text-white" 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 pointer-events-none group-focus-within:text-red-500 transition-colors uppercase">{suffix}</span>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}

function ResultDisplay({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
            <span className={cn(
                "text-xl font-black tabular-nums",
                highlight ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
            )}>{value}</span>
        </div>
    )
}

function MacroCard({ label, value, unit, color, subtitle }: { label: string, value: number, unit: string, color: 'blue' | 'orange' | 'emerald', subtitle: string }) {
    const colors = {
        blue: "text-blue-600 border-blue-100 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/30",
        orange: "text-orange-600 border-orange-100 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/30",
        emerald: "text-emerald-600 border-emerald-100 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30"
    }

    return (
        <div className={cn("p-6 rounded-3xl border flex flex-col items-center text-center space-y-1 group hover:shadow-lg transition-all duration-300", colors[color])}>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tabular-nums leading-none">{Math.round(value)}</span>
                <span className="text-xs font-bold uppercase tracking-tight">{unit}</span>
            </div>
            <span className="text-[10px] font-black px-2 mt-1 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-black/5 dark:border-white/5 opacity-80">{subtitle}</span>
        </div>
    )
}

function SummaryRow({ label, value, highlight }: { label: string, value: string | number, highlight?: boolean }) {
    return (
        <div className="flex justify-between items-center text-[13px]">
            <span className="text-slate-500 font-medium">{label}</span>
            <span className={cn(
                "font-bold tabular-nums",
                highlight ? "bg-red-500 text-white px-2 py-0.5 rounded-lg text-[11px]" : "text-slate-900 dark:text-white"
            )}>
                {typeof value === 'number' ? `${value.toLocaleString()} kcal` : value}
            </span>
        </div>
    )
}
