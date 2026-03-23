'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
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
    Phone,
    Cloud,
    ExternalLink,
    MapPin,
    Mail,
    Clock,
    UserCircle,
    Hash,
    MessageSquare,
    Camera,
    Loader2,
    UserCheck,
    Search,
    ShieldCheck,
    Activity,
    AlertCircle
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchBranches } from '@/app/actions/branches'
import { fetchUsers } from '@/app/actions/users'
import { toast } from 'sonner'
import { updateContract, deleteContract } from '@/app/actions/contracts'
import { addDays, format } from 'date-fns'
import { updateClient } from '@/app/actions/clients'
import { uploadSignature } from '@/app/actions/storage'
import { SignatureField } from '@/components/ui/signature-field'
import { fetchConfigParams, ConfigItem } from '@/app/actions/config-params'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { FinalizeContractDialog } from './finalize-contract-dialog'
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

const ContractDetailRow = ({ label, value, name, type = 'text', icon: Icon, isEditing, formData, onChange }: any) => {
    const isCurrency = ['package_price', 'discounted_price', 'total_amount'].includes(name)
    
    // Format the value for display in the input while editing
    const getEditValue = () => {
        const val = formData[name] ?? ''
        if (isCurrency && val) {
            return Number(val).toLocaleString('vi-VN')
        }
        return val
    }

    const handleInternalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isCurrency) {
            // Strip non-digit characters to keep the underlying value as a raw number string
            const rawValue = e.target.value.replace(/\D/g, '')
            onChange(name, rawValue)
        } else {
            onChange(e)
        }
    }

    return (
        <div className="space-y-1.5 w-full">
            <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />}
                {label} {isEditing && ['package_name', 'payment_method', 'quantity', 'total_amount', 'status', 'id_number', 'email'].includes(name) && <span className="text-red-500">*</span>}
            </Label>
            {isEditing ? (
                <Input
                    name={name}
                    type={isCurrency ? 'text' : type}
                    value={getEditValue()}
                    onChange={handleInternalChange}
                    className="w-full rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
                />
            ) : (
                <p className="text-[15px] font-medium text-slate-700 dark:text-slate-100 min-h-[20px] w-full break-words">
                    {type === 'number' && value ? (['quantity', 'total_sessions', 'package_duration'].includes(name) ? Number(value).toLocaleString('vi-VN') : Number(value).toLocaleString('vi-VN') + ' ₫') : (value || '-')}
                </p>
            )}
        </div>
    )
}
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
    const isMobile = useIsMobile()
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})
    const { permissions, user: currentUser, isLoading: permsLoading } = usePermissions()
    const avatarInputRef = React.useRef<HTMLInputElement>(null)

    const hasAccess = React.useMemo(() => {
        if (!currentUser || !contract) return false
        // For contracts, we check against the contract record
        return canAccessRecord(currentUser, contract)
    }, [currentUser, contract])
    const [branches, setBranches] = React.useState<any[]>([])
    const [statuses, setStatuses] = React.useState<ConfigItem[]>([])
    const [trainerTypes, setTrainerTypes] = React.useState<ConfigItem[]>([])
    const [users, setUsers] = React.useState<any[]>([])
    const [ptSearchTerm, setPtSearchTerm] = React.useState('')
    const [ptOpen, setPtOpen] = React.useState(false)
    const [showFinalizeDialog, setShowFinalizeDialog] = React.useState(false)
    const [generatingPdf, setGeneratingPdf] = React.useState(false)

    const defaultStatus = React.useMemo(() => {
        return statuses.find(s => s.is_default)?.nam || statuses[0]?.nam || 'Chờ ký HĐ'
    }, [statuses])

    React.useEffect(() => {
        if (open) {
            const loadData = async () => {
                const [branchesRes, statusRes, trainerTypeRes, usersRes] = await Promise.all([
                    fetchBranches(),
                    fetchConfigParams('config_contract_status'),
                    fetchConfigParams('config_contract_trainer_type'),
                    fetchUsers()
                ])
                if (branchesRes.success) setBranches(branchesRes.data || [])
                if (statusRes.success) setStatuses(statusRes.data || [])
                if (trainerTypeRes.success) setTrainerTypes(trainerTypeRes.data || [])
                if (usersRes.success) setUsers(usersRes.data || [])
            }
            loadData()
        }
    }, [open])

    React.useEffect(() => {
        if (contract) {
            // Include client's avatar and core info in the form data
            setFormData({
                ...contract,
                avatar_url: contract.clients?.avatar_url || '',
                dob: contract.dob || contract.clients?.dob || '',
                client_status: contract.clients?.status || '',
                medical_condition: contract.medical_condition || contract.medical_history || '',
                initial_height: contract.initial_height?.toString() || '',
                initial_weight: contract.initial_weight?.toString() || '',
            })
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

    const handleInputChange = (eOrName: React.ChangeEvent<HTMLInputElement> | string, value?: string) => {
        if (typeof eOrName === 'string') {
            setFormData((prev: any) => ({ ...prev, [eOrName]: value }))
        } else {
            const { name, value } = eOrName.target
            setFormData((prev: any) => ({ ...prev, [name]: value }))
        }
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData((prev: any) => ({ ...prev, avatar_url: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const daysRemaining = React.useMemo(() => {
        if (!formData.end_date) return '-'
        const end = new Date(formData.end_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diff = end.getTime() - today.getTime()
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
        return days > 0 ? `${days} ngày` : 'Hết hạn'
    }, [formData.end_date])

    // Auto-calculate end_date based on start_date and total_sessions (1 session = 2.5 days)
    React.useEffect(() => {
        if (!isEditing || !formData.start_date || !formData.total_sessions) return

        try {
            const startDate = new Date(formData.start_date)
            const sessions = parseInt(formData.total_sessions.toString())
            if (!isNaN(startDate.getTime()) && !isNaN(sessions)) {
                // Calculation: 1 session = 2.5 days (e.g., 36 sessions = 90 days)
                const days = Math.floor(sessions * 2.5)
                const newEndDate = addDays(startDate, days)
                const formattedEndDate = format(newEndDate, 'yyyy-MM-dd')
                
                if (formattedEndDate !== formData.end_date) {
                    setFormData((prev: any) => ({ ...prev, end_date: formattedEndDate }))
                }
            }
        } catch (e) {
            console.error('Error calculating end_date:', e)
        }
    }, [formData.start_date, formData.total_sessions, isEditing, formData.end_date])

    const sharedRowProps = React.useMemo(() => ({ isEditing, formData, onChange: handleInputChange }), [isEditing, formData, handleInputChange])

    if (!contract) return null

    const handleSave = async () => {
        setLoading(true)
        try {
            let finalFormData = { ...formData }

            // 1. Upload avata if changed (and it's a base64 string)
            if (formData.avatar_url && formData.avatar_url.startsWith('data:image')) {
                const fileName = `avatar_${contract.client_id}_${Date.now()}.png`
                const uploadResult = await uploadSignature(formData.avatar_url, fileName)
                
                if (uploadResult.success) {
                    finalFormData.avatar_url = uploadResult.url
                } else {
                    toast.error('Không thể upload ảnh đại diện: ' + uploadResult.error)
                }
            }

            // Sync client profile info
            const clientUpdates: any = {
                avatar_url: finalFormData.avatar_url,
                member_name: formData.member_name,
                phone: formData.phone,
                email: formData.email,
                address: formData.member_address,
                dob: formData.dob,
                status: formData.client_status
            }
            await updateClient(contract.client_id, clientUpdates)

            // 2. Chữ ký khách hàng
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

            // 3. FILTER OUT non-existent columns in contracts table
            // Based on the user's warning and the schema provided
            const { 
                avatar_url, 
                client_status, // This is for 'clients' table, delete it
                clients, 
                branches, 
                memberships,
                daysRemaining, // computed
                ...contractDataOnly 
            } = finalFormData

            const result = await updateContract(contract.id, contractDataOnly)
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


    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                resizable={!isMobile}
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
                        <div 
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center overflow-visible transition-all relative group",
                                isEditing ? "ring-2 ring-blue-500 cursor-pointer hover:ring-blue-600" : "bg-blue-100 dark:bg-blue-900/30 shadow-sm"
                            )}
                            onClick={() => isEditing && avatarInputRef.current?.click()}
                        >
                            <Avatar className="w-full h-full rounded-full overflow-hidden">
                                <AvatarImage src={formData.avatar_url || ''} className="object-cover" />
                                <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/40">
                                    <UserCircle className="w-6 h-6" />
                                </AvatarFallback>
                            </Avatar>
                            {isEditing && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm border border-white dark:border-slate-900">
                                    <Camera className="w-2.5 h-2.5" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={avatarInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
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
                            <div 
                                className={cn(
                                    "w-20 h-20 rounded-2xl flex items-center justify-center overflow-visible shrink-0 shadow-lg relative transition-all bg-white dark:bg-slate-800",
                                    isEditing ? "ring-4 ring-blue-500/20 shadow-blue-100 dark:shadow-none" : "shadow-blue-200 dark:shadow-blue-900/20"
                                )}
                            >
                                <Avatar className="w-full h-full rounded-2xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-700">
                                    <AvatarImage src={formData.avatar_url || ''} className="object-cover" />
                                    <AvatarFallback className="bg-blue-600 text-white flex items-center justify-center">
                                        <UserCircle className="w-12 h-12" />
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            avatarInputRef.current?.click()
                                        }}
                                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 hover:bg-blue-700 transition-all active:scale-90 z-20"
                                        title="Thay đổi ảnh đại diện"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                )}
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
                                    {contract.clients?.status && (
                                        <div className={cn(
                                            "flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            {
                                                "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30": contract.clients.status === 'Đã khảo sát',
                                                "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900": contract.clients.status === 'Đang tập thử',
                                                "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30": contract.clients.status === 'Đang tư vấn',
                                                "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-900/30": contract.clients.status === 'Tư vấn không tham gia',
                                                "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30": contract.clients.status === 'Không tham gia',
                                                "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30": ['Chốt đăng ký', 'CHỐT ĐĂNG KÝ', 'CHỐT ĐĂNG KÍ'].includes(contract.clients.status),
                                            }
                                        )}>
                                            {contract.clients.status}
                                        </div>
                                    )}
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
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">Tổng tiền</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {formData.total_amount ? Number(formData.total_amount).toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
                                <div className="flex-1 flex flex-col items-center text-center">
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">Kết thúc</span>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Số điện thoại" value={formData.phone} name="phone" icon={Phone} {...sharedRowProps} />
                                <ContractDetailRow label="Email" value={formData.email} name="email" icon={Mail} {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Căn cước công dân" value={formData.id_number} name="id_number" icon={FileText} {...sharedRowProps} />
                                <ContractDetailRow label="Ngày sinh" value={formData.dob} name="dob" type="date" icon={Calendar} {...sharedRowProps} />
                            </div>
                            <ContractDetailRow label="Địa chỉ" value={formData.member_address} name="member_address" icon={MapPin} {...sharedRowProps} />
                            
                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Đại diện pháp luật (Bên B)</h4>
                                <div className="space-y-5">
                                    <ContractDetailRow label="Người đại diện" value={formData.legal_representative} name="legal_representative" icon={UserCircle} {...sharedRowProps} />
                                    <ContractDetailRow label="Số điện thoại" value={formData.representative_phone} name="representative_phone" icon={Phone} {...sharedRowProps} />
                                </div>
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Chỉ số sức khỏe */}
                    <ContractCardSection title="Chỉ số sức khỏe" icon={Hash}>
                        <div className="space-y-5">
                            <ContractDetailRow label="Bệnh lý" value={formData.medical_condition} name="medical_condition" icon={FileText} {...sharedRowProps} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Chiều cao (cm)" value={formData.initial_height} name="initial_height" type="number" icon={Hash} {...sharedRowProps} />
                                <ContractDetailRow label="Cân nặng (kg)" value={formData.initial_weight} name="initial_weight" type="number" icon={Hash} {...sharedRowProps} />
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Chi tiết hợp đồng */}
                    <ContractCardSection title="Chi tiết hợp đồng" icon={Package}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <ContractDetailRow label="Gói tập" value={formData.package_name} name="package_name" icon={Package} {...sharedRowProps} />
                                <ContractDetailRow label="Số lượng" value={formData.quantity} name="quantity" type="number" icon={Hash} {...sharedRowProps} />
                                <ContractDetailRow label="Tổng số buổi" value={formData.total_sessions} name="total_sessions" type="number" icon={Hash} {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Ngày bắt đầu" value={formData.start_date} name="start_date" type="date" icon={Calendar} {...sharedRowProps} />
                                <ContractDetailRow label="Ngày kết thúc" value={formData.end_date} name="end_date" type="date" icon={Calendar} {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        Số ngày còn lại
                                    </Label>
                                    <p className="text-[15px] font-medium text-blue-600 dark:text-blue-400">
                                        {daysRemaining}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Dumbbell className="w-3 h-3" />
                                        Huấn luyện viên
                                    </Label>
                                    <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                        {formData.trainer_name || '-'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Package className="w-3 h-3" />
                                        Phân loại gói
                                    </Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.package_type}
                                            onValueChange={(val: string) => setFormData((prev: any) => ({ ...prev, package_type: val }))}
                                        >
                                            <SelectTrigger className="w-full rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm">
                                                <SelectValue placeholder="Chọn phân loại" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="offline">Offline (Tại trung tâm)</SelectItem>
                                                <SelectItem value="online">Online</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                            {formData.package_type === 'online' ? 'Online' : 'Offline'}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <UserCheck className="w-3 h-3" />
                                        Hình thức tập
                                    </Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.trainer_type}
                                            onValueChange={(val: string) => setFormData((prev: any) => ({ ...prev, trainer_type: val }))}
                                        >
                                            <SelectTrigger className="w-full rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm">
                                                <SelectValue placeholder="Chọn hình thức" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {trainerTypes.map(type => (
                                                    <SelectItem key={type.id} value={type.nam}>{type.nam}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                            {formData.trainer_type || '-'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Building2 className="w-3 h-3" />
                                        Chi nhánh
                                    </Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.branch_id}
                                            onValueChange={(val: string) => setFormData((prev: any) => ({ ...prev, branch_id: val }))}
                                        >
                                            <SelectTrigger className="w-full rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm">
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
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        Trạng thái
                                    </Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.status}
                                            onValueChange={(val: string) => setFormData((prev: any) => ({ ...prev, status: val }))}
                                        >
                                            <SelectTrigger className="w-full rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm">
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
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Giá gói (niêm yết)" value={formData.package_price} name="package_price" type="number" icon={CreditCard} {...sharedRowProps} />
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider">Bằng chữ</Label>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 italic min-h-[20px]">{formData.package_price_text || '-'}</p>
                                </div>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Giá trợ giá" value={formData.discounted_price} name="discounted_price" type="number" icon={CreditCard} {...sharedRowProps} />
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider">Bằng chữ</Label>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 italic min-h-[20px]">{formData.discounted_price_text || '-'}</p>
                                </div>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Tổng giá trị HĐ" value={formData.total_amount} name="total_amount" type="number" icon={CreditCard} {...sharedRowProps} />
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider">Bằng chữ</Label>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 italic min-h-[20px]">{formData.total_amount_text || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Nhân sự & Trung tâm */}
                    <ContractCardSection title="Nhân sự & Trung tâm" icon={ShieldCheck}>
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <UserCheck className="w-3 h-3" />
                                    Huấn luyện viên phụ trách (PT)
                                </Label>
                                {isEditing ? (
                                    <Popover modal={true} open={ptOpen} onOpenChange={setPtOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 px-3 font-normal"
                                            >
                                                <span className="truncate">
                                                    {formData.assigned_pt ? (users.find(u => u.email === formData.assigned_pt)?.name || formData.trainer_name) : (formData.trainer_name || "Chọn PT...")}
                                                </span>
                                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
                                            <div className="p-2 border-b">
                                                <Input 
                                                    placeholder="Tìm nhân viên..." 
                                                    value={ptSearchTerm}
                                                    onChange={(e) => setPtSearchTerm(e.target.value)}
                                                    className="h-9 border-none focus-visible:ring-0" 
                                                />
                                            </div>
                                            <ScrollArea className="h-[200px]">
                                                <div className="p-1">
                                                    {users.filter(u => u.name?.toLowerCase().includes(ptSearchTerm.toLowerCase())).map((user: any) => (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                                                            onClick={() => {
                                                                setFormData((prev: any) => ({
                                                                    ...prev,
                                                                    assigned_pt: user.email,
                                                                    trainer_name: user.name,
                                                                    staff_phone: user.phone || ''
                                                                }))
                                                                setPtOpen(false)
                                                            }}
                                                        >
                                                            <div className="flex flex-col items-start min-w-0">
                                                                <span className="font-medium truncate w-full">{user.name}</span>
                                                                <span className="text-[10px] text-slate-400 truncate w-full">{user.email}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                        {users.find(u => u.email === formData.assigned_pt)?.name || formData.trainer_name || '-'}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="SĐT Nhân sự" value={formData.staff_phone} name="staff_phone" icon={Phone} {...sharedRowProps} />
                                <ContractDetailRow label="Đại diện trung tâm" value={formData.center_representative} name="center_representative" icon={UserCheck} {...sharedRowProps} />
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Chữ ký khách hàng */}
                    <ContractCardSection title="Chữ ký khách hàng" icon={Cloud}>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
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

                    {/* Section: Gửi Hợp đồng Khách hàng */}
                    <ContractCardSection title="Gửi Hợp đồng Khách hàng" icon={Cloud}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Mail className="w-3 h-3" />
                                        Gửi Email
                                    </Label>
                                    <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200 min-h-[20px]">
                                        {formData.sendemail ? new Date(formData.sendemail).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'Chưa gửi'}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-semibold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" />
                                        Gửi Zalo
                                    </Label>
                                    <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200 min-h-[20px]">
                                        {formData.sendzalo ? new Date(formData.sendzalo).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'Chưa gửi'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ContractCardSection>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl h-11 px-6 font-bold text-[13px] text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-inter"
                        disabled={loading}
                    >
                        Đóng
                    </Button>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
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
                            <div className="flex items-center gap-2 flex-wrap justify-end">
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
                                    className="rounded-xl h-11 px-6 font-bold text-[13px] border-blue-100 text-blue-700 hover:bg-blue-50 dark:border-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-all font-inter border-2"
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
                                        className="rounded-xl h-11 px-4 font-bold text-[13px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all font-inter"
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
                                        className="h-11 w-11 rounded-xl border-red-50 dark:border-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100 transition-all active:scale-95 border-2"
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
