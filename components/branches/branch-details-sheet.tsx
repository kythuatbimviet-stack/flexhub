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
} from 'lucide-react'
import { toast } from 'sonner'
import { updateBranch, deleteBranch } from '@/app/actions/branches'
import { cn } from '@/lib/utils'

interface BranchDetailsSheetProps {
    branch: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

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
            const result = await updateBranch(branch.id, {
                ...formData,
                account_number: formData.account_number ? parseInt(formData.account_number) : null
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

    const InfoRow = ({ icon: Icon, label, value, name, type = 'text' }: any) => (
        <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Icon className="w-4 h-4 text-red-500/80 dark:text-red-400" />
                {label}
            </Label>
            {isEditing ? (
                <Input
                    name={name}
                    type={type}
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
            <SheetContent className="sm:max-w-xl border-none shadow-2xl p-0 flex flex-col h-full bg-white dark:bg-gray-950 font-inter">
                <div className="p-8 bg-gradient-to-br from-red-50/50 to-white dark:from-red-950/10 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[1.25rem] bg-red-600 flex items-center justify-center text-white shadow-2xl shadow-red-200 dark:shadow-red-900/40 transition-transform hover:scale-105">
                                    <Building2 className="w-10 h-10" />
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-semibold text-slate-950 dark:text-white">
                                        {isEditing ? 'Chỉnh sửa chi nhánh' : branch.name}
                                    </SheetTitle>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md">
                                            {branch.id}
                                        </span>
                                        {branch.short_name && (
                                            <>
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    {branch.short_name}
                                                </span>
                                            </>
                                        )}
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
                            <Building2 className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thông tin cơ bản</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={Building2} label="Tên chi nhánh" value={formData.name} name="name" />
                            <InfoRow icon={Building2} label="Tên viết tắt" value={formData.short_name} name="short_name" />
                            <InfoRow icon={User} label="Người đại diện" value={formData.representative} name="representative" />
                            <InfoRow icon={Phone} label="Số điện thoại" value={formData.phone} name="phone" />
                        </div>
                        <InfoRow icon={MapPin} label="Địa chỉ chi nhánh" value={formData.address} name="address" />
                    </div>

                    {/* Section: Tài khoản ngân hàng */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <CreditCard className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thông tin thanh toán</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={CreditCard} label="Ngân hàng" value={formData.bank_name} name="bank_name" />
                            <InfoRow icon={CreditCard} label="Số tài khoản" value={formData.account_number} name="account_number" type="number" />
                        </div>
                        <InfoRow icon={User} label="Chủ tài khoản" value={formData.account_holder} name="account_holder" />
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
                                className="flex-1 rounded-xl h-12 font-semibold text-xs bg-slate-950 dark:bg-red-600 text-white hover:bg-black dark:hover:bg-red-700 shadow-2xl shadow-slate-200 dark:shadow-red-900/20 transition-all active:scale-95"
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
                                className="flex-1 rounded-xl h-12 font-semibold text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa chi nhánh
                            </Button>
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 rounded-xl h-12 font-semibold text-xs bg-slate-950 dark:bg-slate-800 text-white hover:bg-black dark:hover:bg-gray-700 shadow-2xl shadow-slate-200 transition-all active:scale-95"
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
