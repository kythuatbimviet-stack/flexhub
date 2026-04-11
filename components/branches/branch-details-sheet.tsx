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
    Mail,
    XCircle,
    Building,
    TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { createBranch, updateBranch, deleteBranch } from '@/app/actions/branches'
import { uploadSignature } from '@/app/actions/storage'
import { SignatureField } from '@/components/ui/signature-field'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface BranchDetailsSheetProps {
    branch: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const CardSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md space-y-5">
        <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
            <h3 className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 leading-none">
                {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
                {title}
            </h3>
        </div>
        <div className="px-1">
            {children}
        </div>
    </div>
)

const DetailRow = ({ 
    label, 
    value, 
    name, 
    type = 'text', 
    icon: Icon, 
    placeholder, 
    isEditing, 
    formData, 
    onChange 
}: any) => (
    <div className="space-y-1.5 text-left">
        <Label className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
            {Icon && <Icon className="w-3.5 h-3.5 text-blue-500/60" />}
            {label}
        </Label>
        {isEditing ? (
            <Input
                name={name}
                type={type}
                value={formData[name] ?? ''}
                onChange={onChange}
                placeholder={placeholder}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-11 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm w-full"
            />
        ) : (
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800/50 transition-all min-h-[44px]">
                <span className="text-sm font-medium tracking-tight">
                    {value || 'Chưa thiết lập'}
                </span>
            </div>
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
    const isMobile = useIsMobile()
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})

    React.useEffect(() => {
        if (branch) {
            setFormData(branch)
            setIsEditing(false)
        } else if (open) {
            setFormData({
                id: '',
                name: '',
                short_name: '',
                brand_code: '',
                address: '',
                center_address: '',
                representative: '',
                legal_representative: '',
                phone: '',
                center_phone: '',
                representative_phone: '',
                bank_name: '',
                bank_code: '',
                account_number: '',
                account_holder: '',
                logo_url: '',
                signature_center: '',
                url_guimail: '',
            })
            setIsEditing(true)
        }
    }, [branch, open])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            let finalFormData = { ...formData }

            if (formData.signature_center && formData.signature_center.startsWith('data:image')) {
                const safeId = (finalFormData.id || 'new').replace(/[^a-z0-9]/gi, '_').toLowerCase()
                const fileName = `branch_sig_${safeId}_${Date.now()}.png`
                const uploadResult = await uploadSignature(formData.signature_center, fileName)
                
                if (uploadResult.success) {
                    finalFormData.signature_center = uploadResult.url
                } else {
                    toast.error('Không thể upload chữ ký: ' + uploadResult.error)
                    setLoading(false)
                    return
                }
            }

            const payload = {
                ...finalFormData,
                account_number: finalFormData.account_number ? finalFormData.account_number.toString() : null
            }

            if (branch) {
                const result = await updateBranch(branch.id, payload)
                if (result.success) {
                    toast.success('Đã cập nhật thông tin chi nhánh')
                    setIsEditing(false)
                    onSuccess()
                } else {
                    toast.error('Lỗi khi cập nhật: ' + result.error)
                }
            } else {
                const result = await createBranch(payload)
                if (result.success) {
                    toast.success('Đã thêm chi nhánh mới thành công')
                    onOpenChange(false)
                    onSuccess()
                } else {
                    toast.error('Lỗi khi thêm chi nhánh: ' + result.error)
                }
            }
        } catch (error: any) {
            console.error('Save Branch Error:', error)
            toast.error('Đã xảy ra lỗi: ' + (error.message || 'Không xác định'))
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
            } catch (error: any) {
                toast.error('Đã xảy ra lỗi: ' + (error.message || 'Không xác định'))
            } finally {
                setLoading(false)
            }
        }
    }

    const handleCancel = () => {
        if (branch) {
            setFormData(branch)
            setIsEditing(false)
        } else {
            onOpenChange(false)
        }
    }

    const sharedRowProps = { isEditing, formData, onChange: handleInputChange }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={isMobile ? "bottom" : "right"}
                resizable={!isMobile}
                showCloseButton={false}
                className={cn(
                    "border-none shadow-2xl p-0 flex flex-col bg-slate-50 dark:bg-gray-950 font-inter transition-all duration-300",
                    isMobile ? "h-[92vh] rounded-t-[32px]" : "h-full w-full"
                )}
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>{!branch ? 'Thêm chi nhánh' : branch.name}</SheetTitle>
                    <SheetDescription>Chi tiết chi nhánh</SheetDescription>
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
                            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <SheetTitle className="text-[14px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-tight truncate">
                                {!branch ? 'Thêm chi nhánh mới' : (isEditing ? 'Chỉnh sửa chi nhánh' : branch.name)}
                            </SheetTitle>
                            {branch && <SheetDescription className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-0.5">Mã CN: {branch.id}</SheetDescription>}
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
                                            onClick={handleCancel}
                                            className="h-9 px-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all font-semibold active:scale-95"
                                        >
                                            <XCircle className="w-4 h-4 mr-1" />
                                            <span className="text-xs">Hủy</span>
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        {branch && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleDelete}
                                                className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-95"
                                                disabled={loading}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            className="h-9 px-2 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20 transition-all font-semibold active:scale-95"
                                        >
                                            <Edit2 className="w-4 h-4 mr-1" />
                                            <span className="text-xs">Sửa</span>
                                        </Button>
                                    </div>
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

                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4 pb-40 sm:pb-24">
                    {/* Top Profile Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 shrink-0 overflow-hidden">
                                {formData.logo_url ? (
                                    <img src={formData.logo_url} alt="Branch Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 className="w-10 h-10 sm:w-12 sm:h-12" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pt-1 space-y-1">
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight leading-none uppercase">
                                    {formData.name || (branch?.name ? branch.name : 'Chi nhánh mới')}
                                </h2>
                                <p className="text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-1">
                                    {formData.short_name || 'Thông tin định danh'} • {formData.brand_code || 'Brand'}
                                </p>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {branch ? 'Đang hoạt động' : 'Đang khởi tạo'}
                                    </div>
                                    {formData.phone && (
                                        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 shadow-sm">
                                            {formData.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Thông tin cơ bản */}
                    <CardSection title="Thông tin cơ bản" icon={Building2}>
                        <div className="space-y-5">
                            <DetailRow 
                                label="Mã chi nhánh (ID)" 
                                value={formData.id} 
                                name="id" 
                                icon={Building2} 
                                {...sharedRowProps}
                                placeholder="CN-HCM"
                                isEditing={isEditing && !branch}
                            />
                            <DetailRow label="Tên chi nhánh" value={formData.name} name="name" icon={Building2} {...sharedRowProps} placeholder="Chi nhánh Fitness Hồ Chí Minh" />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <DetailRow label="Tên viết tắt" value={formData.short_name} name="short_name" icon={Building} {...sharedRowProps} placeholder="FIT-HCM" />
                                <DetailRow label="Mã thương hiệu" value={formData.brand_code} name="brand_code" icon={TrendingUp} {...sharedRowProps} placeholder="EVA-FIT" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <DetailRow label="Số điện thoại" value={formData.phone} name="phone" icon={Phone} {...sharedRowProps} placeholder="0901234567" />
                                <DetailRow label="SĐT Trung tâm (HĐ)" value={formData.center_phone} name="center_phone" icon={Phone} {...sharedRowProps} placeholder="0281234567" />
                            </div>

                            <DetailRow label="Địa chỉ chi nhánh" value={formData.address} name="address" icon={MapPin} {...sharedRowProps} placeholder="Số 123, Đường ABC, Phường XYZ, Quận 1" />
                            <DetailRow label="Địa chỉ trung tâm (HĐ)" value={formData.center_address} name="center_address" icon={MapPin} {...sharedRowProps} placeholder="Số 456, Đường DEF, Phường GHI, Quận 3" />
                        </div>
                    </CardSection>

                    {/* Section: Đại diện & Pháp lý */}
                    <CardSection title="Đại diện & Pháp lý" icon={User}>
                        <div className="space-y-5">
                            <DetailRow label="Người đại diện (HĐ)" value={formData.representative} name="representative" icon={User} {...sharedRowProps} placeholder="Nguyễn Văn A" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <DetailRow label="Người đại diện PL" value={formData.legal_representative} name="legal_representative" icon={User} {...sharedRowProps} placeholder="Trần Thị B" />
                                <DetailRow label="SĐT đại diện PL" value={formData.representative_phone} name="representative_phone" icon={Phone} {...sharedRowProps} placeholder="0907654321" />
                            </div>
                        </div>
                    </CardSection>

                    {/* Section: Thông tin thanh toán */}
                    <CardSection title="Thông tin thanh toán" icon={CreditCard}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <DetailRow label="Ngân hàng" value={formData.bank_name} name="bank_name" icon={CreditCard} {...sharedRowProps} placeholder="Vietcombank" />
                                <DetailRow label="Mã VietQR" value={formData.bank_code} name="bank_code" icon={CreditCard} {...sharedRowProps} placeholder="VCB" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <DetailRow label="Số tài khoản" value={formData.account_number} name="account_number" type="number" icon={CreditCard} {...sharedRowProps} placeholder="1234567890" />
                                <DetailRow label="Chủ tài khoản" value={formData.account_holder} name="account_holder" icon={User} {...sharedRowProps} placeholder="CONG TY TNHH ABC" />
                            </div>
                        </div>
                    </CardSection>

                    {/* Section: Cấu hình hệ thống */}
                    <CardSection title="Cấu hình hệ thống" icon={Cloud}>
                        <div className="space-y-5">
                            <DetailRow 
                                label="URL Logo chi nhánh" 
                                value={formData.logo_url} 
                                name="logo_url" 
                                icon={Cloud} 
                                placeholder="https://example.com/logo.png"
                                {...sharedRowProps} 
                            />
                            <div className="space-y-1.5">
                                <Label className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                                    <Cloud className="w-3.5 h-3.5 text-blue-500/60" />
                                    Chữ ký / Dấu mộc
                                </Label>
                                {isEditing ? (
                                    <SignatureField 
                                        value={formData.signature_center} 
                                        onChange={(val) => setFormData({ ...formData, signature_center: val })} 
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800/50 transition-all min-h-[44px]">
                                        <span className="text-sm font-medium tracking-tight truncate">
                                            {formData.signature_center || 'Chưa thiết lập chữ ký'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {!isEditing && formData.signature_center && (
                                <div className="mt-2 p-4 bg-slate-50 dark:bg-white rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-center shadow-inner">
                                    <img
                                        src={formData.signature_center}
                                        alt="Branch Signature"
                                        className="h-20 object-contain mix-blend-multiply"
                                        onError={(e: any) => e.target.style.display = 'none'}
                                    />
                                </div>
                            )}

                            <DetailRow 
                                label="Webhook Email" 
                                value={formData.url_guimail} 
                                name="url_guimail" 
                                icon={Mail} 
                                placeholder="https://script.google.com/..."
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
                            Đóng
                        </Button>
                    )}
                    
                    <div className={cn(
                        "flex items-center gap-2 flex-1",
                        !isMobile && "max-w-[400px]"
                    )}>
                        {branch && !isEditing && (
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                className="rounded-xl h-11 sm:h-12 px-4 font-semibold text-[13px] border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 dark:border-slate-800 dark:hover:bg-rose-950/20 transition-all active:scale-95"
                                disabled={loading}
                            >
                                <Trash2 className="w-5 h-5 sm:mr-2" />
                                <span className="hidden sm:inline">Xóa</span>
                            </Button>
                        )}
                        {isEditing ? (
                            <Button
                                onClick={handleSave}
                                className="flex-1 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-950 dark:bg-red-600 text-white font-bold shadow-lg active:scale-95 transition-all hover:bg-black dark:hover:bg-red-700"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? (branch ? 'Đang lưu...' : 'Đang tạo...') : (branch ? 'Lưu thay đổi' : 'Tạo chi nhánh')}
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
