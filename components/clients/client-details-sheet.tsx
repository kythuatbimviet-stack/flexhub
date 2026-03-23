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
    History,
    CreditCard,
    Instagram,
    Facebook,
    Users,
    Camera
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
import { AddContractDialog } from '@/components/contracts/add-contract-dialog'
import { AddWeightDialog } from '@/components/weight-tracking/add-weight-dialog'
import { fetchZaloUsers } from '@/app/actions/zalo-users'
import { fetchUsers } from '@/app/actions/users'
import { fetchLatestContractByClientId } from '@/app/actions/contracts'
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
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">{title}</h3>
        </div>
        <div className="p-5 space-y-5">
            {children}
        </div>
    </div>
)

const ClientInfoRow = ({ label, value, name, type = "text", options, isEditing, formData, onChange, onSelectChange }: any) => {
    const listId = options && type !== 'select' ? `${name}-list` : undefined;
    const requiredNames = ['member_name', 'branch_id', 'status', 'assigned_pt', 'pt_name', 'age', 'height', 'weight', 'source', 'goal'];
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
                            step={type === 'number' ? '0.1' : undefined}
                            value={formData[name] ?? ''}
                            onChange={onChange}
                            className={cn(
                                "w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm", 
                                name === 'age' && "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed",
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
                <p className={cn("text-[15px] font-medium", name === 'id' ? "text-red-600 dark:text-red-500 font-bold" : "text-slate-700 dark:text-slate-200")}>
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
                id: '',
                member_name: '',
                phone: '',
                email: '',
                address: '',
                zalo_id: '',
                facebook_id: '',
                status: 'Chốt đăng kí',
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
            })
            setIsEditing(true)
        }
    }, [client, open, currentUser])

    // Auto-generate ID in create mode
    React.useEffect(() => {
        if (isCreateMode && open && formData && !formData.id && !generatingId) {
            setGeneratingId(true)
            generateClientId(formData.branch_id).then((res) => {
                if (res.success && res.data) {
                    setFormData((prev: any) => ({ ...prev, id: res.data }))
                }
            }).finally(() => setGeneratingId(false))
        }
    }, [isCreateMode, open, formData?.branch_id, generatingId])

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

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

    if (!formData) return null

    const handleSave = async () => {
        setLoading(true)
        try {
            let finalFormData = { ...formData }

            // 1. Upload avatar if changed (detected as base64)
            if (formData.avatar_url && formData.avatar_url.startsWith('data:image')) {
                const fileName = `avatar_${formData.id || 'new'}_${Date.now()}.png`
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
        if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
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
        const finalValue = type === 'number' ? parseFloat(value) : value

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

    const handleStatusChange = (value: string) => {
        setFormData((prev: any) => ({ ...prev, status: value }))
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                resizable={!isMobile}
                showCloseButton={false}
                className="w-full border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-gray-950 font-inter"
            >
                <SheetHeader className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex flex-col items-start gap-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-11 h-11 border-2 border-white dark:border-slate-800 shadow-sm rounded-xl">
                            <AvatarImage src={formData.avatar_url} alt={formData.member_name} className="object-cover" />
                            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                                <UserCircle className="w-7 h-7" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <SheetTitle className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                                {isCreateMode ? 'Thông tin khách hàng mới' : (client?.member_name || 'Chi tiết khách hàng')}
                            </SheetTitle>
                            <SheetDescription className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                {isCreateMode ? 'Hoàn tất thông tin bên dưới (* là bắt buộc)' : `ID: ${client?.id} | ${client?.email || 'Chưa cập nhật email'}`}
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

                        {!isCreateMode && hasAccess && !isEditing && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-700 shadow-none"
                                    disabled={loading}
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Sửa
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all font-medium text-xs gap-1.5 border-slate-200 dark:border-slate-700 shadow-none"
                                    disabled={loading}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Xóa
                                </Button>
                            </>
                        )}

                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 h-9 w-9"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>
                </SheetHeader>


                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4">
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
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white truncate">
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

                    {!isEditing && hasAccess && (
                        <div className="grid grid-cols-2 gap-3">
                            <AddContractDialog
                                initialClientId={client.id}
                                onSuccess={onSuccess}
                                isQuickAction={false}
                                triggerOverride={
                                    <Button
                                        variant="outline"
                                        className="h-14 rounded-2xl gap-3 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium text-[13px] shadow-sm border-2"
                                    >
                                        <PlusCircle className="w-4 h-4 text-blue-500" />
                                        Hợp đồng mới
                                    </Button>
                                }
                            />
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

                    {/* Section 1: Thông tin cơ bản */}
                    <ClientCardSection title="Thông tin cơ bản" icon={User}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ClientInfoRow label="Mã khách hàng" value={formData.id} name="id" placeholder={generatingId ? "Đang tạo mã..." : "Mã KH"} readOnly={true} {...sharedRowProps} />
                                <ClientInfoRow label="Họ và tên hội viên" value={formData.member_name} name="member_name" {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ClientInfoRow label="Số điện thoại" value={formData.phone} name="phone" {...sharedRowProps} />
                                <ClientInfoRow label="Email" value={formData.email} name="email" {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ClientInfoRow label="Ngày sinh" value={formData.dob} name="dob" type="date" {...sharedRowProps} />
                                <ClientInfoRow label="Tuổi" value={formData.age} name="age" type="number" {...sharedRowProps} />
                            </div>
                            <ClientInfoRow label="Địa chỉ liên hệ" value={formData.address} name="address" {...sharedRowProps} />
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

                    {/* Section 2: Mạng xã hội */}
                    <ClientCardSection title="Mạng xã hội" icon={MessageSquare}>
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
                                <ClientInfoRow label="Link Facebook" value={formData.facebook_id} name="facebook_id" {...sharedRowProps} />
                            </div>
                        </div>
                    </ClientCardSection>

                    {/* Section: Chỉ số cơ thể */}
                    <ClientCardSection title="Chỉ số cơ thể & Mục tiêu" icon={Activity}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                            <ClientInfoRow label="Chiều cao (cm)" value={formData.height} name="height" type="number" {...sharedRowProps} />
                            <ClientInfoRow label="Cân nặng (kg)" value={formData.weight} name="weight" type="number" {...sharedRowProps} />
                            <ClientInfoRow label="Mục tiêu (kg)" value={formData.target_weight} name="target_weight" type="number" {...sharedRowProps} />
                        </div>
                        <div className="space-y-5">
                            <ClientInfoRow label="Mục tiêu tập luyện" value={formData.goal} name="goal" type="select" options={clientGoals.map((g: any) => g.nam)} {...sharedRowProps} />
                            <ClientInfoRow label="Tiền sử bệnh lý" value={formData.medical_history} name="medical_history" type="textarea" {...sharedRowProps} />
                        </div>
                    </ClientCardSection>

                    {/* Section: Huấn luyện & Gói tập */}
                    <ClientCardSection title="Huấn luyện & Gói tập" icon={Dumbbell}>
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
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ClientInfoRow label="Chi nhánh quản lý" value={formData.branch_id} name="branch_id" type="select" options={branches?.map((b: any) => ({ value: b.id, label: b.name }))} {...sharedRowProps} />
                                <ClientInfoRow label="Loại đăng ký" value={formData.registration_type} name="registration_type" options={clientRegistrationTypes.map((t: any) => t.nam)} {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ClientInfoRow label="Thời gian tập luyện" value={formData.training_time} name="training_time" type="select" options={clientTrainingTimes.map((t: any) => t.nam)} {...sharedRowProps} />
                            </div>
                            <ClientInfoRow label="Ghi chú thêm" value={formData.notes} name="notes" type="textarea" {...sharedRowProps} />
                        </div>
                    </ClientCardSection>

                    {/* Section: Nguồn khách */}
                    <ClientCardSection title="Nguồn khách" icon={Star}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ClientInfoRow label="Nguồn khách hàng" value={formData.source} name="source" type="select" options={clientSources.map((s: any) => s.nam)} {...sharedRowProps} />
                                <ClientInfoRow label="Người giới thiệu" value={formData.referrer} name="referrer" {...sharedRowProps} />
                            </div>
                        </div>
                    </ClientCardSection>
                    
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
        </Sheet>
    )
}
