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
    Save,
    X,
    Trash2,
    Edit2,
    DollarSign,
    Calendar,
    Building2,
    User,
    Tag,
    StickyNote,
    CreditCard,
    ChevronDown,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { updateRevenue, deleteRevenue } from '@/app/actions/financial'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { fetchBranches } from '@/app/actions/branches'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

interface RevenueDetailsSheetProps {
    revenue: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

const CardSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{title}</h3>
        </div>
        <div className="p-5 space-y-5">
            {children}
        </div>
    </div>
)

const DetailRow = ({ label, value, name, type = "text", icon: Icon, isEditing, formData, onChange }: any) => (
    <div className="space-y-1.5 font-inter">
        <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </Label>
        {isEditing ? (
            type === 'textarea' ? (
                <Textarea
                    name={name}
                    value={formData[name] || ''}
                    onChange={onChange}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm resize-none"
                />
            ) : (
                <Input
                    name={name}
                    type={type}
                    value={formData[name] ?? ''}
                    onChange={onChange}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
            )
        ) : (
            <div className="text-[15px] font-medium text-slate-700 dark:text-slate-200 min-h-[20px]">
                {value || <span className="text-slate-300 italic font-normal text-sm">Chưa cập nhật</span>}
            </div>
        )}
    </div>
)

export function RevenueDetailsSheet({ revenue, open, onOpenChange, onSuccess }: RevenueDetailsSheetProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>({})

    React.useEffect(() => {
        if (revenue) {
            setFormData({ ...revenue })
            setIsEditing(false)
        }
    }, [revenue])

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    if (!revenue) return null

    const handleSave = async () => {
        setLoading(true)
        try {
            const { financial_categories, branches: b, clients, users, ...updateData } = formData
            const result = await updateRevenue(revenue.id, updateData)
            if (result.success) {
                toast.success('Đã cập nhật khoản thu')
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
        if (confirm('Bạn có chắc chắn muốn xóa khoản thu này?')) {
            setLoading(true)
            try {
                const result = await deleteRevenue(revenue.id)
                if (result.success) {
                    toast.success('Đã xóa khoản thu thành công')
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[480px] border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-gray-950 font-inter"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>Chi tiết khoản thu</SheetTitle>
                    <SheetDescription>Thông tin chi tiết về giao dịch tài chính #{revenue.id.split('-')[0]}</SheetDescription>
                </SheetHeader>

                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Chi tiết khoản thu</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">ID: {revenue.id.split('-')[0]}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {isEditing ? (
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={loading}
                                className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 shadow-sm transition-all active:scale-95 font-medium text-xs mr-1"
                            >
                                {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                Lưu
                            </Button>
                        ) : (
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
                                    className="sm:hidden rounded-full text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
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
                    {/* Summary Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none">
                                <DollarSign className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {new Intl.NumberFormat('vi-VN').format(formData.amount)}<span className="text-lg ml-1 font-bold text-slate-400 uppercase">đ</span>
                                </h1>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formData.recorded_at ? new Date(formData.recorded_at).toLocaleDateString('vi-VN') : '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <CardSection title="Thông tin giao dịch" icon={Tag}>
                        <div className="grid grid-cols-2 gap-5">
                            <DetailRow label="Số tiền" value={new Intl.NumberFormat('vi-VN').format(formData.amount) + ' đ'} name="amount" type="number" icon={DollarSign} isEditing={isEditing} formData={formData} onChange={handleChange} />

                            <div className="space-y-1.5 font-inter">
                                <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Tag className="w-3 h-3" />
                                    Danh mục
                                </Label>
                                {isEditing ? (
                                    <Select
                                        onValueChange={(val) => setFormData((p: any) => ({ ...p, category_id: val }))}
                                        value={formData.category_id}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm">
                                            <SelectValue placeholder="Chọn danh mục" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {['Hợp đồng', 'Công nợ', 'Khác'].map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                        {formData.category_id || 'Phổ thông'}
                                    </div>
                                )}
                            </div>

                            <DetailRow label="Ngày ghi nhận" value={formData.recorded_at ? new Date(formData.recorded_at).toLocaleDateString('vi-VN') : '-'} name="recorded_at" type="date" icon={Calendar} isEditing={isEditing} formData={formData} onChange={handleChange} />

                            <div className="space-y-1.5 font-inter">
                                <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard className="w-3 h-3" />
                                    Thanh toán
                                </Label>
                                {isEditing ? (
                                    <Select
                                        onValueChange={(val) => setFormData((p: any) => ({ ...p, payment_method: val }))}
                                        value={formData.payment_method}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {['Tiền mặt', 'Chuyển khoản', 'Thẻ'].map(m => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="text-[15px] font-medium text-slate-700 dark:text-slate-200 font-bold text-emerald-600">
                                        {formData.payment_method}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardSection>

                    <CardSection title="Đối tượng & Chi nhánh" icon={Building2}>
                        <div className="space-y-5">
                            <DetailRow label="Khách hàng" value={formData.clients?.member_name || 'Khách vãng lai'} name="customer_id" icon={User} isEditing={isEditing} formData={formData} onChange={handleChange} />

                            <div className="space-y-1.5 font-inter">
                                <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 className="w-3 h-3" />
                                    Chi nhánh
                                </Label>
                                {isEditing ? (
                                    <Select
                                        onValueChange={(val) => setFormData((p: any) => ({ ...p, branch_id: val }))}
                                        value={formData.branch_id}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm">
                                            <SelectValue placeholder="Chọn chi nhánh" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {branches?.map((branch: any) => (
                                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                                        {formData.branches?.name || 'Toàn hệ thống'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardSection>

                    <CardSection title="Ghi chú & Diễn giải" icon={StickyNote}>
                        <DetailRow label="Nội dung" value={formData.description} name="description" type="textarea" isEditing={isEditing} formData={formData} onChange={handleChange} />
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
                                className="rounded-xl h-11 px-8 font-bold text-[13px] bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20 transition-all font-inter active:scale-95"
                                disabled={loading}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Đang lưu...' : 'Lưu lại'}
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="rounded-xl h-11 px-10 font-bold text-[13px] bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20 transition-all font-inter active:scale-95"
                                disabled={loading}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
