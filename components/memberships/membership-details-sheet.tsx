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

    const InfoRow = ({ icon: Icon, label, value, name, type = 'text', isSelect = false, options = [] }: any) => (
        <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Icon className="w-4 h-4 text-red-500/80 dark:text-red-400" />
                {label}
            </Label>
            {isEditing ? (
                isSelect ? (
                    <Select onValueChange={(v) => handleSelectChange(name!, v)} defaultValue={formData[name!] || 'null'}>
                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 bg-white dark:bg-slate-900 border-2">
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
                        type={type}
                        value={type === 'currency' ? formatNumber(formData[name]) : formData[name] || ''}
                        onChange={handleInputChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm focus:ring-2 focus:ring-red-500 shadow-sm border-2"
                    />
                )
            ) : (
                <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-red-50 dark:border-red-900/30 ml-2">
                    {type === 'currency'
                        ? (value ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : '-')
                        : value || '-'
                    }
                </p>
            )}
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl border-none shadow-2xl p-0 flex flex-col h-full bg-white dark:bg-slate-950 font-inter">
                {/* Header Section */}
                <div className="p-8 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <SheetHeader className="space-y-4">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-slate-950 dark:bg-red-600 flex items-center justify-center text-white shadow-2xl shadow-slate-200 dark:shadow-red-950/20">
                                <Package className="w-8 h-8" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-2xl font-semibold text-slate-950 dark:text-white truncate">
                                    {isEditing ? 'Chỉnh sửa gói tập' : pkg.package_name}
                                </SheetTitle>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md">
                                        ID: {pkg.id}
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {pkg.package_type}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12">
                    {/* Section: Thông tin chung */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thông tin gói dịch vụ</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={Package} label="Tên gói tập" value={formData.package_name} name="package_name" />
                            <InfoRow
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
                            <InfoRow
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
                            <InfoRow
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

                    {/* Section: Chi tiết giá & thời gian */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <DollarSign className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Giá & Thời hạn sử dụng</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={DollarSign} label="Giá niêm yết" value={formData.unit_price} name="unit_price" type="currency" />
                            <InfoRow icon={DollarSign} label="Giá ưu đãi" value={formData.discounted_price} name="discounted_price" type="currency" />
                            <InfoRow icon={Calendar} label="Thời hạn (Ngày)" value={formData.duration_days} name="duration_days" type="number" />
                            <InfoRow icon={Calendar} label="Số tháng (Hệ số)" value={formData.months_purchased} name="months_purchased" type="number" />
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50/30 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-6">
                    {isEditing ? (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 rounded-xl h-12 font-semibold text-xs text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all"
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Hủy bỏ
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1 rounded-xl h-12 font-semibold text-xs bg-slate-950 dark:bg-red-600 text-white hover:bg-black dark:hover:bg-red-700 shadow-2xl shadow-slate-200"
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
                                className="flex-1 rounded-xl h-12 font-semibold text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all font-inter"
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa gói tập
                            </Button>
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 rounded-xl h-12 font-semibold text-xs bg-slate-950 dark:bg-slate-800 text-white hover:bg-black dark:hover:bg-slate-700 shadow-2xl shadow-slate-200 transition-all font-inter"
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
