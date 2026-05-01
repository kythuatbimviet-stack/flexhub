'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    ClipboardList,
    Ruler,
    HeartPulse,
    User,
    Activity,
    Save,
    X,
    Loader2,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchContractsLite } from '@/app/actions/contracts'
import { createHealthProfile, updateHealthProfile } from '@/app/actions/health-profiles'

const healthSchema = z.object({
    contract_id: z.string().nullable().optional(),
    
    // Biometrics
    gender: z.string().nullable().optional(),
    height: z.coerce.number().nullable().optional(),
    weight: z.coerce.number().nullable().optional(),
    age: z.coerce.number().nullable().optional(),
    body_fat: z.coerce.number().nullable().optional(),
    
    // Habits
    experience: z.boolean().default(false),
    wake_time: z.string().nullable().optional(),
    sleep_time: z.string().nullable().optional(),
    train_time: z.string().nullable().optional(),
    allergies: z.string().nullable().optional(),
    favorite_foods: z.string().nullable().optional(),
    weight_strategy: z.string().nullable().optional(),
    daily_activity: z.string().nullable().optional(),

    // Measurements
    measurement_shoulder: z.coerce.number().nullable().optional(),
    measurement_chest: z.coerce.number().nullable().optional(),
    measurement_bicep_left: z.coerce.number().nullable().optional(),
    measurement_bicep_right: z.coerce.number().nullable().optional(),
    measurement_waist: z.coerce.number().nullable().optional(),
    measurement_hip: z.coerce.number().nullable().optional(),
    measurement_thigh_left: z.coerce.number().nullable().optional(),
    measurement_thigh_right: z.coerce.number().nullable().optional(),
    measurement_calf_left: z.coerce.number().nullable().optional(),
    measurement_calf_right: z.coerce.number().nullable().optional(),

    // Medical
    medical_cardiovascular: z.string().nullable().optional(),
    medical_blood_pressure: z.string().nullable().optional(),
    medical_diabetes: z.string().nullable().optional(),
    medical_asthma: z.string().nullable().optional(),
    medical_vestibular: z.string().nullable().optional(),
    medical_back_issue: z.string().nullable().optional(),
    medical_stomach: z.string().nullable().optional(),
    medical_nerves: z.string().nullable().optional(),
    medical_neck_shoulder_pain: z.string().nullable().optional(),
    sleep_hours: z.coerce.number().nullable().optional(),
    medical_sciatica: z.string().nullable().optional(),
    medical_joints: z.string().nullable().optional(),
    is_smoker: z.boolean().default(false),
    is_alcoholic: z.boolean().default(false),
    medical_hernia: z.string().nullable().optional(),
    medical_surgery: z.string().nullable().optional(),
    medical_insomnia: z.string().nullable().optional(),
    medical_hip_alignment: z.string().nullable().optional(),
})

type HealthValues = z.infer<typeof healthSchema>

export function HealthProfileDialog({ 
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
    const isMobile = useIsMobile()
    const [loading, setLoading] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')

    const form = useForm<HealthValues>({
        resolver: zodResolver(healthSchema),
        defaultValues: initialData || {
            contract_id: '',
            gender: '',
            height: null,
            weight: null,
            age: null,
            body_fat: null,
            experience: false,
            wake_time: '',
            sleep_time: '',
            train_time: '',
            allergies: '',
            favorite_foods: '',
            weight_strategy: '',
            daily_activity: '',
            measurement_shoulder: null,
            measurement_chest: null,
            measurement_bicep_left: null,
            measurement_bicep_right: null,
            measurement_waist: null,
            measurement_hip: null,
            measurement_thigh_left: null,
            measurement_thigh_right: null,
            measurement_calf_left: null,
            measurement_calf_right: null,
            medical_cardiovascular: '',
            medical_blood_pressure: '',
            medical_diabetes: '',
            medical_asthma: '',
            medical_vestibular: '',
            medical_back_issue: '',
            medical_stomach: '',
            medical_nerves: '',
            medical_neck_shoulder_pain: '',
            sleep_hours: null,
            medical_sciatica: '',
            medical_joints: '',
            is_smoker: false,
            is_alcoholic: false,
            medical_hernia: '',
            medical_surgery: '',
            medical_insomnia: '',
            medical_hip_alignment: '',
        }
    })

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts-lite'],
        queryFn: async () => {
            const res = await fetchContractsLite()
            return res.success ? res.data : []
        }
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

    // Helpers
    const calculateAge = (dob: string | null) => {
        if (!dob) return null
        const birthDate = new Date(dob)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    // Tự động điền thông tin từ hợp đồng
    const selectedContractId = form.watch('contract_id')
    React.useEffect(() => {
        if (!selectedContractId || initialData) return

        const contract = contracts.find((c: any) => c.id === selectedContractId)
        if (contract) {
            const currentAge = calculateAge(contract.dob)
            
            // Sử dụng thông tin ngay từ hợp đồng (top-level fields)
            if (!form.getValues('age')) form.setValue('age', currentAge)
            if (!form.getValues('height')) form.setValue('height', contract.initial_height || null)
            if (!form.getValues('weight')) form.setValue('weight', contract.initial_weight || null)
            
            // Giới tính không có trong bảng contracts, để trống nếu không fetch được
            if (!form.getValues('gender') && contract.clients?.gender) {
                form.setValue('gender', contract.clients.gender)
            }
        }
    }, [selectedContractId, contracts, initialData, form])

    // Helper cho Tag Input
    const TagInput = ({ name, placeholder }: { name: keyof HealthValues, placeholder: string }) => {
        const [inputValue, setInputValue] = React.useState('')
        const value = form.watch(name) as string || ''
        const tags = value ? value.split(',').map(t => t.trim()).filter(t => t) : []

        const addTag = (text?: string) => {
            const tagToAdd = text || inputValue.trim()
            if (!tagToAdd) return
            // Avoid duplicate tags
            if (tags.includes(tagToAdd)) {
                setInputValue('')
                return
            }
            const newTags = [...tags, tagToAdd]
            form.setValue(name, newTags.join(', ') as any)
            setInputValue('')
        }

        const removeTag = (index: number) => {
            const newTags = tags.filter((_, i) => i !== index)
            form.setValue(name, newTags.join(', ') as any)
        }

        return (
            <div className="space-y-2">
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="bg-[#FD5771]/10 text-[#FD5771] border-[#FD5771]/20 px-2 py-0.5 rounded-lg flex items-center gap-1 group">
                                {tag}
                                <X className="w-3 h-3 cursor-pointer hover:text-red-700" onClick={() => removeTag(i)} />
                            </Badge>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <Input 
                        value={inputValue}
                        onChange={e => {
                            const val = e.target.value
                            if (val.endsWith(';') || val.endsWith(',')) {
                                addTag(val.slice(0, -1).trim())
                            } else {
                                setInputValue(val)
                            }
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                addTag()
                            }
                        }}
                        placeholder={placeholder}
                        className="h-10 rounded-lg text-sm border-slate-200 focus:bg-white transition-colors"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => addTag()} className="h-10 rounded-lg shrink-0">Thêm</Button>
                </div>
            </div>
        )
    }

    async function onSubmit(values: HealthValues) {
        setLoading(true)
        try {
            // Sanitize values: convert empty strings to null
            const sanitizedValues = Object.fromEntries(
                Object.entries(values).map(([key, value]) => [
                    key, 
                    value === '' ? null : value
                ])
            )

            let res
            if (initialData?.id) {
                res = await updateHealthProfile(initialData.id, sanitizedValues)
            } else {
                res = await createHealthProfile(sanitizedValues)
            }

            if (res.success) {
                toast.success(initialData?.id ? 'Cập nhật thành công' : 'Thêm mới thành công')
                onSuccess?.()
                onOpenChange(false)
                queryClient.invalidateQueries({ queryKey: ['health-profiles'] })
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
                resizable={!isMobile}
                defaultWidth={750}
                minWidth={360}
                maxWidth={1000}
                showCloseButton={false}
                className="w-full p-0 flex flex-col h-full gap-0 font-inter overflow-hidden border-none shadow-2xl"
            >
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 border-b shrink-0 flex items-center gap-3 bg-white dark:bg-slate-950 z-10">
                    <div className="flex-1 min-w-0">
                        <SheetTitle className="text-base font-medium text-black dark:text-white flex items-center gap-2">
                            <HeartPulse className="w-4 h-4 text-[#FD5771] shrink-0" />
                            <span className="truncate">{initialData ? 'Cập nhật hồ sơ' : 'Hồ sơ sức khỏe mới'}</span>
                        </SheetTitle>
                        <SheetDescription className="text-[11px] text-black/50 dark:text-white/50 mt-0.5 ml-6">
                            Thói quen và số đo cơ thể của hội viên.
                        </SheetDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            type="button"
                            disabled={loading}
                            onClick={() => form.handleSubmit(onSubmit)()}
                            className="bg-[#FD5771] hover:bg-[#E0485F] text-white rounded-xl px-4 font-medium h-9 text-xs gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{loading ? 'Đang lưu...' : 'Lưu'}</span>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onOpenChange(false)}
                            className="rounded-full h-9 w-9 text-black/50 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-4 sm:p-6 space-y-6 pb-6">
                                {/* Contract Selection */}
                                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <FormField
                                        control={form.control}
                                        name="contract_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-black dark:text-white">Hợp đồng khách hàng</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl h-11 bg-white border-slate-200">
                                                            <SelectValue placeholder="Chọn hợp đồng để tạo hồ sơ..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="max-h-[300px] w-[min(90vw,500px)]">
                                                        <div className="p-2 border-b sticky top-0 bg-white dark:bg-slate-950 z-10">
                                                            <Input 
                                                                placeholder="Tìm theo tên, SĐT hoặc mã hợp đồng..." 
                                                                value={searchQuery}
                                                                onChange={e => setSearchQuery(e.target.value)}
                                                                className="h-9 text-sm"
                                                            />
                                                        </div>
                                                        {filteredContracts.length > 0 ? (
                                                            filteredContracts.map((c: any) => (
                                                                <SelectItem key={c.id} value={c.id}>
                                                                    <div className="flex flex-col py-0.5">
                                                                        <span className="font-medium text-slate-900">{c.member_name}</span>
                                                                        <span className="text-[10px] text-slate-500">{c.id} - {c.phone}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-sm text-slate-500">Không tìm thấy kết quả</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Tabs defaultValue="basic" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 rounded-xl h-12 p-1 bg-slate-100 dark:bg-slate-900">
                                        <TabsTrigger value="basic" className="rounded-lg font-medium text-[11px] sm:text-xs h-full data-[state=active]:shadow-sm"><User className="w-3.5 h-3.5 mr-1.5"/> <span className="hidden sm:inline">Chỉ số & </span>Thói quen</TabsTrigger>
                                        <TabsTrigger value="measure" className="rounded-lg font-medium text-[11px] sm:text-xs h-full data-[state=active]:shadow-sm"><Ruler className="w-3.5 h-3.5 mr-1.5"/> Số đo</TabsTrigger>
                                        <TabsTrigger value="medical" className="rounded-lg font-medium text-[11px] sm:text-xs h-full data-[state=active]:shadow-sm"><Activity className="w-3.5 h-3.5 mr-1.5"/> Bệnh lý</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="basic" className="mt-8 space-y-8 focus-visible:outline-none">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 border-l-2 border-[#FD5771] pl-3">
                                                <h3 className="text-sm font-medium text-black dark:text-white">Thông tin cơ bản</h3>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 border rounded-2xl bg-white dark:bg-slate-950 shadow-sm border-slate-100">
                                                <FormField control={form.control} name="gender" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[13px] font-medium text-black dark:text-white">Giới tính</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 rounded-lg text-sm border-slate-200 bg-white">
                                                                    <SelectValue placeholder="Chọn giới tính" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl">
                                                                <SelectItem value="Nam">Nam</SelectItem>
                                                                <SelectItem value="Nữ">Nữ</SelectItem>
                                                                <SelectItem value="Khác">Khác</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="age" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Tuổi</FormLabel><FormControl><Input type="number" inputMode="numeric" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="height" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Chiều cao (cm)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="weight" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Cân nặng (kg)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="body_fat" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">% Mỡ cơ thể</FormLabel><FormControl><Input type="number" step="0.1" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="experience" render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 border rounded-xl mt-7 bg-slate-50/50 border-slate-100">
                                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                        <FormLabel className="text-[13px] font-medium text-black dark:text-white cursor-pointer">Đã có kinh nghiệm tập luyện</FormLabel>
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 border-l-2 border-[#FD5771] pl-3">
                                                <h3 className="text-sm font-medium text-black dark:text-white">Lịch trình & Thói quen</h3>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-5 border rounded-2xl bg-white dark:bg-slate-950 shadow-sm border-slate-100">
                                                <FormField control={form.control} name="wake_time" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Giờ thức dậy</FormLabel><FormControl><Input type="time" step="60" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="sleep_time" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Giờ đi ngủ</FormLabel><FormControl><Input type="time" step="60" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="train_time" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Giờ tập luyện</FormLabel><FormControl><Input type="time" step="60" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="allergies" render={({ field }) => (
                                                    <FormItem className="col-span-full">
                                                        <FormLabel className="text-[13px] font-medium text-black dark:text-white">Thức ăn dị ứng</FormLabel>
                                                        <FormControl>
                                                            <TagInput name="allergies" placeholder="Ví dụ: Hải sản, Cà chua... (Nhấn Enter để thêm)" />
                                                        </FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="favorite_foods" render={({ field }) => (
                                                    <FormItem className="col-span-full">
                                                        <FormLabel className="text-[13px] font-medium text-black dark:text-white">Món ăn yêu thích</FormLabel>
                                                        <FormControl>
                                                            <TagInput name="favorite_foods" placeholder="Nhập các món ăn yêu thích... (Nhấn Enter để thêm)" />
                                                        </FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="daily_activity" render={({ field }) => (
                                                    <FormItem className="col-span-full">
                                                        <FormLabel className="text-[13px] font-medium text-black dark:text-white">Tính chất hoạt động hàng ngày</FormLabel>
                                                        <FormControl>
                                                            <TagInput name="daily_activity" placeholder="Ví dụ: Ngồi văn phòng, Vận động nhiều... (Nhấn ; để phân tách)" />
                                                        </FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="weight_strategy" render={({ field }) => (
                                                    <FormItem className="col-span-full">
                                                        <FormLabel className="text-[13px] font-medium text-black dark:text-white">Đối với cân nặng</FormLabel>
                                                        <FormControl>
                                                            <TagInput name="weight_strategy" placeholder="Ví dụ: Kiểm soát calo... (Nhấn ; để phân tách)" />
                                                        </FormControl>
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="measure" className="mt-8 space-y-8 focus-visible:outline-none">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 border-l-2 border-[#FD5771] pl-3">
                                                <h3 className="text-sm font-medium text-black dark:text-white">Số đo cơ thể (cm)</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 p-5 border rounded-2xl bg-white dark:bg-slate-950 shadow-sm border-slate-100">
                                                <FormField control={form.control} name="measurement_shoulder" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Vai</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="measurement_chest" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Ngực</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="measurement_bicep_left" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Bắp tay (T)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="measurement_bicep_right" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Bắp tay (P)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="measurement_waist" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Bụng</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="measurement_hip" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Mông</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="measurement_thigh_left" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Đùi (T)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="measurement_thigh_right" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Đùi (P)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="measurement_calf_left" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Bắp chân (T)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="measurement_calf_right" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[13px] font-medium text-black dark:text-white">Bắp chân (P)</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm border-slate-200" /></FormControl></FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="medical" className="mt-8 space-y-8 focus-visible:outline-none">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 border-l-2 border-[#FD5771] pl-3">
                                                <h3 className="text-sm font-medium text-black dark:text-white">Tiền sử bệnh lý & Thói quen</h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="is_smoker" render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-xl bg-slate-50/50 border-slate-100 shadow-sm"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-[13px] font-medium text-black dark:text-white cursor-pointer">Hút thuốc lá</FormLabel></FormItem>
                                                )} />
                                                <FormField control={form.control} name="is_alcoholic" render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-xl bg-slate-50/50 border-slate-100 shadow-sm"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-[13px] font-medium text-black dark:text-white cursor-pointer">Sử dụng rượu bia</FormLabel></FormItem>
                                                )} />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 p-4 sm:p-5 border rounded-2xl bg-white dark:bg-slate-950 shadow-sm border-slate-100">
                                                 <FormField control={form.control} name="medical_cardiovascular" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Tim mạch</FormLabel><FormControl><TagInput name="medical_cardiovascular" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_blood_pressure" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Huyết áp</FormLabel><FormControl><TagInput name="medical_blood_pressure" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_diabetes" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Tiểu đường</FormLabel><FormControl><TagInput name="medical_diabetes" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_asthma" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Hen suyễn</FormLabel><FormControl><TagInput name="medical_asthma" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_vestibular" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Tiền đình</FormLabel><FormControl><TagInput name="medical_vestibular" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_back_issue" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Vấn đề cột sống/lưng</FormLabel><FormControl><TagInput name="medical_back_issue" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_stomach" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Dạ dày/Tiêu hóa</FormLabel><FormControl><TagInput name="medical_stomach" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_nerves" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Hệ thần kinh</FormLabel><FormControl><TagInput name="medical_nerves" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_neck_shoulder_pain" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Đau mỏi vai gáy</FormLabel><FormControl><TagInput name="medical_neck_shoulder_pain" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="sleep_hours" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Số giờ ngủ ban đêm</FormLabel><FormControl><Input type="number" inputMode="decimal" {...field} value={field.value || ''} className="h-10 rounded-lg text-sm bg-slate-50/30 border-slate-200 focus:bg-white transition-colors" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_sciatica" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Thần kinh tọa</FormLabel><FormControl><TagInput name="medical_sciatica" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_joints" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Vấn đề về khớp</FormLabel><FormControl><TagInput name="medical_joints" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_hernia" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Thoát vị đĩa đệm</FormLabel><FormControl><TagInput name="medical_hernia" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_surgery" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Lịch sử phẫu thuật</FormLabel><FormControl><TagInput name="medical_surgery" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_insomnia" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Chứng mất ngủ</FormLabel><FormControl><TagInput name="medical_insomnia" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="medical_hip_alignment" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[11px] font-medium text-black dark:text-white tracking-tight">Lệch hông/xương chậu</FormLabel><FormControl><TagInput name="medical_hip_alignment" placeholder="Nhập tình trạng..." /></FormControl></FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                             </ScrollArea>

                             <div className="px-4 sm:px-6 py-3 border-t shrink-0 flex items-center justify-between gap-3 bg-white dark:bg-slate-950 z-10 sm:justify-end">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    type="button" 
                                    onClick={() => onOpenChange(false)} 
                                    className="rounded-xl font-medium h-10 px-4 text-sm text-black/60 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex-1 sm:flex-none"
                                >
                                    Hủy bỏ
                                </Button>
                                <Button 
                                    size="sm"
                                    type="button"
                                    disabled={loading}
                                    onClick={() => form.handleSubmit(onSubmit)()}
                                    className="bg-[#FD5771] hover:bg-[#E0485F] text-white rounded-xl px-6 font-medium h-10 shadow-sm transition-all active:scale-[0.98] flex-1 sm:flex-none text-sm"
                                >
                                    {loading ? 'Đang lưu...' : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Lưu hồ sơ
                                        </>
                                    )}
                                </Button>
                             </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
