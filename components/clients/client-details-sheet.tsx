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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    type ConfigItem,
    fetchClientConfigs
} from '@/app/actions/config-params'
import {
    User,
    MapPin,
    Mail,
    Phone,
    Edit2,
    Trash2,
    Save,
    X,
    UserCircle,
    Dumbbell,
    Activity,
    Star,
    MoreVertical,
    Target,
    HeartPulse,
    MessageSquare,
    ClipboardList,
    FileText,
    PlusCircle,
    ChevronDown,
    Search,
    Check,
    Cloud,
    Building2,
    Calendar,
    Quote,
    TrendingUp,
    TrendingDown,
    History,
    CreditCard,
    Instagram,
    Facebook,
    Users,
    Camera,
    Package,
    Scale,
    BadgeCheck,
    ChevronRight,
    Loader2,
} from 'lucide-react'
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/avatar'
import { updateClient, bulkDeleteClients, createClient, generateClientId } from '@/app/actions/clients'
import { uploadSignature } from '@/app/actions/storage'
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
import { fetchBranches } from '@/app/actions/branches'
import { ContractDetailsSheet } from '@/components/contracts/contract-details-sheet'
import { AddWeightDialog } from '@/components/weight-tracking/add-weight-dialog'
import { fetchZaloUsers } from '@/app/actions/zalo-users'
import { fetchUsers } from '@/app/actions/users'
import { fetchLatestContractByClientId, fetchContractsByClientId } from '@/app/actions/contracts'
import { fetchWeightChartData } from '@/app/actions/weight-tracking'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignatureField } from '@/components/ui/signature-field'
import { usePermissions } from '@/hooks/use-permissions'
import { canAccessRecord } from '@/lib/permissions'

// ─── Component con nằm NGOÀI component cha để tránh re-mount khi state thay đổi ───
const ClientCardSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible mb-5">
        <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">{title}</h3>
        </div>
        <div className="p-5 space-y-5">
            {children}
        </div>
    </div>
)

const ClientInfoRow = ({ label, value, name, type = "text", options, isEditing, formData, onChange, onSelectChange }: any) => {
    const listId = options && type !== 'select' ? `${name}-list` : undefined;
    const requiredNames = ['member_name', 'phone', 'branch_id', 'status', 'assigned_pt', 'pt_name', 'height', 'weight', 'source'];
    return (
        <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-200">
                {label} {isEditing && requiredNames.includes(name) && <span className="text-red-500">*</span>}
            </Label>
            {isEditing ? (
                type === 'textarea' ? (
                    <Textarea
                        name={name}
                        value={formData[name] || ''}
                        onChange={onChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[80px] text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                ) : type === 'select' ? (
                    <Select value={formData[name] || ''} onValueChange={(val) => onSelectChange(name, val)}>
                        <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm">
                            <SelectValue placeholder={`Chọn...`} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                            {options?.map((opt: any, idx: number) => {
                                const optValue = typeof opt === 'object' ? opt.value : opt;
                                const optLabel = typeof opt === 'object' ? opt.label : opt;
                                return (
                                    <SelectItem key={idx} value={optValue}>
                                        {optLabel}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="relative">
                        <Input
                            name={name}
                            type={type}
                            list={listId}
                            step={type === 'number' ? '0.1' : undefined}
                            value={formData[name] ?? ''}
                            onChange={onChange}
                            className={cn(
                                "w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm",
                                name === 'id' && "bg-slate-50 dark:bg-slate-800/50 text-red-600 dark:text-red-500 font-bold cursor-not-allowed"
                            )}
                        />
                        {options && type !== 'select' && (
                            <datalist id={listId}>
                                {options.map((opt: any, idx: number) => {
                                    const optValue = typeof opt === 'object' ? opt.value : opt;
                                    return <option key={idx} value={optValue} />;
                                })}
                            </datalist>
                        )}
                    </div>
                )
            ) : (
                <p className={cn("text-[15px] font-medium", name === 'id' ? (value === '(Tự động)' ? "text-slate-400 font-normal italic" : "text-red-600 dark:text-red-500 font-bold") : "text-slate-700 dark:text-slate-200")}>
                    {type === 'select' && options
                        ? (options.find((o: any) => (typeof o === 'object' ? o.value : o) === value)?.label || options.find((o: any) => (typeof o === 'object' ? o.value : o) === value)?.value || value || <span className="text-slate-400 font-normal text-sm">Chưa cập nhật</span>)
                        : (value || <span className="text-slate-400 font-normal text-sm">Chưa cập nhật</span>)}
                </p>
            )}
        </div>
    )
}
// ─────────────────────────────────────────────────────────────────────────────

interface ClientDetailsSheetProps {
    client: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ClientDetailsSheet({ client, open, onOpenChange, onSuccess }: ClientDetailsSheetProps) {
    const isCreateMode = !client
    const [isEditing, setIsEditing] = React.useState(isCreateMode)
    const isMobile = useIsMobile()
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>(null)
    const [generatingId, setGeneratingId] = React.useState(false)
    const [isContractCreateOpen, setIsContractCreateOpen] = React.useState(false)
    const [selectedContract, setSelectedContract] = React.useState<any>(null)
    const avatarInputRef = React.useRef<HTMLInputElement>(null)
    const { permissions, user: currentUser, isLoading: permsLoading } = usePermissions()

    const hasAccess = React.useMemo(() => {
        if (isCreateMode) return true
        if (!currentUser || !client) return false
        return canAccessRecord(currentUser, client)
    }, [currentUser, client, isCreateMode])

    React.useEffect(() => {
        if (client) {
            setFormData({ ...client })
            setIsEditing(false)
        } else if (open) {
            // Initialize for Create Mode
            setFormData({
                id: '(Tự động)',
                member_name: '',
                phone: '',
                email: '',
                address: '',
                zalo_id: '',
                facebook_id: '',
                status: 'Đã khảo sát',
                assigned_pt: currentUser?.email || '',
                pt_name: currentUser?.name || '',
                dob: '',
                age: null,
                height: null,
                weight: null,
                target_weight: null,
                registration_type: '',
                training_time: '',
                customer_cycle: '',
                source: '',
                referrer: '',
                goal: '',
                medical_history: '',
                notes: '',
                branch_id: currentUser?.branch_id || null,
                signature_url: '',
                avatar_url: '',
                survey_training_history: '',
                survey_injury_history: '',
                survey_work_stress: '',
                survey_health_advice: '',
                survey_pathology_details: '',
                status_reason: '',
                id_number: '',
            })
            setIsEditing(true)
        }
    }, [client, open, currentUser])

    // Tự động gán mã placeholder khi tạo mới (mã thật sẽ được cấp tại server khi lưu)
    React.useEffect(() => {
        if (isCreateMode && open && formData && (formData.id === '' || !formData.id)) {
            setFormData((prev: any) => ({ ...prev, id: '(Tự động)' }))
        }
    }, [isCreateMode, open])

    const { data: branches = [] } = useQuery<any[]>({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data || []
        },
    })

    const allowedBranches = React.useMemo(() => {
        if (permissions.canViewAllBranches) return branches
        if (permissions.allowedBranchIds) {
            return branches.filter(b => permissions.allowedBranchIds?.includes(b.id))
        }
        return []
    }, [branches, permissions])

    const { data: zaloUsersResult } = useQuery({
        queryKey: ['zalo-users'],
        queryFn: fetchZaloUsers,
    })
    const zaloUsers = React.useMemo(() => zaloUsersResult?.data || [], [zaloUsersResult])

    const [zaloOpen, setZaloOpen] = React.useState(false)
    const [zaloSearchTerm, setZaloSearchTerm] = React.useState('')
    const filteredZaloUsers = React.useMemo(() => {
        if (!zaloSearchTerm) return zaloUsers
        return zaloUsers.filter((u: any) =>
            u.display_name?.toLowerCase().includes(zaloSearchTerm.toLowerCase()) ||
            u.zalo_user_id?.toLowerCase().includes(zaloSearchTerm.toLowerCase())
        )
    }, [zaloUsers, zaloSearchTerm])

    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const result = await fetchUsers()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })
    const users = React.useMemo(() => Array.isArray(usersData) ? usersData : [], [usersData])

    const [ptOpen, setPtOpen] = React.useState(false)
    const [ptSearchTerm, setPtSearchTerm] = React.useState('')
    const filteredPts = React.useMemo(() => {
        if (!ptSearchTerm) return users
        return users.filter((u: any) =>
            u.name?.toLowerCase().includes(ptSearchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(ptSearchTerm.toLowerCase())
        )
    }, [users, ptSearchTerm])

    const { data: configResult } = useQuery({
        queryKey: ['client-configs'],
        queryFn: fetchClientConfigs
    })

    const clientStatuses = React.useMemo<ConfigItem[]>(() => {
        return configResult?.data?.statuses || []
    }, [configResult])

    const clientSources = React.useMemo<ConfigItem[]>(() => {
        return configResult?.data?.sources || []
    }, [configResult])

    const clientGoals = React.useMemo<ConfigItem[]>(() => {
        return configResult?.data?.goals || []
    }, [configResult])

    const clientRegistrationTypes = React.useMemo<ConfigItem[]>(() => {
        return configResult?.data?.registrationTypes || []
    }, [configResult])

    const clientTrainingTimes = React.useMemo<ConfigItem[]>(() => {
        return configResult?.data?.trainingTimes || []
    }, [configResult])

    const { data: latestContract } = useQuery({
        queryKey: ['latest-contract', client?.id],
        queryFn: () => fetchLatestContractByClientId(client!.id),
        enabled: !!client?.id,
    })

    const [activeTab, setActiveTab] = React.useState('info')

    // Reset tab when opening a different client
    React.useEffect(() => {
        if (open) setActiveTab('info')
    }, [client?.id, open])

    const { data: allContracts = [], isLoading: contractsLoading } = useQuery<any[]>({
        queryKey: ['client-contracts', client?.id],
        queryFn: async () => {
            const res = await fetchContractsByClientId(client!.id)
            return res.data || []
        },
        enabled: !!client?.id && !isCreateMode,
        staleTime: 5 * 60 * 1000,
    })

    const { data: weightData = [], isLoading: weightLoading } = useQuery<any[]>({
        queryKey: ['client-weight', client?.id],
        queryFn: async () => {
            const res = await fetchWeightChartData(client!.id)
            return res.data || []
        },
        enabled: !!client?.id && !isCreateMode,
        staleTime: 5 * 60 * 1000,
    })



    const handleSave = async () => {
        setLoading(true)
        try {
            let finalFormData = { ...formData }

            // 1. Upload avatar if changed (detected as base64)
            if (formData.avatar_url && formData.avatar_url.startsWith('data:image')) {
                const safeId = (formData.id && formData.id !== '(Tự động)') ? formData.id : 'new'
                const fileName = `avatar_${safeId}_${Date.now()}.png`
                const uploadResult = await uploadSignature(formData.avatar_url, fileName)

                if (uploadResult.success) {
                    finalFormData.avatar_url = uploadResult.url
                } else {
                    toast.error('Không thể upload ảnh đại diện: ' + uploadResult.error)
                }
            }

            if (isCreateMode) {
                const result = await createClient(finalFormData)
                if (!result.success) throw new Error(result.error)
                toast.success('Thêm khách hàng thành công')
                onOpenChange(false)
                onSuccess()
            } else {
                const result = await updateClient(client.id, finalFormData)
                if (!result.success) throw new Error(result.error)
                toast.success('Cập nhật thông tin khách hàng thành công')
                setIsEditing(false)
                onSuccess()
            }
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi cập nhật')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (confirm('Bạn xóa khách hàng thì toàn bộ hợp đồng, công nợ, doanh thu liên quan đến khách hàng này sẽ bị xóa? Bạn có muốn tiếp tục không?')) {
            setLoading(true)
            try {
                const result = await bulkDeleteClients([client.id])
                if (!result.success) throw new Error(result.error)

                toast.success('Đã xóa khách hàng thành công')
                onOpenChange(false)
                onSuccess()
            } catch (error: any) {
                toast.error(error.message || 'Lỗi khi xóa')
            } finally {
                setLoading(false)
            }
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        const type = (e.target as any).type
        const finalValue = type === 'number' ? (value === '' ? null : parseFloat(value)) : value

        setFormData((prev: any) => {
            const newData = { ...prev, [name]: finalValue }

            // Auto-calculate age if dob changes
            if (name === 'dob' && value) {
                const birthDate = new Date(value as string)
                const today = new Date()
                let age = today.getFullYear() - birthDate.getFullYear()
                const m = today.getMonth() - birthDate.getMonth()
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--
                }
                if (age >= 0) {
                    newData.age = age
                }
            } else if (name === 'dob' && !value) {
                newData.age = null
            }

            return newData
        })
    }

    const handleStatusChange = async (value: string) => {
        if (value === formData.status) return

        if (isCreateMode) {
            setFormData((prev: any) => ({ ...prev, status: value }))
            return
        }

        if (confirm("Bạn có muốn đổi trạng thái cho khách hàng không?")) {
            setLoading(true)
            try {
                const result = await updateClient(client.id, { status: value })
                if (result.success) {
                    setFormData((prev: any) => ({ ...prev, status: value }))
                    toast.success('Cập nhật trạng thái thành công')
                    onSuccess()
                } else {
                    toast.error('Lỗi khi cập nhật trạng thái: ' + result.error)
                }
            } catch (error: any) {
                toast.error('Lỗi: ' + error.message)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleBranchChange = (value: string) => {
        setFormData((prev: any) => ({ ...prev, branch_id: value }))
    }

    const sharedRowProps = {
        isEditing,
        formData,
        onChange: handleChange,
        onSelectChange: (name: string, val: string) => setFormData((prev: any) => ({ ...prev, [name]: val }))
    }
    if (!formData) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                resizable={!isMobile}
                showCloseButton={false}
                className="w-full border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-gray-950 font-inter overflow-hidden gap-0"
            >
                <SheetHeader className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex flex-col items-start gap-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-11 h-11 border-2 border-white dark:border-slate-800 shadow-sm rounded-xl">
                            <AvatarImage src={formData?.avatar_url} alt={formData?.member_name} className="object-cover" />
                            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                                <UserCircle className="w-7 h-7" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <SheetTitle className="text-lg font-semibold text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
                                {isCreateMode ? 'Thông tin khách hàng mới' : (client?.member_name || 'Chi tiết khách hàng')}
                            </SheetTitle>
                            <SheetDescription className="text-xs mt-1">
                                {isCreateMode ? (
                                    <span className="text-slate-500 dark:text-slate-400">Hoàn tất thông tin bên dưới (* là bắt buộc)</span>
                                ) : (
                                    <span className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-red-600 dark:text-red-500 font-bold tracking-tight">{client?.id}</span>
                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                        <span className="text-slate-500 dark:text-slate-400">{client?.email || 'Chưa cập nhật email'}</span>
                                    </span>
                                )}
                            </SheetDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-700 shadow-none"
                                    disabled={loading}
                                >
                                    {formData.status}
                                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[180px] rounded-xl border-slate-200 dark:border-slate-800 p-1.5 shadow-xl">
                                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-500">Trạng thái</div>
                                {clientStatuses.length > 0 ? (
                                    clientStatuses.map((s: any) => (
                                        <DropdownMenuItem
                                            key={s.id}
                                            onSelect={() => handleStatusChange(s.nam)}
                                            className={cn(
                                                "rounded-lg text-[13px] font-medium px-3 py-2 cursor-pointer transition-colors",
                                                formData.status === s.nam ? "bg-blue-50/50 text-blue-600 dark:bg-blue-950/30" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {s.nam}
                                        </DropdownMenuItem>
                                    ))
                                ) : (
                                    ['Chốt đăng kí', 'Đang tập', 'Tạm dừng', 'Đã nghỉ'].map((status) => (
                                        <DropdownMenuItem
                                            key={status}
                                            onSelect={() => handleStatusChange(status)}
                                            className={cn(
                                                "rounded-lg text-[13px] font-medium px-3 py-2 cursor-pointer",
                                                formData.status === status ? "bg-blue-50/50 text-blue-600" : "text-slate-600"
                                            )}
                                        >
                                            {status}
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {(formData.status === 'Không tham gia' || formData.status === 'Tư vấn & không tham gia') && (
                            <Input
                                placeholder="Lý do..."
                                className="h-9 w-32 sm:w-48 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus-visible:ring-blue-500 shadow-none px-3 transition-all"
                                value={formData.status_reason || ''}
                                onChange={(e) => setFormData((prev: any) => ({ ...prev, status_reason: e.target.value }))}
                                disabled={loading || (!isEditing && !isCreateMode)}
                            />
                        )}

                        {!isCreateMode && hasAccess && !isEditing && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-700 shadow-none sm:hidden"
                                    disabled={loading}
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Sửa
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-700 shadow-none sm:hidden"
                                    disabled={loading}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Xóa
                                </Button>
                            </>
                        )}

                        {isEditing && (
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={loading}
                                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95 font-bold text-xs mr-1 sm:hidden"
                            >
                                {loading && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                                Lưu
                            </Button>
                        )}

                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 sm:hidden" />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 h-9 w-9 sm:hidden"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>
                </SheetHeader>


                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                        {!isCreateMode && (
                            <div className="px-6 py-2 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 shrink-0">
                                <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl h-10">
                                    <TabsTrigger value="info" className="rounded-lg text-xs font-medium py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
                                        <User className="w-3.5 h-3.5 mr-1.5" />
                                        Thông tin
                                    </TabsTrigger>
                                    <TabsTrigger value="contracts" className="rounded-lg text-xs font-medium py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
                                        <Package className="w-3.5 h-3.5 mr-1.5" />
                                        Hợp đồng {allContracts.length > 0 && <span className="ml-1 text-red-600 font-bold">({allContracts.length})</span>}
                                    </TabsTrigger>
                                    <TabsTrigger value="progress" className="rounded-lg text-xs font-medium py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
                                        <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                                        Tiến trình {weightData.length > 0 && <span className="ml-1 text-red-600 font-bold">({weightData.length})</span>}
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="px-4 sm:px-5 py-5 space-y-4">
                                <TabsContent value="info" className="space-y-4 m-0 border-none p-0 outline-none">
                                    {/* Top Profile Card */}
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex items-start gap-5">
                                            <div className="relative group/avatar shrink-0">
                                                <Avatar className="w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                                                    <AvatarImage src={formData.avatar_url} alt={formData.member_name} className="object-cover rounded-2xl" />
                                                    <AvatarFallback className="bg-blue-600 text-white rounded-2xl">
                                                        <UserCircle className="w-12 h-12" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                {isEditing && (
                                                    <>
                                                        <input
                                                            type="file"
                                                            ref={avatarInputRef}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleAvatarChange}
                                                        />
                                                        <Button
                                                            size="icon"
                                                            onClick={() => avatarInputRef.current?.click()}
                                                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-2 border-white dark:border-slate-900 p-0 z-10"
                                                        >
                                                            <Camera className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1">
                                                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate uppercase tracking-tight">
                                                    {isCreateMode ? (formData.member_name || 'Tên khách hàng') : client?.member_name}
                                                </h2>
                                                <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-0.5 truncate">
                                                    {(isCreateMode ? formData.email : client?.email) || 'Chưa cập nhật email'}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium",
                                                        formData.status === 'Đang tập' ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                                                    )}>
                                                        <div className="w-1.5 h-1.5 rounded-full" />
                                                        {formData.status}
                                                    </div>
                                                    <div className="px-3 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                                        {branches?.find((b: any) => b.id === formData.branch_id)?.name || 'Chọn chi nhánh'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {!isEditing && !isCreateMode && hasAccess && formData.phone && (
                                            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-3">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex-1 h-9 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 font-medium text-xs border border-blue-100 dark:border-blue-900/30"
                                                >
                                                    <a href={`tel:${formData.phone}`}>
                                                        <Phone className="w-3.5 h-3.5 mr-2" />
                                                        Gọi điện cho khách
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {!isEditing && !isCreateMode && hasAccess && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsContractCreateOpen(true)}
                                                className="h-14 rounded-2xl gap-3 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium text-[13px] shadow-sm border-2"
                                            >
                                                <PlusCircle className="w-4 h-4 text-blue-500" />
                                                Hợp đồng mới
                                            </Button>
                                            <AddWeightDialog
                                                clients={[client]}
                                                initialClientId={client.id}
                                                onSuccess={onSuccess}
                                                triggerOverride={
                                                    <Button
                                                        variant="outline"
                                                        className="h-14 rounded-2xl gap-3 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium text-[13px] shadow-sm border-2"
                                                    >
                                                        <Activity className="w-4 h-4 text-emerald-500" />
                                                        Cân nặng
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* Section 1: THÔNG TIN CƠ BẢN KHÁCH HÀNG */}
                                    <ClientCardSection title="THÔNG TIN CƠ BẢN KHÁCH HÀNG" icon={User}>
                                        <div className="space-y-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <ClientInfoRow
                                                    label="Mã khách hàng"
                                                    value={formData.id}
                                                    name="id"
                                                    placeholder={formData.id === '(Tự động)' ? "(Tự động)" : "Mã KH"}
                                                    readOnly={true}
                                                    {...sharedRowProps}
                                                />
                                                <ClientInfoRow label="Họ và tên hội viên" value={formData.member_name} name="member_name" {...sharedRowProps} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <ClientInfoRow label="Nguồn khách hàng" value={formData.source} name="source" type="select" options={clientSources.map((s: any) => s.nam)} {...sharedRowProps} />
                                                <ClientInfoRow label="Người giới thiệu/mang về" value={formData.referrer} name="referrer" {...sharedRowProps} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <ClientInfoRow label="Số điện thoại" value={formData.phone} name="phone" {...sharedRowProps} />
                                                <ClientInfoRow label="Email" value={formData.email} name="email" {...sharedRowProps} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <ClientInfoRow label="Ngày sinh" value={formData.dob} name="dob" type="date" {...sharedRowProps} />
                                                <ClientInfoRow label="Tuổi" value={formData.age} name="age" type="number" {...sharedRowProps} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <ClientInfoRow label="Địa chỉ liên hệ" value={formData.address} name="address" {...sharedRowProps} />
                                                <ClientInfoRow label="Số CMND/CCCD" value={formData.id_number} name="id_number" {...sharedRowProps} />
                                            </div>
                                            <div className="flex items-end gap-3">
                                                <div className="flex-1">
                                                    <ClientInfoRow label="Avatar URL" value={formData.avatar_url} name="avatar_url" {...sharedRowProps} />
                                                </div>
                                                {isEditing && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => avatarInputRef.current?.click()}
                                                        className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                                                    >
                                                        <Camera className="w-4 h-4 text-slate-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </ClientCardSection>

                                    {/* Section 2: MẠNG XÃ HỘI */}
                                    <ClientCardSection title="MẠNG XÃ HỘI" icon={MessageSquare}>
                                        <div className="space-y-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-200">Zalo</Label>
                                                    {isEditing ? (
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => { setZaloOpen(v => !v); if (zaloOpen) setZaloSearchTerm('') }}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm font-normal px-3 shadow-sm hover:border-slate-300 transition-colors",
                                                                    !formData.zalo_id && "text-muted-foreground"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    {formData.zalo_id ? (
                                                                        <>
                                                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: zaloUsers.find((u: any) => u.zalo_user_id === formData.zalo_id)?.avatar_url ? `url(${zaloUsers.find((u: any) => u.zalo_user_id === formData.zalo_id)?.avatar_url})` : 'none' }} />
                                                                            <span className="truncate">{zaloUsers.find((u: any) => u.zalo_user_id === formData.zalo_id)?.display_name || formData.zalo_id}</span>
                                                                        </>
                                                                    ) : (
                                                                        <span>Chọn Zalo...</span>
                                                                    )}
                                                                </div>
                                                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </button>
                                                            {zaloOpen && (
                                                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
                                                                    <div className="p-2 border-b border-slate-50 dark:border-slate-800">
                                                                        <div className="relative">
                                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                                            <Input
                                                                                autoFocus
                                                                                placeholder="Tìm kiếm..."
                                                                                value={zaloSearchTerm}
                                                                                onChange={(e) => setZaloSearchTerm(e.target.value)}
                                                                                className="pl-8 h-9 border-none bg-slate-50/50 dark:bg-slate-900 rounded-lg focus-visible:ring-0"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="max-h-[220px] overflow-y-auto p-1">
                                                                        <button
                                                                            type="button"
                                                                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                                            onClick={() => { setFormData((prev: any) => ({ ...prev, zalo_id: '' })); setZaloOpen(false); setZaloSearchTerm('') }}
                                                                        >
                                                                            <span className="text-slate-500 text-xs">-- Xóa chọn --</span>
                                                                        </button>
                                                                        {filteredZaloUsers.length === 0 && (
                                                                            <div className="p-4 text-center text-xs text-slate-500">Không tìm thấy kết quả</div>
                                                                        )}
                                                                        {filteredZaloUsers.map((user: any) => (
                                                                            <button
                                                                                key={user.id || user.zalo_user_id}
                                                                                type="button"
                                                                                className={cn(
                                                                                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                                                                                    formData.zalo_id === user.zalo_user_id && "bg-blue-50/50 text-blue-600 dark:bg-blue-950/30"
                                                                                )}
                                                                                onClick={() => { setFormData((prev: any) => ({ ...prev, zalo_id: user.zalo_user_id })); setZaloOpen(false); setZaloSearchTerm('') }}
                                                                            >
                                                                                <div className="w-7 h-7 rounded-full bg-slate-100 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none' }}>
                                                                                    {!user.avatar_url && <span className="flex items-center justify-center w-full h-full text-xs font-medium text-slate-500">{user.display_name?.charAt(0)}</span>}
                                                                                </div>
                                                                                <div className="flex flex-col items-start min-w-0">
                                                                                    <span className="font-medium truncate w-full">{user.display_name}</span>
                                                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">{user.zalo_user_id}</span>
                                                                                </div>
                                                                                {formData.zalo_id === user.zalo_user_id && <Check className="ml-auto h-4 w-4 flex-shrink-0" />}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                                            {formData.zalo_id
                                                                ? (zaloUsers.find((zu: any) => zu.zalo_user_id === formData.zalo_id)?.display_name || formData.zalo_id)
                                                                : <span className="text-slate-400 font-normal text-sm">Chưa cập nhật</span>
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <ClientInfoRow label="Link facebook" value={formData.facebook_id} name="facebook_id" {...sharedRowProps} />
                                            </div>
                                        </div>
                                    </ClientCardSection>

                                    {/* Section 3: CHỈ SỐ & MỤC TIÊU */}
                                    <ClientCardSection title="CHỈ SỐ & MỤC TIÊU" icon={Activity}>
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                                <ClientInfoRow label="Chiều cao (cm)" value={formData.height} name="height" type="number" {...sharedRowProps} />
                                                <ClientInfoRow label="Cân nặng (kg)" value={formData.weight} name="weight" type="number" {...sharedRowProps} />
                                            </div>

                                            {/* Chỉ số sức khỏe tự động */}
                                            <div className="grid grid-cols-2 gap-5 p-4 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 mb-6">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Activity className="w-3 h-3" />
                                                        BMI
                                                    </Label>
                                                    <p className="text-xl font-bold text-slate-900 dark:text-white px-0.5">
                                                        {(() => {
                                                            const h = parseFloat(formData.height) || 0;
                                                            const w = parseFloat(formData.weight) || 0;
                                                            const hM = h / 100;
                                                            return hM > 0 ? (w / (hM * hM)).toFixed(1) : '--';
                                                        })()}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Scale className="w-3 h-3" />
                                                        Chỉ số BW(i)
                                                    </Label>
                                                    <p className="text-xl font-bold text-slate-900 dark:text-white px-0.5">
                                                        {(() => {
                                                            const w = parseFloat(formData.weight) || 0;
                                                            return w > 0 ? (w - 100).toFixed(0) : '--';
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>

                                            <ClientInfoRow label="Khung giờ chị có thể đi tập là khung nào?" value={formData.training_time} name="training_time" {...sharedRowProps} />
                                            <ClientInfoRow label="Mục tiêu tập luyện của chị hiện tại là gì?" value={formData.goal} name="goal" {...sharedRowProps} />

                                            <ClientInfoRow
                                                label="Chị đã từng tập luyện bộ môn nào chưa? Trong thời gian tập luyện đó kết quả đạt được là gì? (Nếu chưa tập bỏ qua)"
                                                value={formData.survey_training_history}
                                                name="survey_training_history"
                                                type="textarea"
                                                {...sharedRowProps}
                                            />
                                            <ClientInfoRow
                                                label="Chị đã bao giờ trải qua phẫu thuật, chấn thương, gãy xương bao giờ chưa?"
                                                value={formData.survey_injury_history}
                                                name="survey_injury_history"
                                                type="textarea"
                                                {...sharedRowProps}
                                            />
                                            <ClientInfoRow
                                                label="Công việc của chị ngồi nhiều hay đi lại nhiều? Có thường xuyên stress không? (Nếu được công việc của chị hiện tại là làm gì?)"
                                                value={formData.survey_work_stress}
                                                name="survey_work_stress"
                                                type="textarea"
                                                {...sharedRowProps}
                                            />
                                            <ClientInfoRow
                                                label="Chị có vấn đề gì về bệnh lý: Đau lưng, đau đầu gối, đau vai gáy, tuyến giáp, đa nang, huyết áp cao/thấp...."
                                                value={formData.medical_history}
                                                name="medical_history"
                                                type="textarea"
                                                {...sharedRowProps}
                                            />
                                            <ClientInfoRow
                                                label="Chi tiết bệnh lý (nếu có)"
                                                value={formData.survey_pathology_details}
                                                name="survey_pathology_details"
                                                type="textarea"
                                                {...sharedRowProps}
                                            />
                                            <ClientInfoRow
                                                label="Chị có hay đi khám sức khỏe định kỳ không? Bác sĩ có chẩn đoán vấn đề về tim mạch và lời khuyên gì trước khi tham gia tập luyện không?"
                                                value={formData.survey_health_advice}
                                                name="survey_health_advice"
                                                type="textarea"
                                                {...sharedRowProps}
                                            />
                                            <ClientInfoRow label="Ghi chú thêm" value={formData.notes} name="notes" type="textarea" {...sharedRowProps} />
                                        </div>
                                    </ClientCardSection>

                                    {/* Section: QUẢN LÝ */}
                                    <ClientCardSection title="THÔNG TIN QUẢN LÝ" icon={Dumbbell}>
                                        <div className="space-y-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-200">PT phụ trách</Label>
                                                    {isEditing ? (
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => { setPtOpen(v => !v); if (ptOpen) setPtSearchTerm('') }}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm font-normal px-3 shadow-sm hover:border-slate-300 transition-colors",
                                                                    !formData.pt_name && "text-muted-foreground"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    {formData.pt_name ? (
                                                                        <span className="truncate">{formData.pt_name}</span>
                                                                    ) : (
                                                                        <span>Chọn PT...</span>
                                                                    )}
                                                                </div>
                                                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </button>
                                                            {ptOpen && (
                                                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
                                                                    <div className="p-2 border-b border-slate-50 dark:border-slate-800">
                                                                        <div className="relative">
                                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                                            <Input
                                                                                autoFocus
                                                                                placeholder="Tìm PT..."
                                                                                value={ptSearchTerm}
                                                                                onChange={(e) => setPtSearchTerm(e.target.value)}
                                                                                className="pl-8 h-9 border-none bg-slate-50/50 dark:bg-slate-900 rounded-lg focus-visible:ring-0"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="max-h-[220px] overflow-y-auto p-1">
                                                                        <button
                                                                            type="button"
                                                                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                                            onClick={() => { setFormData((prev: any) => ({ ...prev, pt_name: '', assigned_pt: '' })); setPtOpen(false); setPtSearchTerm('') }}
                                                                        >
                                                                            <span className="text-slate-500 text-xs">-- Không gán PT --</span>
                                                                        </button>
                                                                        {filteredPts.length === 0 && (
                                                                            <div className="p-4 text-center text-xs text-slate-500">Không tìm thấy kết quả</div>
                                                                        )}
                                                                        {filteredPts.map((user: any) => (
                                                                            <button
                                                                                key={user.id}
                                                                                type="button"
                                                                                className={cn(
                                                                                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                                                                                    formData.assigned_pt === user.email && "bg-blue-50/50 text-blue-600 dark:bg-blue-950/30"
                                                                                )}
                                                                                onClick={() => { setFormData((prev: any) => ({ ...prev, pt_name: user.name, assigned_pt: user.email })); setPtOpen(false); setPtSearchTerm('') }}
                                                                            >
                                                                                <div className="flex flex-col items-start min-w-0">
                                                                                    <span className="font-medium truncate w-full">{user.name}</span>
                                                                                    <span className="text-[10px] text-slate-400 truncate w-full">{user.email}</span>
                                                                                </div>
                                                                                {formData.assigned_pt === user.email && <Check className="ml-auto h-4 w-4 flex-shrink-0" />}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                                            {formData.pt_name || <span className="text-slate-400 font-normal text-sm">Chưa cập nhật</span>}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <ClientInfoRow label="Chi nhánh quản lý" value={formData.branch_id} name="branch_id" type="select" options={allowedBranches.map((b: any) => ({ value: b.id, label: b.name }))} {...sharedRowProps} />
                                                </div>
                                            </div>
                                            {/* <div className="grid grid-cols-1 sm:grid-cols-1 gap-5">
                                                <ClientInfoRow label="Lộ trình đăng ký" value={formData.registration_type} name="registration_type" {...sharedRowProps} />
                                            </div> */}
                                        </div>
                                    </ClientCardSection>

                                    {!isCreateMode && (
                                        <ClientCardSection title="THÔNG TIN HỆ THỐNG" icon={History}>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-200">Ngày tạo hệ thống</Label>
                                                    <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                                        {formData.created_at ? new Date(formData.created_at).toLocaleString('vi-VN', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : 'Chưa rõ'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-200">Cập nhật gần nhất</Label>
                                                    <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                                        {formData.updated_at ? new Date(formData.updated_at).toLocaleString('vi-VN', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : 'Chưa rõ'}
                                                    </p>
                                                </div>
                                            </div>
                                        </ClientCardSection>
                                    )}

                                    {/* Section: Chữ ký khách hàng */}
                                    <ClientCardSection title="Chữ ký khách hàng" icon={FileText}>
                                        <div className="space-y-4">
                                            {isEditing ? (
                                                <SignatureField
                                                    value={formData.signature_url}
                                                    onChange={(val) => setFormData((prev: any) => ({ ...prev, signature_url: val }))}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-4 min-h-[120px] bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                                    {formData.signature_url ? (
                                                        <img
                                                            src={formData.signature_url}
                                                            alt="Chữ ký khách hàng"
                                                            className="max-h-32 object-contain"
                                                        />
                                                    ) : (
                                                        <p className="text-sm text-slate-500">Chưa có chữ ký</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </ClientCardSection>

                                    {/* Section: Gửi Hợp đồng Khách hàng */}
                                    {latestContract?.data && (
                                        <ClientCardSection title="Gửi Hợp đồng Khách hàng" icon={Cloud}>
                                            <div className="space-y-5">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            Gửi Email
                                                        </Label>
                                                        <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200 min-h-[20px]">
                                                            {latestContract.data.sendemail ? new Date(latestContract.data.sendemail).toLocaleDateString('vi-VN', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) : 'Chưa gửi'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                            Gửi Zalo
                                                        </Label>
                                                        <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200 min-h-[20px]">
                                                            {latestContract.data.sendzalo ? new Date(latestContract.data.sendzalo).toLocaleDateString('vi-VN', {
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
                                        </ClientCardSection>
                                    )}
                                </TabsContent>

                                <TabsContent value="contracts" className="space-y-4 m-0 border-none p-0 outline-none">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Package className="w-4 h-4 text-blue-500" />
                                            Danh sách hợp đồng <span className="text-red-600 font-bold">({allContracts.length})</span>
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsContractCreateOpen(true)}
                                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1.5 text-xs font-semibold px-2"
                                        >
                                            <PlusCircle className="w-3.5 h-3.5" />
                                            Tạo mới
                                        </Button>
                                    </div>

                                    {contractsLoading ? (
                                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span className="text-xs">Đang tải danh sách...</span>
                                        </div>
                                    ) : allContracts.length === 0 ? (
                                        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                            <Package className="w-8 h-8 opacity-20" />
                                            <span className="text-xs italic">Chưa có hợp đồng nào.</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {allContracts.map((contract) => (
                                                <div
                                                    key={contract.id}
                                                    onClick={() => setSelectedContract(contract)}
                                                    className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-red-600 dark:text-red-500">#{contract.id}</span>
                                                                <div className={cn(
                                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                                                                    contract.status === 'Đã ký HĐ' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" :
                                                                        contract.status === 'Hết hạn HĐ' ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" :
                                                                            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                                )}>
                                                                    {contract.status}
                                                                </div>
                                                            </div>
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                                {contract.package_name || 'Gói tập mặc định'}
                                                            </h4>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.total_amount || 0)}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                                {contract.payment_method}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-y-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                        <div className="space-y-0.5" title="Thời hạn hợp đồng">
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Thời hạn</span>
                                                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                                {contract.start_date ? new Date(contract.start_date).toLocaleDateString('vi-VN') : '---'}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-0.5 text-center">
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Số buổi</span>
                                                            <div className="text-xs font-bold text-red-600 dark:text-red-400">
                                                                {contract.total_sessions || '--'}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-0.5 text-right">
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">HLV/PT</span>
                                                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                {contract.trainer_name || '---'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="progress" className="space-y-4 m-0 border-none p-0 outline-none">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            Tiến trình luyện tập
                                        </h3>
                                        <AddWeightDialog
                                            clients={[client]}
                                            initialClientId={client?.id}
                                            onSuccess={onSuccess}
                                            triggerOverride={
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 gap-1.5 text-xs font-semibold px-2"
                                                >
                                                    <PlusCircle className="w-3.5 h-3.5" />
                                                    Ghi nhận
                                                </Button>
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cân nặng hiện tại</span>
                                                <Scale className="w-3.5 h-3.5 text-emerald-500" />
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{formData.weight || '--'}</span>
                                                <span className="text-xs font-bold text-slate-400">kg</span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mục tiêu</span>
                                                <Target className="w-3.5 h-3.5 text-blue-500" />
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{formData.target_weight || '--'}</span>
                                                <span className="text-xs font-bold text-slate-400">kg</span>
                                            </div>
                                        </div>
                                    </div>

                                    {weightLoading ? (
                                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span className="text-xs">Đang tải dữ liệu...</span>
                                        </div>
                                    ) : weightData.length === 0 ? (
                                        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                            <Activity className="w-8 h-8 opacity-20" />
                                            <span className="text-xs italic">Chưa có dữ liệu theo dõi.</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                                <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between">
                                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lịch sử ghi nhận</h4>
                                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/10 px-2 py-0.5 rounded-full">{weightData.length} bản ghi</span>
                                                </div>
                                                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                    {weightData.slice().reverse().map((record, idx) => {
                                                        const prevRecord = weightData[weightData.length - 1 - idx - 1];
                                                        const diff = prevRecord ? record.weight - prevRecord.weight : 0;

                                                        return (
                                                            <div key={idx} className="px-5 py-4 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-500">
                                                                        {new Date(record.measurement_date).getDate()}
                                                                        <span className="text-[8px] ml-0.5">/{new Date(record.measurement_date).getMonth() + 1}</span>
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                                            {record.weight} <span className="text-[10px] text-slate-400 font-medium lowercase">kg</span>
                                                                        </div>
                                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                                            {new Date(record.measurement_date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {diff !== 0 && (
                                                                    <div className={cn(
                                                                        "flex items-center gap-1 font-bold text-xs",
                                                                        diff > 0 ? "text-red-500" : "text-emerald-500"
                                                                    )}>
                                                                        {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                                        {Math.abs(diff).toFixed(1)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </div>
                    </Tabs>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl h-11 px-6 font-semibold text-[13px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-inter"
                        disabled={loading}
                    >
                        Đóng
                    </Button>

                    <div className="flex items-center gap-2">
                        {!isEditing && hasAccess && (
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                className="rounded-xl h-11 px-4 font-medium text-[13px] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/20 transition-all border-2"
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}

                        {isEditing ? (
                            <Button
                                onClick={handleSave}
                                className="rounded-xl h-11 px-10 font-medium text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all active:scale-95"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Đang lưu...' : (isCreateMode ? 'Tạo hồ sơ khách hàng' : 'Lưu thông tin')}
                            </Button>
                        ) : hasAccess && !isCreateMode ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="rounded-xl h-11 px-10 font-medium text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all active:scale-95"
                                disabled={loading}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Chỉnh sửa hồ sơ
                            </Button>
                        ) : null}
                    </div>
                </div>
            </SheetContent>
            <ContractDetailsSheet
                contract={selectedContract}
                open={isContractCreateOpen || !!selectedContract}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsContractCreateOpen(false)
                        setSelectedContract(null)
                    }
                }}
                onSuccess={onSuccess}
                initialClientId={client?.id}
                initialClient={client}
            />
        </Sheet>
    )
}
