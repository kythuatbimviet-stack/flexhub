'use client'

import * as React from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    User,
    Calendar,
    Scale,
    Edit2,
    Trash2,
    Save,
    X,
    Activity,
    ClipboardList,
    TrendingUp,
    ChevronDown,
    Building2,
    Briefcase
} from 'lucide-react'
import { updateWeightRecord, deleteWeightRecord } from '@/app/actions/weight-tracking'
import { fetchContracts } from '@/app/actions/contracts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

interface WeightDetailsSheetProps {
    record: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    clients: any[]
}

export function WeightDetailsSheet({ record, open, onOpenChange, onSuccess, clients }: WeightDetailsSheetProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>(null)

    React.useEffect(() => {
        if (record) {
            setFormData({
                ...record,
                client_id: record.client_id,
                contract_id: record.contract_id || null,
                measurement_date: record.measurement_date,
                weight: record.weight,
                measurements: record.measurements || '',
                next_measurement_date: record.next_measurement_date || null,
            })
            setIsEditing(false)
        }
    }, [record])

    const selectedClientId = formData?.client_id

    const { data: contractsResult } = useQuery({
        queryKey: ['contracts-for-weight', selectedClientId],
        queryFn: async () => {
            const result = await fetchContracts()
            if (!result.success) throw new Error(result.error)
            const list = (result.data || []).filter((c: any) => c.client_id === selectedClientId)
            return list.sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        },
        enabled: !!selectedClientId && isEditing,
    })

    if (!record || !formData) return null

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await updateWeightRecord(record.id, {
                ...formData,
                updated_at: new Date().toISOString(),
            })
            if (!result.success) throw new Error(result.error)

            toast.success('Cập nhật bản ghi cân nặng thành công')
            setIsEditing(false)
            onSuccess()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi cập nhật')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
            setLoading(true)
            try {
                const result = await deleteWeightRecord(record.id)
                if (!result.success) throw new Error(result.error)

                toast.success('Đã xóa bản ghi thành công')
                onOpenChange(false)
                onSuccess()
            } catch (error: any) {
                toast.error(error.message || 'Lỗi khi xóa')
            } finally {
                setLoading(false)
            }
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        const type = (e.target as any).type
        const finalValue = type === 'number' ? parseFloat(value) : value
        setFormData((prev: any) => ({ ...prev, [name]: finalValue }))
    }

    const CardSection = ({ title, icon: Icon, children }: any) => (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-5">
            <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-[12px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{title}</h3>
            </div>
            <div className="p-5 space-y-5">
                {children}
            </div>
        </div>
    )

    const DetailRow = ({ label, value, name, type = "text", icon: Icon }: any) => (
        <div className="space-y-1.5 font-inter">
            <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />}
                {label}
            </Label>
            {isEditing ? (
                type === 'textarea' ? (
                    <Textarea
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] text-sm focus:ring-2 focus:ring-blue-500 shadow-sm resize-none"
                    />
                ) : (
                    <Input
                        name={name}
                        type={type}
                        step={type === 'number' ? '0.1' : undefined}
                        value={formData[name] ?? ''}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                )
            ) : (
                <div className="text-[15px] font-medium text-slate-700 dark:text-slate-200 min-h-[20px]">
                    {value || <span className="text-slate-300 italic font-normal text-sm">Chưa cập nhật</span>}
                </div>
            )}
        </div>
    )

    const client = clients.find(c => c.id === formData.client_id)
    const contract = contractsResult?.find((c: any) => c.id === formData.contract_id) || record.contracts

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[480px] border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-gray-950"
            >
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <SheetHeader className="flex flex-row items-center gap-3 space-y-0 text-left">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <SheetTitle className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Chi tiết số đo</SheetTitle>
                                <SheetDescription className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {client?.member_name} - {format(new Date(record.measurement_date), 'dd/MM/yyyy')}
                                </SheetDescription>
                            </div>
                        </SheetHeader>
                    </div>
                    <div className="flex items-center gap-1">
                        {!isEditing && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleDelete}
                                    className="sm:hidden rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    disabled={loading}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsEditing(true)}
                                    className="sm:hidden rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                    disabled={loading}
                                >
                                    <Edit2 className="w-5 h-5" />
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4">
                    {/* Summary Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-200 dark:shadow-none">
                                <Scale className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {formData.weight}<span className="text-lg ml-1 font-bold text-slate-400 uppercase">kg</span>
                                </h1>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {format(new Date(formData.measurement_date), 'dd/MM/yyyy')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Hội viên & Hợp đồng */}
                    <CardSection title="Hội viên & Gói tập" icon={User}>
                        <div className="space-y-5">
                            <DetailRow label="Hội viên" value={client?.member_name} icon={User} />

                            <div className="space-y-1.5 font-inter">
                                <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase className="w-3 h-3" />
                                    Hợp đồng
                                </Label>
                                {isEditing ? (
                                    <Select onValueChange={(v) => setFormData((prev: any) => ({ ...prev, contract_id: v }))} value={formData.contract_id || undefined}>
                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm">
                                            <SelectValue placeholder="Chọn hợp đồng" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {contractsResult?.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>{c.registration_type}</SelectItem>
                                            ))}
                                            {contractsResult?.length === 0 && <SelectItem value="none" disabled>Không có hợp đồng</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                            {contract?.registration_type || 'N/A'}
                                        </p>
                                        {contract?.branches?.name && (
                                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 text-[10px] font-bold uppercase">
                                                {contract.branches.name}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardSection>

                    {/* Section: Chỉ số đo lường */}
                    <CardSection title="Chỉ số đo lường" icon={TrendingUp}>
                        <div className="grid grid-cols-2 gap-5">
                            <DetailRow label="Cân nặng (kg)" value={`${formData.weight} kg`} name="weight" type="number" icon={Scale} />
                            <DetailRow label="Ngày đo" value={format(new Date(formData.measurement_date), 'dd/MM/yyyy')} name="measurement_date" type="date" icon={Calendar} />
                            <DetailRow label="Ngày đo tiếp theo" value={formData.next_measurement_date ? format(new Date(formData.next_measurement_date), 'dd/MM/yyyy') : '-'} name="next_measurement_date" type="date" icon={Calendar} />
                        </div>
                    </CardSection>

                    {/* Section: Ghi chú & Nhận xét */}
                    <CardSection title="Ghi chú & Nhận xét" icon={ClipboardList}>
                        <DetailRow label="Nội dung" value={formData.measurements} name="measurements" type="textarea" />
                    </CardSection>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl h-11 px-6 font-bold text-[13px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-inter"
                        disabled={loading}
                    >
                        Đóng
                    </Button>

                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                className="rounded-xl h-11 px-4 font-bold text-[13px] border-red-50 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:hover:bg-red-950/20 transition-all font-inter border-2"
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}

                        {isEditing ? (
                            <Button
                                onClick={handleSave}
                                className="rounded-xl h-11 px-8 font-bold text-[13px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all font-inter active:scale-95"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Đang lưu...' : 'Lưu lại'}
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="rounded-xl h-11 px-10 font-bold text-[13px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all font-inter active:scale-95"
                                disabled={loading}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
