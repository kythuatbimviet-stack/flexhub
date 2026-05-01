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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Plus,
    X,
    ClipboardList,
    Camera,
    Link as LinkIcon,
    Trash2,
    Save,
    Image as ImageIcon,
    Calendar as CalendarIcon,
    Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchContractsLite } from '@/app/actions/contracts'
import { createPhysicalAssessment, updatePhysicalAssessment } from '@/app/actions/physical-assessments'
import { uploadAssessmentImage } from '@/app/actions/storage'
import { cn } from '@/lib/utils'

const assessmentSchema = z.object({
    contract_id: z.string().min(1, 'Vui lòng chọn hợp đồng'),
    created_at: z.date().optional().nullable(),
    
    // Neck
    neck_forward_head: z.boolean().default(false),
    neck_tilted_rotated: z.boolean().default(false),
    neck_image_url: z.string().nullable().optional(),
    neck_links: z.array(z.string()).default([]),
    neck_notes: z.string().nullable().optional(),
    
    // Shoulder
    shoulder_uneven: z.boolean().default(false),
    shoulder_rounded: z.boolean().default(false),
    shoulder_image_url: z.string().nullable().optional(),
    shoulder_links: z.array(z.string()).default([]),
    shoulder_notes: z.string().nullable().optional(),
    
    // Back
    back_kyphosis: z.boolean().default(false),
    back_lordosis: z.boolean().default(false),
    back_image_url: z.string().nullable().optional(),
    back_links: z.array(z.string()).default([]),
    back_notes: z.string().nullable().optional(),
    
    // Pelvis
    pelvis_anterior_tilt: z.boolean().default(false),
    pelvis_posterior_tilt: z.boolean().default(false),
    pelvis_image_url: z.string().nullable().optional(),
    pelvis_links: z.array(z.string()).default([]),
    pelvis_notes: z.string().nullable().optional(),
    
    // Knee
    knee_knock_knees: z.boolean().default(false),
    knee_bow_legs: z.boolean().default(false),
    knee_hyperextended: z.boolean().default(false),
    knee_image_url: z.string().nullable().optional(),
    knee_links: z.array(z.string()).default([]),
    knee_notes: z.string().nullable().optional(),
    
    // Foot
    foot_supination: z.boolean().default(false),
    foot_pronation: z.boolean().default(false),
    foot_image_url: z.string().nullable().optional(),
    foot_links: z.array(z.string()).default([]),
    foot_notes: z.string().nullable().optional(),

    // Summary
    summary_notes: z.string().nullable().optional(),
    recommendations: z.string().nullable().optional(),
})

type AssessmentValues = z.infer<typeof assessmentSchema>

export function AssessmentSheet({ 
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

    const form = useForm<AssessmentValues>({
        resolver: zodResolver(assessmentSchema),
        defaultValues: initialData ? {
            ...initialData,
            created_at: initialData.created_at ? new Date(initialData.created_at) : new Date()
        } : {
            contract_id: '',
            created_at: new Date(),
            neck_forward_head: false,
            neck_tilted_rotated: false,
            neck_links: [],
            shoulder_uneven: false,
            shoulder_rounded: false,
            shoulder_links: [],
            back_kyphosis: false,
            back_lordosis: false,
            back_links: [],
            pelvis_anterior_tilt: false,
            pelvis_posterior_tilt: false,
            pelvis_links: [],
            knee_knock_knees: false,
            knee_bow_legs: false,
            knee_hyperextended: false,
            knee_links: [],
            foot_supination: false,
            foot_pronation: false,
            foot_links: [],
            summary_notes: '',
            recommendations: '',
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

    async function onSubmit(values: AssessmentValues) {
        setLoading(true)
        try {
            let res
            if (initialData?.id) {
                res = await updatePhysicalAssessment(initialData.id, {
                    ...values,
                    created_at: values.created_at?.toISOString()
                })
            } else {
                res = await createPhysicalAssessment({
                    ...values,
                    created_at: values.created_at?.toISOString()
                })
            }

            if (res.success) {
                toast.success(initialData?.id ? 'Cập nhật thành công' : 'Thêm mới thành công')
                onSuccess?.()
                onOpenChange(false)
                queryClient.invalidateQueries({ queryKey: ['physical-assessments'] })
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
                className="w-full p-0 flex flex-col h-full gap-0 font-inter overflow-hidden border-none shadow-2xl"
                resizable={!isMobile}
                defaultWidth={850}
                minWidth={360}
                maxWidth={1200}
                showCloseButton={false}
            >
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 border-b shrink-0 flex items-center gap-3 bg-white dark:bg-slate-950 z-10">
                    <div className="flex-1 min-w-0">
                        <SheetTitle className="text-base font-medium text-black dark:text-white flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-[#FD5771] shrink-0" />
                            <span className="truncate">Đánh giá sai lệch</span>
                        </SheetTitle>
                        <SheetDescription className="text-[11px] text-black/50 dark:text-white/50 mt-0.5 ml-6">
                            Chi tiết sai lệch hội viên.
                        </SheetDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            disabled={loading}
                            onClick={() => form.handleSubmit(onSubmit)()}
                            className="bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-black text-white rounded-xl px-4 font-medium h-9 text-xs gap-1.5 shadow-md transition-all active:scale-[0.98]"
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

                <div className="flex-1 flex flex-col min-h-0 bg-[#F9FAFB] dark:bg-slate-900/50">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="p-4 sm:p-6 space-y-5 pb-8">
                                    {/* Header Controls */}
                                    <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="contract_id"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col min-w-0">
                                                        <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-1.5 flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                            Hội viên đánh giá
                                                        </FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200 shadow-none w-full overflow-hidden focus:ring-red-500/20">
                                                                    <SelectValue placeholder="Chọn hội viên..." className="truncate font-medium" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="max-h-[300px]">
                                                                <div className="p-2 border-b sticky top-0 bg-white dark:bg-slate-950 z-10">
                                                                    <Input 
                                                                        placeholder="Tìm khách hàng..." 
                                                                        value={searchQuery}
                                                                        onChange={e => setSearchQuery(e.target.value)}
                                                                        className="h-10 text-sm"
                                                                    />
                                                                </div>
                                                                {filteredContracts.map((c: any) => (
                                                                    <SelectItem key={c.id} value={c.id} className="text-sm py-2.5">
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
                                                name="created_at"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className="text-[13px] font-medium text-black dark:text-white mb-1.5 flex items-center gap-2">
                                                            <CalendarIcon className="w-4 h-4 text-red-500" />
                                                            Ngày đánh giá
                                                        </FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-full h-12 px-4 text-left font-medium rounded-xl border-slate-200 bg-white shadow-none hover:bg-white text-sm focus:ring-red-500/20",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value ? (
                                                                            format(field.value, "MM/dd/yyyy")
                                                                        ) : (
                                                                            <span>Chọn ngày...</span>
                                                                        )}
                                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-100" align="end">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={field.value || undefined}
                                                                    onSelect={field.onChange}
                                                                    disabled={(date) =>
                                                                        date > new Date() || date < new Date("1900-01-01")
                                                                    }
                                                                    initialFocus
                                                                    locale={vi}
                                                                    className="rounded-2xl"
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <Tabs defaultValue="upper" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 rounded-2xl h-14 p-1.5 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800">
                                            <TabsTrigger value="upper" className="rounded-xl font-medium text-[12px] h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all">PHẦN TRÊN</TabsTrigger>
                                            <TabsTrigger value="lower" className="rounded-xl font-medium text-[12px] h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all">PHẦN DƯỚI</TabsTrigger>
                                            <TabsTrigger value="summary" className="rounded-xl font-medium text-[12px] h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all">TỔNG KẾT</TabsTrigger>
                                        </TabsList>
                                        
                                        <TabsContent value="upper" className="mt-8 space-y-10 focus-visible:outline-none">
                                            <AssessmentSegment name="neck" label="Đầu & Cổ" form={form} />
                                            <AssessmentSegment name="shoulder" label="Vai" form={form} />
                                            <AssessmentSegment name="back" label="Lưng" form={form} />
                                        </TabsContent>

                                        <TabsContent value="lower" className="mt-8 space-y-10 focus-visible:outline-none">
                                            <AssessmentSegment name="pelvis" label="Xương chậu & Hông" form={form} />
                                            <AssessmentSegment name="knee" label="Khớp gối" form={form} />
                                            <AssessmentSegment name="foot" label="Bàn chân" form={form} />
                                        </TabsContent>

                                        <TabsContent value="summary" className="mt-8 space-y-8 focus-visible:outline-none">
                                            <div className="p-6 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                                                <div className="flex items-center gap-2 border-l-4 border-red-500 pl-4 py-0.5">
                                                    <h3 className="text-[15px] font-medium text-black dark:text-white tracking-tight">Kết luận chung</h3>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 gap-6">
                                                    <FormField
                                                        control={form.control}
                                                        name="summary_notes"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-[13px] font-medium text-black/60 dark:text-white/60 tracking-tight mb-2">Nhận định tổng quát</FormLabel>
                                                                <FormControl>
                                                                    <Textarea 
                                                                        {...field} 
                                                                        value={field.value || ''}
                                                                        placeholder="Nhập nhận định chung về tình trạng hội viên..."
                                                                        className="rounded-2xl min-h-[120px] text-sm bg-[#F9FAFB] border-slate-200 focus:bg-white transition-all p-4"
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="recommendations"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-[13px] font-medium text-black/60 dark:text-white/60 tracking-tight mb-2">Đề xuất cải thiện</FormLabel>
                                                                <FormControl>
                                                                    <Textarea 
                                                                        {...field} 
                                                                        value={field.value || ''}
                                                                        placeholder="Đề xuất các bài tập hoặc phương pháp khắc phục..."
                                                                        className="rounded-2xl min-h-[120px] text-sm bg-[#F9FAFB] border-slate-200 focus:bg-white transition-all p-4"
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </ScrollArea>
                            
                            <div className="px-4 sm:px-6 py-3 border-t bg-white dark:bg-slate-950/80 backdrop-blur-md shrink-0 flex items-center justify-between gap-3 z-10 sm:justify-end">
                                <Button 
                                    variant="ghost" 
                                    type="button" 
                                    onClick={() => onOpenChange(false)} 
                                    className="rounded-xl font-medium h-10 px-4 text-sm text-black/60 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex-1 sm:flex-none"
                                >
                                    Hủy bỏ
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-black text-white rounded-xl px-6 font-medium h-10 text-sm transition-all shadow-lg flex items-center gap-2 flex-1 sm:justify-center sm:flex-none active:scale-[0.98]"
                                >
                                    {loading ? 'Đang lưu...' : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Lưu kết quả
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

function AssessmentSegment({ name, label, form }: { name: string, label: string, form: any }) {
    const [newLink, setNewLink] = React.useState('')
    
    // Flags based on the segment
    const flags: Record<string, { key: string, label: string }[]> = {
        neck: [
            { key: 'neck_forward_head', label: 'Đầu hướng ra trước' },
            { key: 'neck_tilted_rotated', label: 'Đầu nghiêng/Xoay' }
        ],
        shoulder: [
            { key: 'shoulder_uneven', label: 'Vai không đều' },
            { key: 'shoulder_rounded', label: 'Khum vai' }
        ],
        back: [
            { key: 'back_kyphosis', label: 'Gù lưng' },
            { key: 'back_lordosis', label: 'Võng lưng' }
        ],
        pelvis: [
            { key: 'pelvis_anterior_tilt', label: 'Xương chậu quay ra trước' },
            { key: 'pelvis_posterior_tilt', label: 'Xương chậu quay ra sau' }
        ],
        knee: [
            { key: 'knee_knock_knees', label: 'Chụm gối (Knock knees)' },
            { key: 'knee_bow_legs', label: 'Chân vòng kiềng (Bow legs)' },
            { key: 'knee_hyperextended', label: 'Duỗi quá mức (Hyperextended)' }
        ],
        foot: [
            { key: 'foot_supination', label: 'Bàn chân quay ngửa (Supination)' },
            { key: 'foot_pronation', label: 'Bàn chân quay sấp (Pronation)' }
        ]
    }

    const currentLinks = form.watch(`${name}_links`) || []

    const addLink = () => {
        if (!newLink) return
        form.setValue(`${name}_links`, [...currentLinks, newLink])
        setNewLink('')
    }

    const removeLink = (idx: number) => {
        const updated = [...currentLinks]
        updated.splice(idx, 1)
        form.setValue(`${name}_links`, updated)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64 = reader.result as string
            const fileName = `assessment_${name}_${Date.now()}.jpg`
            const { uploadAssessmentImage } = await import('@/app/actions/storage')
            const res = await uploadAssessmentImage(base64, fileName)
            if (res.success) {
                form.setValue(`${name}_image_url` as any, res.url)
                toast.success('Đã tải ảnh thành công')
            } else {
                toast.error(res.error)
            }
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 border rounded-2xl bg-white dark:bg-slate-950 shadow-sm border-slate-100 overflow-hidden">
            <div className="flex items-center gap-2 border-l-4 border-red-500 pl-4 py-0.5">
                <h3 className="text-[15px] font-medium text-black dark:text-white tracking-tight">{label}</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                            {flags[name]?.map(flag => (
                                <FormField
                                    key={flag.key}
                                    control={form.control}
                                    name={flag.key as any}
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-xl border border-slate-100 p-4 bg-[#F9FAFB] hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex-1 min-w-[160px]">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="rounded-lg w-6 h-6 border-slate-300 data-[state=checked]:bg-black data-[state=checked]:border-black"
                                                />
                                            </FormControl>
                                            <div className="leading-none flex-1">
                                                <FormLabel 
                                                    className="text-[14px] font-medium text-black dark:text-white cursor-pointer block w-full py-1.5"
                                                >
                                                    {flag.label}
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name={`${name}_notes` as any}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[12px] font-medium text-black/60 dark:text-white/60 tracking-tight mb-2">Ghi chú chi tiết</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        {...field} 
                                        value={field.value || ''}
                                        placeholder={`Ghi chú ${label.toLowerCase()}...`}
                                        className="rounded-[24px] min-h-[140px] text-sm bg-[#F9FAFB] border-slate-200 focus:bg-white focus:shadow-inner transition-all p-5"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-8">
                    <div>
                        <FormLabel className="text-[12px] font-medium text-black/60 dark:text-white/60 tracking-tight mb-2">Hình ảnh chụp tư thế (Kinetic Chain)</FormLabel>
                        <div className="mt-3">
                            {form.watch(`${name}_image_url`) ? (
                                <div className="relative aspect-[4/3] rounded-[28px] overflow-hidden border border-slate-200 group">
                                    <img src={form.getValues(`${name}_image_url`)} alt={label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <Button 
                                            type="button"
                                            variant="destructive" 
                                            size="icon" 
                                            className="h-12 w-12 rounded-full shadow-2xl scale-90 group-hover:scale-100 transition-transform"
                                            onClick={() => form.setValue(`${name}_image_url` as any, null)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-[28px] border-2 border-dashed border-slate-200 bg-[#F9FAFB] hover:bg-white hover:border-red-300 cursor-pointer transition-all group relative overflow-hidden">
                                    <div className="flex flex-col items-center gap-4 z-10">
                                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                                            <Camera className="w-7 h-7 text-slate-400 group-hover:text-red-500 transition-colors" />
                                        </div>
                                        <span className="text-[12px] font-medium text-black/40 dark:text-white/40 tracking-[2px] group-hover:text-red-600 transition-colors">Tải ảnh lên</span>
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <FormLabel className="text-[12px] font-medium text-black/60 dark:text-white/60 tracking-tight mb-2">Liên kết đính kèm</FormLabel>
                        <div className="flex gap-3">
                            <Input 
                                placeholder="Dán link (Video/Tài liệu)..." 
                                value={newLink}
                                onChange={e => setNewLink(e.target.value)}
                                className="h-12 rounded-xl text-sm bg-[#F9FAFB] border-slate-200 focus:bg-white transition-all shadow-none"
                            />
                            <Button type="button" onClick={addLink} variant="outline" size="icon" className="h-12 w-12 rounded-xl shrink-0 border-slate-200 hover:bg-black hover:text-white transition-colors">
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="flex flex-col gap-3 pt-2">
                            {currentLinks.map((link: string, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all group animate-in fade-in slide-in-from-left-2">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <LinkIcon className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="text-xs font-medium truncate text-black dark:text-white max-w-[220px]">{link}</span>
                                    </div>
                                    <button type="button" onClick={() => removeLink(idx)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
