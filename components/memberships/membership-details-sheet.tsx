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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Package,
    Building2,
    DollarSign,
    Calendar,
    Save,
    Trash2,
    X,
    TrendingUp,
    Edit2,
    Clock,
    XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { createMembership, updateMembership, deleteMembership } from '@/app/actions/memberships'
import { fetchBranches } from '@/app/actions/branches'
import { useQuery } from '@tanstack/react-query'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

// ─── Component con nằm NGOÀI component cha để tránh re-mount khi state thay đổi ───
const MembershipCardSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md space-y-5">
        <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-4 bg-red-600 rounded-full" />
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

const MembershipDetailRow = ({ 
    label, 
    value, 
    name, 
    type = 'text', 
    icon: Icon, 
    isSelect = false, 
    options = [], 
    isEditing, 
    onChange, 
    onSelectChange, 
    placeholder 
}: any) => {
    const formatNumber = (val: string | number) => {
        if (val === undefined || val === null || val === '') return ''
        const num = val.toString().replace(/\D/g, '')
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }

    const formatValue = (val: any) => {
        if (type === 'currency') {
            return formatNumber(val)
        }
        return val ?? ''
    }

    return (
        <div className="space-y-1.5 text-left">
            <Label className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                {Icon && <Icon className="w-3.5 h-3.5 text-blue-500/60" />}
                {label}
            </Label>
            {isEditing ? (
                isSelect ? (
                    <Select value={value || 'null'} onValueChange={(val) => onSelectChange?.(name, val)}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-11 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm w-full sm:max-w-[320px]">
                            <SelectValue placeholder={`Chọn ${label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl font-inter">
                            {options.map((opt: any) => (
                                <SelectItem key={opt.value} value={opt.value} className="rounded-lg font-medium py-2.5">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        name={name}
                        type={type === 'currency' ? 'text' : type}
                        value={formatValue(value)}
                        onChange={onChange}
                        placeholder={placeholder}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-11 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm w-full"
                    />
                )
            ) : (
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800/50 transition-all min-h-[44px]">
                    <span className="text-sm font-medium tracking-tight">
                        {isSelect ? (options.find((opt: any) => opt.value === value)?.label || value || 'Chưa thiết lập') : (type === 'currency'
                            ? (value ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : 'Chưa thiết lập')
                            : (value || 'Chưa thiết lập'))}
                    </span>
                </div>
            )}
        </div>
    )
}

interface MembershipDetailsSheetProps {
    pkg: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function MembershipDetailsSheet({
    pkg,
    open,
    onOpenChange,
    onSuccess
}: MembershipDetailsSheetProps) {
    const isMobile = useIsMobile()
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})

    const parseNumber = (val: string) => {
        return val.replace(/\./g, '')
    }

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetchBranches()
            return res.success ? res.data : []
        },
        enabled: open
    })

    React.useEffect(() => {
        if (pkg) {
            setFormData(pkg)
            setIsEditing(false)
        } else if (open) {
            setFormData({
                id: '',
                package_name: '',
                branch_id: '',
                package_type: '',
                trainer_type: '',
                unit_price: '',
                discounted_price: '',
                duration_days: '',
                months_purchased: '',
            })
            setIsEditing(true)
        }
    }, [pkg, open])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        const finalValue = (name === 'unit_price' || name === 'discounted_price')
            ? parseNumber(value)
            : value
        setFormData((prev: any) => ({ ...prev, [name]: finalValue }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value === 'null' ? null : value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const payload = {
                ...formData,
                unit_price: parseFloat(formData.unit_price) || 0,
                discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
                duration_days: parseInt(formData.duration_days) || 0,
                months_purchased: formData.months_purchased ? parseFloat(formData.months_purchased) : null
            }

            if (pkg) {
                const result = await updateMembership(pkg.id, payload)
                if (result.success) {
                    toast.success('Đã cập nhật thông tin gói tập')
                    setIsEditing(false)
                    onSuccess()
                } else {
                    toast.error('Lỗi khi cập nhật: ' + result.error)
                }
            } else {
                const result = await createMembership(payload)
                if (result.success) {
                    toast.success('Đã thêm gói tập mới thành công')
                    onOpenChange(false)
                    onSuccess()
                } else {
                    toast.error('Lỗi khi thêm gói tập: ' + result.error)
                }
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi không xác định')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa gói tập này?')) {
            setLoading(true)
            try {
                const result = await deleteMembership(id)
                if (result.success) {
                    toast.success('Đã xóa gói tập thành công')
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

    const handleCancel = () => {
        if (pkg) {
            setFormData(pkg)
            setIsEditing(false)
        } else {
            onOpenChange(false)
        }
    }

    const sharedRowProps = { 
        isEditing, 
        onChange: handleInputChange, 
        onSelectChange: handleSelectChange 
    }

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
                            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <SheetTitle className="text-[14px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-tight truncate">
                                {!pkg ? 'Thêm gói tập mới' : (isEditing ? 'Chỉnh sửa gói tập' : pkg.package_name)}
                            </SheetTitle>
                            {pkg && <SheetDescription className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-0.5">Mã gói: {pkg.id}</SheetDescription>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        {isEditing ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                className="h-9 px-2 sm:px-4 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all font-semibold active:scale-95"
                            >
                                <XCircle className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline text-xs">Hủy</span>
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="h-9 px-2 sm:px-4 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20 transition-all font-semibold active:scale-95"
                            >
                                <Edit2 className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline text-xs">Sửa</span>
                            </Button>
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
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 shrink-0">
                                <Package className="w-10 h-10 sm:w-12 sm:h-12" />
                            </div>
                            <div className="flex-1 min-w-0 pt-1 space-y-1">
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight leading-none uppercase">
                                    {formData.package_name || (pkg?.package_name ? pkg.package_name : 'Gói tập mới')}
                                </h2>
                                <p className="text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-1">
                                    {formData.package_type || 'N/A'} • {formData.trainer_type || 'N/A'}
                                </p>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 shadow-sm">
                                        <Building2 className="w-2.5 h-2.5" />
                                        {formData.branch_id === 'null' || !formData.branch_id ? 'Toàn hệ thống' : (branches?.find((b: any) => b.id === formData.branch_id)?.name || 'Chi nhánh')}
                                    </div>
                                    {formData.duration_days && (
                                        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-900/40 dark:border-slate-800 shadow-sm">
                                            {formData.duration_days} ngày
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <MembershipCardSection title="Thông tin gói dịch vụ" icon={TrendingUp}>
                        <div className="space-y-5">
                            <MembershipDetailRow
                                label="Mã gói tập (ID)"
                                value={formData.id}
                                name="id"
                                icon={Package}
                                {...sharedRowProps}
                                isEditing={isEditing && !pkg}
                                placeholder="GOI-1M"
                            />
                            <MembershipDetailRow label="Tên gói tập" value={formData.package_name} name="package_name" icon={Package} {...sharedRowProps} placeholder="Gói tập 1 tháng" />
                            <MembershipDetailRow
                                icon={Building2}
                                label="Chi nhánh áp dụng"
                                value={formData.branch_id}
                                name="branch_id"
                                isSelect={true}
                                options={[
                                    { label: 'Toàn hệ thống', value: 'null' },
                                    ...(branches?.map((b: any) => ({ label: b.name, value: b.id })) || [])
                                ]}
                                {...sharedRowProps}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <MembershipDetailRow
                                    icon={Clock}
                                    label="Hình thức tập"
                                    value={formData.package_type}
                                    name="package_type"
                                    isSelect={true}
                                    options={[
                                        { label: 'Trực tiếp', value: 'Trực tiếp' },
                                        { label: 'Online', value: 'Online' },
                                        { label: 'Hybrid', value: 'Hybrid' }
                                    ]}
                                    {...sharedRowProps}
                                />
                                <MembershipDetailRow
                                    icon={Package}
                                    label="Huấn luyện viên"
                                    value={formData.trainer_type}
                                    name="trainer_type"
                                    isSelect={true}
                                    options={[
                                        { label: 'Kèm PT', value: 'Kèm PT' },
                                        { label: 'Không kèm PT', value: 'Không kèm PT' },
                                        { label: 'Tự do', value: 'Tự do' }
                                    ]}
                                    {...sharedRowProps}
                                />
                            </div>
                        </div>
                    </MembershipCardSection>

                    <MembershipCardSection title="Giá & Thời hạn sử dụng" icon={DollarSign}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <MembershipDetailRow icon={DollarSign} label="Giá niêm yết" value={formData.unit_price} name="unit_price" type="currency" {...sharedRowProps} placeholder="5.000.000" />
                                <MembershipDetailRow icon={DollarSign} label="Giá ưu đãi" value={formData.discounted_price} name="discounted_price" type="currency" {...sharedRowProps} placeholder="4.500.000" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <MembershipDetailRow icon={Calendar} label="Thời hạn (Ngày)" value={formData.duration_days} name="duration_days" type="number" {...sharedRowProps} placeholder="30" />
                                <MembershipDetailRow icon={Calendar} label="Số tháng (Hệ số)" value={formData.months_purchased} name="months_purchased" type="number" {...sharedRowProps} placeholder="1" />
                            </div>
                        </div>
                    </MembershipCardSection>
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
                        {pkg && !isEditing && (
                            <Button
                                variant="outline"
                                onClick={() => handleDelete(pkg.id)}
                                className="rounded-xl h-11 sm:h-12 px-4 font-semibold text-[13px] border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 dark:border-slate-800 dark:hover:bg-rose-950/20 transition-all active:scale-95"
                                disabled={loading}
                            >
                                <Trash2 className="w-5 h-5 sm:mr-2" />
                                <span className="hidden sm:inline">Xóa gói</span>
                            </Button>
                        )}
                        {isEditing ? (
                            <Button
                                onClick={handleSave}
                                className="flex-1 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-950 dark:bg-red-600 text-white font-bold shadow-lg active:scale-95 transition-all hover:bg-black dark:hover:bg-red-700"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? (pkg ? 'Đang lưu...' : 'Đang tạo...') : (pkg ? 'Lưu gói tập' : 'Tạo gói mới')}
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-600 text-white font-bold shadow-lg active:scale-95 transition-all hover:bg-blue-700"
                                disabled={loading}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                {isMobile ? 'Sửa thông tin' : 'Chỉnh sửa gói'}
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
