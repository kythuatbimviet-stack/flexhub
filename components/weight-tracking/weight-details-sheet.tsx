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
    Briefcase,
    Ruler,
    Target,
    ShieldCheck,
    Clock,
    History,
    Activity,
    TrendingUp,
    ClipboardList
} from 'lucide-react'
import { updateWeightRecord, deleteWeightRecord } from '@/app/actions/weight-tracking'
import { fetchContractsByClientId, updateContract } from '@/app/actions/contracts'
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
import { format, addDays, parseISO } from 'date-fns'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Check, Search } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

const CardSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="p-5 space-y-5">
            {children}
        </div>
    </div>
)

const DetailRow = ({ label, value, name, type = "text", icon: Icon, isEditing, formData, handleChange, children }: any) => (
    <div className="space-y-1.5 font-inter">
        <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
            {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
            {label}
        </Label>
        {isEditing && name ? (
            children ? children : (
            type === 'textarea' ? (
                <Textarea
                    name={name}
                    value={formData?.[name] || ''}
                    onChange={handleChange}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] text-sm focus:ring-2 focus:ring-blue-500 shadow-sm resize-none"
                />
            ) : (
                <Input
                    name={name}
                    type={type}
                    step={type === 'number' ? '0.1' : undefined}
                    value={formData?.[name] ?? ''}
                    onChange={handleChange}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
            ))
        ) : (
            <div className="text-[15px] font-medium text-slate-900 dark:text-slate-100 min-h-[20px]">
                {value || <span className="text-slate-400 italic font-normal text-sm">Chưa cập nhật</span>}
            </div>
        )}
    </div>
)

interface WeightDetailsSheetProps {
    record: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    clients: any[]
    users?: any[]
}

export function WeightDetailsSheet({ record, open, onOpenChange, onSuccess, clients, users }: WeightDetailsSheetProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>(null)
    const [openClientSearch, setOpenClientSearch] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [extensionDays, setExtensionDays] = React.useState(0)

    const filteredClientsSorted = React.useMemo(() => {
        if (!searchQuery) return clients
        const q = searchQuery.toLowerCase().trim()
        return clients.filter(c => 
            c.member_name?.toLowerCase().includes(q) || 
            c.phone?.includes(q)
        )
    }, [clients, searchQuery])

    React.useEffect(() => {
        if (record && open) {
            setFormData({
                ...record,
                client_id: record.client_id,
                contract_id: record.contract_id || null,
                measurement_date: record.measurement_date ? record.measurement_date.split('T')[0] : '',
                weight: record.weight,
                target_weight: record.target_weight || null,
                measurements: record.measurements || '',
                next_measurement_date: record.next_measurement_date ? record.next_measurement_date.split('T')[0] : null,
            })
            setIsEditing(false)
            setExtensionDays(0)
        }
    }, [record, open])

    const selectedClientId = formData?.client_id

    const { data: contractsResult, isLoading: contractsLoading } = useQuery({
        queryKey: ['contracts-for-weight', selectedClientId],
        queryFn: async () => {
            const result = await fetchContractsByClientId(selectedClientId)
            if (!result.success) throw new Error(result.error)
            return result.data || []
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

            // Process contract extension if requested
            if (formData.contract_id && extensionDays > 0) {
                const targetContract = contractsResult?.find((c: any) => c.id === formData.contract_id) || record.contracts
                if (targetContract && targetContract.end_date) {
                    const currentEndDate = parseISO(targetContract.end_date)
                    const newEndDate = addDays(currentEndDate, extensionDays)
                    const updateRes = await updateContract(formData.contract_id, {
                        end_date: format(newEndDate, 'yyyy-MM-dd')
                    })
                    if (!updateRes.success) {
                        toast.error(`Số đo đã lưu nhưng lỗi gia hạn hợp đồng: ${updateRes.error}`)
                    } else {
                        toast.success(`Đã gia hạn hợp đồng thêm ${extensionDays} ngày`)
                    }
                }
            }

            toast.success('Cập nhật bản ghi cân nặng thành công')
            setIsEditing(false)
            setExtensionDays(0)
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

    const client = formData ? clients.find(c => c.id === formData.client_id) : null
    const contract = formData && contractsResult ? (contractsResult.find((c: any) => c.id === formData.contract_id) || record.contracts) : record?.contracts
    const performer = record && users ? users.find((u: any) => u.email === record.created_by || u.id === record.created_by) : null

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
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-200 dark:shadow-none shrink-0">
                                <Scale className="w-8 h-8" />
                            </div>
                            <div className="flex flex-1 items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {formData.weight}<span className="text-lg ml-1 font-bold text-slate-400 uppercase">kg</span>
                                    </h1>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {format(new Date(formData.measurement_date), 'dd/MM/yyyy')}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cần đạt</p>
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formData.target_weight || '-'}<span className="text-[10px] ml-0.5 font-bold uppercase">kg</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Hội viên & Hợp đồng */}
                    <CardSection title="Hội viên & Gói tập" icon={User}>
                        <div className="space-y-5">
                            <DetailRow 
                                label="Hội viên" 
                                value={client?.member_name} 
                                name="client_id" 
                                icon={User}
                                isEditing={isEditing}
                                formData={formData}
                                handleChange={handleChange}
                            >
                                <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openClientSearch}
                                            className="w-full justify-between rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm font-medium"
                                        >
                                            {formData.client_id
                                                ? clients.find((c) => c.id === formData.client_id)?.member_name
                                                : "Chọn hội viên..."}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl" align="start">
                                        <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-950">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Tìm khách hàng..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="h-10 w-full pl-10 border-none bg-slate-50 dark:bg-slate-900 rounded-xl text-[14px] font-medium focus-visible:ring-1 focus-visible:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>
                                        <ScrollArea className="max-h-[300px]">
                                            {filteredClientsSorted.length === 0 ? (
                                                <div className="py-6 text-center text-sm text-slate-500">
                                                    Không tìm thấy kết quả
                                                </div>
                                            ) : (
                                                <div className="p-2 space-y-1">
                                                    {filteredClientsSorted.map((c: any) => (
                                                        <div
                                                            key={c.id}
                                                            className={cn(
                                                                "flex flex-col gap-0.5 px-4 py-3 text-sm rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-all",
                                                                formData.client_id === c.id && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                                                            )}
                                                            onClick={() => {
                                                                setFormData((prev: any) => ({ ...prev, client_id: c.id, contract_id: null }))
                                                                setOpenClientSearch(false)
                                                                setSearchQuery('')
                                                            }}
                                                        >
                                                            <span>{c.member_name}</span>
                                                            <span className="text-[11px] opacity-60 font-medium">{c.phone || 'Chưa có SĐT'}</span>
                                                            {formData.client_id === c.id && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </DetailRow>

                            <div className="space-y-1.5 font-inter">
                                <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Briefcase className="w-3.5 h-3.5 opacity-70" />
                                    Hợp đồng áp dụng
                                </Label>
                                {isEditing ? (
                                    <Select 
                                        onValueChange={(v) => setFormData((prev: any) => ({ ...prev, contract_id: v === 'none' ? null : v }))} 
                                        value={formData.contract_id || 'none'}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm">
                                            <SelectValue placeholder={contractsLoading ? "Đang tải..." : "Chọn hợp đồng"} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 font-inter">
                                            <SelectItem value="none">Không áp dụng hợp đồng</SelectItem>
                                            {contractsResult?.filter((c: any) => c.status !== 'Hết hạn HĐ').map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.package_name || c.registration_type} ({c.id.slice(-4)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="text-[15px] font-medium text-slate-900 dark:text-slate-100 min-h-[20px]">
                                        {contract?.package_name || contract?.registration_type || <span className="text-slate-400 italic font-normal text-sm">Không áp dụng</span>}
                                    </div>
                                )}
                            </div>

                            {isEditing && formData?.contract_id && (
                                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-[12px] font-bold text-blue-700 dark:text-blue-300 uppercase">Gia hạn hợp đồng</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-medium text-blue-600/70 dark:text-blue-400/70">Số ngày gia hạn thêm</Label>
                                        <div className="flex gap-2">
                                            <Input 
                                                type="number" 
                                                min="0"
                                                value={extensionDays}
                                                onChange={(e) => setExtensionDays(parseInt(e.target.value) || 0)}
                                                className="rounded-xl border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                                                placeholder="Ví dụ: 7, 14, 30..."
                                            />
                                            <div className="flex items-center px-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                                NGÀY
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 italic mt-1 leading-relaxed">
                                            Lưu ý: Hệ thống sẽ cộng dồn số ngày này vào ngày kết thúc hiện tại của hợp đồng.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardSection>

                    {/* Section: Chỉ số đo lường */}
                    <CardSection title="Chỉ số đo lường" icon={Activity}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <DetailRow 
                                label="Cân nặng thực tế (kg)" 
                                value={formData.weight ? `${formData.weight} kg` : ''} 
                                name="weight" 
                                type="number" 
                                icon={Scale}
                                isEditing={isEditing}
                                formData={formData}
                                handleChange={handleChange}
                            />
                            <DetailRow 
                                label="Cân nặng cần đạt (kg)" 
                                value={formData.target_weight ? `${formData.target_weight} kg` : ''} 
                                name="target_weight" 
                                type="number" 
                                icon={Target}
                                isEditing={isEditing}
                                formData={formData}
                                handleChange={handleChange}
                            />
                            <DetailRow 
                                label="Ngày đo" 
                                value={formData.measurement_date} 
                                name="measurement_date" 
                                type="date" 
                                icon={Calendar}
                                isEditing={isEditing}
                                formData={formData}
                                handleChange={handleChange}
                            />
                            <DetailRow 
                                label="Ngày hẹn tiếp theo" 
                                value={formData.next_measurement_date} 
                                name="next_measurement_date" 
                                type="date" 
                                icon={Clock}
                                isEditing={isEditing}
                                formData={formData}
                                handleChange={handleChange}
                            />
                        </div>
                    </CardSection>

                    {/* Section: Ghi chú & Nhận xét */}
                    <CardSection title="Ghi chú & Nhận xét" icon={ClipboardList}>
                        <DetailRow 
                            label="Nội dung ghi chú" 
                            name="measurements" 
                            type="textarea" 
                            value={formData.measurements} 
                            icon={ClipboardList}
                            isEditing={isEditing}
                            formData={formData}
                            handleChange={handleChange}
                        />
                    </CardSection>

                    {/* Section: Thông tin hệ thống */}
                    <CardSection title="Thông tin hệ thống" icon={ShieldCheck}>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Người thực hiện</p>
                                <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 opacity-50" />
                                    {performer?.name || record.created_by?.split('@')[0] || 'System'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tháng báo cáo</p>
                                <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 opacity-50" />
                                    {formData.month || '-'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Thời gian tạo</p>
                                <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 opacity-50" />
                                    {formData.created_at ? format(new Date(formData.created_at), 'HH:mm dd/MM/yyyy') : '-'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Cập nhật cuối</p>
                                <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5 opacity-50" />
                                    {formData.updated_at ? format(new Date(formData.updated_at), 'HH:mm dd/MM/yyyy') : '-'}
                                </p>
                            </div>
                        </div>
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
