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
    FileText,
    User,
    Building2,
    Calendar,
    CreditCard,
    Package,
    Dumbbell,
    Edit2,
    Save,
    Trash2,
    X,
    BadgeCheck,
    Clock,
    Phone,
    Mail,
    MapPin
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { fetchBranches } from '@/app/actions/branches'
import { toast } from 'sonner'
import { updateContract, deleteContract } from '@/app/actions/contracts'
import { cn } from '@/lib/utils'

interface ContractDetailsSheetProps {
    contract: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ContractDetailsSheet({
    contract,
    open,
    onOpenChange,
    onSuccess
}: ContractDetailsSheetProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})
    const [branches, setBranches] = React.useState<any[]>([])

    React.useEffect(() => {
        if (open) {
            const loadBranches = async () => {
                const res = await fetchBranches()
                if (res.success) setBranches(res.data || [])
            }
            loadBranches()
        }
    }, [open])

    React.useEffect(() => {
        if (contract) {
            setFormData(contract)
            setIsEditing(false)
        }
    }, [contract])

    if (!contract) return null

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await updateContract(contract.id, {
                ...formData,
                package_price: formData.package_price ? parseFloat(formData.package_price) : null,
                total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
            })
            if (result.success) {
                toast.success('Đã cập nhật hợp đồng')
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
        if (confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
            setLoading(true)
            try {
                const result = await deleteContract(contract.id)
                if (result.success) {
                    toast.success('Đã xóa hợp đồng thành công')
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

    const InfoRow = ({ icon: Icon, label, value, name, type = 'text' }: any) => (
        <div className="space-y-2">
            <Label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-tight flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </Label>
            {isEditing ? (
                <Input
                    name={name}
                    type={type}
                    value={formData[name] || ''}
                    onChange={handleInputChange}
                    className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900 h-10 text-sm focus:ring-2 focus:ring-red-500 shadow-sm outline-none"
                />
            ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value || '-'}</p>
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
                                    <FileText className="w-10 h-10" />
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-medium text-gray-950 dark:text-white">
                                        {isEditing ? 'Chỉnh sửa Hợp đồng' : contract.member_name}
                                    </SheetTitle>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[10px] font-medium text-red-600 dark:text-red-500 tracking-tight">
                                            {contract.id}
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-tight leading-none mt-0.5">
                                            {contract.status || 'Đang thực hiện'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12">
                    {/* Section: Thông tin khách hàng */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-900 pb-3">
                            <User className="w-4 h-4 text-red-600" />
                            <h3 className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-tight">Thông tin Hội viên</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={User} label="Họ và tên" value={formData.member_name} name="member_name" />
                            <InfoRow icon={Phone} label="Số điện thoại" value={formData.phone} name="phone" />
                            <InfoRow icon={Mail} label="Email" value={formData.email} name="email" />
                        </div>
                        <InfoRow icon={MapPin} label="Địa chỉ" value={formData.member_address} name="member_address" />
                    </div>

                    {/* Section: Dịch vụ */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-900 pb-3">
                            <Package className="w-4 h-4 text-red-600" />
                            <h3 className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-tight">Chi tiết Dịch vụ</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={Package} label="Gói tập" value={formData.package_name} name="package_name" />
                            <InfoRow icon={Clock} label="Ngày bắt đầu" value={formData.start_date} name="start_date" type="date" />
                            <InfoRow icon={Clock} label="Ngày kết thúc" value={formData.end_date} name="end_date" type="date" />
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Chi nhánh
                                </Label>
                                {isEditing ? (
                                    <Select
                                        value={formData.branch_id}
                                        onValueChange={(val) => setFormData((prev: any) => ({ ...prev, branch_id: val }))}
                                    >
                                        <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900 h-10 text-sm">
                                            <SelectValue placeholder="Chọn chi nhánh" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{contract.branches?.name || 'Văn phòng'}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    Trạng thái
                                </Label>
                                {isEditing ? (
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => setFormData((prev: any) => ({ ...prev, status: val }))}
                                    >
                                        <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900 h-10 text-sm">
                                            <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Đang thực hiện">Đang thực hiện</SelectItem>
                                            <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
                                            <SelectItem value="Đã hủy">Đã hủy</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formData.status || 'Đang thực hiện'}</p>
                                )}
                            </div>
                            <InfoRow icon={Dumbbell} label="Huấn luyện viên" value={formData.trainer_name} name="trainer_name" />
                        </div>
                    </div>

                    {/* Section: Thanh toán */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-900 pb-3">
                            <CreditCard className="w-4 h-4 text-red-600" />
                            <h3 className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-tight">Thanh toán</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={CreditCard} label="Hình thức" value={formData.payment_method} name="payment_method" />
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Tổng giá trị
                                </Label>
                                {isEditing ? (
                                    <Input
                                        name="total_amount"
                                        type="number"
                                        value={formData.total_amount || ''}
                                        onChange={handleInputChange}
                                        className="rounded-xl border-gray-200 dark:border-gray-800 bg-red-50/20 dark:bg-red-950/20 h-10 text-sm font-medium text-red-600 outline-none"
                                    />
                                ) : (
                                    <p className="text-lg font-medium text-red-600">
                                        {formData.total_amount ? Number(formData.total_amount).toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                                    </p>
                                )}
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
                                className="flex-1 rounded-xl h-12 font-medium text-xs tracking-tight text-gray-500 hover:bg-white dark:hover:bg-gray-800 transition-all"
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Hủy bỏ
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1 rounded-xl h-12 font-medium text-xs tracking-tight bg-gray-950 dark:bg-red-600 text-white hover:bg-black dark:hover:bg-red-700 shadow-2xl shadow-gray-200 dark:shadow-red-900/20 transition-all active:scale-95"
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
                                className="flex-1 rounded-xl h-12 font-medium text-xs tracking-tight text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa hợp đồng
                            </Button>
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 rounded-xl h-12 font-medium text-xs tracking-tight bg-gray-950 dark:bg-gray-800 text-white hover:bg-black dark:hover:bg-gray-700 shadow-2xl shadow-gray-200 transition-all active:scale-95"
                                disabled={loading}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Sửa hợp đồng
                            </Button>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
