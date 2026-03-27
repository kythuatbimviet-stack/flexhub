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
    User,
    Building,
    MapPin,
    Mail,
    Phone,
    CreditCard,
    Edit2,
    Trash2,
    Save,
    X,
    UserCircle,
    Briefcase,
    Receipt
} from 'lucide-react'
import { updateCustomer, bulkDeleteCustomers } from '@/app/actions/customers'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CustomerDetailsSheetProps {
    customer: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CustomerDetailsSheet({ customer, open, onOpenChange, onSuccess }: CustomerDetailsSheetProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>(null)

    React.useEffect(() => {
        if (customer) {
            setFormData({ ...customer })
            setIsEditing(false)
        }
    }, [customer])

    if (!customer || !formData) return null

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await updateCustomer(customer.id, formData)
            if (!result.success) throw new Error(result.error)

            toast.success('Cập nhật thông tin khách hàng thành công')
            setIsEditing(false)
            onSuccess()
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi cập nhật')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
            setLoading(true)
            try {
                const result = await bulkDeleteCustomers([customer.id])
                if (!result.success) throw new Error(result.error)

                toast.success('Đã xóa khách hàng thành công')
                onOpenChange(false)
                onSuccess()
            } catch (error: any) {
                toast.error(error.message || 'Lỗi khi xóa')
            } finally {
                setLoading(false)
            }
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    const InfoRow = ({ icon: Icon, label, value, name, type = "text" }: any) => (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-400 dark:text-gray-200 uppercase tracking-widest flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </Label>
            {isEditing ? (
                <Input
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-10 text-sm"
                    placeholder={`Nhập ${label.toLowerCase()}...`}
                />
            ) : (
                <p className="text-sm font-medium text-gray-900 leading-relaxed min-h-[1.25rem]">
                    {value || <span className="text-gray-300 italic font-normal">Chưa cập nhật</span>}
                </p>
            )}
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md border-none shadow-2xl p-0 flex flex-col h-full bg-white overflow-hidden gap-0">
                <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white border-b border-gray-100">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                                    <UserCircle className="w-7 h-7" />
                                </div>
                                <div>
                                    <SheetTitle className="text-xl font-bold text-gray-900">{isEditing ? 'Chỉnh sửa thông tin' : customer.name}</SheetTitle>
                                    <SheetDescription className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                                        {customer.id}
                                    </SheetDescription>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
                    {/* Section: Thông tin cá nhân */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Thông tin cơ bản</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <InfoRow icon={User} label="Họ và Tên" value={customer.name} name="name" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InfoRow icon={Phone} label="Số điện thoại" value={customer.phone} name="phone" />
                                <InfoRow icon={Mail} label="Email" value={customer.email} name="email" />
                            </div>
                        </div>
                    </div>

                    {/* Section: Thông tin Doanh nghiệp */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                            <Building className="w-4 h-4 text-blue-500" />
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Thông tin Doanh nghiệp</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <InfoRow icon={Building} label="Tên công ty" value={customer.company_name} name="company_name" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InfoRow icon={Receipt} label="Mã số thuế" value={customer.tax_code} name="tax_code" />
                                <InfoRow icon={Briefcase} label="Chức vụ" value={customer.position} name="position" />
                            </div>
                            <InfoRow icon={Mail} label="Email nhận hóa đơn" value={customer.email_tax} name="email_tax" />
                        </div>
                    </div>

                    {/* Section: Địa chỉ */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Địa chỉ & Giao nhận</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <InfoRow icon={MapPin} label="Địa chỉ giao hàng" value={customer.shipping_address} name="shipping_address" />
                            <InfoRow icon={MapPin} label="Địa chỉ xuất hóa đơn" value={customer.tax_address} name="tax_address" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 rounded-xl h-11 font-semibold text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1 rounded-xl h-11 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                className="flex-1 rounded-xl h-11 font-semibold text-red-500 border-red-100 dark:border-red-900/30 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa
                            </Button>
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 rounded-xl h-11 font-bold bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-lg shadow-gray-200 dark:shadow-none"
                                disabled={loading}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                            </Button>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
