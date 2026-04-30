'use client'

import React from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, Scale, Save, X, Search, Loader2, Plus } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchContractsLite } from '@/app/actions/contracts'
import { createInBodyRecord, updateInBodyRecord } from '@/app/actions/inbody-records'
import { fetchLatestHealthProfileForClient } from '@/app/actions/health-profiles'
import { cn } from '@/lib/utils'

const inbodySchema = z.object({
    client_id: z.string().min(1, 'Vui lòng chọn hội viên'),
    recorded_at: z.string().min(1, 'Vui lòng chọn ngày đo'),
    weight: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
    age: z.number().nullable().optional(),
    gender: z.string().nullable().optional(),
    fitness_score: z.number().nullable().optional(),
    body_water: z.number().nullable().optional(),
    protein: z.number().nullable().optional(),
    minerals: z.number().nullable().optional(),
    body_fat_mass: z.number().nullable().optional(),
    smm: z.number().nullable().optional(),
    bmi: z.number().nullable().optional(),
    pbf: z.number().nullable().optional(),
    bmr: z.number().nullable().optional(),
    lean_arm_r: z.number().nullable().optional(),
    lean_arm_l: z.number().nullable().optional(),
    lean_trunk: z.number().nullable().optional(),
    lean_leg_r: z.number().nullable().optional(),
    lean_leg_l: z.number().nullable().optional(),
    fat_arm_r: z.number().nullable().optional(),
    fat_arm_l: z.number().nullable().optional(),
    fat_trunk: z.number().nullable().optional(),
    fat_leg_r: z.number().nullable().optional(),
    fat_leg_l: z.number().nullable().optional(),
    target_weight: z.number().nullable().optional(),
    fat_control: z.number().nullable().optional(),
    muscle_control: z.number().nullable().optional(),
    weight_control: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
})

type InBodyValues = z.infer<typeof inbodySchema>

interface InBodySheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    initialData?: any
}

export function InBodySheet({ open, onOpenChange, onSuccess, initialData }: InBodySheetProps) {
    const queryClient = useQueryClient()
    const [loading, setLoading] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    const form = useForm<InBodyValues>({
        resolver: zodResolver(inbodySchema),
        defaultValues: {
            client_id: '',
            recorded_at: new Date().toISOString().slice(0, 16),
            weight: null,
            height: null,
            age: null,
            gender: '',
            fitness_score: null,
            body_water: null,
            protein: null,
            minerals: null,
            body_fat_mass: null,
            smm: null,
            bmi: null,
            pbf: null,
            bmr: null,
            lean_arm_r: null,
            lean_arm_l: null,
            lean_trunk: null,
            lean_leg_r: null,
            lean_leg_l: null,
            fat_arm_r: null,
            fat_arm_l: null,
            fat_trunk: null,
            fat_leg_r: null,
            fat_leg_l: null,
            target_weight: null,
            fat_control: null,
            muscle_control: null,
            weight_control: null,
            notes: '',
        }
    })

    // Reset form when initialData changes or sheet opens
    React.useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    ...initialData,
                    recorded_at: initialData.recorded_at
                        ? new Date(initialData.recorded_at).toISOString().slice(0, 16)
                        : new Date().toISOString().slice(0, 16),
                })
            } else {
                form.reset({
                    client_id: '',
                    recorded_at: new Date().toISOString().slice(0, 16),
                    weight: null,
                    height: null,
                    age: null,
                    gender: '',
                    fitness_score: null,
                    body_water: null,
                    protein: null,
                    minerals: null,
                    body_fat_mass: null,
                    smm: null,
                    pbf: null,
                    bmi: null,
                    bmr: null,
                    lean_arm_r: null,
                    lean_arm_l: null,
                    lean_trunk: null,
                    lean_leg_r: null,
                    lean_leg_l: null,
                    fat_arm_r: null,
                    fat_arm_l: null,
                    fat_trunk: null,
                    fat_leg_r: null,
                    fat_leg_l: null,
                    target_weight: null,
                    fat_control: null,
                    muscle_control: null,
                    weight_control: null,
                    notes: '',
                })
            }
        }
    }, [open, initialData, form])

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts-lite'],
        queryFn: async () => {
            const res = await fetchContractsLite()
            return res.success ? res.data : []
        },
        enabled: open
    })

    const filteredContracts = React.useMemo(() => {
        if (!searchQuery) return contracts
        const q = searchQuery.toLowerCase()
        return contracts.filter((c: any) =>
            c.id.toLowerCase().includes(q) ||
            c.member_name?.toLowerCase().includes(q) ||
            c.phone?.includes(q)
        )
    }, [contracts, searchQuery])

    async function handleMemberChange(clientId: string) {
        form.setValue('client_id', clientId)

        try {
            const res = await fetchLatestHealthProfileForClient(clientId)
            if (res.success && res.data) {
                const profile = res.data
                if (profile.weight) form.setValue('weight', Number(profile.weight))
                if (profile.height) form.setValue('height', Number(profile.height))
                if (profile.age) form.setValue('age', profile.age)
                if (profile.gender) form.setValue('gender', profile.gender)
                if (profile.body_fat) form.setValue('pbf', Number(profile.body_fat))
                toast.info('Đã tự động điền thông số từ hồ sơ sức khỏe mới nhất')
            }
        } catch (err) {
            console.error('Error auto-filling from health profile:', err)
        }
    }

    async function onSubmit(values: InBodyValues) {
        setLoading(true)
        try {
            let res;
            if (initialData?.id) {
                res = await updateInBodyRecord(initialData.id, values)
            } else {
                res = await createInBodyRecord(values)
            }

            if (res.success) {
                toast.success(initialData ? 'Đã cập nhật kết quả InBody thành công' : 'Đã lưu kết quả InBody mới thành công')
                onSuccess?.()
                onOpenChange(false)
                queryClient.invalidateQueries({ queryKey: [initialData ? 'inbody-records' : 'all-inbody-records'] })
                form.reset()
            } else {
                toast.error(res.error)
            }
        } catch (error: any) {
            toast.error('Lỗi hệ thống: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const renderField = (name: keyof InBodyValues, label: string, placeholder = '0.0') => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="space-y-1.5">
                    <FormLabel className="text-[11px] font-medium text-black/60 dark:text-white/60 tracking-tight">{label}</FormLabel>
                    <FormControl>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={placeholder}
                            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 focus:ring-red-500 text-black dark:text-white font-medium"
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                </FormItem>
            )}
        />
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                resizable={!isMobile}
                defaultWidth={isMobile ? undefined : 850}
                maxWidth={isMobile ? undefined : 1200}
                minWidth={isMobile ? undefined : 400}
                className={cn(
                    "p-0 border-none shadow-2xl bg-[#F8F9FA] dark:bg-slate-950 flex flex-col h-full gap-0 overflow-hidden",
                    isMobile ? "!w-full !max-w-full" : ""
                )}
            >
                <SheetHeader className="px-4 py-3 sm:p-6 bg-white dark:bg-slate-900 border-b dark:border-slate-800 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 sm:gap-4">
                            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-red-100 shrink-0">
                                <Scale className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div>
                                <SheetTitle className="text-sm sm:text-xl font-medium text-black dark:text-white tracking-tight">
                                    {initialData ? 'Cập nhật InBody' : 'Nhập InBody mới'}
                                </SheetTitle>
                                <SheetDescription className="text-[10px] sm:text-xs font-normal text-black/60 dark:text-white/60 mt-0.5">
                                    {initialData ? 'Chỉnh sửa kết quả phân tích' : 'Phân tích thành phần cơ thể'}
                                </SheetDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                disabled={loading}
                                onClick={form.handleSubmit(onSubmit)}
                                className="sm:hidden h-9 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                            >
                                {loading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Lưu</span>
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="-mr-2 shrink-0 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 min-h-0 bg-[#F8F9FA] dark:bg-slate-950">
                            <div className="p-3 sm:p-6 space-y-4 sm:space-y-8 pb-12">
                                {/* SECTION: MEMBER & DATE */}
                                <div className="p-3 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <FormField
                                            control={form.control}
                                            name="client_id"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-1.5 flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                                        Hội viên đánh giá
                                                    </FormLabel>
                                                    <Select onValueChange={handleMemberChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none w-full focus:ring-red-500/20 text-black dark:text-white">
                                                                <SelectValue placeholder="Chọn hội viên..." className="font-medium" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="max-h-[300px] dark:bg-slate-900 dark:border-slate-800">
                                                            <div className="p-2 border-b dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 dark:text-white/40" />
                                                                    <Input
                                                                        placeholder="Tìm khách hàng..."
                                                                        value={searchQuery}
                                                                        onChange={e => setSearchQuery(e.target.value)}
                                                                        className="h-9 pl-9 text-sm rounded-lg"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {filteredContracts.map((c: any) => (
                                                                <SelectItem key={c.id} value={c.client_id} className="text-sm py-2.5">
                                                                    {c.member_name} - {c.id}
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
                                            name="recorded_at"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-1.5 flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-red-500" />
                                                        Ngày & Giờ đo
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="datetime-local"
                                                            className="rounded-xl h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-red-500/20 px-4 font-medium text-black dark:text-white"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* SECTION 1: CƠ BẢN */}
                                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
                                    <div className="flex items-center gap-2 border-l-4 border-red-500 pl-3 sm:pl-4 py-0.5 mb-4 sm:mb-6">
                                        <h3 className="text-[13px] sm:text-[14px] font-medium text-black dark:text-white tracking-tight">Thông tin cơ bản & Tổng quan</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-3 sm:gap-y-4">
                                        {renderField('weight', 'Cân nặng (kg)')}
                                        {renderField('height', 'Chiều cao (cm)')}
                                        {renderField('age', 'Tuổi')}
                                        <FormField
                                            control={form.control}
                                            name="gender"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="text-[11px] font-medium text-black/60 dark:text-white/60 tracking-tight">Giới tính</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium text-black dark:text-white">
                                                                <SelectValue placeholder="Chọn..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                                            <SelectItem value="Nam">Nam</SelectItem>
                                                            <SelectItem value="Nữ">Nữ</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        {renderField('fitness_score', 'Điểm thể trạng')}
                                    </div>
                                </div>

                                {/* SECTION 2: THÀNH PHẦN */}
                                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3 sm:pl-4 py-0.5 mb-4 sm:mb-6">
                                        <h3 className="text-[13px] sm:text-[14px] font-medium text-emerald-600 dark:text-emerald-400 tracking-tight">Thành phần & Chỉ số</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-3 sm:gap-y-4">
                                        {renderField('body_water', 'Nước (L)')}
                                        {renderField('protein', 'Protein (kg)')}
                                        {renderField('minerals', 'Khoáng (kg)')}
                                        {renderField('body_fat_mass', 'Khối mỡ (kg)')}
                                        {renderField('smm', 'Cơ xương (kg)')}
                                        {renderField('bmi', 'BMI')}
                                        {renderField('pbf', 'PBF (%)')}
                                        {renderField('bmr', 'BMR (kcal)')}
                                    </div>
                                </div>

                                {/* SECTION 3 & 4: PHÂN TÍCH BỘ PHẬN */}
                                <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 md:gap-8">
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="flex items-center gap-2 border-l-4 border-blue-500 pl-3 sm:pl-4 py-0.5 mb-3 sm:mb-6">
                                            <h3 className="text-[13px] sm:text-[14px] font-medium text-blue-600 dark:text-blue-400 tracking-tight">Cơ từng bộ phận (kg)</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            {renderField('lean_arm_r', 'Tay Phải')}
                                            {renderField('lean_arm_l', 'Tay Trái')}
                                            {renderField('lean_trunk', 'Thân mình')}
                                            {renderField('lean_leg_r', 'Chân Phải')}
                                            {renderField('lean_leg_l', 'Chân Trái')}
                                        </div>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-0 border-t border-slate-100 dark:border-slate-800 sm:border-t-0">
                                        <div className="flex items-center gap-2 border-l-4 border-orange-500 pl-3 sm:pl-4 py-0.5 mb-3 sm:mb-6">
                                            <h3 className="text-[13px] sm:text-[14px] font-medium text-orange-600 dark:text-orange-400 tracking-tight">Mỡ từng bộ phận (kg)</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            {renderField('fat_arm_r', 'Tay Phải')}
                                            {renderField('fat_arm_l', 'Tay Trái')}
                                            {renderField('fat_trunk', 'Thân mình')}
                                            {renderField('fat_leg_r', 'Chân Phải')}
                                            {renderField('fat_leg_l', 'Chân Trái')}
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 5: KIỂM SOÁT */}
                                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 border-l-4 border-black dark:border-white pl-3 sm:pl-4 py-0.5 mb-4 sm:mb-6">
                                        <h3 className="text-[13px] sm:text-[14px] font-medium text-black dark:text-white tracking-tight">Mục tiêu kiểm soát</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                                        {renderField('target_weight', 'Cân nặng mục tiêu')}
                                        {renderField('fat_control', 'Điều chỉnh Mỡ')}
                                        {renderField('muscle_control', 'Điều chỉnh Cơ')}
                                        {renderField('weight_control', 'Điều chỉnh Cân')}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="flex px-3 py-3 sm:p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 items-center justify-between gap-2 sm:gap-4 sticky bottom-0 z-20 shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl h-10 sm:h-12 px-3 sm:px-8 font-medium text-black/60 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 sm:flex-none rounded-xl h-10 sm:h-12 px-4 sm:px-12 bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 font-medium shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                        <span className="text-[13px] sm:text-sm">Lưu kết quả</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
