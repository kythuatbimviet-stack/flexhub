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
    Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { updateMembership, deleteMembership } from '@/app/actions/memberships'
import { fetchBranches } from '@/app/actions/branches'
import { useQuery } from '@tanstack/react-query'

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
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})

    const formatNumber = (val: string | number) => {
        if (val === undefined || val === null || val === '') return ''
        const num = val.toString().replace(/\D/g, '')
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }

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
        }
    }, [pkg])

    if (!pkg) return null

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
            const result = await updateMembership(pkg.id, {
                ...formData,
                unit_price: parseFloat(formData.unit_price),
                discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
                duration_days: parseInt(formData.duration_days),
                months_purchased: formData.months_purchased ? parseFloat(formData.months_purchased) : null
            })
            if (result.success) {
                toast.success('Đã cập nhật thông tin gói tập')
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
        if (confirm('Bạn có chắc chắn muốn xóa gói tập này?')) {
            setLoading(true)
            try {
                const result = await deleteMembership(pkg.id)
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

    const DetailRow = ({ label, value, name, type = 'text', icon: Icon, isSelect = false, options = [] }: any) => (
        <div className="space-y-1.5 text-left">
            <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />}
                {label}
            </Label>
            {isEditing ? (
                isSelect ? (
                    <Select onValueChange={(v) => handleSelectChange(name!, v)} defaultValue={formData[name!] || 'null'}>
                        <SelectTrigger className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                            <SelectValue placeholder="Chọn..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {options.map((opt: any) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        name={name}
                        type={type === 'currency' ? 'text' : type}
                        value={type === 'currency' ? formatNumber(formData[name]) : formData[name] || ''}
                        onChange={handleInputChange}
                        className="rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 h-11 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
                    />
                )
            ) : (
                <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200 min-h-[20px]">
                    {type === 'currency'
                        ? (value ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value).replace('₫', '₫') : '-')
                        : value || '-'
                    }
                </p>
            )}
        </div>
    )

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
                            <Package className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {isEditing ? 'Chỉnh sửa gói tập' : pkg.package_name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">ID: {pkg.id}</span>
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
                                <Package className="w-12 h-12" />
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                    {pkg.package_name}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate italic">
                                    {pkg.package_type} - {pkg.trainer_type}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Gói tập Fitness
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-900/40 dark:border-slate-800">
                                        {pkg.duration_days} ngày
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Thông tin chung */}
                    <CardSection title="Thông tin gói dịch vụ" icon={TrendingUp}>
                        <div className="space-y-5 text-left">
                            <DetailRow label="Tên gói tập" value={formData.package_name} name="package_name" icon={Package} />
                            <DetailRow
                                icon={Building2}
                                label="Chi nhánh áp dụng"
                                value={pkg.branches?.name || 'Toàn hệ thống'}
                                name="branch_id"
                                isSelect={true}
                                options={[
                                    { label: 'Toàn hệ thống', value: 'null' },
                                    ...(branches?.map((b: any) => ({ label: b.name, value: b.id })) || [])
                                ]}
                            />
                            <div className="grid grid-cols-2 gap-5">
                                <DetailRow
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
                                />
                                <DetailRow
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
                                />
                            </div>
                        </div>
                    </CardSection>

                    {/* Section: Chi tiết giá & thời gian */}
                    <CardSection title="Giá & Thời hạn sử dụng" icon={DollarSign}>
                        <div className="space-y-5 text-left">
                            <div className="grid grid-cols-2 gap-5">
                                <DetailRow icon={DollarSign} label="Giá niêm yết" value={formData.unit_price} name="unit_price" type="currency" />
                                <DetailRow icon={DollarSign} label="Giá ưu đãi" value={formData.discounted_price} name="discounted_price" type="currency" />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <DetailRow icon={Calendar} label="Thời hạn (Ngày)" value={formData.duration_days} name="duration_days" type="number" />
                                <DetailRow icon={Calendar} label="Số tháng (Hệ số)" value={formData.months_purchased} name="months_purchased" type="number" />
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
