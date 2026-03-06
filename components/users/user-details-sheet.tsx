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

    const InfoRow = ({ icon: Icon, label, value, name }: any) => (
        <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Icon className="w-4 h-4 text-red-500/80 dark:text-red-400" />
                {label}
            </Label>
            {isEditing ? (
                <Input
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleInputChange}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm focus:ring-2 focus:ring-red-500 shadow-sm border-2"
                />
            ) : (
                <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-red-50 dark:border-red-900/30 ml-2">
                    {value || '-'}
                </p>
            )}
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl border-none shadow-2xl p-0 flex flex-col h-full bg-white dark:bg-gray-950 font-inter">
                <div className="p-8 bg-gradient-to-br from-red-50/50 to-white dark:from-red-950/10 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[1.25rem] bg-gray-900 dark:bg-red-600 flex items-center justify-center text-white shadow-2xl shadow-gray-200 dark:shadow-red-900/40 transition-transform hover:scale-105">
                                    <UserCircle className="w-10 h-10" />
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-semibold text-slate-950 dark:text-white">
                                        {isEditing ? 'Chỉnh sửa nhân viên' : user.name}
                                    </SheetTitle>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md">
                                            {user.position || 'Nhân viên'}
                                        </span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold",
                                            user.status === 'Activated'
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", user.status === 'Activated' ? "bg-emerald-600" : "bg-rose-600")} />
                                            {user.status === 'Activated' ? 'Đang hoạt động' : 'Tạm ngưng'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12">
                    {/* Section: Liên hệ */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Mail className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thông tin liên hệ</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={User} label="Họ và tên" value={formData.name} name="name" />
                            <InfoRow icon={Mail} label="Email tài khoản" value={formData.email} name="email" />
                            <InfoRow icon={Phone} label="Số điện thoại" value={formData.phone} name="phone" />
                        </div>
                    </div>

                    {/* Section: Công việc */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Briefcase className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Vị trí công tác</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={Building2} label="Chi nhánh" value={user.branches?.name || user.branch_name} name="branch_name" />
                            <InfoRow icon={Briefcase} label="Phòng ban" value={formData.department} name="department" />
                            <InfoRow icon={Edit2} label="Chức vụ" value={formData.position} name="position" />
                            <InfoRow icon={Shield} label="Vai trò hệ thống" value={formData.role_id} name="role_id" />
                        </div>
                    </div>

                    {/* Section: Hệ thống */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Clock className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thông tin hệ thống</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-red-500/80 dark:text-red-400" />
                                    Ngày tham gia
                                </Label>
                                <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-red-50 dark:border-red-900/30 ml-2">
                                    {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/30 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-6">
                    {isEditing ? (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-white dark:hover:bg-gray-800 transition-all"
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Hủy bỏ
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest bg-gray-950 dark:bg-red-600 text-white hover:bg-black dark:hover:bg-red-700 shadow-2xl shadow-gray-200 dark:shadow-red-900/20 transition-all active:scale-95"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Đang lưu...' : 'Lưu cập nhật'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                onClick={handleDelete}
                                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa nhân sự
                            </Button>
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest bg-gray-950 dark:bg-gray-800 text-white hover:bg-black dark:hover:bg-gray-700 shadow-2xl shadow-gray-200 transition-all active:scale-95"
                                disabled={loading}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Sửa nhân sự
                            </Button>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
