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

    const DetailRow = ({ label, value, name, type = 'input', icon: Icon }: any) => (
        <div className="space-y-1.5 text-left">
            <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />}
                {label}
            </Label>
            {isEditing ? (
                type === 'textarea' ? (
                    <Textarea
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleInputChange}
                        className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 min-h-[100px] text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
                    />
                ) : (
                    <Input
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleInputChange}
                        className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
                    />
                )
            ) : (
                <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200 min-h-[20px]">
                    {value || '-'}
                </p>
            )}
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[480px] border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-gray-950 font-inter"
            >
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 overflow-hidden">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                            ) : (
                                <UserStar className="w-6 h-6" />
                            )}
                        </div>
                        <SheetHeader className="flex flex-col gap-0.5">
                            <SheetTitle className="text-sm font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                                {isEditing ? 'Chỉnh sửa Zalo User' : user.display_name}
                                {user.is_sensitive && <Shield className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                            </SheetTitle>
                            <SheetDescription className="text-[11px] text-slate-500 dark:text-slate-400">
                                ID: {user.zalo_user_id?.slice(0, 12)}...
                            </SheetDescription>
                        </SheetHeader>
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
                            <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 shrink-0 overflow-hidden">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserStar className="w-12 h-12" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                    {user.display_name}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate italic">
                                    {user.alias || 'Chưa đặt biệt danh'}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                        user.is_following ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30" : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", user.is_following ? "bg-emerald-500" : "bg-slate-400")} />
                                        {user.is_following ? 'Đang quan tâm' : 'Bỏ quan tâm'}
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
                                        {user.user_type || 'Zalo OA'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Thông tin định danh */}
                    <CardSection title="Thông tin định danh" icon={User}>
                        <div className="space-y-5">
                            <DetailRow label="Tên hiển thị" value={formData.display_name} name="display_name" icon={User} />
                            <DetailRow label="Biệt danh (Alias)" value={formData.alias} name="alias" icon={Info} />
                            <div className="grid grid-cols-1 gap-5">
                                <DetailRow label="Zalo User ID" value={formData.zalo_user_id} name="zalo_user_id" icon={UserStar} />
                                <DetailRow label="User ID theo App" value={formData.user_id_by_app} name="user_id_by_app" icon={MessageSquare} />
                            </div>
                        </div>
                    </CardSection>

                    {/* Section: Phân loại & Ghi chú */}
                    <CardSection title="Phân loại & Ghi chú" icon={Tag}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <DetailRow label="Loại người dùng" value={formData.user_type} name="user_type" icon={Building2} />
                                <DetailRow label="Thẻ (Tags)" value={formData.tags} name="tags" icon={Tag} />
                            </div>
                            <DetailRow label="Ghi chú" value={formData.notes} name="notes" type="textarea" icon={StickyNote} />
                        </div>
                    </CardSection>

                    {/* Section: Hệ thống */}
                    <CardSection title="Dữ liệu hệ thống" icon={Clock}>
                        <div className="grid grid-cols-2 gap-5">
                            <DetailRow
                                label="Tương tác cuối"
                                value={user.last_interaction_date ? new Date(user.last_interaction_date).toLocaleDateString('vi-VN') : '-'}
                                name="last_interaction_date"
                                icon={MessageSquare}
                            />
                            <DetailRow
                                label="Ngày tạo"
                                value={user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}
                                name="created_at"
                                icon={Calendar}
                            />
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
                                Sửa thông tin
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
