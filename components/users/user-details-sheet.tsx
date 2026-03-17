'use client'

import * as React from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
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
    Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { updateUser, deleteUser } from '@/app/actions/users'
import { cn } from '@/lib/utils'

// ─── Component con nằm NGOÀI component cha để tránh re-mount khi state thay đổi ───
const CardSection = ({ title, icon: Icon, children }: any) => (
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

const UserDetailRow = ({ label, value, name, type = 'text', icon: Icon, isEditing, formData, onChange }: any) => (
    <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
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
                {value || '-'}
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
}

export function UserDetailsSheet({
    user,
    open,
    onOpenChange,
    onSuccess
}: UserDetailsSheetProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})

    React.useEffect(() => {
        if (user) {
            setFormData(user)
            setIsEditing(false)
        }
    }, [user])

    if (!user) return null

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
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

    const sharedRowProps = { isEditing, formData, onChange: handleInputChange }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                resizable
                showCloseButton={false}
                className="w-full border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-gray-950 font-inter"
            >
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <UserCircle className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {isEditing ? 'Chỉnh sửa nhân sự' : user.name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{user.email || 'Hệ thống ladyfit'}</span>
                        </div>
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
                    {/* Top Profile Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-start gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 shrink-0">
                                <UserCircle className="w-12 h-12" />
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                    {user.name}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate italic">
                                    {user.position || 'Nhân sự ladyfit'}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                        user.status === 'Activated' ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30" : "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", user.status === 'Activated' ? "bg-emerald-500" : "bg-rose-500")} />
                                        {user.status === 'Activated' ? 'Đang hoạt động' : 'Tạm ngưng'}
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
                                        ID: {user.id.slice(0, 8)}...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Liên hệ */}
                    <CardSection title="Thông tin liên hệ" icon={Mail}>
                        <div className="space-y-5">
                            <UserDetailRow label="Họ và tên" value={formData.name} name="name" icon={User} {...sharedRowProps} />
                            <div className="grid grid-cols-2 gap-5">
                                <UserDetailRow label="Số điện thoại" value={formData.phone} name="phone" icon={Phone} {...sharedRowProps} />
                                <UserDetailRow label="Email" value={formData.email} name="email" icon={Mail} {...sharedRowProps} />
                            </div>
                        </div>
                    </CardSection>

                    {/* Section: Công việc */}
                    <CardSection title="Vị trí công tác" icon={Briefcase}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <UserDetailRow label="Chi nhánh" value={user.branches?.name || user.branch_name} name="branch_name" icon={Building2} {...sharedRowProps} />
                                <UserDetailRow label="Phòng ban" value={formData.department} name="department" icon={Briefcase} {...sharedRowProps} />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <UserDetailRow label="Chức vụ" value={formData.position} name="position" icon={BadgeCheck} {...sharedRowProps} />
                                <UserDetailRow label="Vai trò" value={formData.permissions} name="permissions" icon={Shield} {...sharedRowProps} />
                            </div>
                        </div>
                    </CardSection>

                    {/* Section: Hệ thống */}
                    <CardSection title="Thông tin hệ thống" icon={Clock}>
                        <div className="grid grid-cols-2 gap-5">
                            <UserDetailRow
                                label="Ngày tham gia"
                                value={user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}
                                name="created_at"
                                icon={Calendar}
                                {...sharedRowProps}
                            />
                            <UserDetailRow label="Trạng thái" value={user.status === 'Activated' ? 'Đang hoạt động' : 'Tạm ngưng'} name="status" icon={BadgeCheck} {...sharedRowProps} />
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
                                Sửa nhân sự
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
