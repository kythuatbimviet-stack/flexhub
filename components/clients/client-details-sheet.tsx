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

    const InfoRow = ({ icon: Icon, label, value, name, type = "text" }: any) => (
        <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Icon className="w-4 h-4 text-red-500/80 dark:text-red-400" />
                {label}
            </Label>
            {isEditing ? (
                type === 'textarea' ? (
                    <Textarea
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[100px] text-sm focus:ring-2 focus:ring-red-500 shadow-sm border-2"
                    />
                ) : (
                    <Input
                        name={name}
                        type={type}
                        step={type === 'number' ? '0.1' : undefined}
                        value={formData[name] ?? ''}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm focus:ring-2 focus:ring-red-500 shadow-sm border-2"
                    />
                )
            ) : (
                <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-red-50 dark:border-red-900/30 ml-2">
                    {value || <span className="text-slate-300 italic font-normal">Chưa cập nhật</span>}
                </p>
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
                                <div className="w-16 h-16 rounded-[1.25rem] bg-red-600 flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-105">
                                    <UserCircle className="w-10 h-10" />
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-medium text-slate-950 dark:text-white flex items-center gap-2">
                                        {isEditing ? 'Chỉnh sửa hồ sơ' : client.member_name}
                                    </SheetTitle>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            {client.id}
                                        </span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-widest",
                                            client.status === 'Đang tập' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", client.status === 'Đang tập' ? "bg-emerald-600" : "bg-slate-400")} />
                                            {formData.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {!isEditing && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all font-medium text-[11px] gap-2 px-3 border border-slate-200 dark:border-slate-700"
                                            disabled={loading}
                                        >
                                            Chuyển trạng thái
                                            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-slate-200 dark:border-slate-800 p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
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
                                                        formData.status === s.nam ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                                                        "rounded-lg text-[13px] font-medium px-3 py-2 cursor-pointer transition-colors",
                                                        formData.status === status ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    )}
                                                >
                                                    {status}
                                                </DropdownMenuItem>
                                            ))
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12">
                    {/* Section: Quick Actions */}
                    {!isEditing && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <Activity className="w-5 h-5 text-red-600 dark:text-red-500" />
                                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Thao tác nhanh</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {client.phone && (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-20 rounded-2xl flex-col gap-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all font-medium text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600"
                                    >
                                        <a href={`tel:${client.phone}`}>
                                            <Phone className="w-5 h-5" />
                                            Gọi khách
                                        </a>
                                    </Button>
                                )}

                                <AddContractDialog
                                    initialClientId={client.id}
                                    onSuccess={onSuccess}
                                    isQuickAction={true}
                                />

                                <AddWeightDialog
                                    clients={[client]}
                                    initialClientId={client.id}
                                    onSuccess={onSuccess}
                                    isQuickAction={true}
                                />
                            </div>
                        </div>
                    )}

                    {/* Section: Thông tin cơ bản */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <User className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Thông tin cơ bản</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={User} label="Họ và Tên hội viên" value={formData.member_name} name="member_name" />
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-red-500/80 dark:text-red-400" />
                                    Trạng thái
                                </Label>
                                {isEditing ? (
                                    <Select
                                        onValueChange={handleStatusChange}
                                        value={formData.status}
                                    >
                                        <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm focus:ring-2 focus:ring-red-500 shadow-sm border-2">
                                            <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {clientStatuses.length > 0 ? (
                                                clientStatuses.map((s) => (
                                                    <SelectItem key={s.id} value={s.nam}>
                                                        {s.nam}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <>
                                                    <SelectItem value="Chốt đăng kí">Chốt đăng kí</SelectItem>
                                                    <SelectItem value="Đang tập">Đang tập</SelectItem>
                                                    <SelectItem value="Tạm dừng">Tạm dừng</SelectItem>
                                                    <SelectItem value="Đã nghỉ">Đã nghỉ</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-red-50 dark:border-red-900/30 ml-2">{formData.status}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-red-500/80 dark:text-red-400" />
                                    Chi nhánh
                                </Label>
                                {isEditing ? (
                                    <Select
                                        onValueChange={handleBranchChange}
                                        value={formData.branch_id || undefined}
                                    >
                                        <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 text-sm focus:ring-2 focus:ring-red-500 shadow-sm border-2">
                                            <SelectValue placeholder="Chọn chi nhánh" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {branches?.map((branch: any) => (
                                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-base font-medium text-slate-900 dark:text-slate-100 pl-6 border-l-2 border-red-50 dark:border-red-900/30 ml-2">
                                        {branches?.find((b: any) => b.id === formData.branch_id)?.name || 'Chưa gán chi nhánh'}
                                    </p>
                                )}
                            </div>
                            <InfoRow icon={Phone} label="Số điện thoại" value={formData.phone} name="phone" />
                            <InfoRow icon={Mail} label="Email" value={formData.email} name="email" />
                            <InfoRow icon={MessageSquare} label="Zalo ID" value={formData.zalo_id} name="zalo_id" />
                            <InfoRow icon={User} label="Facebook ID" value={formData.facebook_id} name="facebook_id" />
                        </div>
                        <InfoRow icon={MapPin} label="Địa chỉ cư trú" value={formData.address} name="address" />
                    </div>

                    {/* Section: Chỉ số cơ thể */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Activity className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Chỉ số cơ thể & Mục tiêu</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
                            <InfoRow icon={User} label="Tuổi" value={formData.age} name="age" type="number" />
                            <InfoRow icon={Activity} label="Chiều cao (cm)" value={formData.height} name="height" type="number" />
                            <InfoRow icon={Activity} label="Cân nặng (kg)" value={formData.weight} name="weight" type="number" />
                            <InfoRow icon={Target} label="Mục tiêu (kg)" value={formData.target_weight} name="target_weight" type="number" />
                        </div>
                        <div className="grid grid-cols-1 gap-8">
                            <InfoRow icon={Target} label="Mục tiêu tập luyện" value={formData.goal} name="goal" type="textarea" />
                            <InfoRow icon={HeartPulse} label="Tiền sử bệnh lý" value={formData.medical_history} name="medical_history" type="textarea" />
                        </div>
                    </div>

                    {/* Section: PT & Đăng ký */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Dumbbell className="w-5 h-5 text-red-600 dark:text-red-500" />
                            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Huấn luyện & Gói tập</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <InfoRow icon={Dumbbell} label="PT Phụ trách" value={formData.pt_name} name="pt_name" />
                            <InfoRow icon={ClipboardList} label="Loại đăng ký" value={formData.registration_type} name="registration_type" />
                            <InfoRow icon={Activity} label="Thời gian tập" value={formData.training_time} name="training_time" />
                            <InfoRow icon={ClipboardList} label="Chu kỳ khách hàng" value={formData.customer_cycle} name="customer_cycle" />
                        </div>
                        <InfoRow icon={ClipboardList} label="Ghi chú thêm" value={formData.notes} name="notes" type="textarea" />
                    </div>
                </div>

                <div className="p-8 bg-gray-50/30 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-6">
                    {isEditing ? (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 rounded-xl h-12 font-medium text-xs uppercase tracking-widest text-gray-500 hover:bg-white dark:hover:bg-gray-800 transition-all"
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Hủy bỏ
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1 rounded-xl h-12 font-medium text-xs uppercase tracking-widest bg-gray-950 dark:bg-red-600 text-white hover:bg-black dark:hover:bg-red-700 shadow-2xl shadow-gray-200 dark:shadow-red-900/20 transition-all active:scale-95"
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
                                className="flex-1 rounded-xl h-12 font-medium text-xs uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa hồ sơ
                            </Button>
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 rounded-xl h-12 font-medium text-xs uppercase tracking-widest bg-gray-950 dark:bg-gray-800 text-white hover:bg-black dark:hover:bg-gray-700 shadow-2xl shadow-gray-200 transition-all active:scale-95"
                                disabled={loading}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Chỉnh sửa Hồ sơ
                            </Button>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
