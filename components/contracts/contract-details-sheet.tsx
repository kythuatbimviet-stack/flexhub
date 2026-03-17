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
import {
    FileText,
    User,
    Building2,
    Calendar,
    CreditCard,
    Package,
    Dumbbell,
    Edit2,
    Save,
    Trash2,
    X,
    BadgeCheck,
    Clock,
    Phone,
    Mail,
    MapPin,
    Cloud,
    ExternalLink
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { fetchBranches } from '@/app/actions/branches'
import { toast } from 'sonner'
import { updateContract, deleteContract } from '@/app/actions/contracts'
import { uploadSignature } from '@/app/actions/storage'
import { SignatureField } from '@/components/ui/signature-field'
import { fetchConfigParams, ConfigItem } from '@/app/actions/config-params'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { FinalizeContractDialog } from './finalize-contract-dialog'
import { Loader2, Download } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { canAccessRecord } from '@/lib/permissions'

// ─── Component con nằm NGOÀI component cha để tránh re-mount khi state thay đổi ───
const ContractCardSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-[12px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{title}</h3>
        </div>
        {children}
    </div>
)

const ContractDetailRow = ({ label, value, name, type = 'text', icon: Icon, isEditing, formData, onChange }: any) => (
    <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            {Icon && <Icon className="w-3 h-3" />}
            {label} {isEditing && ['package_name', 'payment_method', 'quantity', 'total_amount', 'status', 'id_number', 'email'].includes(name) && <span className="text-red-500">*</span>}
        </Label>
        {isEditing ? (
            <Input
                name={name}
                type={type}
                value={formData[name] ?? ''}
                onChange={onChange}
                className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
            />
        ) : (
            <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200 min-h-[20px]">
                {type === 'number' && value ? Number(value).toLocaleString('vi-VN') + ' ₫' : (value || '-')}
            </p>
        )}
    </div>
)
// ─────────────────────────────────────────────────────────────────────────────

interface ContractDetailsSheetProps {
    contract: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ContractDetailsSheet({
    contract,
    open,
    onOpenChange,
    onSuccess
}: ContractDetailsSheetProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})
    const { permissions, user: currentUser, isLoading: permsLoading } = usePermissions()

    const hasAccess = React.useMemo(() => {
        if (!currentUser || !contract) return false
        // For contracts, we check against the contract record
        return canAccessRecord(currentUser, contract)
    }, [currentUser, contract])
    const [branches, setBranches] = React.useState<any[]>([])
    const [statuses, setStatuses] = React.useState<ConfigItem[]>([])
    const [showFinalizeDialog, setShowFinalizeDialog] = React.useState(false)
    const [generatingPdf, setGeneratingPdf] = React.useState(false)

    const defaultStatus = React.useMemo(() => {
        return statuses.find(s => s.is_default)?.nam || statuses[0]?.nam || 'Đang thực hiện'
    }, [statuses])

    React.useEffect(() => {
        if (open) {
            const loadData = async () => {
                const [branchesRes, statusRes] = await Promise.all([
                    fetchBranches(),
                    fetchConfigParams('config_contract_status'),
                ])
                if (branchesRes.success) setBranches(branchesRes.data || [])
                if (statusRes.success) setStatuses(statusRes.data || [])
            }
            loadData()
        }
    }, [open])

    React.useEffect(() => {
        if (contract) {
            setFormData(contract)
            setIsEditing(false)
        }
    }, [contract])

    // Listen for Realtime updates to the PDF URL
    React.useEffect(() => {
        if (!open || !contract?.id) return

        const supabase = createClient()
        const channel = supabase
            .channel(`contract-${contract.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'contracts',
                    filter: `id=eq.${contract.id}`
                },
                (payload) => {
                    const newUrl = payload.new.contract_file_url
                    if (newUrl && newUrl !== 'create_contract') {
                        setFormData((prev: any) => ({ ...prev, contract_file_url: newUrl }))
                        setGeneratingPdf(false)
                        toast.success('Hợp đồng PDF đã sẵn sàng!')
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [open, contract?.id])

    if (!contract) return null

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            let finalFormData = { ...formData }

            // Nếu chữ ký khách hàng là base64, upload lên Storage
            if (formData.signature_url && formData.signature_url.startsWith('data:image')) {
                const fileName = `client_sig_${contract.id}_${Date.now()}.png`
                const uploadResult = await uploadSignature(formData.signature_url, fileName)
                
                if (uploadResult.success) {
                    finalFormData.signature_url = uploadResult.url
                } else {
                    toast.error('Không thể upload chữ ký khách hàng: ' + uploadResult.error)
                    return
                }
            }

            const result = await updateContract(contract.id, finalFormData)
            if (result.success) {
                toast.success('Đã cập nhật hợp đồng')
                setIsEditing(false)
                onSuccess()
            } else {
                toast.error('Lỗi khi cập nhật: ' + result.error)
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi không xác định')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
            setLoading(true)
            try {
                const result = await deleteContract(contract.id)
                if (result.success) {
                    toast.success('Đã xóa hợp đồng thành công')
                    onOpenChange(false)
                    onSuccess()
                } else {
                    toast.error('Lỗi khi xóa: ' + result.error)
                }
            } catch (error) {
                toast.error('Đã xảy ra lỗi không xác định')
            } finally {
                setLoading(false)
            }
        }
    }

    const handleExportPDF = () => {
        if (!contract?.id) return
        window.open(`/contracts/print/${encodeURIComponent(contract.id)}`, '_blank')
    }

    const handleExportPDFV2 = () => {
        if (!contract?.id) return
        window.open(`/contracts/print-v3/${encodeURIComponent(contract.id)}`, '_blank')
    }

    const handleGenerateDocPDF = async () => {
        if (!contract?.id) return
        
        // Trigger generation status
        try {
            await updateContract(contract.id, {
                contract_file_url: 'create_contract'
            })
            // Open new preview page in a new tab (dashboard route)
            window.open(`/contracts/preview-gdoc/${contract.id}`, '_blank')
        } catch (error: any) {
            toast.error('Lỗi hệ thống: ' + error.message)
        }
    }

    const sharedRowProps = { isEditing, formData, onChange: handleInputChange }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                resizable
                showCloseButton={false}
                className="w-full border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-gray-950 font-inter"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>
                        {isEditing ? 'Chỉnh sửa Hợp đồng' : `Hợp đồng: ${contract.member_name}`}
                    </SheetTitle>
                    <SheetDescription>
                        Chi tiết thông tin hợp đồng #{contract.id}
                    </SheetDescription>
                </SheetHeader>

                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {isEditing ? 'Chỉnh sửa Hợp đồng' : `Hợp đồng: ${contract.member_name}`}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">ID: {contract.id}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {!isEditing && hasAccess && (
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
                    {/* Top Status Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-start gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 shrink-0">
                                <FileText className="w-12 h-12" />
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                    {contract.package_name}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate italic">
                                    {contract.member_name}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium tracking-tight",
                                        (formData.status || defaultStatus) === 'Chờ ký HĐ' ? "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30" :
                                            (formData.status || defaultStatus) === 'Đã ký HĐ' ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30" :
                                                "bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full",
                                            (formData.status || defaultStatus) === 'Chờ ký HĐ' ? "bg-amber-500" :
                                                (formData.status || defaultStatus) === 'Đã ký HĐ' ? "bg-emerald-500" :
                                                    "bg-slate-400"
                                        )} />
                                        {formData.status || defaultStatus}
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-[10px] font-medium tracking-tight bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
                                        {branches?.find((b: any) => b.id === formData.branch_id)?.name || contract.branches?.name || 'Chi nhánh'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {formData.status === 'Chờ ký HĐ' && !isEditing && hasAccess && (
                            <div className="mt-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                    <BadgeCheck className="w-5 h-5" />
                                    <span className="text-sm font-bold">Hợp đồng đang chờ ký kết</span>
                                </div>
                                <Button
                                    onClick={() => setShowFinalizeDialog(true)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 shadow-lg shadow-emerald-100 dark:shadow-none"
                                >
                                    Chốt Ký HĐ Ngay
                                </Button>
                            </div>
                        )}

                        {/* Show summary even if no edit access, but actions are restricted elsewhere */}
                        {!isEditing && (
                            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-3">
                                <div className="flex-1 flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Tổng tiền</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {formData.total_amount ? Number(formData.total_amount).toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
                                <div className="flex-1 flex flex-col items-center text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Kết thúc</span>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {formData.end_date ? new Date(formData.end_date).toLocaleDateString('vi-VN') : '-'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section: Thông tin khách hàng */}
                    <ContractCardSection title="Thông tin khách hàng" icon={User}>
                        <div className="space-y-5">
                            <ContractDetailRow label="Hội viên" value={formData.member_name} name="member_name" icon={User} {...sharedRowProps} />
                            <div className="grid grid-cols-2 gap-5">
                                <ContractDetailRow label="Số điện thoại" value={formData.phone} name="phone" icon={Phone} {...sharedRowProps} />
                                <ContractDetailRow label="Email" value={formData.email} name="email" icon={Mail} {...sharedRowProps} />
                            </div>
                            <ContractDetailRow label="Căn cước công dân" value={formData.id_number} name="id_number" icon={FileText} {...sharedRowProps} />
                            <ContractDetailRow label="Địa chỉ" value={formData.member_address} name="member_address" icon={MapPin} {...sharedRowProps} />
                        </div>
                    </ContractCardSection>

                    {/* Section: Chi tiết hợp đồng */}
                    <ContractCardSection title="Chi tiết hợp đồng" icon={Package}>
                        <div className="space-y-5">
                            <ContractDetailRow label="Gói tập" value={formData.package_name} name="package_name" icon={Package} {...sharedRowProps} />
                            <div className="grid grid-cols-2 gap-5">
                                <ContractDetailRow label="Ngày bắt đầu" value={formData.start_date} name="start_date" type="date" icon={Calendar} {...sharedRowProps} />
                                <ContractDetailRow label="Ngày kết thúc" value={formData.end_date} name="end_date" type="date" icon={Calendar} {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <ContractDetailRow label="Số lượng/Tháng" value={formData.quantity} name="quantity" type="number" icon={Clock} {...sharedRowProps} />
                                <ContractDetailRow label="Huấn luyện viên" value={formData.trainer_name} name="trainer_name" icon={Dumbbell} {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Building2 className="w-3 h-3" />
                                        Chi nhánh
                                    </Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.branch_id}
                                            onValueChange={(val: string) => setFormData((prev: any) => ({ ...prev, branch_id: val }))}
                                        >
                                            <SelectTrigger className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm">
                                                <SelectValue placeholder="Chọn chi nhánh" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                            {branches?.find((b: any) => b.id === formData.branch_id)?.name || contract.branches?.name || '-'}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        Trạng thái
                                    </Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.status}
                                            onValueChange={(val: string) => setFormData((prev: any) => ({ ...prev, status: val }))}
                                        >
                                            <SelectTrigger className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm">
                                                <SelectValue placeholder="Chọn trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map(status => (
                                                    <SelectItem key={status.id} value={status.nam}>{status.nam}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">{formData.status || defaultStatus}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Thanh toán */}
                    <ContractCardSection title="Thanh toán" icon={CreditCard}>
                        <div className="space-y-5">
                            <ContractDetailRow label="Hình thức" value={formData.payment_method} name="payment_method" icon={CreditCard} {...sharedRowProps} />
                            <div className="grid grid-cols-2 gap-5">
                                <ContractDetailRow label="Giá gói (niêm yết)" value={formData.package_price} name="package_price" type="number" icon={CreditCard} {...sharedRowProps} />
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bằng chữ</Label>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 italic min-h-[20px]">{formData.package_price_text || '-'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <ContractDetailRow label="Giá trợ giá" value={formData.discounted_price} name="discounted_price" type="number" icon={CreditCard} {...sharedRowProps} />
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bằng chữ</Label>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 italic min-h-[20px]">{formData.discounted_price_text || '-'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <ContractDetailRow label="Tổng giá trị HĐ" value={formData.total_amount} name="total_amount" type="number" icon={CreditCard} {...sharedRowProps} />
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bằng chữ</Label>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 italic min-h-[20px]">{formData.total_amount_text || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Chữ ký khách hàng */}
                    <ContractCardSection title="Chữ ký khách hàng" icon={Cloud}>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Cloud className="w-3 h-3" />
                                    Chữ ký khách hàng
                                </Label>
                                {isEditing ? (
                                    <SignatureField
                                        value={formData.signature_url}
                                        onChange={(val) => setFormData((prev: any) => ({ ...prev, signature_url: val }))}
                                    />
                                ) : (
                                    formData.signature_url ? (
                                        <div className="flex flex-col items-center justify-center p-4 min-h-[120px] bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                            <img 
                                                src={formData.signature_url} 
                                                alt="Chữ ký khách hàng" 
                                                className="max-h-32 object-contain"
                                                onError={(e: any) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Chưa có chữ ký</p>
                                    )
                                )}
                            </div>
                        </div>
                    </ContractCardSection>
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
                            <div className="flex items-center gap-2">
                                {formData.status === 'Chờ ký HĐ' && hasAccess && (
                                    <Button
                                        onClick={() => setShowFinalizeDialog(true)}
                                        className="rounded-xl h-11 px-6 font-bold text-[13px] bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20 transition-all font-inter active:scale-95"
                                        disabled={loading}
                                    >
                                        <BadgeCheck className="w-4 h-4 mr-2" />
                                        Chốt Ký HĐ
                                    </Button>
                                )}
                                {/* Other export actions might be allowed for everyone who can see the record */}
                                <Button
                                    onClick={handleGenerateDocPDF}
                                    variant="outline"
                                    disabled={generatingPdf || !hasAccess} // maybe prevent regen if no access
                                    className="rounded-xl h-11 px-6 font-bold text-[13px] border-blue-100 text-blue-700 hover:bg-blue-50 dark:border-blue-900/30 dark:hover:bg-blue-950/20 transition-all font-inter border-2"
                                    title="Tạo file PDF từ mẫu Google Doc và lưu vào Drive"
                                >
                                    {generatingPdf ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Cloud className="w-4 h-4 mr-2 text-blue-500" />
                                    )}
                                    Xuất lại hợp đồng
                                </Button>
                                {formData.contract_file_url && formData.contract_file_url !== 'create_contract' && (
                                    <Button
                                        onClick={() => window.open(`/contracts/preview-gdoc/${encodeURIComponent(contract.id)}`, '_blank')}
                                        variant="ghost"
                                        className="rounded-xl h-11 px-4 font-bold text-[13px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all font-inter"
                                        title="Xem bản xem trước PDF (Print Preview)"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                )}
                                {contract.status === 'Chờ ký HĐ' && hasAccess && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDelete()}
                                        className="h-11 w-11 rounded-xl border-red-50 text-red-500 hover:bg-red-50 hover:border-red-100 transition-all active:scale-95 border-2"
                                        title="Xóa hợp đồng"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                                {hasAccess && (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className="rounded-xl h-11 px-8 font-bold text-[13px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all font-inter active:scale-95"
                                        disabled={loading}
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Sửa
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <FinalizeContractDialog
                    contract={contract}
                    open={showFinalizeDialog}
                    onOpenChange={setShowFinalizeDialog}
                    onSuccess={() => {
                        onSuccess()
                        onOpenChange(false)
                    }}
                />

            </SheetContent>
        </Sheet>
    )
}
