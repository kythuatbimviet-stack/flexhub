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
    Building2,
    MapPin,
    User,
    Phone,
    CreditCard,
    Edit2,
    Save,
    Trash2,
    X,
    Cloud,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateBranch, deleteBranch } from '@/app/actions/branches'
import { uploadSignature } from '@/app/actions/storage'
import { SignatureField } from '@/components/ui/signature-field'
import { cn } from '@/lib/utils'

interface BranchDetailsSheetProps {
    branch: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

// ─── Component con được định nghĩa NGOÀI component cha ───────────────────────
// Điều này ngăn React unmount/remount chúng mỗi khi state cha thay đổi,
// từ đó giữ nguyên focus của ô nhập liệu khi người dùng gõ phím.

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

interface DetailRowProps {
    label: string
    value?: any
    name: string
    type?: string
    icon?: any
    placeholder?: string
    isEditing: boolean
    formData: any
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const DetailRow = ({ label, value, name, type = 'text', icon: Icon, placeholder, isEditing, formData, onChange }: DetailRowProps) => (
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
                placeholder={placeholder}
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

export function BranchDetailsSheet({
    branch,
    open,
    onOpenChange,
    onSuccess
}: BranchDetailsSheetProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})

    React.useEffect(() => {
        if (branch) {
            setFormData(branch)
            setIsEditing(false)
        }
    }, [branch])

    if (!branch) return null

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            let finalFormData = { ...formData }

            // Nếu chữ ký là base64 (người dùng vừa ký hoặc upload ảnh mới), tiến hành upload lên Storage
            if (formData.signature_center && formData.signature_center.startsWith('data:image')) {
                const fileName = `branch_sig_${branch.id}_${Date.now()}.png`
                const uploadResult = await uploadSignature(formData.signature_center, fileName)
                
                if (uploadResult.success) {
                    finalFormData.signature_center = uploadResult.url
                } else {
                    toast.error('Không thể upload chữ ký: ' + uploadResult.error)
                    return
                }
            }

            const result = await updateBranch(branch.id, {
                ...finalFormData,
                account_number: finalFormData.account_number ? parseInt(finalFormData.account_number) : null
            })
            if (result.success) {
                toast.success('Đã cập nhật thông tin chi nhánh')
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
        if (confirm('Bạn có chắc chắn muốn xóa chi nhánh này?')) {
            setLoading(true)
            try {
                const result = await deleteBranch(branch.id)
                if (result.success) {
                    toast.success('Đã xóa chi nhánh thành công')
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
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {isEditing ? 'Chỉnh sửa chi nhánh' : branch.name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">ID: {branch.id}</span>
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
                                <Building2 className="w-12 h-12" />
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                    {branch.name}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate italic">
                                    {branch.short_name || 'Chi nhánh ladyfit'}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Đang hoạt động
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
                                        {branch.id}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Thông tin cơ bản */}
                    <CardSection title="Thông tin cơ bản" icon={Building2}>
                        <div className="space-y-5">
                            <DetailRow label="Tên chi nhánh" value={formData.name} name="name" icon={Building2} {...sharedRowProps} />
                            <div className="grid grid-cols-2 gap-5">
                                <DetailRow label="Tên viết tắt" value={formData.short_name} name="short_name" icon={Building2} {...sharedRowProps} />
                                <DetailRow label="Số điện thoại trung tâm" value={formData.center_phone || formData.phone} name="center_phone" icon={Phone} {...sharedRowProps} />
                            </div>
                            <DetailRow label="Người đại diện (hiển thị HĐ)" value={formData.representative} name="representative" icon={User} {...sharedRowProps} />
                            <DetailRow label="Địa chỉ trung tâm" value={formData.center_address || formData.address} name="center_address" icon={MapPin} {...sharedRowProps} />
                        </div>
                    </CardSection>

                    {/* Section: Đại diện pháp lý */}
                    <CardSection title="Đại diện theo pháp luật" icon={User}>
                        <div className="space-y-5">
                            <DetailRow label="Họ và tên người đại diện PL" value={formData.legal_representative} name="legal_representative" icon={User} {...sharedRowProps} />
                            <DetailRow label="Số điện thoại người đại diện" value={formData.representative_phone} name="representative_phone" icon={Phone} {...sharedRowProps} />
                        </div>
                    </CardSection>

                    {/* Section: Thông tin thanh toán */}
                    <CardSection title="Thông tin thanh toán" icon={CreditCard}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <DetailRow label="Ngân hàng" value={formData.bank_name} name="bank_name" icon={CreditCard} {...sharedRowProps} />
                                <DetailRow label="Số tài khoản" value={formData.account_number} name="account_number" type="number" icon={CreditCard} {...sharedRowProps} />
                            </div>
                            <DetailRow label="Chủ tài khoản" value={formData.account_holder} name="account_holder" icon={User} {...sharedRowProps} />
                        </div>
                    </CardSection>

                    {/* Section: Chữ ký & Dấu mộc */}
                    <CardSection title="Chữ ký & Dấu mộc" icon={Cloud}>
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Cloud className="w-3 h-3" />
                                    Chữ ký chi nhánh
                                </Label>
                                {isEditing ? (
                                    <SignatureField
                                        value={formData.signature_center}
                                        onChange={(val) => setFormData((prev: any) => ({ ...prev, signature_center: val }))}
                                    />
                                ) : (
                                    formData.signature_center ? (
                                        <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-center">
                                            <img
                                                src={formData.signature_center}
                                                alt="Branch Signature"
                                                className="h-20 object-contain"
                                                onError={(e: any) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Chưa có chữ ký</p>
                                    )
                                )}
                            </div>
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
