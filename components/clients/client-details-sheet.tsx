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
    type ConfigItem,
    fetchClientConfigs
} from '@/app/actions/config-params'
import {
    User,
    MapPin,
    Mail,
    Phone,
    Edit2,
    Trash2,
    Save,
    X,
    UserCircle,
    Dumbbell,
    Activity,
    Target,
    HeartPulse,
    MessageSquare,
    ClipboardList
} from 'lucide-react'
import { updateClient, bulkDeleteClients } from '@/app/actions/clients'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { fetchBranches } from '@/app/actions/branches'
import { AddContractDialog } from '@/components/contracts/add-contract-dialog'
import { AddWeightDialog } from '@/components/weight-tracking/add-weight-dialog'
import { FileText, PlusCircle, ChevronDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ClientDetailsSheetProps {
    client: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ClientDetailsSheet({ client, open, onOpenChange, onSuccess }: ClientDetailsSheetProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState<any>(null)

    React.useEffect(() => {
        if (client) {
            setFormData({ ...client })
            setIsEditing(false)
        }
    }, [client])

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await fetchBranches()
            if (!result.success) throw new Error(result.error)
            return result.data
        },
    })

    const { data: configResult } = useQuery({
        queryKey: ['client-configs'],
        queryFn: fetchClientConfigs
    })

    const clientStatuses = React.useMemo<ConfigItem[]>(() => {
        return configResult?.data?.statuses || []
    }, [configResult])

    const clientSources = React.useMemo<ConfigItem[]>(() => {
        return configResult?.data?.sources || []
    }, [configResult])

    const clientGoals = React.useMemo<ConfigItem[]>(() => {
        return configResult?.data?.goals || []
    }, [configResult])

    const clientRegistrationTypes = React.useMemo<ConfigItem[]>(() => {
        return configResult?.data?.registrationTypes || []
    }, [configResult])

    if (!client || !formData) return null

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await updateClient(client.id, formData)
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
                const result = await bulkDeleteClients([client.id])
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        const type = (e.target as any).type
        const finalValue = type === 'number' ? parseFloat(value) : value
        setFormData((prev: any) => ({ ...prev, [name]: finalValue }))
    }

    const handleStatusChange = (value: string) => {
        setFormData((prev: any) => ({ ...prev, status: value }))
    }

    const handleBranchChange = (value: string) => {
        setFormData((prev: any) => ({ ...prev, branch_id: value }))
    }

    const CardSection = ({ title, icon: Icon, children }: any) => (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-5">
            <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-[12px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{title}</h3>
            </div>
            <div className="p-5 space-y-5">
                {children}
            </div>
        </div>
    )

    const InfoRow = ({ label, value, name, type = "text" }: any) => (
        <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {label}
            </Label>
            {isEditing ? (
                type === 'textarea' ? (
                    <Textarea
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[80px] text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                ) : (
                    <Input
                        name={name}
                        type={type}
                        step={type === 'number' ? '0.1' : undefined}
                        value={formData[name] ?? ''}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-10 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                )
            ) : (
                <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                    {value || <span className="text-slate-300 italic font-normal text-sm">Chưa cập nhật</span>}
                </p>
            )}
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[480px] border-none shadow-2xl p-0 flex flex-col h-full bg-slate-50 dark:bg-gray-950 font-inter"
            >
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <UserCircle className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{client.member_name}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{client.email || 'No email provided'}</span>
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
                                <UserCircle className="w-12 h-12" />
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                    {client.member_name}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate italic">
                                    {client.email || 'Chưa cập nhật email'}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                        formData.status === 'Đang tập' ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30" : "bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", formData.status === 'Đang tập' ? "bg-emerald-500" : "bg-slate-400")} />
                                        {formData.status}
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
                                        {branches?.find((b: any) => b.id === formData.branch_id)?.name || 'Hệ thống'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!isEditing && (
                            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-3">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-[10px] gap-2 shadow-none border-none"
                                            disabled={loading}
                                        >
                                            ĐỔI TRẠNG THÁI
                                            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[200px] rounded-xl border-slate-200 dark:border-slate-800 p-1.5 shadow-xl">
                                        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Trạng thái mới</div>
                                        {clientStatuses.length > 0 ? (
                                            clientStatuses.map((s: any) => (
                                                <DropdownMenuItem
                                                    key={s.id}
                                                    onSelect={() => {
                                                        const newFormData = { ...formData, status: s.nam };
                                                        setFormData(newFormData);
                                                        updateClient(client.id, newFormData).then(res => {
                                                            if (res.success) {
                                                                toast.success(`Đã chuyển trạng thái sang: ${s.nam}`);
                                                                onSuccess();
                                                            } else {
                                                                toast.error('Lỗi khi cập nhật trạng thái');
                                                            }
                                                        });
                                                    }}
                                                    className={cn(
                                                        "rounded-lg text-[13px] font-medium px-3 py-2 cursor-pointer transition-colors",
                                                        formData.status === s.nam ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    )}
                                                >
                                                    {s.nam}
                                                </DropdownMenuItem>
                                            ))
                                        ) : (
                                            ['Chốt đăng kí', 'Đang tập', 'Tạm dừng', 'Đã nghỉ'].map((status) => (
                                                <DropdownMenuItem
                                                    key={status}
                                                    onSelect={() => {
                                                        const newFormData = { ...formData, status };
                                                        setFormData(newFormData);
                                                        updateClient(client.id, newFormData).then(res => {
                                                            if (res.success) {
                                                                toast.success(`Đã chuyển trạng thái sang: ${status}`);
                                                                onSuccess();
                                                            } else {
                                                                toast.error('Lỗi khi cập nhật trạng thái');
                                                            }
                                                        });
                                                    }}
                                                    className={cn(
                                                        "rounded-lg text-[13px] font-medium px-3 py-2 cursor-pointer",
                                                        formData.status === status ? "bg-blue-50 text-blue-600" : "text-slate-600"
                                                    )}
                                                >
                                                    {status}
                                                </DropdownMenuItem>
                                            ))
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />

                                <div className="flex-1 flex gap-2">
                                    {client.phone && (
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 h-9 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 font-bold text-[10px]"
                                        >
                                            <a href={`tel:${client.phone}`}>
                                                <Phone className="w-3.5 h-3.5 mr-2" />
                                                GỌI ĐIỆN
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="grid grid-cols-2 gap-3">
                            <AddContractDialog
                                initialClientId={client.id}
                                onSuccess={onSuccess}
                                isQuickAction={false}
                                triggerOverride={
                                    <Button
                                        variant="outline"
                                        className="h-14 rounded-2xl gap-3 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-[11px] uppercase tracking-wider shadow-sm border-2"
                                    >
                                        <PlusCircle className="w-4 h-4 text-blue-500" />
                                        Hợp đồng mới
                                    </Button>
                                }
                            />
                            <AddWeightDialog
                                clients={[client]}
                                initialClientId={client.id}
                                onSuccess={onSuccess}
                                triggerOverride={
                                    <Button
                                        variant="outline"
                                        className="h-14 rounded-2xl gap-3 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-[11px] uppercase tracking-wider shadow-sm border-2"
                                    >
                                        <Activity className="w-4 h-4 text-emerald-500" />
                                        Cân nặng
                                    </Button>
                                }
                            />
                        </div>
                    )}

                    {/* Section: Thông tin cá nhân */}
                    <CardSection title="Thông tin cá nhân" icon={User}>
                        <div className="space-y-5">
                            <InfoRow label="Họ và Tên" value={formData.member_name} name="member_name" />
                            <div className="grid grid-cols-2 gap-5">
                                <InfoRow label="Số điện thoại" value={formData.phone} name="phone" />
                                <InfoRow label="Email" value={formData.email} name="email" />
                            </div>
                            <InfoRow label="Địa chỉ" value={formData.address} name="address" />
                            <div className="grid grid-cols-2 gap-5">
                                <InfoRow label="Zalo ID" value={formData.zalo_id} name="zalo_id" />
                                <InfoRow label="Facebook ID" value={formData.facebook_id} name="facebook_id" />
                            </div>
                        </div>
                    </CardSection>

                    {/* Section: Chỉ số cơ thể */}
                    <CardSection title="Chỉ số cơ thể & Mục tiêu" icon={Activity}>
                        <div className="grid grid-cols-2 gap-5 mb-5">
                            <InfoRow label="Tuổi" value={formData.age} name="age" type="number" />
                            <InfoRow label="Chiều cao (cm)" value={formData.height} name="height" type="number" />
                            <InfoRow label="Cân nặng (kg)" value={formData.weight} name="weight" type="number" />
                            <InfoRow label="Mục tiêu (kg)" value={formData.target_weight} name="target_weight" type="number" />
                        </div>
                        <div className="space-y-5">
                            <InfoRow label="Mục tiêu tập luyện" value={formData.goal} name="goal" type="textarea" />
                            <InfoRow label="Tiền sử bệnh lý" value={formData.medical_history} name="medical_history" type="textarea" />
                        </div>
                    </CardSection>

                    {/* Section: Huấn luyện & Gói tập */}
                    <CardSection title="Huấn luyện & Gói tập" icon={Dumbbell}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <InfoRow label="PT Phụ trách" value={formData.pt_name} name="pt_name" />
                                <InfoRow label="Loại đăng ký" value={formData.registration_type} name="registration_type" />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <InfoRow label="Thời gian tập" value={formData.training_time} name="training_time" />
                                <InfoRow label="Chu kỳ khách" value={formData.customer_cycle} name="customer_cycle" />
                            </div>
                            <InfoRow label="Ghi chú thêm" value={formData.notes} name="notes" type="textarea" />
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
                                Sửa hồ sơ
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
