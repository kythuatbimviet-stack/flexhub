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
    Edit3,
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
    AlertCircle,
    MoreHorizontal,
    Users,
    ChevronDown,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
import { Badge } from '@/components/ui/badge'
import { fetchBranches } from '@/app/actions/branches'
import { fetchUsers } from '@/app/actions/users'
import { toast } from 'sonner'
import { updateContract, deleteContract, createContract, generateContractId, checkContractIdExists, fetchContractById } from '@/app/actions/contracts'
import { addDays, format } from 'date-fns'
import { updateClient, fetchClients } from '@/app/actions/clients'
import { uploadSignature } from '@/app/actions/storage'
import { SignatureField } from '@/components/ui/signature-field'
import { fetchConfigParams, ConfigItem, fetchContractConfigs } from '@/app/actions/config-params'
import { fetchMemberships } from '@/app/actions/memberships'
import { cn, numberToVietnameseWords, getVietQRUrl, formatDecimalForDisplay, parseDecimalInput, isValidDecimalInput } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { FinalizeContractDialog } from './finalize-contract-dialog'
import { ContractClosureDialog } from './contract-closure-dialog'
import { usePermissions } from '@/hooks/use-permissions'
import { canAccessRecord } from '@/lib/permissions'
import { TrendingDown, TrendingUp, Minus, ClipboardCheck, RefreshCw, PauseCircle, XCircle as XCircleIcon } from 'lucide-react'

// ─── Component con nằm NGOÀI component cha để tránh re-mount khi state thay đổi ───
const ContractCardSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50 dark:border-slate-800/50">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                {Icon && <Icon className="w-4 h-4" />}
            </div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-white tracking-tight">{title}</h3>
        </div>
        {children}
    </div>
)

const ContractDetailRow = ({ label, value, name, type = 'text', icon: Icon, isEditing, formData, onChange, children }: any) => {
    const isCurrency = ['package_price', 'discounted_price', 'total_amount'].includes(name)

    // Format the value for display in the input while editing
    const getEditValue = () => {
        const val = formData[name] ?? ''
        if (isCurrency && val) {
            return Number(val).toLocaleString('vi-VN')
        }
        if (['initial_weight', 'initial_height'].includes(name) && val != null) {
            return formatDecimalForDisplay(val)
        }
        return val
    }

    const handleInternalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isCurrency) {
            // Strip non-digit characters to keep the underlying value as a raw number string
            const rawValue = e.target.value.replace(/\D/g, '')
            onChange(name, rawValue)
        } else if (['initial_weight', 'initial_height'].includes(name)) {
            const val = e.target.value
            if (isValidDecimalInput(val)) {
                onChange(name, parseDecimalInput(val))
            }
        } else {
            onChange(e)
        }
    }

    return (
        <div className="space-y-1.5 w-full text-left">
            <Label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3 text-red-500/70" />}
                {label} {isEditing && ['package_name', 'payment_method', 'quantity', 'total_amount', 'status', 'id_number', 'email', 'client_id', 'membership_id'].includes(name) && <span className="text-red-500">*</span>}
            </Label>
            {isEditing ? (
                children ? (
                    children
                ) : (
                    <Input
                        name={name}
                        type={isCurrency ? 'text' : type}
                        value={getEditValue()}
                        onChange={handleInternalChange}
                        readOnly={['package_price', 'discounted_price'].includes(name)}
                        className={cn(
                            "w-full rounded-xl border-slate-200 dark:border-slate-800 h-10 text-sm focus:ring-2 focus:ring-red-500/20 outline-none transition-all placeholder:text-slate-300",
                            ['package_price', 'discounted_price'].includes(name)
                                ? "bg-slate-200 dark:bg-slate-800 font-medium"
                                : "bg-slate-50/50 dark:bg-slate-950"
                        )}
                    />
                )
            ) : (
                <p className={cn(
                    "text-[15px] font-medium min-h-[20px] w-full break-words",
                    name === 'id' ? "text-red-600 dark:text-red-500" : "text-slate-900 dark:text-slate-100"
                )}>
                    {type === 'number' && value ? (
                        ['quantity', 'total_sessions', 'package_duration', 'initial_weight', 'initial_height'].includes(name)
                            ? Number(value).toLocaleString('vi-VN')
                            : Number(value).toLocaleString('vi-VN') + ' ₫'
                    ) : (value || '-')}
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
    initialClientId?: string
    initialClient?: any
}

export function ContractDetailsSheet({
    contract,
    open,
    onOpenChange,
    onSuccess,
    initialClientId,
    initialClient
}: ContractDetailsSheetProps) {
    const isMobile = useIsMobile()
    const isCreateMode = !contract
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [isLoadingFullData, setIsLoadingFullData] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})
    const { permissions, user: currentUser, isLoading: permsLoading } = usePermissions()
    const avatarInputRef = React.useRef<HTMLInputElement>(null)
    const prevContractIdRef = React.useRef<string | null>(null)
    const [generatingId, setGeneratingId] = React.useState(false)

    const hasAccess = React.useMemo(() => {
        if (!currentUser || !contract) return false
        // For contracts, we check against the contract record
        return canAccessRecord(currentUser, contract)
    }, [currentUser, contract])
    const [branches, setBranches] = React.useState<any[]>([])
    const [statuses, setStatuses] = React.useState<ConfigItem[]>([])
    const [contractSources, setContractSources] = React.useState<ConfigItem[]>([])
    const [sourceSearchTerm, setSourceSearchTerm] = React.useState('')
    const [sourceOpen, setSourceOpen] = React.useState(false)
    const [trainerTypes, setTrainerTypes] = React.useState<ConfigItem[]>([])
    const [users, setUsers] = React.useState<any[]>([])
    const [ptSearchTerm, setPtSearchTerm] = React.useState('')
    const [ptOpen, setPtOpen] = React.useState(false)
    const [showFinalizeDialog, setShowFinalizeDialog] = React.useState(false)
    const [showClosureDialog, setShowClosureDialog] = React.useState(false)
    const [generatingPdf, setGeneratingPdf] = React.useState(false)
    const [clients, setClients] = React.useState<any[]>([])
    const [clientSearchTerm, setClientSearchTerm] = React.useState('')
    const [clientOpen, setClientOpen] = React.useState(false)
    const [packages, setPackages] = React.useState<any[]>([])
    const [packageSearchTerm, setPackageSearchTerm] = React.useState('')
    const [packageOpen, setPackageOpen] = React.useState(false)
    const [selectedPackageId, setSelectedPackageId] = React.useState<string>('')

    const allowedBranches = React.useMemo(() => {
        if (permissions.canViewAllBranches) return branches
        if (permissions.allowedBranchIds) {
            return branches.filter(b => permissions.allowedBranchIds?.includes(b.id))
        }
        return []
    }, [branches, permissions])

    const defaultStatus = React.useMemo(() => {
        return statuses.find(s => s.is_default)?.nam || statuses[0]?.nam || 'Chờ ký HĐ'
    }, [statuses])

    React.useEffect(() => {
        if (open) {
            const loadData = async () => {
                const [branchesRes, contractConfigsRes, trainerTypeRes, usersRes, clientsRes, membershipsRes] = await Promise.all([
                    fetchBranches(),
                    fetchContractConfigs(),
                    fetchConfigParams('config_contract_trainer_type'),
                    fetchUsers(),
                    fetchClients(),
                    fetchMemberships()
                ])
                if (branchesRes.success) setBranches(branchesRes.data || [])
                if (contractConfigsRes.success) {
                    setStatuses(contractConfigsRes.data?.statuses || [])
                    setContractSources(contractConfigsRes.data?.sources || [])
                }
                if (trainerTypeRes.success) setTrainerTypes(trainerTypeRes.data || [])
                if (usersRes.success) setUsers(usersRes.data || [])
                if (clientsRes.success) setClients(clientsRes.data || [])
                if (membershipsRes.success) setPackages(membershipsRes.data || [])
            }
            loadData()
        }
    }, [open])

    React.useEffect(() => {
        if (contract?.id && open) {
            // Check if the contract object already has the necessary joined data (clients and branches)
            // 'account_number' chỉ có trong fetchContractById (SELECT *), không có trong fetchContractsLite
            const hasFullData = 'account_number' in contract

            const initializeWithData = (data: any) => {
                setFormData({
                    ...data,
                    avatar_url: data.clients?.avatar_url || '',
                    client_status: data.clients?.status || '',
                    dob: data.dob || '',
                    medical_condition: data.medical_condition || '',
                    initial_height: data.initial_height?.toString() || '',
                    initial_weight: data.initial_weight?.toString() || '',
                    target_weight: data.target_weight?.toString() || '',
                    id_number: data.id_number || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    member_address: data.member_address || '',
                    source: data.source || '',
                    assigned_pt: data.assigned_pt || '',
                    trainer_name: data.trainer_name || '',
                    account_number: data.account_number || data.branches?.account_number || '',
                    account_holder: data.account_holder || data.branches?.account_holder || '',
                    bank_name: data.bank_name || data.branches?.bank_name || '',
                    bank_code: data.bank_code || data.branches?.bank_code || '',
                    total_sessions: data.total_sessions?.toString() || '',
                })
            }

            // Nạp dữ liệu có sẵn ngay lập tức (dữ liệu lite từ danh sách)
            initializeWithData(contract)

            // Chỉ reset về view mode khi mở hợp đồng MỚI (tránh re-fire do clients/branches load xong)
            const isNewContract = prevContractIdRef.current !== contract.id
            if (isNewContract) {
                setIsEditing(false)
                prevContractIdRef.current = contract.id
            }

            // Nếu đã là full data, không cần fetch thêm
            if (hasFullData) {
                setIsLoadingFullData(false)
                return
            }

            // Nếu là lite data, fetch full data ngầm mà không chặn UI
            setIsLoadingFullData(true)
            const getFullContract = async () => {
                try {
                    const res = await fetchContractById(contract.id)
                    if (res.success && res.data) {
                        // Chỉ cập nhật formData nếu user KHÔNG đang chỉnh sửa
                        setIsEditing(prev => {
                            if (!prev) initializeWithData(res.data)
                            return prev
                        })
                    }
                } catch (error) {
                    console.error('Error fetching full contract:', error)
                } finally {
                    setIsLoadingFullData(false)
                }
            }
            getFullContract()
        } else if (open && isCreateMode) {
            const initCreateMode = async () => {
                setIsEditing(true)
                const initialData: any = {
                    status: defaultStatus,
                    start_date: format(new Date(), 'yyyy-MM-dd'),
                    contract_type: 'Hội viên',
                    quantity: '1',
                    payment_method: 'Tiền mặt',
                    package_type: 'Trực tiếp',
                }

                // Handle pre-filled client
                const targetClient = initialClient || (initialClientId ? clients.find(c => c.id === initialClientId) : null)
                if (targetClient) {
                    initialData.client_id = targetClient.id
                    initialData.member_name = targetClient.member_name
                    initialData.phone = targetClient.phone || ''
                    initialData.email = targetClient.email || ''
                    initialData.member_address = targetClient.address || '' // Lấy từ 'address' của Client
                    initialData.id_number = targetClient.id_number || '' // Căn cước công dân
                    initialData.trainer_name = targetClient.pt_name || ''
                    initialData.dob = (targetClient.dob || targetClient.date_of_birth) ? (targetClient.dob || targetClient.date_of_birth).split('T')[0] : ''
                    initialData.avatar_url = targetClient.avatar_url || ''
                    initialData.assigned_pt = targetClient.assigned_pt || ''
                    initialData.branch_id = targetClient.branch_id || ''
                    initialData.initial_height = targetClient.height?.toString() || ''
                    initialData.initial_weight = targetClient.weight?.toString() || ''
                    initialData.target_weight = targetClient.target_weight?.toString() || ''
                    initialData.medical_condition = targetClient.medical_history || ''
                    initialData.signature_url = targetClient.signature_url || ''
                    initialData.source = targetClient.source || ''
                }

                // If we have a branch, generate ID
                const branchId = initialData.branch_id || allowedBranches[0]?.id
                if (branchId) {
                    initialData.branch_id = branchId
                    const branch = branches.find((b: any) => b.id === branchId)
                    if (branch) {
                        initialData.facility_name = branch.name || ''
                        initialData.address = branch.address || ''
                        initialData.center_phone = branch.center_phone || branch.phone || ''
                        initialData.center_address = branch.center_address || branch.address || ''
                        initialData.center_representative = branch.representative || ''
                        initialData.signature_center = branch.representative || ''
                        initialData.account_number = branch.account_number?.toString() || ''
                        initialData.account_holder = branch.account_holder || ''
                        initialData.bank_name = branch.bank_name || ''
                        initialData.bank_code = branch.bank_code || ''
                    }
                    // Generate ID and AWAIT it before setting formData to avoid race condition
                    setGeneratingId(true)
                    const idRes = await generateContractId(branchId)
                    if (idRes.success && idRes.data) {
                        initialData.id = idRes.data
                    }
                    setGeneratingId(false)
                }

                setFormData(initialData)
            }
            initCreateMode()
        }
    }, [contract, open, isCreateMode, initialClient, initialClientId, clients, branches, defaultStatus])

    const filteredClients = React.useMemo(() => {
        if (!clientSearchTerm) return clients
        const term = clientSearchTerm.toLowerCase()
        return clients.filter((client: any) =>
            client.member_name?.toLowerCase().includes(term) ||
            client.phone?.toLowerCase().includes(term) ||
            client.email?.toLowerCase().includes(term)
        )
    }, [clients, clientSearchTerm])


    // So sánh package_type case-insensitive (DB và UI đều dùng 'Offline' / 'Online')
    const normalizePackageType = (type: string) => {
        if (!type) return ''
        return type.toLowerCase().trim()
    }

    const filteredPackages = React.useMemo(() => {
        if (!formData.branch_id) return []
        let filtered = packages.filter((pkg: any) => pkg.branch_id === formData.branch_id)
        if (formData.package_type) {
            const normalizedSelected = normalizePackageType(formData.package_type)
            filtered = filtered.filter((pkg: any) =>
                normalizePackageType(pkg.package_type) === normalizedSelected
            )
        }
        if (!packageSearchTerm) return filtered
        const term = packageSearchTerm.toLowerCase()
        return filtered.filter((pkg: any) =>
            pkg.package_name?.toLowerCase().includes(term) ||
            pkg.unit_price?.toString().includes(term) ||
            pkg.package_duration?.toString().includes(term)
        )
    }, [packages, formData.branch_id, formData.package_type, packageSearchTerm])

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

    const handleClientChange = (clientId: string) => {
        const client = clients.find(c => c.id === clientId)
        if (client) {
            setFormData((prev: any) => {
                const newData = {
                    ...prev,
                    client_id: client.id,
                    member_name: client.member_name,
                    phone: client.phone || '',
                    email: client.email || '',
                    member_address: client.address || '', // Lấy từ 'address' của Client
                    id_number: client.id_number || '', // Căn cước công dân
                    trainer_name: client.pt_name || '',
                    dob: (client.dob || client.date_of_birth) ? (client.dob || client.date_of_birth).split('T')[0] : '',
                    avatar_url: client.avatar_url || '',
                    assigned_pt: client.assigned_pt || '',
                    branch_id: client.branch_id || prev.branch_id,
                    initial_height: client.height?.toString() || '',
                    initial_weight: client.weight?.toString() || '',
                    target_weight: client.target_weight?.toString() || '',
                    medical_condition: client.medical_history || '',
                    signature_url: client.signature_url || '',
                    source: client.source || '',
                }
                if (client.branch_id && client.branch_id !== prev.branch_id) {
                    handleBranchChange(client.branch_id)
                }
                return newData
            })
        }
    }

    const handleBranchChange = async (branchId: string) => {
        setGeneratingId(true)
        const res = await generateContractId(branchId)
        if (res.success) {
            const branch = branches.find((b: any) => b.id === branchId)
            setFormData((prev: any) => ({
                ...prev,
                branch_id: branchId,
                id: res.data,
                facility_name: branch?.name || '',
                address: branch?.address || '',
                center_phone: branch?.center_phone || branch?.phone || '',
                center_address: branch?.center_address || branch?.address || '',
                center_representative: branch?.representative || '',
                signature_center: branch?.representative || '',
                account_number: branch?.account_number?.toString() || '',
                account_holder: branch?.account_holder || '',
                bank_name: branch?.bank_name || '',
                bank_code: branch?.bank_code || '',
                membership_id: '',
                package_name: '',
                package_price: '0',
                total_amount: '0',
                package_duration: '',
                end_date: ''
            }))
        }
        setGeneratingId(false)
    }

    const handlePackageChange = (packageId: string) => {
        const pkg = packages.find(p => p.id === packageId)
        if (pkg) {
            const unitPrice = pkg.discounted_price || pkg.unit_price || 0
            const qty = parseInt(formData.quantity || '1')
            const pkgPrice = unitPrice * qty
            const startDate = new Date(formData.start_date || new Date())
            const duration = parseInt(pkg.duration_days || '0')
            const endDate = addDays(startDate, duration * qty)

            setFormData((prev: any) => ({
                ...prev,
                membership_id: packageId,
                package_name: pkg.package_name,
                package_price: pkgPrice.toString(),
                total_amount: pkgPrice.toString(),
                package_duration: pkg.duration_days?.toString() || '',
                total_sessions: (qty * duration).toString(),
                end_date: format(endDate, 'yyyy-MM-dd')
            }))
        }
    }

    const handleInputChange = (eOrName: React.ChangeEvent<HTMLInputElement> | string, value?: string) => {
        const name = typeof eOrName === 'string' ? eOrName : eOrName.target.name
        const val = typeof eOrName === 'string' ? value : eOrName.target.value

        setFormData((prev: any) => {
            const newData = { ...prev, [name]: val }

            // Trigger recalculations if quantity, start_date or package_duration changes
            if (name === 'quantity' || name === 'start_date' || name === 'package_duration') {
                const qty = parseInt(newData.quantity || '1')
                const duration = parseInt(newData.package_duration || '0')
                const pkg = packages.find(p => p.id === prev.membership_id)

                if (pkg) {
                    const unitPrice = pkg.discounted_price || pkg.unit_price || 0
                    const pkgPrice = unitPrice * qty
                    newData.package_price = pkgPrice.toString()
                    newData.total_amount = pkgPrice.toString()
                }

                const startDate = new Date(newData.start_date || new Date())
                if (!isNaN(startDate.getTime())) {
                    const endDate = addDays(startDate, duration * qty)
                    newData.end_date = format(endDate, 'yyyy-MM-dd')
                }
            }

            return newData
        })
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

    const isContractExpired = React.useMemo(() => {
        if (!formData.end_date) return false
        const end = new Date(formData.end_date)
        end.setHours(0, 0, 0, 0)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return end < today
    }, [formData.end_date])

    // Auto-calculate end_date logic
    React.useEffect(() => {
        if (!isEditing || !formData.start_date) return

        // If it's a membership package, end_date is usually set by handlePackageChange or quantity change
        // However, if manual total_sessions is entered (for PT contracts), we use the 1 session = 2.5 days rule
        if (formData.total_sessions && !formData.membership_id) {
            try {
                const startDate = new Date(formData.start_date)
                const sessions = parseInt(formData.total_sessions.toString())
                if (!isNaN(startDate.getTime()) && !isNaN(sessions)) {
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
        }
    }, [formData.start_date, formData.total_sessions, isEditing, formData.end_date, formData.membership_id])

    // Auto-fill PT phone number
    React.useEffect(() => {
        if (!isEditing || !formData.assigned_pt || users.length === 0) {
            if (isEditing && !formData.assigned_pt && formData.staff_phone !== '') {
                setFormData((prev: any) => ({ ...prev, staff_phone: '' }))
            }
            return
        }

        const ptUser = users.find((u: any) => u.email === formData.assigned_pt)
        const phone = ptUser?.phone || ''
        if (formData.staff_phone !== phone || formData.trainer_phone !== phone) {
            setFormData((prev: any) => ({
                ...prev,
                staff_phone: phone,
                trainer_phone: phone
            }))
        }
    }, [formData.assigned_pt, users, isEditing, formData.staff_phone, formData.trainer_phone])

    // Auto-generate QR Payment URL
    React.useEffect(() => {
        // QR generates whenever account_number + total_amount exist (not just when payment_method = Chuyển khoản)
        if (!formData.account_number || !formData.total_amount) {
            if (formData.qr_payment_url) setFormData((prev: any) => ({ ...prev, qr_payment_url: '' }))
            return
        }

        const description = `${(formData.member_name || '').toUpperCase()} TTHD ${(formData.id || '').toUpperCase()}`

        const qrUrl = getVietQRUrl(
            formData.bank_code || formData.bank_name || '',
            formData.account_number,
            Number(formData.total_amount || 0),
            formData.account_holder || '',
            description
        )

        if (formData.qr_payment_url !== qrUrl) {
            setFormData((prev: any) => ({ ...prev, qr_payment_url: qrUrl }))
        }
    }, [formData.bank_code, formData.bank_name, formData.account_number, formData.total_amount, formData.account_holder, formData.id, formData.member_name, formData.payment_method, formData.qr_payment_url])

    // Auto-calculate discount
    React.useEffect(() => {
        if (!isEditing) return
        const pkgPrice = parseFloat(formData.package_price || '0')
        const total = parseFloat(formData.total_amount || '0')
        const discount = total - pkgPrice
        if (formData.discounted_price !== discount.toString()) {
            setFormData((prev: any) => ({ ...prev, discounted_price: discount.toString() }))
        }
    }, [formData.total_amount, formData.package_price, isEditing, formData.discounted_price])

    // Number to words conversion
    const package_price_text = React.useMemo(() => numberToVietnameseWords(Number(formData.package_price || 0)) + ' đồng chẵn', [formData.package_price])
    const discounted_price_text = React.useMemo(() => numberToVietnameseWords(Number(formData.discounted_price || 0)) + ' đồng chẵn', [formData.discounted_price])
    const total_amount_text = React.useMemo(() => numberToVietnameseWords(Number(formData.total_amount || 0)) + ' đồng chẵn', [formData.total_amount])

    const sharedRowProps = React.useMemo(() => ({ isEditing, formData, onChange: handleInputChange }), [isEditing, formData, handleInputChange])

    const handleSave = async () => {
        if (!formData.id) {
            toast.error('Vui lòng nhập số hợp đồng')
            return
        }
        setLoading(true)
        try {
            let finalFormData = { ...formData }

            // 1. Upload avata if changed (and it's a base64 string)
            if (formData.avatar_url && formData.avatar_url.startsWith('data:image')) {
                const fileName = `avatar_${formData.client_id || 'new'}_${Date.now()}.png`
                const uploadResult = await uploadSignature(formData.avatar_url, fileName)

                if (uploadResult.success) {
                    finalFormData.avatar_url = uploadResult.url
                } else {
                    toast.error('Không thể upload ảnh đại diện: ' + uploadResult.error)
                }
            }

            // Sync client profile info
            const clientId = isCreateMode ? formData.client_id : contract?.client_id
            if (clientId) {
                const clientUpdates: any = {
                    avatar_url: finalFormData.avatar_url,
                    member_name: formData.member_name,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.member_address,
                    dob: formData.dob,
                    status: formData.client_status
                }
                await updateClient(clientId, clientUpdates)
            }

            // 2. Chữ ký khách hàng
            if (formData.signature_url && formData.signature_url.startsWith('data:image')) {
                const fileName = `client_sig_${formData.id || 'new'}_${Date.now()}.png`
                const uploadResult = await uploadSignature(formData.signature_url, fileName)

                if (uploadResult.success) {
                    finalFormData.signature_url = uploadResult.url
                } else {
                    toast.error('Không thể upload chữ ký khách hàng: ' + uploadResult.error)
                    setLoading(false)
                    return
                }
            }

            if (isCreateMode) {
                // Validation for creation
                if (!formData.client_id) {
                    toast.error('Vui lòng chọn khách hàng')
                    setLoading(false)
                    return
                }
                if (!formData.membership_id) {
                    toast.error('Vui lòng chọn gói tập')
                    setLoading(false)
                    return
                }

                // Check if ID exists
                const checkRes = await checkContractIdExists(formData.id)
                if (checkRes.success && checkRes.exists) {
                    const proceed = window.confirm(`Số hợp đồng "${formData.id}" đã tồn tại. Bạn có chắc chắn muốn tiếp tục?`)
                    if (!proceed) {
                        setLoading(false)
                        return
                    }
                }

                // Prepare data for creation - Filter out UI-only or non-contract columns
                const {
                    avatar_url,
                    client_status,
                    clients,
                    branches,
                    memberships,
                    daysRemaining,
                    package_price_text,
                    discounted_price_text,
                    total_amount_text,
                    bank_code, // not a column in contracts table
                    ...contractDataOnly
                } = finalFormData

                const result = await createContract({
                    ...contractDataOnly,
                    package_price: Number(contractDataOnly.package_price || 0),
                    total_amount: Number(contractDataOnly.total_amount || 0),
                    discounted_price: Number(contractDataOnly.discounted_price || 0),
                    initial_height: Number(contractDataOnly.initial_height || 0),
                    initial_weight: Number(contractDataOnly.initial_weight || 0),
                    total_sessions: contractDataOnly.total_sessions ? Number(contractDataOnly.total_sessions) : undefined
                })

                if (result.success) {
                    toast.success('Hợp đồng đã được tạo thành công!')
                    setIsEditing(false)
                    onSuccess()
                    onOpenChange(false)
                } else {
                    toast.error('Lỗi khi tạo hợp đồng: ' + result.error)
                }
            } else {
                // 3. FILTER OUT non-existent columns in contracts table
                const {
                    avatar_url,
                    client_status,
                    clients,
                    branches,
                    memberships,
                    daysRemaining,
                    package_price_text,
                    discounted_price_text,
                    total_amount_text,
                    bank_code, // not a column in contracts table
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
            }
        } catch (error: any) {
            console.error('Save error:', error)
            toast.error('Đã xảy ra lỗi hệ thống: ' + (error.message || 'Lỗi không xác định'))
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (confirm('Xóa hợp đồng này sẽ xóa phần công nợ liên quan đến hợp đồng đó, Bạn có muốn tiếp tục không?')) {
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

        try {
            setGeneratingPdf(true)
            const supabase = createClient()
            // Gửi lệnh cập nhật ngầm
            await supabase
                .from('contracts')
                .update({ contract_file_url: 'create_contract' })
                .eq('id', contract.id)

            // Mở trang xem trước trong tab mới
            window.open(`/contracts/preview-gdoc/${contract.id}`, '_blank')

            // Đóng bảng chi tiết và reset trạng thái ngay lập tức
            setGeneratingPdf(false)
            onOpenChange(false)
        } catch (error: any) {
            setGeneratingPdf(false)
            toast.error('Lỗi hệ thống: ' + error.message)
        }
    }


    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                resizable={!isMobile}
                showCloseButton={false}
                className="w-full border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-gray-950 font-inter overflow-hidden gap-0"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>
                        {isCreateMode ? 'Tạo Hợp đồng mới' : (isEditing ? 'Chỉnh sửa Hợp đồng' : `Hợp đồng: ${formData.member_name}`)}
                    </SheetTitle>
                    <SheetDescription>
                        {isCreateMode ? 'Nhập thông tin để tạo hợp đồng mới' : `Chi tiết thông tin hợp đồng #${formData.id}`}
                    </SheetDescription>
                </SheetHeader>

                {/* Sticky Header */}
                <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col text-left">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-none mb-1.5">
                                {isCreateMode ? 'Tạo Hợp đồng mới' : (formData.member_name || 'Chi tiết Hợp đồng')}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-red-600 dark:text-red-500">
                                    {isCreateMode ? (generatingId ? 'Đang tạo số HĐ...' : (formData.id || 'Chưa có số HĐ')) : `#${formData.id}`}
                                </span>
                                {!isCreateMode && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        <span className="text-xs font-medium text-slate-500">
                                            {daysRemaining}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {isEditing && (
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={loading}
                                className="h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 shadow-sm transition-all active:scale-95 font-medium mr-1"
                            >
                                {loading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                                {isCreateMode ? 'Tạo hợp đồng' : 'Lưu'}
                            </Button>
                        )}

                        {!isEditing && (
                            <div className="flex items-center gap-1">
                                {!isCreateMode && (
                                    <>
                                        {isLoadingFullData ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled
                                                className="h-9 w-9 rounded-xl text-slate-300 dark:text-slate-600"
                                                title="Đang tải dữ liệu..."
                                            >
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setIsEditing(true)}
                                                className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-100 dark:border-slate-800 shadow-xl p-1.5 ">
                                                <DropdownMenuItem onClick={handleGenerateDocPDF} disabled={generatingPdf} className="gap-2.5 py-2.5 rounded-xl focus:bg-slate-50 dark:focus:bg-slate-900 cursor-pointer">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                    <span className="font-medium text-sm">{generatingPdf ? 'Đang chuẩn bị...' : 'Xuất lại hợp đồng'}</span>
                                                </DropdownMenuItem>
                                                {formData.contract_file_url && formData.contract_file_url !== 'create_contract' && (
                                                    <DropdownMenuItem onClick={() => window.open(`/contracts/preview-gdoc/${encodeURIComponent(formData.id)}`, '_blank')} className="gap-2.5 py-2.5 rounded-xl focus:bg-slate-50 dark:focus:bg-slate-900 cursor-pointer">
                                                        <ExternalLink className="w-4 h-4 text-emerald-500" />
                                                        <span className="font-medium text-sm">Mở hợp đồng</span>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                                                <DropdownMenuItem onClick={handleDelete} className="gap-2.5 py-2.5 rounded-xl text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer">
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="font-medium text-sm">Xóa hợp đồng</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4 relative">
                    {loading && !isEditing && (
                        <div className="absolute inset-0 z-50 bg-white/60 dark:bg-gray-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="text-xs font-medium text-slate-500">Đang nạp dữ liệu hợp đồng...</span>
                        </div>
                    )}
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
                                    {formData.package_name || (isCreateMode ? 'Chọn gói tập' : '')}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    {formData.member_name || (isCreateMode ? 'Hội viên mới' : '')}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {isEditing ? (
                                        <Select
                                            value={formData.status || defaultStatus}
                                            onValueChange={(val: string) => setFormData((prev: any) => ({ ...prev, status: val }))}
                                        >
                                            <SelectTrigger className="h-7 px-3 text-[10px] font-medium rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-1 focus:ring-blue-500 min-w-[120px]">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                                                        (formData.status || defaultStatus) === 'Chờ ký HĐ' ? "bg-amber-500" :
                                                        (formData.status || defaultStatus) === 'Đã ký HĐ' ? "bg-emerald-500" :
                                                        (formData.status || defaultStatus) === 'Hết hạn HĐ' ? "bg-rose-500" :
                                                        "bg-slate-400"
                                                    )} />
                                                    <SelectValue placeholder="Trạng thái" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-xl p-1">
                                                {statuses.map(s => (
                                                    <SelectItem key={s.id} value={s.nam} className="text-xs rounded-lg py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full",
                                                                s.nam === 'Chờ ký HĐ' ? "bg-amber-500" :
                                                                s.nam === 'Đã ký HĐ' ? "bg-emerald-500" :
                                                                s.nam === 'Hết hạn HĐ' ? "bg-rose-500" :
                                                                "bg-slate-400"
                                                            )} />
                                                            {s.nam}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium tracking-tight",
                                            (formData.status || defaultStatus) === 'Chờ ký HĐ' ? "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30" :
                                            (formData.status || defaultStatus) === 'Đã ký HĐ' ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30" :
                                            (formData.status || defaultStatus) === 'Hết hạn HĐ' ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30" :
                                            "bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full",
                                                (formData.status || defaultStatus) === 'Chờ ký HĐ' ? "bg-amber-500" :
                                                        "bg-slate-400"
                                            )} />
                                            {formData.status || defaultStatus}
                                        </div>
                                    )}

                                    <div className="px-3 py-1 rounded-full text-[10px] font-medium tracking-tight bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
                                        {formData.facility_name || branches?.find((b: any) => b.id === formData.branch_id)?.name || formData.branches?.name || 'Chi nhánh'}
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
                                    <span className="text-[10px] font-medium text-slate-900 dark:text-slate-400 tracking-widest leading-none mb-1">Tổng tiền</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {formData.total_amount ? Number(formData.total_amount).toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
                                <div className="flex-1 flex flex-col items-center text-center">
                                    <span className="text-[10px] font-medium text-slate-900 dark:text-slate-400 tracking-widest leading-none mb-1">Kết thúc</span>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {formData.end_date ? new Date(formData.end_date).toLocaleDateString('vi-VN') : '-'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section: Thông tin khách hàng */}
                    <ContractCardSection title="KHÁCH HÀNG" icon={User}>
                        <div className="space-y-5">
                            <ContractDetailRow label="Chọn Khách hàng" value={formData.member_name} name="client_id" icon={Users} {...sharedRowProps}>
                                <Popover modal={true} open={clientOpen} onOpenChange={setClientOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-10 px-3 font-normal text-slate-900 dark:text-white"
                                        >
                                            <span className="truncate">
                                                {formData.member_name || "Tìm khách hàng..."}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-100 dark:border-slate-800">
                                        <div className="p-2 border-b border-slate-50 dark:border-slate-800">
                                            <Input
                                                placeholder="Tên, SĐT, Email..."
                                                value={clientSearchTerm}
                                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                                className="h-9 border-none bg-slate-50 dark:bg-slate-900 rounded-lg focus-visible:ring-0"
                                            />
                                        </div>
                                        <ScrollArea className="h-[250px]">
                                            <div className="p-1">
                                                {filteredClients.map((client: any) => (
                                                    <button
                                                        key={client.id}
                                                        type="button"
                                                        className={cn(
                                                            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors",
                                                            formData.client_id === client.id && "bg-red-50 dark:bg-red-950/20 text-red-600"
                                                        )}
                                                        onClick={() => {
                                                            handleClientChange(client.id)
                                                            setClientOpen(false)
                                                        }}
                                                    >
                                                        <div className="flex flex-col items-start min-w-0">
                                                            <span className="font-medium truncate w-full">{client.member_name}</span>
                                                            <span className="text-[10px] text-slate-400 truncate w-full">{client.phone} | {client.id}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </ContractDetailRow>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Căn cước công dân" value={formData.id_number} name="id_number" icon={FileText} {...sharedRowProps} />
                                <ContractDetailRow label="Ngày sinh" value={formData.dob} name="dob" type="date" icon={Calendar} {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Địa chỉ" value={formData.member_address} name="member_address" icon={MapPin} {...sharedRowProps} />
                                <ContractDetailRow label="Nguồn khách" value={formData.source} name="source" icon={Users} {...sharedRowProps}>
                                    <Popover modal={true} open={sourceOpen} onOpenChange={setSourceOpen}>
                                        <PopoverTrigger asChild>
                                            <div className="relative w-full">
                                                <Input
                                                    value={formData.source || ""}
                                                    onChange={(e) => handleInputChange('source', e.target.value)}
                                                    placeholder="Chọn hoặc nhập nguồn..."
                                                    className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-10 px-3 pr-10 font-normal text-slate-900 dark:text-white"
                                                    onFocus={() => setSourceOpen(true)}
                                                />
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 cursor-pointer" onClick={() => setSourceOpen(!sourceOpen)} />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-100 dark:border-slate-800" align="start">
                                            <div className="p-2 border-b border-slate-50 dark:border-slate-800">
                                                <Input
                                                    placeholder="Tìm nguồn..."
                                                    value={sourceSearchTerm}
                                                    onChange={(e) => setSourceSearchTerm(e.target.value)}
                                                    className="h-9 border-none bg-slate-50 dark:bg-slate-900 rounded-lg focus-visible:ring-0"
                                                />
                                            </div>
                                            <ScrollArea className="h-[200px]">
                                                <div className="p-1">
                                                    {contractSources.filter(s => s.nam?.toLowerCase().includes(sourceSearchTerm.toLowerCase())).map((source) => (
                                                        <button
                                                            key={source.id}
                                                            type="button"
                                                            className={cn(
                                                                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900",
                                                                formData.source === source.nam && "bg-red-50 dark:bg-red-950/20 text-red-600"
                                                            )}
                                                            onClick={() => {
                                                                handleInputChange('source', source.nam)
                                                                setSourceOpen(false)
                                                            }}
                                                        >
                                                            <span className="font-medium truncate w-full">{source.nam}</span>
                                                        </button>
                                                    ))}
                                                    {contractSources.filter(s => s.nam?.toLowerCase().includes(sourceSearchTerm.toLowerCase())).length === 0 && sourceSearchTerm && (
                                                        <div className="px-2 py-1.5 text-xs text-slate-500 italic">
                                                            Sử dụng nguồn mới: "{sourceSearchTerm}"
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </PopoverContent>
                                    </Popover>
                                </ContractDetailRow>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                <h4 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-4 tracking-tight">Đại diện pháp luật (Bên B)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <ContractDetailRow label="Người đại diện" value={formData.legal_representative} name="legal_representative" icon={UserCircle} {...sharedRowProps} />
                                    <ContractDetailRow label="Số điện thoại" value={formData.representative_phone} name="representative_phone" icon={Phone} {...sharedRowProps} />
                                </div>
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Chỉ số sức khỏe */}
                    <ContractCardSection title="CHỈ SỐ SỨC KHỎE" icon={Hash}>
                        <div className="space-y-5">
                            <ContractDetailRow label="Bệnh lý" value={formData.medical_condition} name="medical_condition" icon={FileText} {...sharedRowProps} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Chiều cao (cm)" value={formData.initial_height} name="initial_height" type="text" icon={Hash} {...sharedRowProps} />
                                <ContractDetailRow label="Cân nặng (kg)" value={formData.initial_weight} name="initial_weight" type="text" icon={Hash} {...sharedRowProps} />
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Chi tiết hợp đồng */}
                    <ContractCardSection title="Chi tiết hợp đồng" icon={Package}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Phân loại gói" value={formData.package_type} name="package_type" icon={Package} {...sharedRowProps}>
                                    <Select
                                        value={formData.package_type}
                                        onValueChange={(val: string) => {
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                package_type: val,
                                                membership_id: '', // Reset package when classification changes
                                                package_name: ''
                                            }))
                                        }}
                                    >
                                        <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-10 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                            <SelectItem value="Offline">Offline</SelectItem>
                                            <SelectItem value="Online">Online</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </ContractDetailRow>
                                <ContractDetailRow label="Chọn Gói tập" value={formData.package_name} name="membership_id" icon={Package} {...sharedRowProps}>
                                    <Popover modal={true} open={packageOpen} onOpenChange={setPackageOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-10 px-3 font-normal text-slate-900 dark:text-white"
                                            >
                                                <span className="truncate">
                                                    {formData.package_name || "Tìm gói tập..."}
                                                </span>
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-100 dark:border-slate-800 shadow-xl">
                                            <div className="p-2 border-b border-slate-50 dark:border-slate-800">
                                                <Input
                                                    placeholder="Tên gói, giá..."
                                                    value={packageSearchTerm}
                                                    onChange={(e) => setPackageSearchTerm(e.target.value)}
                                                    className="h-9 border-none bg-slate-50 dark:bg-slate-900 rounded-lg focus-visible:ring-0"
                                                />
                                            </div>
                                            <ScrollArea className="h-[250px]">
                                                <div className="p-1">
                                                    {filteredPackages.map((pkg: any) => (
                                                        <button
                                                            key={pkg.id}
                                                            type="button"
                                                            className={cn(
                                                                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors",
                                                                formData.membership_id === pkg.id && "bg-red-50 dark:bg-red-950/20 text-red-600"
                                                            )}
                                                            onClick={() => {
                                                                handlePackageChange(pkg.id)
                                                                setPackageOpen(false)
                                                            }}
                                                        >
                                                            <div className="flex flex-col items-start min-w-0">
                                                                <span className="font-semibold truncate w-full">{pkg.package_name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] text-red-600 font-medium">{Number(pkg.unit_price).toLocaleString('vi-VN')} ₫</span>
                                                                    <span className="text-[10px] text-slate-400">| {pkg.package_duration} {pkg.duration_unit}</span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </PopoverContent>
                                    </Popover>
                                </ContractDetailRow>
                            </div>

                            <ContractDetailRow label="Thời hạn gói tập" value={formData.package_duration} name="package_duration" icon={Clock} {...sharedRowProps} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Số lượng" value={formData.quantity} name="quantity" type="number" icon={Hash} {...sharedRowProps} />
                                <ContractDetailRow label="Số buổi tập" value={formData.total_sessions} name="total_sessions" type="number" icon={Hash} {...sharedRowProps} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Ngày bắt đầu" value={formData.start_date} name="start_date" type="date" icon={Calendar} {...sharedRowProps} />
                                <ContractDetailRow label="Ngày kết thúc" value={formData.end_date} name="end_date" type="date" icon={Calendar} {...sharedRowProps} />
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Nhân sự & Trung tâm */}
                    <ContractCardSection title="NHÂN SỰ - CHI NHÁNH" icon={ShieldCheck}>
                        <div className="space-y-5">
                            <ContractDetailRow label="Chi nhánh" value={branches?.find((b: any) => b.id === formData.branch_id)?.name} name="branch_id" icon={Building2} {...sharedRowProps}>
                                <Select
                                    value={formData.branch_id}
                                    onValueChange={handleBranchChange}
                                >
                                    <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-10 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </ContractDetailRow>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-medium text-slate-900 dark:text-slate-300 tracking-tight flex items-center gap-2">
                                    <UserCheck className="w-3 h-3" />
                                    Huấn luyện viên phụ trách (PT)
                                </Label>
                                {isEditing ? (
                                    <Popover modal={true} open={ptOpen} onOpenChange={setPtOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-10 px-3 font-normal text-slate-900 dark:text-white"
                                            >
                                                <span className="truncate">
                                                    {formData.assigned_pt ? (users.find(u => u.email === formData.assigned_pt)?.name || formData.trainer_name) : (formData.trainer_name || "Chọn PT...")}
                                                </span>
                                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-100 dark:border-slate-800">
                                            <div className="p-2 border-b border-slate-50 dark:border-slate-800">
                                                <Input
                                                    placeholder="Tìm nhân viên..."
                                                    value={ptSearchTerm}
                                                    onChange={(e) => setPtSearchTerm(e.target.value)}
                                                    className="h-9 border-none bg-slate-50 dark:bg-slate-900 rounded-lg focus-visible:ring-0"
                                                />
                                            </div>
                                            <ScrollArea className="h-[200px]">
                                                <div className="p-1">
                                                    {users.filter(u => u.name?.toLowerCase().includes(ptSearchTerm.toLowerCase())).map((user: any) => (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            className={cn(
                                                                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900",
                                                                formData.assigned_pt === user.email && "bg-red-50 dark:bg-red-950/20 text-red-600"
                                                            )}
                                                            onClick={() => {
                                                                setFormData((prev: any) => ({
                                                                    ...prev,
                                                                    assigned_pt: user.email,
                                                                    trainer_name: user.name,
                                                                    staff_phone: user.phone || '',
                                                                    trainer_phone: user.phone || '' // Sync both
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
                                <ContractDetailRow label="SĐT PT/Nhân sự" value={formData.trainer_phone} name="trainer_phone" icon={Phone} {...sharedRowProps} />
                                <ContractDetailRow label="Đại diện trung tâm" value={formData.center_representative} name="center_representative" icon={UserCheck} {...sharedRowProps} />
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Thanh toán */}
                    <ContractCardSection title="THANH TOÁN" icon={CreditCard}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Giá gói (niêm yết)" value={formData.package_price} name="package_price" type="number" icon={CreditCard} {...sharedRowProps} />
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-medium text-slate-900 dark:text-slate-300 tracking-tight">Bằng chữ</Label>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 min-h-[20px] italic">{package_price_text || '-'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Tổng giá trị HĐ" value={formData.total_amount} name="total_amount" type="number" icon={CreditCard} {...sharedRowProps} />
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-medium text-slate-900 dark:text-slate-300 tracking-tight">Bằng chữ</Label>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 min-h-[20px] italic">{total_amount_text || '-'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContractDetailRow label="Giảm giá/Đã tiết kiệm" value={formData.discounted_price} name="discounted_price" type="number" icon={CreditCard} {...sharedRowProps} />
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-medium text-slate-900 dark:text-slate-300 tracking-tight">Bằng chữ</Label>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 min-h-[20px] italic">{discounted_price_text || '-'}</p>
                                </div>
                            </div>
                            <ContractDetailRow label="Ghi chú thanh toán" value={formData.payment_notes} name="payment_notes" icon={FileText} {...sharedRowProps} />


                        </div>
                    </ContractCardSection>



                    {/* Section: Chữ ký khách hàng */}
                    <ContractCardSection title="CHỮ KÝ KHÁCH HÀNG" icon={Cloud}>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-medium text-slate-900 dark:text-slate-300 tracking-tight flex items-center gap-2">
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
                                        <p className="text-sm text-slate-400">Chưa có chữ ký</p>
                                    )
                                )}
                            </div>
                        </div>
                    </ContractCardSection>

                    {/* Section: Tổng kết HĐ — chỉ hiện khi đã hết hạn */}
                    {isContractExpired && !isCreateMode && (
                        <ContractCardSection title="TỔNG KẾT HỢP ĐỒNG" icon={ClipboardCheck}>
                            <div className="space-y-5">
                                {/* Cân nặng & Thay đổi */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1">
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Cân ban đầu</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                            {formData.initial_weight ? `${formData.initial_weight} kg` : '—'}
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1">
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Cân kết thúc</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                            {formData.final_weight ? `${formData.final_weight} kg` : '—'}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        'p-3.5 rounded-xl space-y-1',
                                        formData.weight_change > 0
                                            ? 'bg-emerald-50 dark:bg-emerald-950/30'
                                            : formData.weight_change < 0
                                                ? 'bg-orange-50 dark:bg-orange-950/30'
                                                : 'bg-gray-50 dark:bg-gray-800/50'
                                    )}>
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Số cân giảm</p>
                                        <p className={cn(
                                            'text-base font-bold flex items-center gap-1',
                                            formData.weight_change > 0
                                                ? 'text-emerald-700 dark:text-emerald-400'
                                                : formData.weight_change < 0
                                                    ? 'text-orange-700 dark:text-orange-400'
                                                    : 'text-gray-500'
                                        )}>
                                            {formData.weight_change > 0 ? (
                                                <TrendingDown className="w-4 h-4" />
                                            ) : formData.weight_change < 0 ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : (
                                                <Minus className="w-4 h-4" />
                                            )}
                                            {formData.weight_change
                                                ? `${formData.weight_change > 0 ? '' : '+'}${(-formData.weight_change).toFixed(1)} kg`
                                                : '—'}
                                        </p>
                                    </div>
                                </div>

                                {/* Trạng thái đóng HĐ */}
                                {formData.closure_status ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Tình trạng</p>
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                                                formData.closure_status === 'Renew'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                    : formData.closure_status === 'Tạm nghỉ'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400'
                                                        : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400'
                                            )}>
                                                {formData.closure_status === 'Renew' && <RefreshCw className="w-3 h-3" />}
                                                {formData.closure_status === 'Tạm nghỉ' && <PauseCircle className="w-3 h-3" />}
                                                {formData.closure_status === 'Nghỉ hẳn' && <XCircleIcon className="w-3 h-3" />}
                                                {formData.closure_status}
                                            </span>
                                        </div>
                                        {formData.closure_reason && (
                                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                                <p className="text-[10px] font-medium text-gray-400 mb-1">Lý do nghỉ</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{formData.closure_reason}</p>
                                            </div>
                                        )}
                                        {formData.closed_at && (
                                            <p className="text-[11px] text-gray-400">
                                                Đã xử lý: {new Date(formData.closed_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                                        <ClipboardCheck className="w-4 h-4 text-amber-600 shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                            Hợp đồng đã hết hạn nhưng chưa được xử lý.
                                        </p>
                                    </div>
                                )}

                                {/* Nút xử lý */}
                                {!isEditing && (
                                    <Button
                                        onClick={() => setShowClosureDialog(true)}
                                        className={cn(
                                            'w-full rounded-xl h-11 font-semibold text-[13px] transition-all',
                                            formData.closure_status
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-100 dark:shadow-orange-900/20'
                                        )}
                                    >
                                        <ClipboardCheck className="w-4 h-4 mr-2" />
                                        {formData.closure_status ? 'Cập nhật tình trạng HĐ' : 'Xử lý hợp đồng hết hạn'}
                                    </Button>
                                )}
                            </div>
                        </ContractCardSection>
                    )}

                    {/* Section: Gửi Hợp đồng Khách hàng */}
                    <ContractCardSection title="GỬI HỢP ĐỒNG" icon={Cloud}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-medium text-slate-900 dark:text-slate-300 tracking-wider flex items-center gap-2">
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
                                    <Label className="text-[10px] font-medium text-slate-900 dark:text-slate-300 tracking-wider flex items-center gap-2">
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
                                className={cn(
                                    "rounded-xl h-11 px-8 font-bold text-[13px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-all font-inter active:scale-95",
                                    isCreateMode ? "bg-red-600 hover:bg-red-700 shadow-red-100 dark:shadow-red-900/20" : "shadow-blue-100 dark:shadow-blue-900/20"
                                )}
                                disabled={loading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Đang lưu...' : isCreateMode ? 'Tạo Hợp đồng' : 'Lưu lại'}
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
                                <Button
                                    onClick={handleGenerateDocPDF}
                                    variant="outline"
                                    disabled={generatingPdf || !hasAccess}
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
                                        onClick={() => window.open(`/contracts/preview-gdoc/${encodeURIComponent(formData.id)}`, '_blank')}
                                        variant="ghost"
                                        className="rounded-xl h-11 px-4 font-bold text-[13px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all font-inter"
                                        title="Xem bản xem trước PDF (Print Preview)"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                )}
                                {formData.status === 'Chờ ký HĐ' && !isCreateMode && hasAccess && (
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
                                        disabled={loading || isLoadingFullData}
                                    >
                                        {isLoadingFullData ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Edit2 className="w-4 h-4 mr-2" />
                                        )}
                                        {isLoadingFullData ? 'Đang tải...' : 'Sửa'}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <FinalizeContractDialog
                    contract={formData}
                    open={showFinalizeDialog}
                    onOpenChange={setShowFinalizeDialog}
                    onSuccess={() => {
                        onSuccess()
                        onOpenChange(false)
                    }}
                />

                <ContractClosureDialog
                    contract={formData}
                    open={showClosureDialog}
                    onOpenChange={setShowClosureDialog}
                    onSuccess={() => {
                        onSuccess()
                        // Refresh dữ liệu trong sheet
                        if (contract?.id) {
                            fetchContractById(contract.id).then(res => {
                                if (res.success && res.data) {
                                    setFormData((prev: any) => ({
                                        ...prev,
                                        closure_status: res.data.closure_status,
                                        closure_reason: res.data.closure_reason,
                                        closed_at: res.data.closed_at,
                                        final_weight: res.data.final_weight,
                                        weight_change: res.data.weight_change,
                                        status: res.data.status,
                                    }))
                                }
                            })
                        }
                    }}
                />

            </SheetContent>
        </Sheet>
    )
}
