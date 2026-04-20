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
    User,
    Mail,
    Phone,
    Building2,
    Briefcase,
    Shield,
    Edit2,
    Save,
    Trash2,
    X,
    BadgeCheck,
    Clock,
    UserCircle,
    XCircle,
    Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { updateUser, deleteUser } from '@/app/actions/users'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { fetchBranches } from '@/app/actions/branches'
import { Checkbox } from '@/components/ui/checkbox'

// ─── Component con nằm NGOÀI component cha để tránh re-mount khi state thay đổi ───
const CardSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-[12px] font-semibold text-black dark:text-white tracking-tight">{title}</h3>
        </div>
        {children}
    </div>
)

const UserDetailRow = ({ label, value, name, type = 'text', options, icon: Icon, isEditing, formData, onChange, onValueChange }: any) => (
    <div className="space-y-1.5">
        <Label className="text-[10px] font-medium text-black/40 dark:text-slate-500 tracking-tight flex items-center gap-2">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </Label>
        {isEditing ? (
            type === 'select' ? (
                <Select
                    value={formData[name] || undefined}
                    onValueChange={(val) => onValueChange(name, val)}
                >
                    <SelectTrigger className="w-full rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all border-2">
                        <SelectValue placeholder={`Chọn ${label.toLowerCase()}...`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 z-[100]">
                        {options?.map((opt: any) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <Input
                    name={name}
                    type={type}
                    value={formData[name] ?? ''}
                    onChange={onChange}
                    disabled={name === 'created_at'}
                    className={cn(
                        "rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300",
                        name === 'created_at' && "opacity-60 cursor-not-allowed"
                    )}
                />
            )
        ) : (
            <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200 min-h-[20px]">
                {name === 'status' ? (value === 'Activated' ? 'Đang hoạt động' : 'Tạm ngưng') : 
                 (name === 'dob' && value) ? new Date(value).toLocaleDateString('vi-VN') :
                 (value || '-')}
            </p>
        )}
    </div>
)
// ─────────────────────────────────────────────────────────────────────────────

interface UserDetailsSheetProps {
    user: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    branches?: any[]
}

export function UserDetailsSheet({
    user,
    open,
    onOpenChange,
    onSuccess,
    branches: branchesProp = []
}: UserDetailsSheetProps) {
    const isMobile = useIsMobile()
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})

    const [branches, setBranches] = React.useState<any[]>([])

    React.useEffect(() => {
        if (open && branchesProp.length === 0) {
            const loadData = async () => {
                const res = await fetchBranches()
                if (res.success) {
                    setBranches(res.data || [])
                }
            }
            loadData()
        } else if (open && branchesProp.length > 0) {
            setBranches(branchesProp)
        }
    }, [open, branchesProp])

    React.useEffect(() => {
        if (user) {
            // Parse managed_branches if it's a string (Postgres text representation of JSON)
            let managedBranches = user.managed_branches
            if (typeof managedBranches === 'string' && managedBranches.length > 3) {
                try {
                    managedBranches = JSON.parse(managedBranches)
                } catch (e) {
                    // Try to handle Postgres array format {} if it's not JSON
                    if (managedBranches.startsWith('{') && managedBranches.endsWith('}')) {
                        managedBranches = managedBranches.slice(1, -1).split(',').map((s: string) => s.trim().replace(/"/g, ''))
                    } else {
                        managedBranches = []
                    }
                }
            }

            setFormData({
                ...user,
                managed_branches: Array.isArray(managedBranches) ? managedBranches : []
            })
            setIsEditing(false)
        }
    }, [user])

    if (!user) return null

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => {
            const newData = { ...prev, [name]: value }
            
            // Auto-calculate age if dob changes
            if (name === 'dob' && value) {
                const birthDate = new Date(value)
                const today = new Date()
                let age = today.getFullYear() - birthDate.getFullYear()
                const m = today.getMonth() - birthDate.getMonth()
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--
                }
                if (age >= 0) newData.age = age
            } else if (name === 'dob' && !value) {
                newData.age = null
            }
            
            return newData
        })
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await updateUser(user.id, formData)
            if (result.success) {
                toast.success('Đã cập nhật thông tin nhân sự')
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
        if (confirm('Bạn có chắc chắn muốn xóa nhân sự này khỏi hệ thống?')) {
            setLoading(true)
            try {
                const result = await deleteUser(user.id)
                if (result.success) {
                    toast.success('Đã xóa nhân sự thành công')
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


    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev: any) => {
            const newData = { ...prev, [name]: value }
            if (name === 'branch_id') {
                const branch = branches.find((b: any) => b.id === value)
                newData.branch_name = branch ? branch.name : null
            }
            return newData
        })
    }

    const toggleManagedBranch = (branchId: string) => {
        setFormData((prev: any) => {
            const current = Array.isArray(prev.managed_branches) ? prev.managed_branches : []
            const next = current.includes(branchId)
                ? current.filter((id: string) => id !== branchId)
                : [...current, branchId]
            return { ...prev, managed_branches: next }
        })
    }

    const sharedRowProps = { isEditing, formData, onChange: handleInputChange, onValueChange: handleSelectChange }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={isMobile ? "bottom" : "right"}
                resizable={!isMobile}
                showCloseButton={false}
                className={cn(
                    "border-none shadow-2xl p-0 flex flex-col bg-slate-50 dark:bg-gray-950 font-inter transition-all duration-300",
                    isMobile ? "h-[92vh] rounded-t-[32px]" : "h-full w-full sm:max-w-[540px]"
                )}
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>{isEditing ? 'Chỉnh sửa nhân sự' : user.name}</SheetTitle>
                    <SheetDescription>Chi tiết thông tin nhân sự hệ thống</SheetDescription>
                </SheetHeader>

                {/* Sticky Header */}
                <div className={cn(
                    "sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 sm:px-5 py-3 flex items-center justify-between shrink-0",
                    isMobile && "py-4"
                )}>
                    {isMobile && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-2" />
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                            <UserCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[14px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                                {isEditing ? 'Chỉnh sửa nhân sự' : user.name}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email || 'Ladyfit System'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        {isMobile && (
                            <>
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSave}
                                            className="h-9 px-2 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/20 transition-all font-semibold active:scale-95"
                                            disabled={loading}
                                        >
                                            <Save className="w-4 h-4 mr-1" />
                                            <span className="text-xs">Lưu</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditing(false)}
                                            className="h-9 px-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all font-semibold active:scale-95"
                                        >
                                            <XCircle className="w-4 h-4 mr-1" />
                                            <span className="text-xs">Hủy</span>
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                        className="h-9 px-2 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20 transition-all font-semibold active:scale-95"
                                    >
                                        <Edit2 className="w-4 h-4 mr-1" />
                                        <span className="text-xs">Sửa</span>
                                    </Button>
                                )}
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4 pb-44 sm:pb-24">
                    {/* Top Profile Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 shrink-0">
                                <UserCircle className="w-10 h-10 sm:w-12 sm:h-12" />
                            </div>
                            <div className="flex-1 min-w-0 pt-1 space-y-1">
                                <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white truncate tracking-tight leading-none">
                                    {user.name}
                                </h2>
                                <p className="text-[13px] sm:text-sm text-black/60 dark:text-gray-400 font-medium">
                                    {user.position || 'Nhân sự Ladyfit'}
                                </p>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                        user.status === 'Activated' ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 shadow-sm" : "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 shadow-sm"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", user.status === 'Activated' ? "bg-emerald-500" : "bg-rose-500")} />
                                        {user.status === 'Activated' ? 'Đang hoạt động' : 'Tạm ngưng'}
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 shadow-sm">
                                        Điện thoại: {user.phone || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Liên hệ */}
                    <CardSection title="Thông tin liên hệ" icon={Mail}>
                        <div className="space-y-5">
                            <UserDetailRow label="Họ và tên" value={formData.name} name="name" icon={User} {...sharedRowProps} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <UserDetailRow label="Số điện thoại" value={formData.phone} name="phone" icon={Phone} {...sharedRowProps} />
                                <UserDetailRow label="Email" value={formData.email} name="email" icon={Mail} {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <UserDetailRow label="Ngày sinh" value={formData.dob} name="dob" type="date" icon={Calendar} {...sharedRowProps} />
                                <UserDetailRow label="Tuổi" value={formData.age} name="age" type="number" icon={User} {...sharedRowProps} />
                            </div>
                        </div>
                    </CardSection>

                    {/* Section: Công việc */}
                    <CardSection title="Vị trí công tác" icon={Briefcase}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <UserDetailRow
                                    label="Chi nhánh"
                                    value={formData.branch_name || user.branches?.name || '-'}
                                    name="branch_id"
                                    icon={Building2}
                                    type="select"
                                    options={branches.map((b: any) => ({ label: b.name, value: b.id }))}
                                    {...sharedRowProps}
                                />
                                <UserDetailRow
                                    label="Phòng ban"
                                    value={formData.department}
                                    name="department"
                                    icon={Briefcase}
                                    type="select"
                                    options={[
                                        { label: 'PT', value: 'PT' },
                                        { label: 'Quản lý', value: 'Quản lý' }
                                    ]}
                                    {...sharedRowProps}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <UserDetailRow
                                    label="Chức vụ"
                                    value={formData.position}
                                    name="position"
                                    icon={BadgeCheck}
                                    type="select"
                                    options={[
                                        { label: 'Nhân viên', value: 'Nhân viên' },
                                        { label: 'Quản lý chi nhánh', value: 'Quản lý chi nhánh' },
                                        { label: 'Quản lý', value: 'Quản lý' },
                                        { label: 'CEO', value: 'CEO' }
                                    ]}
                                    {...sharedRowProps}
                                />
                                <UserDetailRow
                                    label="Vai trò"
                                    value={formData.permissions}
                                    name="permissions"
                                    icon={Shield}
                                    type="select"
                                    options={[
                                        { label: 'Admin', value: 'Admin' },
                                        { label: 'User', value: 'User' }
                                    ]}
                                    {...sharedRowProps}
                                />
                            </div>
                        </div>
                    </CardSection>

                    {/* Section: Chi nhánh quản lý (Chỉ hiện khi là Quản lý) */}
                    {formData.position === 'Quản lý' && (
                        <CardSection title="Chi nhánh quản lý" icon={Shield}>
                            <div className="space-y-4">
                                <p className="text-[11px] text-slate-500 mb-2 italic">
                                    {isEditing
                                        ? "Chọn danh sách các chi nhánh nhân sự này sẽ tham gia quản lý."
                                        : "Danh sách hồ sơ chi nhánh được phân quyền quản lý."}
                                </p>
                                {isEditing ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {branches.map((branch: any) => (
                                            <div key={branch.id} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-900">
                                                <Checkbox
                                                    id={`managed-${branch.id}`}
                                                    checked={Array.isArray(formData.managed_branches) && formData.managed_branches.includes(branch.id)}
                                                    onCheckedChange={() => toggleManagedBranch(branch.id)}
                                                />
                                                <Label
                                                    htmlFor={`managed-${branch.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {branch.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    Array.isArray(formData.managed_branches) && formData.managed_branches.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.managed_branches.map((branchId: string) => {
                                                const branch = branches.find((b: any) => b.id.toString().trim() === branchId.toString().trim())
                                                return (
                                                    <div key={branchId} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 text-[12px] font-bold">
                                                        {branch ? branch.name : (branchId === 'all' ? 'Tất cả chi nhánh' : branchId)}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-black/40 dark:text-gray-500 font-medium tracking-tight">Chưa phân quyền chi nhánh nào</p>
                                    ))}
                            </div>
                        </CardSection>
                    )}

                    {/* Section: Hệ thống */}
                    <CardSection title="Thông tin hệ thống" icon={Clock}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <UserDetailRow
                                label="Ngày tham gia"
                                value={user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}
                                name="created_at"
                                icon={Calendar}
                                {...sharedRowProps}
                                isEditing={false}
                            />
                            <UserDetailRow
                                label="Trạng thái"
                                value={formData.status}
                                name="status"
                                icon={BadgeCheck}
                                type="select"
                                options={[
                                    { label: 'Đang hoạt động', value: 'Activated' },
                                    { label: 'Tạm ngưng', value: 'In Activated' }
                                ]}
                                {...sharedRowProps}
                            />
                        </div>
                    </CardSection>
                </div>

                {/* Sticky Footer */}
                <div className={cn(
                    "sticky bottom-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 flex items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] shrink-0",
                    isMobile && "pb-8"
                )}>
                    {!isMobile && (
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl h-12 px-6 font-semibold text-[13px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                            disabled={loading}
                        >
                            Đóng cửa sổ
                        </Button>
                    )}

                    <div className={cn(
                        "flex items-center gap-2 flex-1",
                        !isMobile && "max-w-[400px]"
                    )}>
                        {user && !isEditing && (
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                className="rounded-xl h-11 sm:h-12 px-4 font-semibold text-[13px] border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 dark:border-slate-800 dark:hover:bg-rose-950/20 transition-all active:scale-95"
                                disabled={loading}
                            >
                                <Trash2 className="w-5 h-5 sm:mr-2" />
                                <span className="hidden sm:inline">Xóa nhân sự</span>
                            </Button>
                        )}
                        {isEditing ? (
                            <Button
                                onClick={handleSave}
                                className="flex-1 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-950 dark:bg-red-600 text-white font-bold shadow-lg active:scale-95 transition-all hover:bg-black dark:hover:bg-red-700"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Đang lưu...' : 'Lưu thông tin'}
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-600 text-white font-bold shadow-lg active:scale-95 transition-all hover:bg-blue-700"
                                disabled={loading}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                {isMobile ? 'Sửa thông tin' : 'Chỉnh sửa'}
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
