'use client'

import * as React from 'react'
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Trash2,
    FileText,
    Calendar,
    Building2,
    CreditCard,
    Trash,
    Clock,
    BadgeCheck,
    Package,
    RotateCcw,
    FileDown,
    ChevronLeft,
    ChevronRight,
    User,
    CalendarClock,
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    LayoutGrid,
    ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fetchContracts, fetchContractsLite, bulkDeleteContracts } from '@/app/actions/contracts'

import { ContractDetailsSheet } from '@/components/contracts/contract-details-sheet'
import { ImportExcelContractDialog } from '@/components/contracts/import-excel-contract-dialog'
import { fetchBranches } from '@/app/actions/branches'
import { fetchContractConfigs } from '@/app/actions/config-params'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { usePermissions } from '@/hooks/use-permissions'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'

const TEN_MINUTES = 10 * 60 * 1000

const MemberSummaryPopover = ({ contract, onShowDetails }: { contract: any, onShowDetails: () => void }) => {
    const age = React.useMemo(() => {
        if (!contract.dob) return null
        try {
            const birthDate = new Date(contract.dob)
            if (isNaN(birthDate.getTime())) return null
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const m = today.getMonth() - birthDate.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--
            }
            return age
        } catch (e) {
            return null
        }
    }, [contract.dob])

    const weightLoss = React.useMemo(() => {
        const initial_w = parseFloat(contract.initial_weight || '0')
        const target_w = parseFloat(contract.target_weight || '0')
        if (!isNaN(initial_w) && !isNaN(target_w) && initial_w > 0) {
            return initial_w - target_w
        }
        return null
    }, [contract.initial_weight, contract.target_weight])

    const formattedDob = React.useMemo(() => {
        if (!contract.dob) return '--'
        try {
            const d = new Date(contract.dob)
            if (isNaN(d.getTime())) return '--'
            return format(d, 'dd/MM/yyyy')
        } catch (e) {
            return '--'
        }
    }, [contract.dob])

    return (
        <PopoverContent 
            className="w-[320px] p-0 border-none shadow-2xl rounded-[24px] overflow-hidden bg-white dark:bg-gray-950 font-inter" 
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-6 space-y-6">
                {/* Header: Avatar, Name & Phone */}
                <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-slate-50 dark:border-slate-800 shadow-sm rounded-2xl">
                        <AvatarImage src={contract.avatar_url} className="object-cover" />
                        <AvatarFallback className="bg-slate-100 text-slate-400">
                            <User className="w-8 h-8" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                        <h4 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
                            {contract.member_name}
                        </h4>
                        <span className="text-[14px] font-semibold text-rose-500 tracking-tight">
                            {contract.phone}
                        </span>
                    </div>
                </div>

                {/* Info List */}
                <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500 font-medium">Ngày sinh</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold uppercase">
                            {formattedDob} 
                            {age !== null ? ` (${age} tuổi)` : ''}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500 font-medium">Chiều cao (cm)</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">{contract.initial_height || '--'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500 font-medium">Cân nặng ban đầu (kg)</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">{contract.initial_weight || '--'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500 font-medium font-inter">Cân nặng dự kiến giảm (kg)</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">
                            {weightLoss !== null && weightLoss > 0 ? weightLoss : '--'}
                        </span>
                    </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

                <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500 font-medium">Facebook cá nhân</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">--</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500 font-medium">Email</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer truncate max-w-[180px]">
                            {contract.email || '--'}
                        </span>
                    </div>
                </div>

                {/* Footer Action */}
                <Button 
                    onClick={(e) => {
                        e.stopPropagation()
                        onShowDetails()
                    }}
                    className="w-full h-12 rounded-xl bg-[#FD5771] hover:bg-[#e04d64] text-white font-bold text-[14px] transition-all active:scale-[0.98] shadow-lg shadow-red-100 dark:shadow-red-950/20"
                >
                    Xem chi tiết
                </Button>
            </div>
        </PopoverContent>
    )
}

export default function ContractsPage() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = React.useState('')
    const [debouncedSearch, setDebouncedSearch] = React.useState('')
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(20)
    const [selectedRows, setSelectedRows] = React.useState<string[]>([])
    const [selectedContract, setSelectedContract] = React.useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [showMobileFilters, setShowMobileFilters] = React.useState(false)

    // Filter states
    const [statusFilter, setStatusFilter] = React.useState('all')
    const [branchFilter, setBranchFilter] = React.useState('all')
    const [ptFilter, setPtFilter] = React.useState('all')
    const [contractTypeFilter, setContractTypeFilter] = React.useState('all')
    const [isSortOpen, setIsSortOpen] = React.useState(false)

    const { permissions, user: currentUser, isLoading: isLoadingPermissions } = usePermissions()

    const SortPopover = () => {
        const [localSort, setLocalSort] = React.useState(sortConfig || { key: 'updated_at', direction: 'desc' })

        const fields = [
            { label: 'Ngày cập nhật', value: 'updated_at' },
            { label: 'Ngày ký', value: 'start_date' },
            { label: 'Ngày tạo', value: 'created_at' },
            { label: 'Tên hội viên', value: 'member_name' },
            { label: 'Tổng tiền', value: 'total_amount' },
            { label: 'Trạng thái', value: 'status' },
        ]

        return (
            <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className={cn(
                        "h-9 px-3 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all gap-2",
                        isSortOpen && "bg-red-50 text-red-600 border-red-200"
                    )}>
                        <LayoutGrid className="w-4 h-4" />
                        <span className="text-xs font-semibold hidden sm:inline">Sắp xếp</span>
                        <ChevronDown className={cn("w-3 h-3 transition-transform", isSortOpen && "rotate-180")} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0 border-none shadow-2xl rounded-[24px] overflow-hidden bg-white dark:bg-gray-950" align="end">
                    <div className="p-5 space-y-5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[15px] font-bold text-slate-900 dark:text-white">Bộ lọc sắp xếp</h4>
                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                                <ArrowUpDown className="w-4 h-4 text-red-500" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tiêu chí ưu tiên</label>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {fields.map((f) => (
                                        <button
                                            key={f.value}
                                            onClick={() => setLocalSort({ ...localSort, key: f.value })}
                                            className={cn(
                                                "flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all border",
                                                localSort.key === f.value 
                                                    ? "bg-red-50 border-red-100 text-red-600" 
                                                    : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                                            )}
                                        >
                                            {f.label}
                                            {localSort.key === f.value && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thứ tự hiển thị</label>
                                <div className="flex p-1 bg-slate-50 dark:bg-slate-900 rounded-xl gap-1">
                                    <button
                                        onClick={() => setLocalSort({ ...localSort, direction: 'asc' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-bold transition-all",
                                            localSort.direction === 'asc' ? "bg-white shadow-sm text-red-600" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                        Tăng dần
                                    </button>
                                    <button
                                        onClick={() => setLocalSort({ ...localSort, direction: 'desc' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-bold transition-all",
                                            localSort.direction === 'desc' ? "bg-white shadow-sm text-red-600" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                        Giảm dần
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-11 rounded-xl text-[13px] font-bold text-slate-500 border-slate-200"
                                onClick={() => setIsSortOpen(false)}
                            >
                                Đóng
                            </Button>
                            <Button
                                className="flex-2 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold shadow-lg shadow-red-100"
                                onClick={() => {
                                    setSortConfig(localSort)
                                    setIsSortOpen(false)
                                }}
                            >
                                Áp dụng
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (!sortConfig || sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 w-3 h-3 opacity-30" />
        return sortConfig.direction === 'asc' 
            ? <ChevronUp className="ml-1 w-3 h-3 text-red-500" /> 
            : <ChevronDown className="ml-1 w-3 h-3 text-red-500" />
    }

    React.useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1) }, 400)
        return () => clearTimeout(t)
    }, [searchTerm])
    React.useEffect(() => { setPage(1) }, [statusFilter, branchFilter, ptFilter, contractTypeFilter, pageSize])
    
    // Sort config state moved after usePermissions for correct initialization order if needed
    const [sortConfig, setSortConfig] = React.useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'updated_at', direction: 'desc' })

    // ── Data from global cache ────────────────────────────────────────────────
    const { data: configResult } = useQuery({
        queryKey: ['contract-configs'],
        queryFn: fetchContractConfigs,
        staleTime: Infinity,
    })
    const contractStatuses = React.useMemo(() => configResult?.data?.statuses || [], [configResult])

    // ── Contracts list — dùng Lite version (không JOIN clients nặng) ───────────
    // Khi mở ContractDetailsSheet, fetchContractById sẽ tải full data
    const { data: contracts = [], isLoading } = useQuery<any[]>({
        queryKey: ['contracts-all'],
        queryFn: async () => {
            const res = await fetchContractsLite()  // ✅ Lite: nhanh hơn ~60%
            return res.success ? (res.data ?? []) : []
        },
        staleTime: TEN_MINUTES,            // ✅ Match với AppDataInitializer
        select: (data) => Array.isArray(data) ? data : [],
    })

    const { data: branches = [] } = useQuery<any[]>({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? (res.data ?? []) : []
        },
        staleTime: Infinity,
    })

    const allowedBranches = React.useMemo(() => {
        if (permissions.canViewAllBranches) return branches
        if (permissions.allowedBranchIds) {
            return branches.filter(b => permissions.allowedBranchIds?.includes(b.id))
        }
        return []
    }, [branches, permissions])

    // Set initial branch filter if restricted to one branch
    React.useEffect(() => {
        if (!isLoadingPermissions && !permissions.canViewAllBranches && allowedBranches.length === 1 && branchFilter === 'all') {
            setBranchFilter(allowedBranches[0].id)
        }
    }, [allowedBranches, permissions, isLoadingPermissions, branchFilter])

    // ── Client-side filtering ─────────────────────────────────────────────────
    const filteredContracts = React.useMemo(() => {
        let result = (contracts ?? []).filter((c: any) => {
            if (debouncedSearch) {
                const q = debouncedSearch.toLowerCase()
                if (
                    !c.member_name?.toLowerCase().includes(q) &&
                    !c.id?.toLowerCase().includes(q) &&
                    !c.package_name?.toLowerCase().includes(q)
                ) return false
            }
            if (statusFilter !== 'all' && c.status !== statusFilter) return false
            if (branchFilter !== 'all' && c.branch_id !== branchFilter) return false
            if (ptFilter !== 'all' && c.trainer_name !== ptFilter) return false
            if (contractTypeFilter !== 'all' && c.contract_type !== contractTypeFilter) return false
            return true
        })

        if (sortConfig) {
            result = [...result].sort((a: any, b: any) => {
                const aValue = a[sortConfig.key] || ''
                const bValue = b[sortConfig.key] || ''
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return result
    }, [contracts, debouncedSearch, statusFilter, branchFilter, ptFilter, contractTypeFilter, sortConfig])

    // ── Pagination (client-side) ──────────────────────────────────────────────
    const totalCount = filteredContracts.length
    const totalPages = pageSize === -1 ? 1 : Math.ceil(totalCount / pageSize)
    const pagedContracts = React.useMemo(() => {
        if (pageSize === -1) return filteredContracts
        const from = (page - 1) * pageSize
        return filteredContracts.slice(from, from + pageSize)
    }, [filteredContracts, page, pageSize])

    // ── Filter option lists (full DB, not just current page) ─────────────────
    const ptOptions = React.useMemo(() =>
        Array.from(new Set((contracts ?? []).map((c: any) => c.trainer_name).filter(Boolean))),
        [contracts]
    )
    const typeOptions = React.useMemo(() =>
        Array.from(new Set((contracts ?? []).map((c: any) => c.contract_type).filter(Boolean))),
        [contracts]
    )

    // Status counts for the badge tabs
    const statusCounts = React.useMemo(() => {
        const counts: Record<string, number> = { total: contracts?.length ?? 0 }
        contractStatuses.forEach((s: any) => {
            counts[s.nam] = (contracts ?? []).filter((c: any) => c.status === s.nam).length
        })
        return counts
    }, [contracts, contractStatuses])

    const refetch = () => {
        queryClient.invalidateQueries({ queryKey: ['contracts-all'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    }

    const clearFilters = () => {
        setSearchTerm(''); setStatusFilter('all'); setBranchFilter('all')
        setPtFilter('all'); setContractTypeFilter('all')
        toast.info('Đã xóa tất cả bộ lọc')
    }

    const handleRowClick = (contract: any, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
            (e.target as HTMLElement).tagName.toLowerCase() === 'label'
        ) return
        setSelectedContract(contract); setIsDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Xóa hợp đồng này sẽ xóa phần công nợ liên quan đến hợp đồng đó, Bạn có muốn tiếp tục không?')) {
            const result = await bulkDeleteContracts([id])
            if (!result.success) toast.error('Lỗi khi xóa: ' + result.error)
            else { toast.success('Đã xóa hợp đồng thành công'); refetch() }
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return
        if (confirm(`Xóa các hợp đồng này sẽ xóa phần công nợ liên quan, Bạn có muốn tiếp tục xóa ${selectedRows.length} hợp đồng đã chọn?`)) {
            const result = await bulkDeleteContracts(selectedRows)
            if (!result.success) toast.error('Lỗi khi xóa hàng loạt: ' + result.error)
            else { toast.success(`Đã xóa thành công ${selectedRows.length} hợp đồng`); setSelectedRows([]); refetch() }
        }
    }

    const exportToExcel = () => {
        if (!filteredContracts?.length) { toast.error('Không có dữ liệu để xuất'); return }
        const data = filteredContracts.map((c: any) => ({
            'Mã hợp đồng': c.id,
            'Mã khách hàng': c.client_id,
            'Hội viên': c.member_name,
            'Số điện thoại': c.phone,
            'Email': c.email,
            'Ngày sinh': c.dob ? new Date(c.dob).toLocaleDateString('vi-VN') : '',
            'Số CMND/CCCD': c.id_number,
            'Địa chỉ hội viên': c.member_address,
            'Trạng thái': c.status,
            'Mã chi nhánh': c.branch_id,
            'Chi nhánh': c.branches?.name || c.facility_name || '',
            'Tên cơ sở': c.facility_name,
            'Tên viết tắt': c.short_name,
            'Địa chỉ cơ sở': c.address,
            'Hotline trung tâm': c.center_phone,
            'Loại hợp đồng': c.contract_type,
            'Tên hợp đồng': c.contract_name,
            'Ngày ký': c.signing_date ? new Date(c.signing_date).toLocaleDateString('vi-VN') : '',
            'Ngày bắt đầu': c.start_date ? new Date(c.start_date).toLocaleDateString('vi-VN') : '',
            'Ngày kết thúc': c.end_date ? new Date(c.end_date).toLocaleDateString('vi-VN') : '',
            'Thời hạn gói (tháng)': c.package_duration,
            'Tổng số ngày': c.total_days,
            'Nguồn khách': c.source,
            'Đại diện pháp luật': c.legal_representative,
            'SĐT đại diện': c.representative_phone,
            'Chiều cao ban đầu': c.initial_height,
            'Cân nặng ban đầu': c.initial_weight,
            'Cân nặng mục tiêu': c.target_weight,
            'Cân nặng cuối cùng': c.final_weight,
            'Thay đổi cân nặng': c.weight_change,
            'Tình trạng sức khỏe': c.medical_conditions,
            'Tình trạng bệnh lý': c.medical_condition,
            'Mã gói tập': c.membership_id,
            'Tên gói tập': c.package_name,
            'Loại gói tập': c.package_type,
            'Số lượng': c.quantity,
            'Giá niêm yết': c.package_price,
            'Giá niêm yết (chữ)': c.package_price_text,
            'Giá trước giảm': c.price_before_discount,
            'Giá sau giảm': c.discounted_price,
            'Giá sau giảm (chữ)': c.discounted_price_text,
            'Tổng tiền': c.total_amount,
            'Tổng tiền (chữ)': c.total_amount_text,
            'Lựa chọn tùy chỉnh': c.custom_selection,
            'Loại PT': c.trainer_type,
            'Tổng số buổi': c.total_sessions,
            'Tên PT': c.trainer_name,
            'SĐT PT': c.trainer_phone,
            'PT được chỉ định': c.assigned_pt,
            'Đại diện trung tâm': c.center_representative,
            'Tên người đại diện': c.representative_name,
            'SĐT nhân viên': c.staff_phone,
            'Phương thức thanh toán': c.payment_method,
            'Số kỳ thanh toán': c.payment_installment,
            'Số tài khoản': c.account_number,
            'Chủ tài khoản': c.account_holder,
            'Tên ngân hàng': c.bank_name,
            'Ghi chú thanh toán': c.payment_notes,
            'Link QR': c.qr_payment_url,
            'Link file HĐ': c.contract_file_url,
            'Tên file HĐ': c.contract_file_name,
            'Ảnh 1': c.photo_1_url,
            'Ảnh 2': c.photo_2_url,
            'Tháng': c.month,
            'Ngày': c.day,
            'Chữ ký hội viên': c.signature_url,
            'Chữ ký trung tâm': c.signature_center,
            'Gửi Zalo': c.sendzalo,
            'Gửi Email': c.sendemail,
            'Người tạo (ID)': c.created_by,
            'Email người tạo': c.created_by_email,
            'Ngày tạo hệ thống': c.created_at ? new Date(c.created_at).toLocaleString('vi-VN') : '',
            'Cập nhật cuối': c.updated_at ? new Date(c.updated_at).toLocaleString('vi-VN') : '',
            'Nhật ký hoạt động': c.action_log,
            'Địa chỉ trung tâm': c.center_address,
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Contracts')
        XLSX.writeFile(wb, `Contracts_Export_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Đã xuất file Excel thành công')
    }

    const toggleRow = (id: string) =>
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
    const toggleAll = () =>
        setSelectedRows(selectedRows.length === pagedContracts.length ? [] : pagedContracts.map((c: any) => c.id))

    return (
        <div className="space-y-1.5 font-inter pb-10">
            <ContractDetailsSheet
                contract={selectedContract} open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen} onSuccess={refetch}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-[#FD5771]" />
                        Hợp đồng
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-300 font-medium tracking-tight">Theo dõi và quản lý các hợp đồng dịch vụ của hội viên.</p>
                </div>
                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {selectedRows.length > 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <Button variant="ghost" onClick={handleBulkDelete}
                                    className="text-red-700 hover:text-red-800 hover:bg-red-50 font-medium px-4 h-11 rounded-xl border border-red-100">
                                    <Trash className="w-4 h-4 mr-2" />
                                    Xóa ({selectedRows.length})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex gap-2">
                        <ImportExcelContractDialog onSuccess={refetch} />
                        <Button variant="ghost" onClick={exportToExcel}
                            className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 h-11 w-11 p-0 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all font-medium">
                            <FileDown className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" asChild
                            className="rounded-xl border border-gray-100 dark:border-gray-800 text-red-600 dark:text-red-400 h-11 px-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-medium gap-2">
                            <Link href="/contracts/due" className="flex items-center gap-2">
                                <CalendarClock className="w-5 h-5" />
                                <span className="text-sm">HĐ Đến hạn</span>
                            </Link>
                        </Button>
                        <Button 
                            onClick={() => {
                                setSelectedContract(null)
                                setIsDetailsOpen(true)
                            }}
                            className="rounded-xl h-11 px-6 font-bold text-[13px] bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100 dark:shadow-red-900/20 transition-all font-inter active:scale-95"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Tạo Hợp đồng
                        </Button>
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="bg-transparent h-auto p-0 flex flex-nowrap overflow-x-auto no-scrollbar gap-2 px-1 mb-1 w-full justify-start py-1">
                    <TabsTrigger value="all" className={cn(
                        "flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border border-gray-100 dark:border-gray-800",
                        "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-red-200 data-[state=active]:text-red-600",
                        "bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-300"
                    )}>
                        Tất cả
                        <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600">{statusCounts.total}</span>
                    </TabsTrigger>
                    {contractStatuses.map((s: any) => {
                        const statusColors: any = {
                            'Đang tập': { active: 'bg-emerald-50 text-emerald-700 border-emerald-200', inactive: 'bg-emerald-50/30 text-emerald-600/70 border-emerald-100/50', badge: 'bg-emerald-500 text-white' },
                            'Chờ ký': { active: 'bg-slate-100 text-slate-700 border-slate-300', inactive: 'bg-slate-50/50 text-slate-500 border-slate-100', badge: 'bg-slate-400 text-white' },
                            'Hết hạn': { active: 'bg-rose-50 text-rose-700 border-rose-200', inactive: 'bg-rose-50/30 text-rose-600/70 border-rose-100/50', badge: 'bg-rose-500 text-white' },
                            'Hoàn thành': { active: 'bg-blue-50 text-blue-700 border-blue-200', inactive: 'bg-blue-50/30 text-blue-600/70 border-blue-100/50', badge: 'bg-blue-500 text-white' },
                            'Hủy': { active: 'bg-neutral-100 text-neutral-700 border-neutral-300', inactive: 'bg-neutral-50/50 text-neutral-500 border-neutral-100', badge: 'bg-neutral-400 text-white' },
                            'Gia hạn': { active: 'bg-amber-50 text-amber-700 border-amber-200', inactive: 'bg-amber-50/30 text-amber-600/70 border-amber-100/50', badge: 'bg-amber-500 text-white' }
                        }
                        const colors = statusColors[s.nam] || { active: 'bg-white text-red-600 border-red-200', inactive: 'bg-white/50 text-gray-500 border-gray-100', badge: 'bg-red-500 text-white' }

                        return (
                            <TabsTrigger key={`status-tab-${s.id}`} value={s.nam} 
                                className={cn(
                                    "flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-none border",
                                    "data-[state=active]:shadow-md hover:scale-105 active:scale-95",
                                    colors.inactive,
                                    "data-[state=active]:" + colors.active.split(' ').join(' data-[state=active]:')
                                )}>
                                {s.nam}
                                <span className={cn("px-1.5 py-0.5 rounded-lg text-[10px] font-bold", colors.badge)}>
                                    {statusCounts[s.nam] || 0}
                                </span>
                            </TabsTrigger>
                        )
                    })}
                </TabsList>
            </Tabs>

            {/* Filter Section */}
            <Card className="border-none shadow-sm rounded-xl overflow-visible bg-white dark:bg-gray-900 py-0">
                <div className="py-1 px-1 sm:px-1.5 rounded-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300 group-focus-within:text-red-600 transition-colors" />
                                <input
                                    placeholder="Tìm kiếm hợp đồng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 h-9 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                                />
                            </div>
                            <SortPopover />
                            <Button variant="outline" size="icon"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={cn("lg:hidden h-9 w-9 rounded-lg border-gray-200 dark:border-gray-800",
                                    showMobileFilters ? "bg-red-50 text-red-600 border-red-200" : "bg-white dark:bg-gray-800/50")}>
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>

                        <AnimatePresence>
                            {(showMobileFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                                <motion.div
                                    initial={typeof window !== 'undefined' && window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden lg:overflow-visible lg:flex lg:flex-row lg:items-center gap-2">
                                    <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 items-center pt-2 lg:pt-0">
                                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
                                                <SelectValue placeholder="Chi nhánh" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                {(permissions.canViewAllBranches || allowedBranches.length > 1) && (
                                                    <SelectItem value="all">{permissions.canViewAllBranches ? 'Tất cả chi nhánh' : 'Tất cả chi nhánh'}</SelectItem>
                                                )}
                                                {allowedBranches.map((branch: any) => (
                                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={ptFilter} onValueChange={setPtFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
                                                <SelectValue placeholder="PT phụ trách" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả PT</SelectItem>
                                                {ptOptions.map((pt: string) => (
                                                    <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
                                            <SelectTrigger className="h-9 rounded-lg border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-3 shadow-none">
                                                <SelectValue placeholder="Loại hợp đồng" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                                <SelectItem value="all">Tất cả loại</SelectItem>
                                                {typeOptions.map((type: string) => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button variant="ghost" onClick={clearFilters}
                                            className="h-9 px-3 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 transition-all col-span-2 lg:col-span-1 justify-center">
                                            <RotateCcw className="w-4 h-4 mr-2 lg:mr-0" />
                                            <span className="lg:hidden text-sm font-medium">Làm mới bộ lọc</span>
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pagination controls (top) */}
                    {!isLoading && totalCount > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-3 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/10 gap-4 mt-1 rounded-b-xl">
                            <div className="flex items-center gap-4">
                                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
                                    <span className="text-gray-900 dark:text-gray-100 font-black">{pagedContracts.length}</span> / {totalCount} hợp đồng
                                </div>
                                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                                    <SelectTrigger className="h-7 w-16 rounded-lg border-gray-100 dark:border-gray-800 text-[10px] font-bold focus:ring-red-500 bg-white dark:bg-gray-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="-1">Tất cả</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {pageSize !== -1 && totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <Button variant="outline" size="sm" disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className="rounded-lg border-gray-100 dark:border-gray-800 h-7 px-2 text-[10px] font-bold bg-white dark:bg-gray-800">
                                        <ChevronLeft className="w-3 h-3 mr-1" />Trước
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                            let pn = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
                                            return (
                                                <Button key={pn} variant={page === pn ? 'default' : 'outline'} size="sm"
                                                    onClick={() => setPage(pn)}
                                                    className={cn('w-7 h-7 rounded-lg p-0 text-[10px] font-black',
                                                        page === pn ? 'bg-red-600 hover:bg-red-700' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800')}>
                                                    {pn}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                    <Button variant="outline" size="sm" disabled={page === totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        className="rounded-lg border-gray-100 dark:border-gray-800 h-7 px-2 text-[10px] font-bold bg-white dark:bg-gray-800">
                                        Sau<ChevronRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Table */}
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-50 dark:border-gray-800 hover:bg-transparent border-t-0">
                                <TableHead className="w-12 pl-6 h-9">
                                    <Checkbox
                                        checked={selectedRows.length === pagedContracts.length && pagedContracts.length > 0}
                                        onCheckedChange={toggleAll}
                                        className="rounded-lg border-gray-300 dark:border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                    />
                                </TableHead>
                                <TableHead onClick={() => handleSort('member_name')} className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 cursor-pointer hover:text-red-600 transition-colors uppercase tracking-wider group">
                                    <div className="flex items-center">
                                        Hợp đồng & Hội viên 
                                        <SortIcon columnKey="member_name" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('package_name')} className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 cursor-pointer hover:text-red-600 transition-colors uppercase tracking-wider group">
                                    <div className="flex items-center">
                                        Dịch vụ & Gói tập 
                                        <SortIcon columnKey="package_name" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('total_amount')} className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 cursor-pointer hover:text-red-600 transition-colors uppercase tracking-wider group">
                                    <div className="flex items-center">
                                        Giá trị & Thanh toán 
                                        <SortIcon columnKey="total_amount" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('branch_id')} className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 cursor-pointer hover:text-red-600 transition-colors uppercase tracking-wider group">
                                    <div className="flex items-center">
                                        Chi nhánh và PT 
                                        <SortIcon columnKey="branch_id" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('start_date')} className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 cursor-pointer hover:text-red-600 transition-colors uppercase tracking-wider group">
                                    <div className="flex items-center">
                                        Ngày hợp đồng 
                                        <SortIcon columnKey="start_date" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('status')} className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 cursor-pointer hover:text-red-600 transition-colors uppercase tracking-wider group">
                                    <div className="flex items-center">
                                        Trạng thái
                                        <SortIcon columnKey="status" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right pr-8 text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9 uppercase tracking-wider">Tùy chọn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                        <TableCell className="text-right pr-8"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : pagedContracts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                            </div>
                                            <p className="text-gray-400 text-sm font-medium">Thêm hợp đồng đầu tiên.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                    pagedContracts.map((contract: any) => {
                                        const remainingDays = (() => {
                                            if (!contract.end_date) return null
                                            const end = new Date(contract.end_date)
                                            const today = new Date()
                                            today.setHours(0, 0, 0, 0)
                                            const diff = end.getTime() - today.getTime()
                                            return Math.ceil(diff / (1000 * 60 * 60 * 24))
                                        })()

                                        return (
                                            <TableRow key={contract.id} onClick={(e) => handleRowClick(contract, e)}
                                                className={cn('border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors',
                                                    selectedRows.includes(contract.id) && 'bg-red-50/30 dark:bg-red-950/20')}>
                                                <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox checked={selectedRows.includes(contract.id)}
                                                        onCheckedChange={() => toggleRow(contract.id)} className="rounded-lg" />
                                                </TableCell>
                                                <TableCell className="py-2.5">
                                                    <div className="flex items-start justify-between group">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                                                                {contract.id}
                                                            </span>
                                                            <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                                                {contract.member_name}
                                                            </span>
                                                            <span className="text-[12px] font-medium text-gray-400 dark:text-gray-300">
                                                                {contract.phone}
                                                            </span>
                                                        </div>

                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <button 
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500"
                                                                >
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </button>
                                                            </PopoverTrigger>
                                                            <MemberSummaryPopover 
                                                                contract={contract} 
                                                                onShowDetails={() => {
                                                                    setSelectedContract(contract); 
                                                                    setIsDetailsOpen(true)
                                                                }} 
                                                            />
                                                        </Popover>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-gray-600 dark:text-gray-100">
                                                        <div className="flex items-center gap-1.5">
                                                            <Package className="w-3 h-3 text-gray-400 dark:text-gray-300" />
                                                            {contract.package_name || 'Chưa chọn gói'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-300 text-[11px]">
                                                            <Clock className="w-3 h-3" />
                                                            {contract.contract_type || 'Dịch vụ'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-gray-600 dark:text-gray-100">
                                                        <span className="text-sm font-medium text-red-600">
                                                            {contract.total_amount ? Number(contract.total_amount).toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-300 text-[11px]">
                                                            <CreditCard className="w-3 h-3" />
                                                            {contract.payment_method || 'N/A'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                        <div className="flex items-center gap-1.5">
                                                            <Building2 className="w-3 h-3 text-gray-400" />
                                                            {contract.branches?.name || 'Văn phòng'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                            <User className="w-3 h-3" />
                                                            {contract.trainer_name || 'Chưa có PT'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-[11px] text-gray-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>Ký: {contract.start_date ? new Date(contract.start_date).toLocaleDateString('vi-VN') : '-'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" />
                                                            <span>Hết: {contract.end_date ? new Date(contract.end_date).toLocaleDateString('vi-VN') : '-'}</span>
                                                        </div>
                                                        <div className={cn("mt-1 font-bold", remainingDays !== null && remainingDays <= 0 ? "text-red-500" : "text-blue-500")}>
                                                            Còn: {remainingDays !== null ? (remainingDays > 0 ? `${remainingDays} ngày` : 'Hết hạn') : '-'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
                                                        contract.status === 'Chờ ký HĐ' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        contract.status === 'Đã ký HĐ' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        "bg-gray-50 text-gray-600 border-gray-100"
                                                    )}>
                                                        <div className={cn("w-1 h-1 rounded-full", 
                                                            contract.status === 'Chờ ký HĐ' ? "bg-amber-500" :
                                                            contract.status === 'Đã ký HĐ' ? "bg-emerald-500" :
                                                            "bg-gray-400"
                                                        )} />
                                                        {contract.status}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {contract.contract_file_url && contract.contract_file_url !== 'create_contract' && contract.contract_file_url.startsWith('http') && (
                                                            <Button variant="ghost" size="icon"
                                                                onClick={(e) => { e.stopPropagation(); window.open(contract.contract_file_url, '_blank') }}
                                                                title="Mở link hợp đồng"
                                                                className="w-8 h-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600">
                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon"
                                                            onClick={(e) => { e.stopPropagation(); setSelectedContract(contract); setIsDetailsOpen(true) }}
                                                            className="w-8 h-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(contract.id) }}
                                                            className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
