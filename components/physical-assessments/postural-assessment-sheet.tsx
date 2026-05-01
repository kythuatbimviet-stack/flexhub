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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Camera,
    ClipboardList,
    Save,
    X,
    Calendar,
    Trash2,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { savePosturalAssessment, type PosturalAssessment } from '@/app/actions/postural-assessments'
import { fetchContractsLite } from '@/app/actions/contracts'
import { uploadAssessmentImage } from '@/app/actions/storage'
import { cn } from '@/lib/utils'

const posturalSchema = z.object({
    client_id: z.string(),
    pt_id: z.string(),
    assessment_date: z.string(),

    // Head & Neck
    forward_head: z.boolean().default(false),
    head_tilt_rotation: z.boolean().default(false),
    head_notes: z.string().optional(),
    head_image_url: z.string().optional(),

    // Shoulders & Back
    uneven_shoulders: z.boolean().default(false),
    rounded_shoulders: z.boolean().default(false),
    kyphosis: z.boolean().default(false),
    lordosis: z.boolean().default(false),
    back_notes: z.string().optional(),
    back_image_url: z.string().optional(),

    // Hips & Pelvis
    pelvic_tilt_anterior: z.boolean().default(false),
    pelvic_tilt_posterior: z.boolean().default(false),
    pelvic_notes: z.string().optional(),
    pelvic_image_url: z.string().optional(),

    // Knees
    knee_valgus: z.boolean().default(false),
    knee_varus: z.boolean().default(false),
    knee_hyperextension: z.boolean().default(false),
    knee_notes: z.string().optional(),
    knee_image_url: z.string().optional(),

    // Feet
    pronation: z.boolean().default(false),
    supination: z.boolean().default(false),
    feet_notes: z.string().optional(),
    feet_image_url: z.string().optional(),

    recommendations: z.string().optional(),
})

type PosturalValues = z.infer<typeof posturalSchema>

interface PosturalAssessmentSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clientId?: string
    clientName?: string
    ptEmail: string
    initialData?: PosturalAssessment | null
}

export function PosturalAssessmentSheet({
    open,
    onOpenChange,
    clientId,
    clientName,
    ptEmail,
    initialData
}: PosturalAssessmentSheetProps) {
    const queryClient = useQueryClient()
    const isMobile = useIsMobile()
    const [isUploading, setIsUploading] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState('')

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts-lite'],
        queryFn: async () => {
            const res = await fetchContractsLite()
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
        const seen = new Set()
        return filtered.filter((c: any) => {
            if (seen.has(c.client_id)) return false
            seen.add(c.client_id)
            return true
        })
    }, [contracts, searchQuery])

    const form = useForm<PosturalValues>({
        resolver: zodResolver(posturalSchema),
        defaultValues: React.useMemo(() => {
            if (initialData) {
                return {
                    ...initialData,
                    client_id: initialData.client_id || clientId || '',
                    pt_id: ptEmail,
                    assessment_date: new Date(initialData.assessment_date).toISOString().split('T')[0]
                }
            }
            return {
                client_id: clientId || '',
                pt_id: ptEmail,
                assessment_date: new Date().toISOString().split('T')[0],
                forward_head: false,
                head_tilt_rotation: false,
                uneven_shoulders: false,
                rounded_shoulders: false,
                kyphosis: false,
                lordosis: false,
                pelvic_tilt_anterior: false,
                pelvic_tilt_posterior: false,
                knee_valgus: false,
                knee_varus: false,
                knee_hyperextension: false,
                pronation: false,
                supination: false,
                head_notes: '',
                back_notes: '',
                pelvic_notes: '',
                knee_notes: '',
                feet_notes: '',
                recommendations: '',
            }
        }, [initialData, clientId, ptEmail])
    })

    React.useEffect(() => {
        if (open) {
            form.reset({
                ...form.getValues(),
                ...(initialData ? {
                    ...initialData,
                    assessment_date: new Date(initialData.assessment_date).toISOString().split('T')[0]
                } : {})
            })
        }
    }, [open, initialData, form])

    const saveMutation = useMutation({
        mutationFn: savePosturalAssessment,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(initialData ? 'Đã cập nhật đánh giá' : 'Đã lưu đánh giá mới')
                queryClient.invalidateQueries({ queryKey: ['postural-assessments', clientId] })
                onOpenChange(false)
            } else {
                toast.error(res.error)
            }
        }
    })

    const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof PosturalValues) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsUploading(field)
        try {
            const reader = new FileReader()
            reader.onloadend = async () => {
                const base64 = reader.result as string
                const fileName = `postural_${clientId}_${field}_${Date.now()}.jpg`
                const res = await uploadAssessmentImage(base64, fileName)
                if (res.success) {
                    form.setValue(field as any, res.url)
                    toast.success('Đã tải ảnh lên')
                } else {
                    toast.error(res.error)
                }
                setIsUploading(null)
            }
            reader.readAsDataURL(file)
        } catch {
            toast.error('Lỗi khi tải ảnh')
            setIsUploading(null)
        }
    }

    const onSubmit = (values: PosturalValues) => {
        saveMutation.mutate({ ...values, id: initialData?.id } as PosturalAssessment)
    }

    // ── Section renderer (mobile-first) ────────────────────────────────────────
    const renderSection = (
        title: string,
        fields: { name: keyof PosturalValues; label: string; type: 'checkbox' | 'textarea' | 'image' }[]
    ) => (
        <div className="space-y-4 p-4 bg-white dark:bg-slate-950 rounded-xl border border-black/[0.07] dark:border-white/[0.07]">
            {/* Section title */}
            <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 rounded-full bg-[#FD5771]" />
                <h3 className="text-[13px] font-medium text-black dark:text-white">{title}</h3>
            </div>

            {/* Checkboxes — full-width stacked on mobile */}
            <div className="space-y-2">
                {fields.filter(f => f.type === 'checkbox').map(f => (
                    <FormField
                        key={f.name}
                        control={form.control}
                        name={f.name as any}
                        render={({ field }) => (
                            <FormItem
                                className={cn(
                                    'flex flex-row items-center gap-3 space-y-0 rounded-xl px-3.5 py-3 border transition-colors cursor-pointer select-none',
                                    field.value
                                        ? 'bg-red-50/60 border-red-200 dark:bg-red-900/10 dark:border-red-800/40'
                                        : 'bg-black/[0.02] border-black/[0.07] dark:bg-white/[0.02] dark:border-white/[0.07]'
                                )}
                            >
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="rounded-[5px] h-[18px] w-[18px] shrink-0 data-[state=checked]:bg-[#FD5771] data-[state=checked]:border-[#FD5771]"
                                    />
                                </FormControl>
                                <FormLabel className={cn(
                                    'text-[13px] font-medium cursor-pointer flex-1 leading-snug',
                                    field.value ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white'
                                )}>
                                    {f.label}
                                </FormLabel>
                            </FormItem>
                        )}
                    />
                ))}
            </div>

            {/* Textarea */}
            {fields.filter(f => f.type === 'textarea').map(f => (
                <FormField
                    key={f.name}
                    control={form.control}
                    name={f.name as any}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[12px] font-medium text-black dark:text-white">
                                Ghi chú
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={`Ghi chú ${title.toLowerCase()}...`}
                                    className="resize-none min-h-[80px] rounded-xl border-black/[0.1] bg-black/[0.02] focus:bg-white focus:border-[#FD5771] text-[13px] transition-all"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            ))}

            {/* Image upload — compact on mobile */}
            {fields.filter(f => f.type === 'image').map(f => (
                <FormField
                    key={f.name}
                    control={form.control}
                    name={f.name as any}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[12px] font-medium text-black dark:text-white">
                                Ảnh tư thế
                            </FormLabel>
                            <FormControl>
                                <div className="relative mt-1">
                                    {field.value ? (
                                        <div className="relative rounded-xl overflow-hidden border border-black/[0.08]">
                                            <img
                                                src={field.value}
                                                alt={title}
                                                className="w-full max-h-48 object-cover"
                                            />
                                            {/* Floating action buttons */}
                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                                                    onClick={() => document.getElementById(`upload-${f.name}`)?.click()}
                                                >
                                                    <Camera className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full shadow-md bg-red-500 hover:bg-red-600 text-white"
                                                    onClick={() => form.setValue(f.name as any, '')}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="w-full h-16 rounded-xl border border-dashed border-black/20 bg-black/[0.02] flex items-center justify-center gap-3 text-black/40 hover:text-[#FD5771] hover:border-[#FD5771]/50 hover:bg-red-50/30 transition-all"
                                            onClick={() => document.getElementById(`upload-${f.name}`)?.click()}
                                        >
                                            <Camera className="w-4 h-4 shrink-0" />
                                            <span className="text-[12px] font-normal">Tải ảnh chụp tư thế</span>
                                            {isUploading === f.name && (
                                                <span className="text-[11px] text-[#FD5771] animate-pulse ml-1">Đang tải...</span>
                                            )}
                                        </button>
                                    )}
                                    <input
                                        type="file"
                                        id={`upload-${f.name}`}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => onImageUpload(e, f.name)}
                                    />
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
            ))}
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="w-full p-0 flex flex-col h-full gap-0 font-inter overflow-hidden border-l border-black/[0.06] shadow-2xl"
                resizable={!isMobile}
                defaultWidth={680}
                minWidth={360}
                maxWidth={1100}
                showCloseButton={false}
            >
                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="px-4 sm:px-6 py-3 border-b border-black/[0.06] shrink-0 flex items-center gap-3 bg-white dark:bg-slate-950 z-10">
                    <div className="w-7 h-7 rounded-lg bg-[#FD5771]/10 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 text-[#FD5771]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <SheetTitle className="text-[14px] font-medium text-black dark:text-white leading-tight">
                            Đánh giá sai lệch
                        </SheetTitle>
                        <SheetDescription className="text-[11px] text-black/50 dark:text-white/50 font-normal mt-0.5">
                            {initialData ? 'Chỉnh sửa bản ghi đánh giá' : 'Tạo bản ghi đánh giá mới'}
                        </SheetDescription>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            type="button"
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={saveMutation.isPending}
                            className="bg-black hover:bg-slate-800 text-white rounded-xl px-3 font-medium h-9 text-xs gap-1.5 shadow-md transition-all active:scale-[0.98]"
                        >
                            <Save className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">
                                {saveMutation.isPending ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Lưu'}
                            </span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full h-9 w-9 text-black/50 hover:text-black hover:bg-black/[0.05] shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* ── Body ─────────────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#F9FAFB] dark:bg-slate-900/50">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="p-4 sm:p-5 space-y-4 pb-6">

                                    {/* ── Meta controls: client + date ─────── */}
                                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-black/[0.07] dark:border-white/[0.07] space-y-3">

                                        {/* Member select */}
                                        <FormField
                                            control={form.control}
                                            name="client_id"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col min-w-0">
                                                    <FormLabel className="text-[12px] font-medium text-black dark:text-white mb-1">
                                                        Hội viên đánh giá
                                                    </FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11 rounded-xl bg-white border-black/[0.10] text-[13px] w-full">
                                                                <SelectValue placeholder="Chọn hội viên..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="max-h-[280px]">
                                                            <div className="p-2 border-b sticky top-0 bg-white dark:bg-slate-950 z-10">
                                                                <Input
                                                                    placeholder="Tìm khách hàng..."
                                                                    value={searchQuery}
                                                                    onChange={e => setSearchQuery(e.target.value)}
                                                                    className="h-9 text-[13px]"
                                                                />
                                                            </div>
                                                            {filteredContracts.map((c: any) => (
                                                                <SelectItem key={c.id} value={c.client_id} className="text-[13px] py-2">
                                                                    {c.member_name} — {c.id}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Date */}
                                        <FormField
                                            control={form.control}
                                            name="assessment_date"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="text-[12px] font-medium text-black dark:text-white mb-1 flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        Ngày đánh giá
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            className="h-11 rounded-xl border-black/[0.10] bg-white text-[13px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* ── Tabs ─────────────────────────────── */}
                                    <Tabs defaultValue="upper" className="w-full min-w-0">
                                        <TabsList className="grid w-full grid-cols-3 rounded-xl h-11 p-1 bg-black/[0.05] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
                                            <TabsTrigger
                                                value="upper"
                                                className="rounded-lg text-[12px] font-medium h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black dark:data-[state=active]:bg-slate-800 transition-all truncate"
                                            >
                                                Phần trên
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="lower"
                                                className="rounded-lg text-[12px] font-medium h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black dark:data-[state=active]:bg-slate-800 transition-all truncate"
                                            >
                                                Phần dưới
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="final"
                                                className="rounded-lg text-[12px] font-medium h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black dark:data-[state=active]:bg-slate-800 transition-all truncate"
                                            >
                                                Tổng kết
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* Upper body */}
                                        <TabsContent value="upper" className="mt-4 space-y-4 focus-visible:outline-none">
                                            {renderSection('Đầu & Cổ', [
                                                { name: 'forward_head', label: 'Đầu hướng ra trước', type: 'checkbox' },
                                                { name: 'head_tilt_rotation', label: 'Đầu nghiêng / Xoay', type: 'checkbox' },
                                                { name: 'head_notes', label: 'Ghi chú', type: 'textarea' },
                                                { name: 'head_image_url', label: 'Ảnh chụp', type: 'image' },
                                            ])}
                                            {renderSection('Vai & Lưng trên', [
                                                { name: 'uneven_shoulders', label: 'Vai không đều', type: 'checkbox' },
                                                { name: 'rounded_shoulders', label: 'Khum vai', type: 'checkbox' },
                                                { name: 'kyphosis', label: 'Gù lưng', type: 'checkbox' },
                                                { name: 'lordosis', label: 'Võng lưng (trên)', type: 'checkbox' },
                                                { name: 'back_notes', label: 'Ghi chú', type: 'textarea' },
                                                { name: 'back_image_url', label: 'Ảnh chụp', type: 'image' },
                                            ])}
                                        </TabsContent>

                                        {/* Lower body */}
                                        <TabsContent value="lower" className="mt-4 space-y-4 focus-visible:outline-none">
                                            {renderSection('Thắt lưng & Chậu', [
                                                { name: 'pelvic_tilt_anterior', label: 'Chậu nghiêng trước', type: 'checkbox' },
                                                { name: 'pelvic_tilt_posterior', label: 'Chậu nghiêng sau', type: 'checkbox' },
                                                { name: 'pelvic_notes', label: 'Ghi chú', type: 'textarea' },
                                                { name: 'pelvic_image_url', label: 'Ảnh chụp', type: 'image' },
                                            ])}
                                            {renderSection('Đầu gối', [
                                                { name: 'knee_valgus', label: 'Khép gối (Valgus)', type: 'checkbox' },
                                                { name: 'knee_varus', label: 'Mở gối (Varus)', type: 'checkbox' },
                                                { name: 'knee_hyperextension', label: 'Duỗi quá mức', type: 'checkbox' },
                                                { name: 'knee_notes', label: 'Ghi chú', type: 'textarea' },
                                                { name: 'knee_image_url', label: 'Ảnh chụp', type: 'image' },
                                            ])}
                                            {renderSection('Bàn chân', [
                                                { name: 'pronation', label: 'Lệch trong (Pronation)', type: 'checkbox' },
                                                { name: 'supination', label: 'Lệch ngoài (Supination)', type: 'checkbox' },
                                                { name: 'feet_notes', label: 'Ghi chú', type: 'textarea' },
                                                { name: 'feet_image_url', label: 'Ảnh chụp', type: 'image' },
                                            ])}
                                        </TabsContent>

                                        {/* Summary */}
                                        <TabsContent value="final" className="mt-4 focus-visible:outline-none">
                                            <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-black/[0.07] dark:border-white/[0.07] space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-0.5 h-4 rounded-full bg-[#FD5771]" />
                                                    <h3 className="text-[13px] font-medium text-black dark:text-white">Kết luận & Khuyến nghị</h3>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="recommendations"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Nhập các khuyến nghị tập luyện phục hồi..."
                                                                    className="rounded-xl min-h-[160px] text-[13px] bg-black/[0.02] border-black/[0.10] focus:bg-white focus:border-[#FD5771] transition-all"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </ScrollArea>

                            {/* ── Footer ───────────────────────────────────── */}
                            <div className="px-4 py-3 border-t border-black/[0.06] bg-white dark:bg-slate-950 shrink-0 flex items-center gap-2.5 z-10">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-xl font-medium h-11 px-4 text-black/70 hover:text-black hover:bg-black/[0.05] flex-1 text-[13px]"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={saveMutation.isPending}
                                    className="bg-black hover:bg-slate-800 text-white rounded-xl font-medium h-11 text-[13px] transition-all flex items-center justify-center gap-2 flex-[2] active:scale-[0.98]"
                                >
                                    <Save className="w-4 h-4 shrink-0" />
                                    {saveMutation.isPending
                                        ? 'Đang lưu...'
                                        : initialData ? 'Cập nhật' : 'Lưu đánh giá'
                                    }
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
