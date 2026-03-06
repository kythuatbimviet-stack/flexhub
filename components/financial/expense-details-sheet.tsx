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
    Save,
    X,
    Trash2,
    Edit2,
    Banknote,
    Calendar,
    Building2,
    Tag,
    StickyNote,
    CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { updateExpense, deleteExpense } from '@/app/actions/financial'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { fetchBranches } from '@/app/actions/branches'
import { fetchFinancialCategories } from '@/app/actions/financial'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

interface ExpenseDetailsSheetProps {
    expense: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ExpenseDetailsSheet({ expense, open, onOpenChange, onSuccess }: ExpenseDetailsSheetProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})

    React.useEffect(() => {
        if (expense) {
            setFormData({ ...expense })
            setIsEditing(false)
        }
    }, [expense])

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: categories } = useQuery({
        queryKey: ['financial-categories-expense'],
        queryFn: async () => {
            const result = await fetchFinancialCategories('expense')
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    if (!expense) return null

    const handleSave = async () => {
        setLoading(true)
        try {
            const { financial_categories, branches: b, ...updateData } = formData
            const result = await updateExpense(expense.id, updateData)
            if (result.success) {
                toast.success('Đã cập nhật khoản chi')
                setIsEditing(false)
                onSuccess()
            } else {
                toast.error('Lỗi khi cập nhật: ' + result.error)
            }
        } catch (error: any) {
            toast.error(error.message || 'Lỗi không xác định')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) {
            setLoading(true)
            try {
                const result = await deleteExpense(expense.id)
                if (result.success) {
                    toast.success('Đã xóa khoản chi thành công')
                    onOpenChange(false)
                    onSuccess()
                } else {
                    toast.error('Lỗi khi xóa: ' + result.error)
                }
            } catch (error: any) {
                toast.error(error.message || 'Lỗi không xác định')
            } finally {
                setLoading(false)
            }
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        const fieldType = (e.target as any).type
        const finalValue = fieldType === 'number' ? parseFloat(value) : value
        setFormData((prev: any) => ({ ...prev, [name]: finalValue }))
    }

    const InfoRow = ({ icon: Icon, label, value, name, type = "text" }: any) => (
        <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Icon className="w-4 h-4 text-rose-500/80 dark:text-rose-400" />
                {label}
            </Label>
            {isEditing ? (
                type === 'textarea' ? (
                    <Textarea
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] text-sm focus:ring-2 focus:ring-rose-500 shadow-sm border-2"
                    />
                ) : (
                    <Input
                        name={name}
                        type={type}
                        value={formData[name] ?? ''}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm focus:ring-2 focus:ring-rose-500 shadow-sm border-2"
                    />
                )
            ) : (
                <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-rose-50 dark:border-rose-900/30 ml-2">
                    {value || <span className="text-slate-300 italic font-normal">Chưa cập nhật</span>}
                </p>
            )}
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl border-none shadow-2xl p-0 flex flex-col h-full bg-white dark:bg-gray-950 font-inter">
                <div className="p-8 bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-950/10 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[1.25rem] bg-rose-600 flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-105">
                                    <Banknote className="w-10 h-10" />
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                                        {isEditing ? 'Chỉnh sửa khoản chi' : `Khoản chi: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expense.amount)}`}
                                    </SheetTitle>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            {expense.id.split('-')[0]}
                                        </span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                            Đã tất toán
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Banknote className="w-5 h-5 text-rose-600 dark:text-rose-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Chi tiết chi phí</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={Banknote} label="Số tiền (VND)" value={new Intl.NumberFormat('vi-VN').format(formData.amount)} name="amount" type="number" />
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-rose-500/80 dark:text-rose-400" />
                                    Danh mục
                                </Label>
                                {isEditing ? (
                                    <Select onValueChange={(val) => setFormData((p: any) => ({ ...p, category_id: val }))} value={formData.category_id}>
                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm focus:ring-2 focus:ring-rose-500 shadow-sm border-2">
                                            <SelectValue placeholder="Chọn danh mục" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {categories?.map((cat: any) => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-rose-50 dark:border-rose-900/30 ml-2">
                                        {formData.financial_categories?.name || 'Chưa phân loại'}
                                    </p>
                                )}
                            </div>
                            <InfoRow icon={Calendar} label="Ngày ghi nhận" value={formData.recorded_at ? new Date(formData.recorded_at).toLocaleDateString('vi-VN') : '-'} name="recorded_at" type="date" />
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-rose-500/80 dark:text-rose-400" />
                                    Hình thức thanh toán
                                </Label>
                                {isEditing ? (
                                    <Select onValueChange={(val) => setFormData((p: any) => ({ ...p, payment_method: val }))} value={formData.payment_method}>
                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm focus:ring-2 focus:ring-rose-500 shadow-sm border-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
                                            <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
                                            <SelectItem value="Thẻ">Thẻ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-rose-50 dark:border-rose-900/30 ml-2">
                                        {formData.payment_method}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Building2 className="w-5 h-5 text-rose-600 dark:text-rose-500" />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Phân bổ chi nhánh</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-rose-500/80 dark:text-rose-400" />
                                    Chi nhánh
                                </Label>
                                {isEditing ? (
                                    <Select onValueChange={(val) => setFormData((p: any) => ({ ...p, branch_id: val }))} value={formData.branch_id}>
                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm focus:ring-2 focus:ring-rose-500 shadow-sm border-2">
                                            <SelectValue placeholder="Chọn chi nhánh" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {branches?.map((branch: any) => (
                                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-rose-50 dark:border-rose-900/30 ml-2">
                                        {formData.branches?.name || 'Không xác định'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <InfoRow icon={StickyNote} label="Ghi chú / Diễn giải" value={formData.description} name="description" type="textarea" />
                    </div>
                </div>

                <div className="p-8 bg-gray-50/30 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-6">
                    {isEditing ? (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-white transition-all"
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Hủy bỏ
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest bg-gray-950 dark:bg-rose-600 text-white hover:bg-black transition-all shadow-2xl active:scale-95"
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
                                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all"
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa giao dịch
                            </Button>
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 rounded-xl h-12 font-bold text-xs uppercase tracking-widest bg-gray-950 dark:bg-gray-800 text-white hover:bg-black transition-all shadow-2xl active:scale-95"
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
