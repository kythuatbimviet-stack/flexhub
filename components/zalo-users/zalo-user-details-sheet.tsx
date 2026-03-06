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
import { Textarea } from '@/components/ui/textarea'
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
    Calendar,
    MessageSquare,
    Tag,
    StickyNote,
    Star,
    Info,
    UserStar
} from 'lucide-react'
import { toast } from 'sonner'
import { updateZaloUser, deleteZaloUser } from '@/app/actions/zalo-users'
import { cn } from '@/lib/utils'

interface ZaloUserDetailsSheetProps {
    user: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ZaloUserDetailsSheet({
    user,
    open,
    onOpenChange,
    onSuccess
}: ZaloUserDetailsSheetProps) {
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await updateZaloUser(user.id, formData)
            if (result.success) {
                toast.success('Đã cập nhật thông tin Zalo user')
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
        if (confirm('Bạn có chắc chắn muốn xóa Zalo user này khỏi hệ thống?')) {
            setLoading(true)
            try {
                const result = await deleteZaloUser(user.id)
                if (result.success) {
                    toast.success('Đã xóa Zalo user thành công')
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

    const InfoRow = ({ icon: Icon, label, value, name, type = 'input' }: any) => (
        <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Icon className="w-4 h-4 text-blue-500/80 dark:text-blue-400" />
                {label}
            </Label>
            {isEditing ? (
                type === 'textarea' ? (
                    <Textarea
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleInputChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] text-sm focus:ring-2 focus:ring-blue-500 shadow-sm border-2"
                    />
                ) : (
                    <Input
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleInputChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm border-2"
                    />
                )
            ) : (
                <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-blue-50 dark:border-blue-900/30 ml-2">
                    {value || '-'}
                </p>
            )}
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl border-none shadow-2xl p-0 flex flex-col h-full bg-white dark:bg-gray-950 font-inter">
                <div className="p-8 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/10 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[1.25rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden bg-cover bg-center shadow-2xl transition-transform hover:scale-105" style={{ backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : 'none' }}>
                                    {!user.avatar_url && <UserStar className="w-10 h-10 text-slate-400" />}
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                                        {isEditing ? 'Chỉnh sửa Zalo User' : user.display_name}
                                        {user.is_sensitive && <Shield className="w-5 h-5 text-rose-500" />}
                                    </SheetTitle>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md">
                                            {user.user_type || 'Chưa định nghĩa'}
                                        </span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold",
                                            user.is_following
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", user.is_following ? "bg-emerald-600" : "bg-slate-400")} />
                                            {user.is_following ? 'Đang quan tâm' : 'Đã bỏ quan tâm'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12">
                    {/* Section: Thông tin cơ bản */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thông tin cơ bản</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={User} label="Tên hiển thị" value={formData.display_name} name="display_name" />
                            <InfoRow icon={Info} label="Biệt danh (Alias)" value={formData.alias} name="alias" />
                            <InfoRow icon={UserStar} label="Zalo User ID" value={formData.zalo_user_id} name="zalo_user_id" />
                            <InfoRow icon={MessageSquare} label="User ID theo App" value={formData.user_id_by_app} name="user_id_by_app" />
                        </div>
                    </div>

                    {/* Section: Phân loại & Ghi chú */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Tag className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Phân loại & Ghi chú</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={Building2} label="Loại người dùng" value={formData.user_type} name="user_type" />
                            <InfoRow icon={Tag} label="Thẻ (Tags)" value={formData.tags} name="tags" />
                        </div>
                        <InfoRow icon={StickyNote} label="Ghi chú" value={formData.notes} name="notes" type="textarea" />
                    </div>

                    {/* Section: Hệ thống */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dữ liệu hệ thống</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-500/80 dark:text-blue-400" />
                                    Tương tác cuối cùng
                                </Label>
                                <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-blue-50 dark:border-blue-900/30 ml-2">
                                    {user.last_interaction_date ? new Date(user.last_interaction_date).toLocaleDateString('vi-VN') : '-'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500/80 dark:text-blue-400" />
                                    Ngày tạo bản ghi
                                </Label>
                                <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-blue-50 dark:border-blue-900/30 ml-2">
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
                                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest bg-gray-950 dark:bg-blue-600 text-white hover:bg-black dark:hover:bg-blue-700 shadow-2xl shadow-gray-200 dark:shadow-blue-900/20 transition-all active:scale-95"
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
                                Xóa người dùng
                            </Button>
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest bg-gray-950 dark:bg-gray-800 text-white hover:bg-black dark:hover:bg-gray-700 shadow-2xl shadow-gray-200 transition-all active:scale-95"
                                disabled={loading}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Chỉnh sửa thông tin
                            </Button>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
